from rest_framework.permissions import BasePermission, SAFE_METHODS

from .models import Tour


class IsTourMember(BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated)

    def has_object_permission(self, request, view, obj):
        if isinstance(obj, Tour):
            return obj.is_member(request.user)
        tour = getattr(obj, 'tour', None)
        if tour is None:
            return False
        if callable(tour):
            tour = tour()
        if isinstance(tour, Tour):
            return tour.is_member(request.user)
        return Tour.objects.filter(pk=getattr(tour, 'pk', tour), memberships__user=request.user).exists()


class IsTourCreator(BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated)

    def has_object_permission(self, request, view, obj):
        if isinstance(obj, Tour):
            return obj.is_creator(request.user)
        tour = getattr(obj, 'tour', None)
        if tour is None:
            return False
        if callable(tour):
            tour = tour()
        if isinstance(tour, Tour):
            return tour.is_creator(request.user)
        return Tour.objects.filter(pk=getattr(tour, 'pk', tour), memberships__user=request.user, memberships__role='creator').exists()
