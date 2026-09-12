from django.urls import path

from .views import (
    TourListPageView,
    CreateTourPageView,
    TourListAPIView,
    CreateTourAPIView,
)


app_name = "tours"


urlpatterns = [

    # Tour List HTML Page
    path(
        "tours/",
        TourListPageView.as_view(),
        name="tour-list-page"
    ),


    # Create Tour HTML Page
    path(
        "tours/create/",
        CreateTourPageView.as_view(),
        name="create-tour-page"
    ),


    # Tour List API
    path(
        "api/tours/",
        TourListAPIView.as_view(),
        name="list-tours"
    ),


    # Create Tour API
    path(
        "api/tours/create/",
        CreateTourAPIView.as_view(),
        name="create-tour"
    ),

]