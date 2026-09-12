from django.contrib.auth.mixins import UserPassesTestMixin, LoginRequiredMixin
from django.db.models import Sum, Count, Q
from django.http import JsonResponse, HttpResponseRedirect
from django.shortcuts import render, get_object_or_404
from django.views import View
from rest_framework import status
from rest_framework.permissions import IsAdminUser
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.accounts.models import User
from apps.tours.models import Tour, TourMember
from apps.expenses.models import Expense


class StaffRequiredMixin(LoginRequiredMixin, UserPassesTestMixin):
    login_url = "/login/"

    def test_func(self):
        user = self.request.user
        return user.is_authenticated and (user.is_staff or user.is_superuser)

    def handle_no_permission(self):
        if self.request.user.is_authenticated:
            # User lacks staff privileges: redirect to client website on port 8000
            return HttpResponseRedirect("http://127.0.0.1:8000/client/dashboard/")
        return HttpResponseRedirect(f"/login/?next={self.request.get_full_path()}")


class AdminDashboardPageView(StaffRequiredMixin, View):
    template_name = "admin/dashboard.html"

    def dispatch(self, request, *args, **kwargs):
        # Admin is strictly dedicated to port 8001.
        # If accessed through port 8000 or any other port, redirect directly to port 8001.
        host = request.get_host()
        if not host.endswith(":8001"):
            return HttpResponseRedirect(f"http://127.0.0.1:8001{request.get_full_path()}")
        return super().dispatch(request, *args, **kwargs)

    def get(self, request, *args, **kwargs):
        total_users = User.objects.count()
        total_tours = Tour.objects.count()
        total_expenses = Expense.objects.count()
        total_spend = Expense.objects.aggregate(total=Sum("amount"))["total"] or 0.0

        context = {
            "total_users": total_users,
            "total_tours": total_tours,
            "total_expenses": total_expenses,
            "total_spend": float(total_spend),
            "admin_user": request.user,
        }
        return render(request, self.template_name, context)


class AdminPlatformStatsAPI(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request, *args, **kwargs):
        total_users = User.objects.count()
        active_users = User.objects.filter(is_active=True).count()
        staff_users = User.objects.filter(is_staff=True).count()
        suspended_users = User.objects.filter(is_active=False).count()

        total_tours = Tour.objects.count()
        active_tours = Tour.objects.filter(status="active").count()
        settled_tours = Tour.objects.filter(status="settled").count()

        total_expenses = Expense.objects.count()
        total_spend = Expense.objects.aggregate(total=Sum("amount"))["total"] or 0.0
        avg_spend_per_tour = (float(total_spend) / total_tours) if total_tours > 0 else 0.0

        recent_users_qs = User.objects.order_by("-created_at")[:5]
        recent_users = [
            {
                "id": u.id,
                "name": u.get_full_name(),
                "email": u.email,
                "phone": u.phone_number,
                "is_active": u.is_active,
                "is_staff": u.is_staff,
                "created_at": u.created_at.strftime("%b %d, %Y") if u.created_at else "",
            }
            for u in recent_users_qs
        ]

        recent_tours_qs = Tour.objects.select_related("created_by").order_by("-created_at")[:5]
        recent_tours = [
            {
                "id": t.id,
                "title": t.title,
                "destination": t.destination,
                "status": t.status,
                "budget": float(t.budget),
                "created_by": t.created_by.get_full_name() if t.created_by else "Unknown",
                "created_at": t.created_at.strftime("%b %d, %Y") if t.created_at else "",
            }
            for t in recent_tours_qs
        ]

        return Response({
            "users": {
                "total": total_users,
                "active": active_users,
                "staff": staff_users,
                "suspended": suspended_users,
            },
            "tours": {
                "total": total_tours,
                "active": active_tours,
                "settled": settled_tours,
            },
            "financials": {
                "total_expenses": total_expenses,
                "total_spend": float(total_spend),
                "avg_spend_per_tour": round(avg_spend_per_tour, 2),
            },
            "recent_users": recent_users,
            "recent_tours": recent_tours,
        })


