from django.db import transaction as db_transaction
from django.utils.dateparse import parse_date
from django.shortcuts import get_object_or_404
from django.db.models import DecimalField
from decimal import Decimal

from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.filters import OrderingFilter

from apps.tours.models import Tour
from .models import Expense, ExpenseSplit, Receipt, ExpenseLimit
from .permissions import IsTourMember, IsExpenseEditor
from .serializers import (
    ExpenseReadSerializer,
    ExpenseCreateUpdateSerializer,
    ReceiptUploadSerializer,
    ExpenseLimitReadSerializer,
    ExpenseLimitWriteSerializer,
)
from .limit_utils import (
    annotate_limit_with_spending,
    check_expense_limits_for_tour,
)


def _alerts_for_user(limit_checks, user_id, amount=None, tour=None):
    out = {
        'limit_exceeded': False,
        'just_crossed': False,
        'limit_amount': None,
        'total_spent': None,
        'remaining': None,
    }
    if not user_id:
        return out
    if limit_checks and user_id in limit_checks:
        r = limit_checks[user_id]
        out['limit_exceeded'] = r.get('limit_exceeded', False)
        out['just_crossed'] = r.get('just_crossed', False)
        out['limit_amount'] = r.get('limit_amount')
        out['total_spent'] = r.get('total_spent')
        out['remaining'] = r.get('remaining')
        return out
    if tour:
        lim = ExpenseLimit.objects.filter(tour=tour, user_id=user_id).first()
        if lim:
            lim = annotate_limit_with_spending(lim)
            out['limit_exceeded'] = bool(lim.limit_exceeded)
            out['limit_amount'] = float(lim.amount)
            out['total_spent'] = float(lim.total_spent)
            out['remaining'] = float(lim.remaining)
    return out


