from django.urls import path

from .views import (
    UserRegistrationView,
    UserLoginAPIView,
)

urlpatterns = [
    path("register/", UserRegistrationView.as_view(), name="api-register"),
    path("login/", UserLoginAPIView.as_view(), name="api-login"),
]
