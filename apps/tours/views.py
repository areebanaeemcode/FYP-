from datetime import date
from decimal import Decimal, InvalidOperation
from urllib.parse import quote

from django.db import IntegrityError, transaction
from django.utils import timezone
from django.db.models import Sum, Count, Subquery, OuterRef, CharField, Value as V
from django.db.models.functions import Coalesce
from django.views.generic import TemplateView
from django.contrib.auth.mixins import LoginRequiredMixin
from django.shortcuts import get_object_or_404
from django.http import HttpResponseForbidden

from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.filters import SearchFilter, OrderingFilter

from .models import Tour, TourMember, SettlementTransfer
from .serializers import (
    TourSerializer,
    TourCreateSerializer,
    TourJoinSerializer,
)
from .pagination import TourPagination
from .permissions import IsTourMember, IsTourCreator
from apps.reports.views import TourAnalyticsAPIView, TourAnalyticsPageView


CATEGORY_KEYWORDS = {
    "transport": [
        "taxi", "cab", "uber", "lyft", "bus", "train", "flight", "plane", "airport",
        "metro", "subway", "car", "rental", "gas", "fuel", "parking", "toll",
        "ferry", "shuttle", "transport", "fare", "ticket",
    ],
    "accommodation": [
        "hotel", "hostel", "motel", "resort", "bnb", "airbnb", "stay", "lodge",
        "room", "booking", "cabin", "villa", "accommodation", "apartment",
    ],
    "food": [
        "dinner", "lunch", "breakfast", "brunch", "snack", "coffee", "cafe",
        "restaurant", "meal", "drink", "drinks", "bar", "pub", "pizza", "burger",
        "sushi", "tacos", "pasta", "bakery", "ice cream", "tea", "groceries",
        "supermarket", "beer", "wine",
    ],
    "activities": [
        "tour", "museum", "ticket", "show", "concert", "park", "adventure",
        "hike", "diving", "swim", "ski", "safari", "spa", "massage", "cinema",
        "movie", "game", "entertainment", "attraction", "experience", "guide",
        "activity", "event",
    ],
    "shopping": [
        "shop", "shopping", "souvenir", "gift", "store", "mall", "clothes",
        "market", "buy", "purchase", "bag", "outlet",
    ],
}
CATEGORY_LABELS = {
    "transport": "Transport",
    "accommodation": "Accommodation",
    "food": "Food",
    "activities": "Activities",
    "shopping": "Shopping",
    "other": "Other",
}
CATEGORY_ORDER = [
    "food", "transport", "accommodation", "activities", "shopping", "other",
]


def _aggregate_tour_category_totals(tour):
    from apps.expenses.models import Expense
    from django.db.models import DecimalField
    from django.db.models.functions import Coalesce
    rows = (
        Expense.objects.filter(tour=tour)
        .values('category')
        .annotate(total=Coalesce(Sum('amount', output_field=DecimalField(max_digits=12, decimal_places=2)), 0, output_field=DecimalField(max_digits=12, decimal_places=2)))
        .order_by('-total')
    )
    totals_by_cat = {r['category']: r['total'] for r in rows}
    total_spent = sum(totals_by_cat.values()) or 0
    ordered = []
    for cat, total in sorted(
        totals_by_cat.items(), key=lambda kv: (-kv[1], CATEGORY_ORDER.index(kv[0]) if kv[0] in CATEGORY_ORDER else 99)
    ):
        share = (total / total_spent * 100) if total_spent > 0 else 0
        ordered.append({
            'category': {
                'value': cat,
                'label': CATEGORY_LABELS.get(cat, cat),
            },
            'total': float(total),
            'share_pct': round(float(share), 2),
        })
    return ordered, float(total_spent)


def _keyword_based_category(title, notes):
    haystack = f"{title or ''} {notes or ''}".lower()
    best_cat = None
    best_hits = 0
    for cat, keywords in CATEGORY_KEYWORDS.items():
        hits = sum(1 for kw in keywords if kw in haystack)
        if hits > best_hits:
            best_hits = hits
            best_cat = cat
    if best_cat and best_hits > 0:
        return best_cat, f"Matched keyword for '{CATEGORY_LABELS[best_cat]}' in title/notes."
    return None, None


def _history_based_category(tour):
    from apps.expenses.models import Expense
    from django.db.models import DecimalField, IntegerField
    from django.db.models.functions import Coalesce
    rows = (
        Expense.objects.filter(tour=tour)
        .values('category')
        .annotate(
            cnt=Count('id', output_field=IntegerField()),
            total=Coalesce(Sum('amount', output_field=DecimalField(max_digits=12, decimal_places=2)), 0, output_field=DecimalField(max_digits=12, decimal_places=2)),
        )
        .order_by('-total', '-cnt')
    )
    if not rows:
        return None, None
    top = rows[0]
    cat = top['category']
    return (
        cat,
        f"Based on tour history — {CATEGORY_LABELS.get(cat, cat)} is your most frequently recorded category (${float(top['total']):.2f} spent).",
    )


