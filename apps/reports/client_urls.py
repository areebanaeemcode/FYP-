from django.urls import path

from . import views

app_name = 'reports'

urlpatterns = [
    path(
        '',
        views.GlobalAnalyticsPageView.as_view(),
        name='global-analytics-page',
    ),
    path(
        'api/',
        views.GlobalAnalyticsAPIView.as_view(),
        name='global-analytics-api',
    ),
]
