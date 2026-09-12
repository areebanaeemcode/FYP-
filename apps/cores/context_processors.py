from apps.notifications.models import Notification
from apps.tours.models import Tour


def pt_global_context(request):
    user = request.user if hasattr(request, "user") else None
    total_user_tours = 0
    jwt_access = None
    jwt_refresh = None
    if user and user.is_authenticated:
        try:
            total_user_tours = Tour.objects.filter(memberships__user=user).distinct().count()
        except Exception:
            total_user_tours = 0
        try:
            from rest_framework_simplejwt.tokens import RefreshToken
            ref = RefreshToken.for_user(user)
            jwt_access = str(ref.access_token)
            jwt_refresh = str(ref)
        except Exception:
            pass
    return {
        "current_user": user if (user and user.is_authenticated) else None,
        "unread_notification_count": Notification.unread_count(user),
        "total_user_tours": total_user_tours,
        "pt_site_name": "Pay-Together",
        "pt_year": "2026",
        "jwt_access": jwt_access,
        "jwt_refresh": jwt_refresh,
    }

