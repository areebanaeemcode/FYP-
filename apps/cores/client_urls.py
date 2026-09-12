from django.urls import path

from . import views

app_name = 'cores'

urlpatterns = [
    path(
        'api/offline/sync-expenses/',
        views.OfflinePendingExpenseSyncAPI.as_view(),
        name='offline-sync-expenses-api',
    ),
]
