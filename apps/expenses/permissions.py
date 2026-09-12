from rest_framework.permissions import BasePermission

from apps.tours.models import Tour
from .models import Expense


class IsTourMember(BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated)

    def has_object_permission(self, request, view, obj):
        if isinstance(obj, Expense):
            tour = obj.tour
        elif isinstance(obj, Tour):
            tour = obj
        else:
            tour = getattr(obj, 'tour', None)
        if tour is None:
            return False
        if isinstance(tour, Tour):
            return tour.is_member(request.user)
        return Tour.objects.filter(
            pk=getattr(tour, 'pk', tour),
            memberships__user=request.user,
        ).exists()


class IsExpenseEditor(BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated)

    def has_object_permission(self, request, view, obj):
        if not isinstance(obj, Expense):
            return False
        tour = obj.tour
        if not (isinstance(tour, Tour) and tour.is_member(request.user)):
            return False
        u = request.user
        return bool(
            obj.paid_by_id == u.pk
            or (obj.created_by_id is not None and obj.created_by_id == u.pk)
            or tour.is_creator(u)
        )
