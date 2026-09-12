from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)

from apps.cores.views import AdminAccessPassGateView


urlpatterns = [

    path(
        "admin/access-pass/",
        AdminAccessPassGateView.as_view(),
        name="admin-access-pass-gate",
    ),

    path(
        "admin/",
        admin.site.urls
    ),

    # Public root-level auth pages (aliases that redirect authenticated users)
    path(
        "",
        include(
            "apps.accounts.public_urls",
        )
    ),

    # Root-level DRF auth APIs (backward-compatible)
    path(
        "api/",
        include(
            "apps.accounts.api_urls",
        )
    ),

    # JWT Login Token
    path(
        "api/token/",
        TokenObtainPairView.as_view(),
        name="token_obtain_pair",
    ),

    # JWT Refresh Token
    path(
        "api/token/refresh/",
        TokenRefreshView.as_view(),
        name="token_refresh",
    ),

    # Client portal — all end-user HTML + client-scoped APIs
    path(
        "client/",
        include(
            "core.client_portal_urls",
            namespace="client",
        )
    ),

]


if settings.DEBUG:

    urlpatterns += static(
        settings.MEDIA_URL,
        document_root=settings.MEDIA_ROOT,
    )
    urlpatterns += static(
        settings.STATIC_URL,
        document_root=settings.STATICFILES_DIRS[0] if settings.STATICFILES_DIRS else None,
    )