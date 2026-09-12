from django.urls import path

from . import views


app_name = 'notifications'


urlpatterns = [
    path('', views.NotificationsPageView.as_view(), name='notifications-page'),
    path('api/', views.NotificationListAPI.as_view(), name='notification-list'),
    path('api/count/', views.NotificationCountAPI.as_view(), name='notification-count'),
    path('api/mark-read/', views.MarkNotificationsReadAPI.as_view(), name='notification-mark-read'),
]
