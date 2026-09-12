from django.shortcuts import redirect
from django.views.generic import TemplateView, View, UpdateView
from django.contrib.auth.mixins import LoginRequiredMixin
from django.contrib.auth import login as django_login
from django.urls import reverse_lazy

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser

from rest_framework_simplejwt.tokens import RefreshToken

from .serializers import (
    UserRegistrationSerializer,
    UserLoginSerializer,
    UserProfileSerializer,
    ProfileUpdateSerializer,
)
from .models import User


class LandingPageView(TemplateView):
    template_name = "landing.html"

    def dispatch(self, request, *args, **kwargs):
        if request.get_host().endswith(":8001"):
            if request.user.is_authenticated and (request.user.is_staff or request.user.is_superuser):
                return redirect("/client/admin/")
            return redirect("/login/?next=/client/admin/")
        return super().dispatch(request, *args, **kwargs)

    def get_context_data(self, **kwargs):
        ctx = super().get_context_data(**kwargs)
        user = self.request.user
        ctx["is_authenticated"] = user.is_authenticated
        if user.is_authenticated:
            ctx["user_name"] = user.first_name or user.email.split("@")[0]
            ctx["dashboard_url"] = "/client/dashboard/"
        else:
            ctx["login_url"] = "/login/"
            ctx["register_url"] = "/register/"
        return ctx


class RootRedirectView(View):
    def get(self, request):
        if request.get_host().endswith(":8001"):
            return redirect("/client/admin/")
        return redirect("/")


class AuthenticatedRedirectMixin:
    def dispatch(self, request, *args, **kwargs):
        if request.user.is_authenticated:
            if request.get_host().endswith(":8001"):
                if request.user.is_staff or request.user.is_superuser:
                    return redirect("/client/admin/")
                return redirect("http://127.0.0.1:8000/client/dashboard/")
            return redirect("/client/dashboard/")
        return super().dispatch(request, *args, **kwargs)


class RegisterPageView(AuthenticatedRedirectMixin, TemplateView):
    template_name = "auth/register.html"


class LoginPageView(AuthenticatedRedirectMixin, TemplateView):
    template_name = "auth/login.html"

    def get_context_data(self, **kwargs):
        ctx = super().get_context_data(**kwargs)
        ctx["is_admin_portal"] = self.request.get_host().endswith(":8001")
        return ctx


class DashboardPageView(LoginRequiredMixin, TemplateView):
    template_name = "dashboard/dashboard.html"

    def get_context_data(self, **kwargs):
        from apps.tours.models import Tour
        ctx = super().get_context_data(**kwargs)
        ctx["tour_create_url"] = "/client/tours/create/"
        ctx["tour_list_url"] = "/client/tours/"
        ctx["analytics_url"] = "/client/analytics/"
        ctx["notifications_list_url"] = "/client/notifications/"
        ctx["profile_url"] = "/client/profile/"
        ctx["join_tour_api_url"] = "/client/tours/api/join/"
        user = self.request.user
        recent = []
        try:
            tours = list(
                Tour.objects.filter(memberships__user=user)
                .select_related("created_by")
                .distinct()
                .order_by("-created_at")[:5]
            )
            for t in tours:
                creator = t.created_by
                recent.append({
                    "id": t.pk,
                    "title": t.title,
                    "destination": t.destination or "",
                    "start_date": str(t.start_date) if t.start_date else "",
                    "end_date": str(t.end_date) if t.end_date else "",
                    "budget": str(t.budget) if t.budget is not None else "0.00",
                    "join_token": t.join_token or "",
                    "creator_name": (
                        f"{getattr(creator, 'first_name', '') or ''} {getattr(creator, 'last_name', '') or ''}".strip()
                        or getattr(creator, "email", "") or "Unknown"
                    ),
                    "detail_url": f"/client/tours/{t.pk}/",
                })
        except Exception:
            recent = []
        ctx["recent_tours"] = recent
        return ctx


class ProfilePageView(LoginRequiredMixin, TemplateView):
    template_name = "auth/profile.html"


class ClientLogoutView(View):
    def get(self, request):
        from django.contrib.auth import logout as django_logout
        django_logout(request)
        next_url = request.GET.get("next") or "/"
        response = redirect(next_url)
        response.delete_cookie("jwt_access")
        response.delete_cookie("jwt_refresh")
        return response

    def post(self, request):
        return self.get(request)


class UserRegistrationView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = UserRegistrationSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            django_login(request, user)
            refresh = RefreshToken.for_user(user)
            return Response(
                {
                    "success": True,
                    "message": "User Registered Successfully",
                    "user": {
                        "id": user.id,
                        "first_name": user.first_name,
                        "last_name": getattr(user, "last_name", ""),
                        "email": user.email,
                    },
                    "tokens": {
                        "refresh": str(refresh),
                        "access": str(refresh.access_token),
                    },
                },
                status=status.HTTP_201_CREATED,
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class UserLoginAPIView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = UserLoginSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.validated_data["user"]
            django_login(request, user)
            refresh = RefreshToken.for_user(user)
            return Response(
                {
                    "success": True,
                    "message": "Login Successful",
                    "user": {
                        "id": user.id,
                        "first_name": user.first_name,
                        "last_name": user.last_name,
                        "email": user.email,
                        "phone_number": user.phone_number,
                    },
                    "tokens": {
                        "refresh": str(refresh),
                        "access": str(refresh.access_token),
                    },
                },
                status=status.HTTP_200_OK,
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ProfileAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        serializer = UserProfileSerializer(request.user)
        return Response(serializer.data, status=status.HTTP_200_OK)


class ProfileUpdateAPIView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def patch(self, request):
        serializer = ProfileUpdateSerializer(
            request.user, data=request.data, partial=True, context={"request": request}
        )
        if serializer.is_valid():
            user = serializer.save()
            return Response(
                UserProfileSerializer(user, context={"request": request}).data,
                status=status.HTTP_200_OK,
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def put(self, request):
        return self.patch(request)
