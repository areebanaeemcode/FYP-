from django.contrib.auth.mixins import LoginRequiredMixin
from django.views.generic import TemplateView

from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.filters import OrderingFilter

from apps.notifications.models import Notification
from apps.notifications.serializers import (
    NotificationReadSerializer,
    MarkNotificationsReadSerializer,
)


class NotificationsPageView(LoginRequiredMixin, TemplateView):
    template_name = "notifications/list.html"

    def get_context_data(self, **kwargs):
        ctx = super().get_context_data(**kwargs)
        ctx["dashboard_url"] = "/client/dashboard/"
        ctx["tour_list_url"] = "/client/tours/"
        ctx["profile_url"] = "/client/profile/"
        return ctx


class NotificationListAPI(generics.ListAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = NotificationReadSerializer
    filter_backends = [OrderingFilter]
    ordering_fields = ['created_at', 'is_read']
    ordering = ['-created_at']

    def get_queryset(self):
        return (
            Notification.objects.filter(recipient=self.request.user)
            .select_related('tour')
        )

    def list(self, request, *args, **kwargs):
        only_unread = request.query_params.get('unread_only', '').lower() in ('1', 'true', 'yes')
        qs = self.get_queryset()
        if only_unread:
            qs = qs.filter(is_read=False)
        tour_id = request.query_params.get('tour_id')
        if tour_id:
            try:
                qs = qs.filter(tour_id=int(tour_id))
            except (TypeError, ValueError):
                pass
        qs = self.filter_queryset(qs)
        total_unread = Notification.objects.filter(recipient=request.user, is_read=False).count()
        try:
            limit = int(request.query_params.get('limit') or 0)
        except (TypeError, ValueError):
            limit = 0
        if limit and limit > 0:
            qs = qs[:limit]
        serializer = self.get_serializer(qs, many=True)
        return Response({
            'items': serializer.data,
            'total_unread': total_unread,
            'count': len(serializer.data),
        }, status=status.HTTP_200_OK)


class NotificationCountAPI(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        tour_id = request.query_params.get('tour_id')
        qs = Notification.objects.filter(recipient=request.user, is_read=False)
        if tour_id:
            try:
                qs = qs.filter(tour_id=int(tour_id))
            except (TypeError, ValueError):
                pass
        unread_count = qs.count()
        total = Notification.objects.filter(recipient=request.user).count()
        return Response({
            'unread': unread_count,
            'total': total,
        }, status=status.HTTP_200_OK)


class MarkNotificationsReadAPI(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        serializer = MarkNotificationsReadSerializer(data=request.data or {})
        serializer.is_valid(raise_exception=True)
        mark_all = bool(serializer.validated_data.get('all', False))
        ids = serializer.validated_data.get('ids') or []
        qs = Notification.objects.filter(recipient=request.user, is_read=False)
        if mark_all:
            pass
        elif ids:
            qs = qs.filter(pk__in=list(ids))
        else:
            return Response({'detail': 'Provide ids or set all=true.'}, status=status.HTTP_400_BAD_REQUEST)
        updated = 0
        if qs.exists():
            from django.utils import timezone
            updated = qs.update(is_read=True, read_at=timezone.now())
        unread_count = Notification.objects.filter(recipient=request.user, is_read=False).count()
        return Response({
            'detail': f'Marked {updated} notification(s) as read.',
            'marked': updated,
            'unread': unread_count,
        }, status=status.HTTP_200_OK)