def annotate_tour_list(qs, user_id=None):
    qs = qs.annotate(
        _total_spent=Coalesce(Sum('expenses__amount'), 0),
        _member_count=Count('memberships', distinct=True),
        _creator_name_sub=Subquery(
            TourMember.objects.filter(
                tour=OuterRef('pk'),
                role='creator',
            ).values('user__first_name')[:1]
        ),
        _creator_name_last_sub=Subquery(
            TourMember.objects.filter(
                tour=OuterRef('pk'),
                role='creator',
            ).values('user__last_name')[:1]
        ),
        _creator_id_sub=Subquery(
            TourMember.objects.filter(
                tour=OuterRef('pk'),
                role='creator',
            ).values('user_id')[:1]
        ),
    )
    annotated = []
    for t in qs:
        t.total_spent = t._total_spent
        t.member_count = t._member_count
        first = t._creator_name_sub or ''
        last = t._creator_name_last_sub or ''
        full = f'{first} {last}'.strip()
        t.creator_name = full or (t.created_by.get_full_name() if hasattr(t.created_by, 'get_full_name') else str(t.created_by))
        t.creator_id = t._creator_id_sub or getattr(t.created_by, 'pk', None)
        annotated.append(t)
    return qs


def annotate_tour_detail(tour):
    total = tour.expenses.aggregate(t=Sum('amount'))['t'] or 0
    tour.total_spent = total
    tour.member_count = tour.memberships.count()
    creator = tour.memberships.filter(role='creator').select_related('user').first()
    if creator:
        u = creator.user
        first = getattr(u, 'first_name', '') or ''
        last = getattr(u, 'last_name', '') or ''
        full = f'{first} {last}'.strip()
        tour.creator_name = full or getattr(u, 'email', '')
        tour.creator_id = getattr(u, 'pk', None) or getattr(u, 'id', None)
    else:
        u = tour.created_by
        first = getattr(u, 'first_name', '') or ''
        last = getattr(u, 'last_name', '') or ''
        full = f'{first} {last}'.strip()
        tour.creator_name = full or getattr(u, 'email', '')
        tour.creator_id = getattr(u, 'pk', None) or getattr(u, 'id', None)
    return tour


# ------------- HTML PAGE VIEWS -------------

class TourListPageView(LoginRequiredMixin, TemplateView):
    template_name = 'tour/tour-list.html'

    def get_context_data(self, **kwargs):
        ctx = super().get_context_data(**kwargs)
        ctx['tour_create_url'] = '/client/tours/create/'
        ctx['tour_list_url'] = '/client/tours/'
        return ctx


class CreateTourPageView(LoginRequiredMixin, TemplateView):
    template_name = 'tour/create-tour.html'

    def get_context_data(self, **kwargs):
        ctx = super().get_context_data(**kwargs)
        ctx['tour_create_submit_url'] = '/client/api/tours/'
        ctx['tour_list_url'] = '/client/tours/'
        return ctx


class TourDetailPageView(LoginRequiredMixin, TemplateView):
    template_name = 'tour/tour-detail.html'

    def get_context_data(self, **kwargs):
        ctx = super().get_context_data(**kwargs)
        ctx['tour_id'] = kwargs.get('pk')
        ctx['tour_list_url'] = '/client/tours/'
        ctx['settlement_url'] = '/client/tours/{pk}/settlement/'.format(pk=ctx['tour_id'])
        ctx['analytics_url'] = '/client/tours/{pk}/analytics/'.format(pk=ctx['tour_id'])
        tour = Tour.objects.filter(pk=ctx['tour_id']).first()
        if tour:
            ctx['tour'] = tour
            ctx['join_token'] = tour.join_token
            ctx['join_link'] = tour.join_link
            try:
                full_link = self.request.build_absolute_uri(tour.join_link)
            except Exception:
                full_link = tour.join_link
            ctx['full_join_link'] = full_link
            msg = f'Hey! Join my tour "{tour.title}" on PayTogether:\n{full_link}'
            ctx['whatsapp_share_url'] = f'https://api.whatsapp.com/send?text={quote(msg)}'

            membership = tour.memberships.filter(user=self.request.user).first()
            ctx['current_user_role'] = membership.role if membership else 'none'
            ctx['is_tour_creator'] = bool(
                tour.is_creator(self.request.user)
                or (getattr(tour, 'creator_id', None) == self.request.user.id)
                or ctx['current_user_role'] in ('creator', 'admin')
            )
        else:
            ctx['tour'] = None
            ctx['join_token'] = ''
            ctx['join_link'] = ''
            ctx['full_join_link'] = ''
            ctx['whatsapp_share_url'] = '#'
            ctx['is_tour_creator'] = False
            ctx['current_user_role'] = 'none'
        return ctx


