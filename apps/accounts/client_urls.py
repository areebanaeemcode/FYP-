from django.urls import path

from .views import (
    DashboardPageView,
    ProfilePageView,
    ClientLogoutView,
    ProfileAPIView,
    ProfileUpdateAPIView,
    UserRegistrationView,
    UserLoginAPIView,
)
from .admin_views import (
    AdminDashboardPageView,
    AdminPlatformStatsAPI,
    AdminUsersListAPI,
    AdminUserStatusToggleAPI,
    AdminUserRoleToggleAPI,
    AdminToursListAPI,
)

urlpatterns = [
    path("dashboard/", DashboardPageView.as_view(), name="dashboard-page"),
    path("profile/", ProfilePageView.as_view(), name="profile-page"),
    path("logout/", ClientLogoutView.as_view(), name="logout"),
    path("api/profile/", ProfileAPIView.as_view(), name="profile-api"),
    path("api/profile/update/", ProfileUpdateAPIView.as_view(), name="profile-update-api"),
    path("api/register/", UserRegistrationView.as_view(), name="register-api"),
    path("api/login/", UserLoginAPIView.as_view(), name="login-api"),

    # Admin Portal Views & APIs
    path("admin/", AdminDashboardPageView.as_view(), name="admin-dashboard"),
    path("admin/api/stats/", AdminPlatformStatsAPI.as_view(), name="admin-api-stats"),
    path("admin/api/users/", AdminUsersListAPI.as_view(), name="admin-api-users"),
    path("admin/api/users/<int:user_id>/toggle-status/", AdminUserStatusToggleAPI.as_view(), name="admin-api-user-toggle-status"),
    path("admin/api/users/<int:user_id>/toggle-role/", AdminUserRoleToggleAPI.as_view(), name="admin-api-user-toggle-role"),
    path("admin/api/tours/", AdminToursListAPI.as_view(), name="admin-api-tours"),
]
