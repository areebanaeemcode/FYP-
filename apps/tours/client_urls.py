from django.urls import path

from . import views

app_name = 'tours'

urlpatterns = [
    # Pages
    path(
        '',
        views.TourListPageView.as_view(),
        name='tour-list-page',
    ),
    path(
        'create/',
        views.CreateTourPageView.as_view(),
        name='tour-create-page',
    ),
    path(
        '<int:pk>/',
        views.TourDetailPageView.as_view(),
        name='tour-detail-page',
    ),
    path(
        'join/',
        views.JoinTourPageView.as_view(),
        name='tour-join-generic-page',
    ),
    path(
        'join/<str:join_token>/',
        views.JoinTourPageView.as_view(),
        name='tour-join-page',
    ),

    # APIs
    path(
        'api/',
        views.TourListAPIView.as_view(),
        name='tour-list-api',
    ),
    path(
        'api/create/',
        views.CreateTourAPIView.as_view(),
        name='tour-create-api',
    ),
    path(
        'api/<int:pk>/',
        views.TourDetailAPIView.as_view(),
        name='tour-detail-api',
    ),
    path(
        'api/<int:pk>/delete/',
        views.TourDeleteAPIView.as_view(),
        name='tour-delete-api',
    ),
    path(
        'api/join/',
        views.JoinTourAPIView.as_view(),
        name='tour-join-api',
    ),
    path(
        'api/join/<str:join_token>/',
        views.JoinTourAPIView.as_view(),
        name='tour-join-with-token-api',
    ),
    path(
        'api/<int:pk>/smart/',
        views.SmartExpenseAPIView.as_view(),
        name='tour-smart-api',
    ),
    path(
        '<int:pk>/settlement/',
        views.TourSettlementPageView.as_view(),
        name='tour-settlement-page',
    ),
    path(
        'api/<int:pk>/settlement/',
        views.SettlementAPIView.as_view(),
        name='tour-settlement-api',
    ),
    path(
        '<int:pk>/analytics/',
        views.TourAnalyticsPageView.as_view(),
        name='tour-analytics-page',
    ),
    path(
        'api/<int:pk>/analytics/',
        views.TourAnalyticsAPIView.as_view(),
        name='tour-analytics-api',
    ),
    path(
        'api/<int:pk>/invite/',
        views.InviteTourMemberAPIView.as_view(),
        name='tour-invite-api',
    ),
    path(
        'api/<int:pk>/remove-member/',
        views.RemoveTourMemberAPIView.as_view(),
        name='tour-remove-member-api',
    ),
    path(
        'api/<int:pk>/change-role/',
        views.ChangeMemberRoleAPIView.as_view(),
        name='tour-change-role-api',
    ),
]