class JoinTourPageView(LoginRequiredMixin, TemplateView):
    template_name = 'tour/join-tour.html'

    def get_context_data(self, **kwargs):
        ctx = super().get_context_data(**kwargs)
        token = kwargs.get('join_token', '').strip()
        ctx['join_token'] = token
        ctx['tour_list_url'] = '/client/tours/'
        if token:
            tour = Tour.objects.filter(join_token=token).select_related('created_by').first()
            if tour:
                ctx['tour'] = tour
                ctx['is_member'] = tour.is_member(self.request.user)
                ctx['tour_title'] = tour.title
                ctx['tour_destination'] = tour.destination
                ctx['tour_creator'] = tour.created_by.get_full_name() or tour.created_by.email
                ctx['member_count'] = tour.memberships.count()
        return ctx


# ------------- API VIEWS -------------

class TourListAPIView(generics.ListAPIView):
    serializer_class = TourSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = TourPagination
    filter_backends = [SearchFilter, OrderingFilter]
    search_fields = ['title', 'destination', 'status', 'description']
    ordering_fields = ['created_at', 'start_date', 'budget', 'title']
    ordering = ['-created_at']

    def get_queryset(self):
        user = self.request.user
        qs = Tour.objects.filter(
            memberships__user=user,
        ).select_related('created_by').distinct()
        return qs

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        page = self.paginate_queryset(queryset)
        if page is not None:
            for t in page:
                annotate_tour_detail(t)
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        for t in queryset:
            annotate_tour_detail(t)
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)


class CreateTourAPIView(generics.CreateAPIView):
    serializer_class = TourCreateSerializer
    permission_classes = [IsAuthenticated]

    @transaction.atomic
    def perform_create(self, serializer):
        defaults = {}
        if not serializer.validated_data.get('start_date'):
            defaults['start_date'] = date.today()
        if not serializer.validated_data.get('end_date'):
            defaults['end_date'] = date.today()
        if not serializer.validated_data.get('budget'):
            defaults['budget'] = 0
        instance = serializer.save(
            created_by=self.request.user,
            **defaults,
        )
        TourMember.objects.get_or_create(
            tour=instance,
            user=self.request.user,
            defaults={'role': 'creator'},
        )

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        instance = serializer.instance
        annotate_tour_detail(instance)
        out_serializer = TourSerializer(instance, context=self.get_serializer_context())
        headers = self.get_success_headers(out_serializer.data)
        return Response(out_serializer.data, status=status.HTTP_201_CREATED, headers=headers)


class TourDetailAPIView(generics.RetrieveAPIView):
    queryset = Tour.objects.select_related('created_by').all()
    serializer_class = TourSerializer
    permission_classes = [IsAuthenticated, IsTourMember]
    lookup_url_kwarg = 'pk'

    def get_object(self):
        obj = super().get_object()
        self.check_object_permissions(self.request, obj)
        annotate_tour_detail(obj)
        obj._members_prefetched = list(obj.memberships.select_related('user').all())
        return obj


class TourDeleteAPIView(generics.DestroyAPIView):
    queryset = Tour.objects.all()
    permission_classes = [IsAuthenticated, IsTourCreator]
    lookup_url_kwarg = 'pk'

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        title = str(instance)
        self.perform_destroy(instance)
        return Response({'detail': f'Tour "{title}" deleted successfully.'}, status=status.HTTP_200_OK)


class JoinTourAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def _resolve_token(self, token_from_body, token_from_url):
        token = token_from_url or token_from_body or ''
        token = token.strip().rstrip('/')
        if '/' in token:
            token = token.rstrip('/').rsplit('/', 1)[-1]
        return token

    def get(self, request, join_token=None, *args, **kwargs):
        token = self._resolve_token(request.query_params.get('join_token', ''), join_token or '')
        if not token:
            return Response({'join_token': ['Join token is required.']}, status=status.HTTP_400_BAD_REQUEST)
        tour = get_object_or_404(Tour, join_token=token)
        annotate_tour_detail(tour)
        return Response({
            'id': tour.id,
            'title': tour.title,
            'destination': tour.destination,
            'start_date': tour.start_date,
            'end_date': tour.end_date,
            'status': tour.status,
            'budget': tour.budget,
            'creator_name': tour.created_by.get_full_name() or tour.created_by.email,
            'member_count': getattr(tour, 'member_count', tour.memberships.count()),
            'is_member': tour.is_member(request.user),
            'join_token': tour.join_token,
            'join_link': tour.join_link,
        }, status=status.HTTP_200_OK)

    def post(self, request, join_token=None, *args, **kwargs):
        serializer = TourJoinSerializer(data=request.data or {})
        serializer.is_valid(raise_exception=True)
        body_token = serializer.validated_data.get('join_token') or ''
        token = self._resolve_token(body_token, join_token or '')
        if not token:
            return Response({'join_token': ['Join token is required.']}, status=status.HTTP_400_BAD_REQUEST)
        token = token.strip().upper()
        tour = Tour.objects.filter(join_token=token).first() or Tour.objects.filter(join_token__iexact=token).first()
        if not tour:
            return Response({'join_token': ['Invalid join code or token.']}, status=status.HTTP_404_NOT_FOUND)
        try:
            with transaction.atomic():
                membership, created = TourMember.objects.get_or_create(
                    tour=tour,
                    user=request.user,
                    defaults={'role': 'member'},
                )
        except IntegrityError:
            created = False
            membership = TourMember.objects.filter(tour=tour, user=request.user).first()
        if hasattr(tour, '_members_prefetched'):
            delattr(tour, '_members_prefetched')
        tour.refresh_from_db()
        annotate_tour_detail(tour)
        if created:
            try:
                from apps.notifications.hooks import notify_member_joined
                notify_member_joined(tour, request.user)
            except Exception:
                pass
        if not created:
            return Response({
                'detail': 'You are already a member of this tour.',
                'already_member': True,
                'tour': TourSerializer(tour, context={'request': request}).data,
            }, status=status.HTTP_200_OK)
        return Response({
            'detail': 'Successfully joined the tour.',
            'already_member': False,
            'tour': TourSerializer(tour, context={'request': request}).data,
        }, status=status.HTTP_201_CREATED)


class SmartExpenseAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk, *args, **kwargs):
        tour = get_object_or_404(Tour, pk=pk)
        if not tour.is_member(request.user):
            return Response(
                {'detail': 'You are not a member of this tour.'},
                status=status.HTTP_403_FORBIDDEN,
            )
        hint_title = request.query_params.get('title') or ''
        hint_notes = request.query_params.get('notes') or ''

        top_categories, total_spent = _aggregate_tour_category_totals(tour)
        high_spend = [c for c in top_categories if c['share_pct'] >= 30.0]

        # 1. keyword match on hint_title/hint_notes
        suggested_cat, reason = _keyword_based_category(hint_title, hint_notes)
        # 2. history fallback if no keyword match
        if not suggested_cat:
            suggested_cat, reason = _history_based_category(tour)
        # 3. other fallback
        if not suggested_cat:
            suggested_cat = 'other'
            reason = "No recorded expenses yet — starting with a sensible default of 'Other'."

        suggested = {
            'value': suggested_cat,
            'label': CATEGORY_LABELS.get(suggested_cat, suggested_cat),
        }

        return Response({
            'tour_id': tour.pk,
            'total_spent': total_spent,
            'suggested_category': suggested,
            'reason': reason,
            'top_categories': top_categories,
            'high_spend_categories': high_spend,
        }, status=status.HTTP_200_OK)


class SettlementAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk, *args, **kwargs):
        tour = get_object_or_404(Tour, pk=pk)
        if not tour.is_member(request.user):
            return Response(
                {'detail': 'You are not a member of this tour.'},
                status=status.HTTP_403_FORBIDDEN,
            )
        from .settlement_engine import compute_settlement
        data = compute_settlement(tour)
        paid_transfers = set(SettlementTransfer.objects.filter(tour=tour, paid=True).values_list(
            'from_user_id', 'to_user_id', 'amount'
        ))
        for transfer in data['transfers']:
            key = (transfer['from_user_id'], transfer['to_user_id'], Decimal(str(transfer['amount'])).quantize(Decimal('0.01')))
            transfer['paid'] = key in paid_transfers
        return Response(data, status=status.HTTP_200_OK)


