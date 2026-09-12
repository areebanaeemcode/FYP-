from django.urls import path, include


app_name = "client"

urlpatterns = [
    path("", include("apps.accounts.client_urls")),
    path("tours/", include("apps.tours.client_urls")),
    path("expenses/", include("apps.expenses.client_urls")),
    path("notifications/", include("apps.notifications.client_urls")),
    path("analytics/", include("apps.reports.client_urls")),
    path("", include("apps.cores.client_urls")),
]
