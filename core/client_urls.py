from django.urls import path, include

app_name = "client"

urlpatterns = [
    path(
        "",
        include("apps.accounts.client_urls"),
    ),
    path(
        "",
        include("apps.tours.client_urls"),
    ),
    path(
        "",
        include("apps.expenses.client_urls"),
    ),
    path(
        "",
        include("apps.notifications.client_urls"),
    ),
    path(
        "",
        include("apps.reports.client_urls"),
    ),
    path(
        "",
        include("apps.cores.client_urls"),
    ),
]
