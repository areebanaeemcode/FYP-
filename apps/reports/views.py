from django.contrib.auth.mixins import LoginRequiredMixin
from django.shortcuts import get_object_or_404
from django.views.generic import TemplateView

from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.tours.models import Tour

from .analytics import (
    compute_tour_analytics,
    compute_user_global_analytics,
)


class GlobalAnalyticsPageView(LoginRequiredMixin, TemplateView):
    template_name = 'analytics/global.html'

    def get_context_data(self, **kwargs):
        ctx = super().get_context_data(**kwargs)
        ctx['user_id'] = self.request.user.id
        ctx['dashboard_url'] = '/client/dashboard/'
        ctx['tours_url'] = '/client/tours/'
        return ctx


class GlobalAnalyticsAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        data = compute_user_global_analytics(request.user)
        return Response(data, status=status.HTTP_200_OK)


class TourAnalyticsPageView(LoginRequiredMixin, TemplateView):
    template_name = 'analytics/tour.html'

    def get_context_data(self, **kwargs):
        ctx = super().get_context_data(**kwargs)
        tour = get_object_or_404(Tour, pk=kwargs['pk'])
        ctx['tour'] = tour
        ctx['tour_id'] = kwargs['pk']
        ctx['tour_detail_url'] = '/client/tours/{pk}/'.format(pk=kwargs['pk'])
        ctx['tour_settlement_url'] = '/client/tours/{pk}/settlement/'.format(pk=kwargs['pk'])
        ctx['tours_url'] = '/client/tours/'
        return ctx


class TourAnalyticsAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk, *args, **kwargs):
        tour = get_object_or_404(Tour, pk=pk)
        if not tour.is_member(request.user):
            return Response(
                {'detail': 'You are not a member of this tour.'},
                status=status.HTTP_403_FORBIDDEN,
            )
        data = compute_tour_analytics(tour)
        return Response(data, status=status.HTTP_200_OK)