class AdminUsersListAPI(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request, *args, **kwargs):
        query = request.GET.get("q", "").strip()
        status_filter = request.GET.get("filter", "all").strip().lower()

        qs = User.objects.annotate(
            tours_count=Count("tour_memberships", distinct=True)
        ).order_by("-created_at")

        if query:
            qs = qs.filter(
                Q(email__icontains=query)
                | Q(first_name__icontains=query)
                | Q(last_name__icontains=query)
                | Q(phone_number__icontains=query)
            )

        if status_filter == "active":
            qs = qs.filter(is_active=True)
        elif status_filter == "suspended":
            qs = qs.filter(is_active=False)
        elif status_filter == "staff":
            qs = qs.filter(is_staff=True)

        users = []
        for u in qs:
            total_paid = Expense.objects.filter(paid_by=u).aggregate(s=Sum("amount"))["s"] or 0.0
            users.append({
                "id": u.id,
                "first_name": u.first_name,
                "last_name": u.last_name,
                "full_name": u.get_full_name(),
                "email": u.email,
                "phone_number": u.phone_number,
                "is_active": u.is_active,
                "is_staff": u.is_staff,
                "is_superuser": u.is_superuser,
                "is_current_user": (u.id == request.user.id),
                "tours_count": u.tours_count,
                "total_paid": float(total_paid),
                "created_at": u.created_at.strftime("%b %d, %Y") if u.created_at else "",
            })

        return Response({"users": users, "total": len(users)})


class AdminUserStatusToggleAPI(APIView):
    permission_classes = [IsAdminUser]

    def post(self, request, user_id, *args, **kwargs):
        target_user = get_object_or_404(User, id=user_id)

        if target_user.id == request.user.id:
            return Response(
                {"detail": "You cannot suspend your own administrator account."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        new_status = not target_user.is_active
        target_user.is_active = new_status
        target_user.save(update_fields=["is_active", "updated_at"])

        status_label = "activated" if new_status else "suspended"
        return Response({
            "message": f"User {target_user.email} has been {status_label}.",
            "is_active": target_user.is_active,
            "user_id": target_user.id,
        })


class AdminUserRoleToggleAPI(APIView):
    permission_classes = [IsAdminUser]

    def post(self, request, user_id, *args, **kwargs):
        target_user = get_object_or_404(User, id=user_id)

        if target_user.id == request.user.id:
            return Response(
                {"detail": "You cannot change role for your own administrator account."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        new_role = not target_user.is_staff
        target_user.is_staff = new_role
        target_user.save(update_fields=["is_staff", "updated_at"])

        role_label = "granted Admin/Staff role" if new_role else "revoked Admin/Staff role"
        return Response({
            "message": f"User {target_user.email} has been {role_label}.",
            "is_staff": target_user.is_staff,
            "user_id": target_user.id,
        })


class AdminToursListAPI(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request, *args, **kwargs):
        query = request.GET.get("q", "").strip()
        status_filter = request.GET.get("status", "all").strip().lower()

        qs = Tour.objects.select_related("created_by").annotate(
            members_total=Count("memberships", distinct=True)
        ).order_by("-created_at")

        if query:
            qs = qs.filter(
                Q(title__icontains=query)
                | Q(destination__icontains=query)
                | Q(created_by__email__icontains=query)
                | Q(join_token__icontains=query)
            )

        if status_filter in ["active", "settled", "archived"]:
            qs = qs.filter(status=status_filter)

        tours = []
        for t in qs:
            total_spent = Expense.objects.filter(tour=t).aggregate(s=Sum("amount"))["s"] or 0.0
            tours.append({
                "id": t.id,
                "title": t.title,
                "destination": t.destination,
                "status": t.status,
                "join_token": t.join_token,
                "budget": float(t.budget),
                "total_spent": float(total_spent),
                "members_count": t.members_total,
                "created_by": t.created_by.get_full_name() if t.created_by else "Unknown",
                "creator_email": t.created_by.email if t.created_by else "",
                "start_date": str(t.start_date) if t.start_date else "",
                "end_date": str(t.end_date) if t.end_date else "",
                "created_at": t.created_at.strftime("%b %d, %Y") if t.created_at else "",
            })

        return Response({"tours": tours, "total": len(tours)})