class SettlementTransferPaidAPIView(APIView):
    """Persist completion of one current suggested transfer.

    Only the member who owes the money may mark their own payment as completed.
    The underlying balances remain an expense-based calculation.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, pk, *args, **kwargs):
        tour = get_object_or_404(Tour, pk=pk)
        if not tour.is_member(request.user):
            return Response({'detail': 'You are not a member of this tour.'}, status=status.HTTP_403_FORBIDDEN)
        try:
            from_user_id = int(request.data.get('from_user_id'))
            to_user_id = int(request.data.get('to_user_id'))
            amount = Decimal(str(request.data.get('amount'))).quantize(Decimal('0.01'))
        except (TypeError, ValueError, InvalidOperation):
            return Response({'detail': 'A valid transfer is required.'}, status=status.HTTP_400_BAD_REQUEST)
        if amount <= 0 or request.user.id != from_user_id:
            return Response({'detail': 'Only the paying member can mark this transfer paid.'}, status=status.HTTP_403_FORBIDDEN)

        from .settlement_engine import compute_settlement
        current = compute_settlement(tour)['transfers']
        is_current_transfer = any(
            item['from_user_id'] == from_user_id and item['to_user_id'] == to_user_id and
            Decimal(str(item['amount'])).quantize(Decimal('0.01')) == amount
            for item in current
        )
        if not is_current_transfer:
            return Response({'detail': 'This transfer is no longer part of the current settlement.'}, status=status.HTTP_400_BAD_REQUEST)
        with transaction.atomic():
            record, _ = SettlementTransfer.objects.select_for_update().get_or_create(
                tour=tour, from_user_id=from_user_id, to_user_id=to_user_id, amount=amount,
            )
            record.paid = True
            record.marked_paid_by = request.user
            record.paid_at = timezone.now()
            record.save(update_fields=['paid', 'marked_paid_by', 'paid_at', 'updated_at'])
        return Response({'paid': True}, status=status.HTTP_200_OK)


class TourSettlementPageView(LoginRequiredMixin, TemplateView):
    template_name = 'tour/settlement.html'

    def dispatch(self, request, *args, **kwargs):
        tour = get_object_or_404(Tour, pk=kwargs['pk'])
        if not tour.is_member(request.user):
            return HttpResponseForbidden('You are not a member of this tour.')
        return super().dispatch(request, *args, **kwargs)

    def get_context_data(self, **kwargs):
        ctx = super().get_context_data(**kwargs)
        tour = get_object_or_404(Tour, pk=kwargs['pk'])
        ctx['tour'] = tour
        ctx['tour_id'] = kwargs['pk']
        ctx['tour_detail_url'] = '/client/tours/{pk}/'.format(pk=ctx['tour_id'])
        ctx['tour_list_url'] = '/client/tours/'
        from .settlement_engine import compute_settlement
        import json
        settlement_data = compute_settlement(tour)
        paid_transfers = set(SettlementTransfer.objects.filter(tour=tour, paid=True).values_list(
            'from_user_id', 'to_user_id', 'amount'
        ))
        for transfer in settlement_data['transfers']:
            key = (transfer['from_user_id'], transfer['to_user_id'], Decimal(str(transfer['amount'])).quantize(Decimal('0.01')))
            transfer['paid'] = key in paid_transfers
        ctx['settlement'] = settlement_data
        ctx['settlement_json'] = json.dumps(settlement_data)
        return ctx


class InviteTourMemberAPIView(APIView):
    permission_classes = [IsAuthenticated, IsTourMember]

    def post(self, request, pk):
        from apps.accounts.models import User
        tour = get_object_or_404(Tour, pk=pk)
        self.check_object_permissions(request, tour)
        is_admin = bool(tour.is_creator(request.user))

        identifier = (request.data.get('identifier') or '').strip()
        role = (request.data.get('role') or 'member').strip().lower()
        if not is_admin:
            role = 'member'
        elif role not in ('creator', 'member'):
            role = 'member'

        if not identifier:
            return Response(
                {"detail": "Please provide email or phone number to invite."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        target = None
        lookup_fields = []
        if '@' in identifier:
            lookup_fields = [{'email__iexact': identifier}]
        else:
            digits = ''.join(ch for ch in identifier if ch.isdigit() or ch == '+')
            lookup_fields = [
                {'phone_number': digits} if digits else None,
                {'email__iexact': identifier},
            ]
            lookup_fields = [f for f in lookup_fields if f]

        for q in lookup_fields:
            try:
                target = User.objects.get(**q)
                break
            except User.MultipleObjectsReturned:
                target = User.objects.filter(**q).first()
                break
            except User.DoesNotExist:
                continue

        if target is None:
            if identifier.endswith('.invalid'):
                return Response(
                    {
                        "added": False,
                        "invite_sent": False,
                        "state": "user_not_found",
                        "message": (
                            "No account found with that email or phone. "
                            "Ask them to sign up first at /register/, then invite them again. "
                            "Future: invite email feature will be available here."
                        ),
                        "identifier": identifier,
                    },
                    status=status.HTTP_404_NOT_FOUND,
                )

            import random
            raw_pwd = "TourPass#" + str(random.randint(1000, 9999))
            clean_display_name = identifier.strip()
            if '@' in identifier:
                user_email = identifier.lower().strip()
                phone_candidate = f"+923{random.randint(10000000, 99999999)}"
                while User.objects.filter(phone_number=phone_candidate).exists():
                    phone_candidate = f"+923{random.randint(10000000, 99999999)}"
                target = User.objects.create_user(
                    email=user_email,
                    password=raw_pwd,
                    first_name=clean_display_name,
                    last_name="",
                    phone_number=phone_candidate,
                )
            else:
                digits = ''.join(ch for ch in identifier if ch.isdigit() or ch == '+')
                phone_candidate = digits if (len(digits) <= 15 and digits and not User.objects.filter(phone_number=digits).exists()) else f"+923{random.randint(10000000, 99999999)}"
                user_email = f"user_{phone_candidate.replace('+', '')[-6:]}@pay-together.dev"
                while User.objects.filter(email=user_email).exists():
                    user_email = f"user_{random.randint(100000, 999999)}@pay-together.dev"
                target = User.objects.create_user(
                    email=user_email,
                    password=raw_pwd,
                    first_name=clean_display_name,
                    last_name="",
                    phone_number=phone_candidate,
                )
        else:
            # If existing target has a placeholder or empty name, update to entered identifier
            if not target.first_name or target.first_name == 'Member' or target.first_name.startswith('Member '):
                target.first_name = identifier.strip()
                target.save(update_fields=['first_name'])

        if target.pk == request.user.pk:
            return Response(
                {"added": False, "message": "You cannot invite yourself. You are already a member.", "state": "self"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        membership, created = TourMember.objects.get_or_create(
            tour=tour,
            user=target,
            defaults={"role": role},
        )

        if not created and role != membership.role:
            membership.role = role
            membership.save()

        from apps.notifications.models import Notification
        try:
            role_label = "Admin" if membership.role == "creator" else "Member"
            Notification.objects.create(
                user=target,
                type="member_joined",
                title=f"Added to tour: {tour.title}",
                message=f"{request.user.first_name or request.user.email} added you to '{tour.title}' as {role_label}.",
                related_object_id=tour.pk,
            )
        except Exception:
            pass

        # Check if initial financial amounts (Total Paid / Fair Share) were provided
        from decimal import Decimal
        raw_paid = request.data.get('total_paid')
        raw_share = request.data.get('fair_share')
        try:
            total_paid = Decimal(str(raw_paid)) if raw_paid not in (None, '', 0, '0') else Decimal('0.00')
        except Exception:
            total_paid = Decimal('0.00')
        try:
            fair_share = Decimal(str(raw_share)) if raw_share not in (None, '', 0, '0') else Decimal('0.00')
        except Exception:
            fair_share = Decimal('0.00')

        if total_paid < 0:
            total_paid = Decimal('0.00')
        if fair_share < 0:
            fair_share = Decimal('0.00')

        if total_paid > 0 or fair_share > 0:
            from apps.expenses.models import Expense, ExpenseSplit
            from django.utils import timezone
            TWO_PLACES = Decimal('0.01')
            total_paid = total_paid.quantize(TWO_PLACES)
            fair_share = fair_share.quantize(TWO_PLACES)
            target_name = (f"{getattr(target, 'first_name', '') or ''} {getattr(target, 'last_name', '') or ''}".strip() or target.email)

            if total_paid > 0 and fair_share == total_paid:
                exp = Expense.objects.create(
                    tour=tour,
                    title=f"Opening Contribution ({target_name})",
                    amount=total_paid,
                    category="other",
                    payment_method="cash",
                    paid_by=target,
                    created_by=request.user,
                    paid_at=timezone.now(),
                    notes=f"Opening balance recorded when adding member {target.email}",
                )
                ExpenseSplit.objects.create(
                    expense=exp,
                    user=target,
                    share_amount=fair_share,
                )
            elif total_paid > 0 and fair_share < total_paid:
                exp = Expense.objects.create(
                    tour=tour,
                    title=f"Advance Payment ({target_name})",
                    amount=total_paid,
                    category="other",
                    payment_method="cash",
                    paid_by=target,
                    created_by=request.user,
                    paid_at=timezone.now(),
                    notes=f"Advance payment recorded when adding member {target.email}",
                )
                if fair_share > 0:
                    ExpenseSplit.objects.create(
                        expense=exp,
                        user=target,
                        share_amount=fair_share,
                    )
                ExpenseSplit.objects.create(
                    expense=exp,
                    user=request.user,
                    share_amount=total_paid - fair_share,
                )
            else:
                # fair_share > total_paid
                if total_paid > 0:
                    exp1 = Expense.objects.create(
                        tour=tour,
                        title=f"Opening Contribution ({target_name})",
                        amount=total_paid,
                        category="other",
                        payment_method="cash",
                        paid_by=target,
                        created_by=request.user,
                        paid_at=timezone.now(),
                        notes=f"Initial paid amount recorded when adding member {target.email}",
                    )
                    ExpenseSplit.objects.create(
                        expense=exp1,
                        user=target,
                        share_amount=total_paid,
                    )
                remaining_share = fair_share - total_paid
                exp2 = Expense.objects.create(
                    tour=tour,
                    title=f"Tour Registration Share ({target_name})",
                    amount=remaining_share,
                    category="other",
                    payment_method="cash",
                    paid_by=request.user,
                    created_by=request.user,
                    paid_at=timezone.now(),
                    notes=f"Initial expense share recorded when adding member {target.email}",
                )
                ExpenseSplit.objects.create(
                    expense=exp2,
                    user=target,
                    share_amount=remaining_share,
                )

        annotate_tour_detail(tour)
        out_serializer = TourSerializer(tour, context={"request": request})

        return Response(
            {
                "added": True,
                "created": bool(created),
                "state": "added" if created else "already_member",
                "member": {
                    "id": target.pk,
                    "full_name": (f"{getattr(target, 'first_name', '') or ''} {getattr(target, 'last_name', '') or ''}".strip() or target.email),
                    "email": target.email,
                    "phone_number": getattr(target, 'phone_number', ''),
                    "role": membership.role,
                    "role_label": "Admin" if membership.role == "creator" else "Member",
                    "is_admin": is_admin,
                },
                "message": (
                    f"{target.email} added to tour as {'Admin' if membership.role == 'creator' else 'Member'}." if created
                    else f"{target.email} was already a member. Role updated to {'Admin' if membership.role == 'creator' else 'Member'}."
                ),
                "tour": out_serializer.data,
            },
            status=status.HTTP_200_OK,
        )


class ChangeMemberRoleAPIView(APIView):
    permission_classes = [IsAuthenticated, IsTourMember]

    def post(self, request, pk):
        from apps.accounts.models import User
        tour = get_object_or_404(Tour, pk=pk)
        self.check_object_permissions(request, tour)

        raw_user_id = request.data.get('user_id')
        new_role = (request.data.get('role') or 'member').strip().lower()
        if new_role not in ('creator', 'member'):
            return Response(
                {"detail": "Role must be 'creator' (Admin) or 'member'."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            target_id = int(raw_user_id)
        except (TypeError, ValueError):
            return Response(
                {"detail": "user_id must be a valid integer."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        target = get_object_or_404(User, pk=target_id)

        if target.pk == request.user.pk:
            return Response(
                {"changed": False, "detail": "You cannot change your own role."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        membership_qs = TourMember.objects.filter(tour=tour, user=target)
        if not membership_qs.exists():
            return Response(
                {"changed": False, "detail": "This user is not a member of the tour."},
                status=status.HTTP_404_NOT_FOUND,
            )

        mem = membership_qs.first()
        old_role_label = "Admin" if mem.role == "creator" else "Member"
        new_role_label = "Admin" if new_role == "creator" else "Member"

        new_name = (request.data.get('full_name') or request.data.get('name') or '').strip()
        name_changed = False
        if new_name:
            parts = new_name.split(' ', 1)
            new_first = parts[0]
            new_last = parts[1] if len(parts) > 1 else ''
            if target.first_name != new_first or target.last_name != new_last:
                target.first_name = new_first
                target.last_name = new_last
                target.save(update_fields=['first_name', 'last_name'])
                name_changed = True

        role_changed = False
        if mem.role != new_role:
            mem.role = new_role
            mem.save(update_fields=['role'])
            role_changed = True

            from apps.notifications.models import Notification
            try:
                Notification.objects.create(
                    user=target,
                    type="member_role_changed",
                    title=f"Role changed in tour: {tour.title}",
                    message=f"Your role was changed from {old_role_label} to {new_role_label} in '{tour.title}'.",
                    related_object_id=tour.pk,
                )
            except Exception:
                pass

        target_display_name = f"{getattr(target, 'first_name', '') or ''} {getattr(target, 'last_name', '') or ''}".strip() or target.email

        # Check if financial balance (Total Paid / Fair Share) was passed to update
        raw_paid = request.data.get('total_paid')
        raw_share = request.data.get('fair_share')
        finance_changed = False
        if raw_paid is not None or raw_share is not None:
            from decimal import Decimal
            try:
                total_paid = Decimal(str(raw_paid)) if raw_paid not in (None, '') else None
            except Exception:
                total_paid = None
            try:
                fair_share = Decimal(str(raw_share)) if raw_share not in (None, '') else None
            except Exception:
                fair_share = None

            if total_paid is not None or fair_share is not None:
                from apps.expenses.models import Expense, ExpenseSplit
                from django.utils import timezone
                TWO_PLACES = Decimal('0.01')
                if total_paid is not None and total_paid < 0:
                    total_paid = Decimal('0.00')
                if fair_share is not None and fair_share < 0:
                    fair_share = Decimal('0.00')

                # Clean up previous opening / member balance expenses for this member
                Expense.objects.filter(
                    tour=tour,
                    notes__icontains=f"member {target.email}"
                ).delete()

                total_paid = (total_paid or Decimal('0.00')).quantize(TWO_PLACES)
                fair_share = (fair_share or Decimal('0.00')).quantize(TWO_PLACES)

                if total_paid > 0 or fair_share > 0:
                    finance_changed = True
                    if total_paid > 0 and fair_share == total_paid:
                        exp = Expense.objects.create(
                            tour=tour,
                            title=f"Opening Contribution ({target_display_name})",
                            amount=total_paid,
                            category="other",
                            payment_method="cash",
                            paid_by=target,
                            created_by=request.user,
                            paid_at=timezone.now(),
                            notes=f"Opening balance recorded when editing member {target.email}",
                        )
                        ExpenseSplit.objects.create(
                            expense=exp,
                            user=target,
                            share_amount=fair_share,
                        )
                    elif total_paid > 0 and fair_share < total_paid:
                        exp = Expense.objects.create(
                            tour=tour,
                            title=f"Advance Payment ({target_display_name})",
                            amount=total_paid,
                            category="other",
                            payment_method="cash",
                            paid_by=target,
                            created_by=request.user,
                            paid_at=timezone.now(),
                            notes=f"Advance payment recorded when editing member {target.email}",
                        )
                        if fair_share > 0:
                            ExpenseSplit.objects.create(
                                expense=exp,
                                user=target,
                                share_amount=fair_share,
                            )
                        ExpenseSplit.objects.create(
                            expense=exp,
                            user=request.user,
                            share_amount=total_paid - fair_share,
                        )
                    else:
                        # fair_share > total_paid
                        if total_paid > 0:
                            exp1 = Expense.objects.create(
                                tour=tour,
                                title=f"Opening Contribution ({target_display_name})",
                                amount=total_paid,
                                category="other",
                                payment_method="cash",
                                paid_by=target,
                                created_by=request.user,
                                paid_at=timezone.now(),
                                notes=f"Initial paid amount recorded when editing member {target.email}",
                            )
                            ExpenseSplit.objects.create(
                                expense=exp1,
                                user=target,
                                share_amount=total_paid,
                            )
                        remaining_share = fair_share - total_paid
                        exp2 = Expense.objects.create(
                            tour=tour,
                            title=f"Tour Registration Share ({target_display_name})",
                            amount=remaining_share,
                            category="other",
                            payment_method="cash",
                            paid_by=request.user,
                            created_by=request.user,
                            paid_at=timezone.now(),
                            notes=f"Initial expense share recorded when editing member {target.email}",
                        )
                        ExpenseSplit.objects.create(
                            expense=exp2,
                            user=target,
                            share_amount=remaining_share,
                        )

        if finance_changed and (name_changed or role_changed):
            status_msg = f"Updated '{target_display_name}' (Role: {new_role_label}, Paid: ${total_paid}, Share: ${fair_share})."
        elif finance_changed:
            status_msg = f"Updated financial balance for {target_display_name} (Paid: ${total_paid}, Share: ${fair_share})."
        elif role_changed and name_changed:
            status_msg = f"Updated name to '{target_display_name}' and role to {new_role_label}."
        elif role_changed:
            status_msg = f"Changed role for {target.email} from {old_role_label} to {new_role_label}."
        elif name_changed:
            status_msg = f"Updated member name to '{target_display_name}'."
        else:
            status_msg = f"Member settings saved successfully."

        if hasattr(tour, '_members_prefetched'):
            delattr(tour, '_members_prefetched')
        tour.refresh_from_db()
        annotate_tour_detail(tour)
        out_serializer = TourSerializer(tour, context={"request": request})
        return Response(
            {
                "changed": True,
                "message": status_msg,
                "member": {
                    "id": target.pk,
                    "email": target.email,
                    "full_name": target_display_name,
                    "role": mem.role,
                    "role_label": new_role_label,
                },
                "tour": out_serializer.data,
            },
            status=status.HTTP_200_OK,
        )


class RemoveTourMemberAPIView(APIView):
    permission_classes = [IsAuthenticated, IsTourMember]

    def post(self, request, pk):
        from apps.accounts.models import User
        tour = get_object_or_404(Tour, pk=pk)
        self.check_object_permissions(request, tour)

        raw_user_id = request.data.get('user_id')
        try:
            target_id = int(raw_user_id)
        except (TypeError, ValueError):
            return Response(
                {"detail": "user_id must be a valid integer."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        target = get_object_or_404(User, pk=target_id)

        if target.pk == request.user.pk:
            return Response(
                {"removed": False, "detail": "As tour creator, you cannot remove yourself. Use delete tour instead."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        membership_qs = TourMember.objects.filter(tour=tour, user=target)
        if not membership_qs.exists():
            return Response(
                {"removed": False, "detail": "This user is not a member of the tour."},
                status=status.HTTP_404_NOT_FOUND,
            )
        mem = membership_qs.first()
        if mem.role == 'creator':
            return Response(
                {"removed": False, "detail": "Cannot remove the tour creator."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        from apps.notifications.models import Notification
        try:
            Notification.objects.create(
                user=target,
                type="member_removed",
                title=f"Removed from tour: {tour.title}",
                message=f"You were removed from the tour '{tour.title}' by {request.user.first_name or request.user.email}.",
                related_object_id=tour.pk,
            )
        except Exception:
            pass

        membership_qs.delete()

        annotate_tour_detail(tour)
        out_serializer = TourSerializer(tour, context={"request": request})
        return Response(
            {
                "removed": True,
                "message": f"Removed {target.email} from the tour.",
                "removed_user": {
                    "id": target.pk,
                    "email": target.email,
                    "full_name": (f"{getattr(target, 'first_name', '') or ''} {getattr(target, 'last_name', '') or ''}".strip() or target.email),
                },
                "tour": out_serializer.data,
            },
            status=status.HTTP_200_OK,
        )
