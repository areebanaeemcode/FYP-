from django.urls import path

from .views import (
    RegisterPageView,
    LoginPageView,
    LandingPageView,
)

urlpatterns = [
    path("register/", RegisterPageView.as_view(), name="register-page"),
    path("login/", LoginPageView.as_view(), name="login-page"),
    path("", LandingPageView.as_view(), name="landing-page"),
]
