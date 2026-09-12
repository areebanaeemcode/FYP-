from django.urls import path

from .views import (
    RegisterPageView,
    LoginPageView,
    DashboardPageView,
    UserRegistrationView,
    UserLoginAPIView,
    ProfileAPIView,
)
app_name = "accounts"

urlpatterns = [

    path(
        "api/register/",
        UserRegistrationView.as_view(),
        name="register"
    ),

    path(
        "register/",
        RegisterPageView.as_view(),
        name="register-page"
    ),

     path(
        "login/",
        LoginPageView.as_view(),
        name="login-page",
    ),

     path(
        "api/login/",
        UserLoginAPIView.as_view(),
        name="login",
    ),
     path(
        "dashboard/",
        DashboardPageView.as_view(),
        name="dashboard-page",
    ),
    path(
        "api/profile/",
        ProfileAPIView.as_view(),
        name="profile-api",
    
    ),


]