class ExpenseListAPI(generics.ListAPIView):
    permission_classes = [IsAuthenticated, IsTourMember]
    serializer_class = ExpenseReadSerializer
    filter_backends = [OrderingFilter]
    ordering_fields = ['paid_at', 'created_at', 'amount']
    ordering = ['-paid_at', '-created_at']

    def get_queryset(self):
        return Expense.objects.select_related('tour', 'paid_by').prefetch_related(
            'splits', 'splits__user', 'receipt'
        )

    def list(self, request, *args, **kwargs):
        tour_id = request.query_params.get('tour_id') or request.data.get('tour_id')
        if not tour_id:
            return Response(
                {'detail': 'tour_id query parameter is required.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        tour = get_object_or_404(Tour, pk=tour_id)
        if not tour.is_member(request.user):
            return Response(
                {'detail': 'You are not a member of this tour.'},
                status=status.HTTP_403_FORBIDDEN,
            )
        qs = self.filter_queryset(self.get_queryset().filter(tour=tour))

        category = request.query_params.get('category')
        if category:
            qs = qs.filter(category=category)
        pm = request.query_params.get('payment_method')
        if pm:
            qs = qs.filter(payment_method=pm)
        dfrom = request.query_params.get('date_from')
        if dfrom:
            d = parse_date(dfrom)
            if d:
                qs = qs.filter(paid_at__date__gte=d)
        dto = request.query_params.get('date_to')
        if dto:
            d = parse_date(dto)
            if d:
                qs = qs.filter(paid_at__date__lte=d)

        page = self.paginate_queryset(qs)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        serializer = self.get_serializer(qs, many=True)
        return Response(serializer.data)


from rest_framework.parsers import JSONParser, FormParser, MultiPartParser

class ExpenseCreateAPI(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [JSONParser, FormParser, MultiPartParser]

    def post(self, request, *args, **kwargs):
        tour_id = request.data.get('tour_id')
        if not tour_id:
            return Response(
                {'detail': 'tour_id is required.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        tour = get_object_or_404(Tour, pk=tour_id)
        if not tour.is_member(request.user):
            return Response(
                {'detail': 'You are not a member of this tour.'},
                status=status.HTTP_403_FORBIDDEN,
            )
        serializer = ExpenseCreateUpdateSerializer(
            data=request.data, context={'request': request}
        )
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        expense = serializer.save()
        # Run expense-limit checks for paid_by after expense write
        paid_by_id = getattr(expense, 'paid_by_id', None)
        affected_user_ids = set()
        if paid_by_id:
            affected_user_ids.add(paid_by_id)
        limit_checks = check_expense_limits_for_tour(tour, affected_users=list(affected_user_ids))
        # Fire notifications for new_expense (tour members except paid_by and creator)
        new_notifs = 0
        try:
            from apps.notifications.hooks import notify_new_expense
            new_notifs = notify_new_expense(expense)
        except Exception:
            pass
        expense = (
            Expense.objects.filter(pk=expense.pk)
            .select_related('tour', 'paid_by')
            .prefetch_related('splits', 'splits__user', 'receipt')
            .first()
        )
        read = ExpenseReadSerializer(expense, context={'request': request})
        data = dict(read.data)
        data['alerts'] = {
            'actor': _alerts_for_user(limit_checks, request.user.id, tour=tour),
            'paid_by': _alerts_for_user(limit_checks, paid_by_id, tour=tour),
        }
        return Response(data, status=status.HTTP_201_CREATED)


class ExpenseDetailAPI(generics.RetrieveUpdateAPIView):
    permission_classes = [IsAuthenticated]
    queryset = Expense.objects.select_related('tour', 'paid_by').prefetch_related(
        'splits', 'splits__user', 'receipt'
    )
    serializer_class = ExpenseReadSerializer

    def get_permissions(self):
        perms = [IsAuthenticated()]
        if self.request.method in ('GET', 'HEAD', 'OPTIONS'):
            perms.append(IsTourMember())
        else:
            perms.append(IsExpenseEditor())
        return perms

    def get_serializer_class(self):
        if self.request.method in ('PATCH', 'PUT', 'POST'):
            return ExpenseCreateUpdateSerializer
        return ExpenseReadSerializer

    def get_object(self):
        obj = super().get_object()
        self.check_object_permissions(self.request, obj)
        return obj

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = ExpenseReadSerializer(instance, context={'request': request})
        return Response(serializer.data)

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        tour = instance.tour
        old_paid_by_id = getattr(instance, 'paid_by_id', None)
        serializer = ExpenseCreateUpdateSerializer(
            instance, data=request.data, partial=partial, context={'request': request}
        )
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        updated = serializer.save()
        new_paid_by_id = getattr(updated, 'paid_by_id', None)
        affected = {u for u in (old_paid_by_id, new_paid_by_id) if u}
        limit_checks = check_expense_limits_for_tour(tour, affected_users=list(affected))
        # Fire expense update notifications as new_expense for tour members except paid_by/creator
        try:
            from apps.notifications.hooks import notify_new_expense
            notify_new_expense(updated)
        except Exception:
            pass
        updated = (
            Expense.objects.filter(pk=updated.pk)
            .select_related('tour', 'paid_by')
            .prefetch_related('splits', 'splits__user', 'receipt')
            .first()
        )
        read = ExpenseReadSerializer(updated, context={'request': request})
        data = dict(read.data)
        data['alerts'] = {
            'actor': _alerts_for_user(limit_checks, request.user.id, tour=tour),
            'paid_by': _alerts_for_user(limit_checks, new_paid_by_id, tour=tour),
        }
        return Response(data, status=status.HTTP_200_OK)

    def patch(self, request, *args, **kwargs):
        kwargs['partial'] = True
        return self.update(request, *args, **kwargs)


class ExpenseDeleteAPI(APIView):
    permission_classes = [IsAuthenticated, IsExpenseEditor]

    def delete(self, request, pk, *args, **kwargs):
        expense = get_object_or_404(
            Expense.objects.select_related('tour').prefetch_related('splits'),
            pk=pk,
        )
        self.check_object_permissions(request, expense)
        tour = expense.tour
        paid_by_id = getattr(expense, 'paid_by_id', None)
        with db_transaction.atomic():
            expense.delete()
        limit_checks = {}
        if paid_by_id:
            limit_checks = check_expense_limits_for_tour(tour, affected_users=[paid_by_id])
        resp = {
            'detail': 'Expense deleted',
            'alerts': {
                'actor': _alerts_for_user(limit_checks, request.user.id, tour=tour),
                'paid_by': _alerts_for_user(limit_checks, paid_by_id, tour=tour),
            } if (paid_by_id or limit_checks) else {'actor': _alerts_for_user({}, request.user.id, tour=tour), 'paid_by': {}},
        }
        return Response(resp, status=status.HTTP_200_OK)


class ReceiptUploadAPI(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk, *args, **kwargs):
        expense = get_object_or_404(
            Expense.objects.select_related('tour').prefetch_related('receipt'),
            pk=pk,
        )
        if not expense.tour.is_member(request.user):
            return Response(
                {'detail': 'You are not a member of this tour.'},
                status=status.HTTP_403_FORBIDDEN,
            )
        serializer = ReceiptUploadSerializer(data=request.data, context={'request': request})
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        image_file = serializer.validated_data['image']
        with db_transaction.atomic():
            receipt = getattr(expense, 'receipt', None)
            is_new = receipt is None
            old_image = None
            if is_new:
                receipt = Receipt(expense=expense)
            else:
                old_image = receipt.image
            receipt.image = image_file
            receipt.uploaded_by = request.user
            if is_new or receipt.verified_by_id is None:
                receipt.verified_by = request.user
                from django.utils import timezone
                receipt.verified_at = timezone.now()
            receipt.save()
            expense.save(update_fields=['updated_at'])
            if old_image and old_image != receipt.image:
                try:
                    old_image.delete(save=False)
                except Exception:
                    pass
        expense = (
            Expense.objects.filter(pk=expense.pk)
            .select_related('tour', 'paid_by')
            .prefetch_related('splits', 'splits__user', 'receipt')
            .first()
        )
        read = ExpenseReadSerializer(expense, context={'request': request})
        return Response(read.data, status=status.HTTP_201_CREATED if is_new else status.HTTP_200_OK)


class ReceiptVerifyAPI(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk, *args, **kwargs):
        expense = get_object_or_404(
            Expense.objects.select_related('tour').prefetch_related('receipt'),
            pk=pk,
        )
        if not expense.tour.is_member(request.user):
            return Response(
                {'detail': 'You are not a member of this tour.'},
                status=status.HTTP_403_FORBIDDEN,
            )
        receipt = getattr(expense, 'receipt', None)
        if not receipt or not receipt.image:
            return Response(
                {'detail': 'This expense does not have a receipt yet.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        receipt.mark_verified(request.user)
        expense = (
            Expense.objects.filter(pk=expense.pk)
            .select_related('tour', 'paid_by')
            .prefetch_related('splits', 'splits__user', 'receipt')
            .first()
        )
        read = ExpenseReadSerializer(expense, context={'request': request})
        return Response(read.data, status=status.HTTP_200_OK)


class ExpenseLimitAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def _serialize(self, limit):
        limit = annotate_limit_with_spending(limit)
        obj = {
            'id': limit.id,
            'tour_id': limit.tour_id,
            'user_id': limit.user_id,
            'amount': float(limit.amount),
            'total_spent': float(limit.total_spent),
            'remaining': float(limit.remaining),
            'limit_exceeded': bool(limit.limit_exceeded),
            'last_notified_exceeded': bool(limit.last_notified_exceeded),
            'updated_at': limit.updated_at.isoformat() if limit.updated_at else None,
        }
        return obj

    def get(self, request, *args, **kwargs):
        tour_id = request.query_params.get('tour_id')
        if not tour_id:
            return Response({'detail': 'tour_id query parameter is required.'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            tour_id = int(tour_id)
        except (TypeError, ValueError):
            return Response({'detail': 'tour_id must be integer.'}, status=status.HTTP_400_BAD_REQUEST)
        tour = get_object_or_404(Tour, pk=tour_id)
        if not tour.is_member(request.user):
            return Response({'detail': 'You are not a member of this tour.'}, status=status.HTTP_403_FORBIDDEN)
        limit = ExpenseLimit.objects.filter(tour=tour, user=request.user).first()
        if not limit:
            return Response({
                'id': None,
                'tour_id': tour_id,
                'user_id': request.user.id,
                'amount': None,
                'total_spent': 0.0,
                'remaining': None,
                'limit_exceeded': False,
                'last_notified_exceeded': False,
                'updated_at': None,
            }, status=status.HTTP_200_OK)
        return Response(self._serialize(limit), status=status.HTTP_200_OK)

    def put(self, request, *args, **kwargs):
        serializer = ExpenseLimitWriteSerializer(data=request.data or {})
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        tour_id = serializer.validated_data['tour_id']
        amount = serializer.validated_data['amount']
        tour = get_object_or_404(Tour, pk=tour_id)
        if not tour.is_member(request.user):
            return Response({'detail': 'You are not a member of this tour.'}, status=status.HTTP_403_FORBIDDEN)
        with db_transaction.atomic():
            limit, created = ExpenseLimit.objects.select_for_update().get_or_create(
                tour=tour,
                user=request.user,
                defaults={'amount': amount},
            )
            if not created:
                old_amount = limit.amount
                limit.amount = amount
                # If user raises the limit, clear last_notified so user can be notified on next cross
                if amount > old_amount:
                    limit.last_notified_exceeded = False
                limit.save(update_fields=['amount', 'last_notified_exceeded', 'updated_at'])
            # Re-run limit checks against user after upsert
            check_expense_limits_for_tour(tour, affected_users=[request.user.id])
        data = self._serialize(limit)
        return Response(data, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)

    def patch(self, request, *args, **kwargs):
        return self.put(request, *args, **kwargs)
