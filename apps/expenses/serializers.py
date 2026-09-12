from decimal import Decimal, ROUND_HALF_UP

from rest_framework import serializers

from apps.accounts.models import User
from apps.tours.models import Tour, TourMember
from .models import (
    Expense,
    ExpenseSplit,
    Receipt,
    ExpenseLimit,
    CATEGORY_CHOICES,
    PAYMENT_METHOD_CHOICES,
)


CATEGORY_MAP = dict(CATEGORY_CHOICES)
PAYMENT_METHOD_MAP = dict(PAYMENT_METHOD_CHOICES)
TWO_PLACES = Decimal('0.01')


def _user_full_name(u):
    first = getattr(u, 'first_name', '') or ''
    last = getattr(u, 'last_name', '') or ''
    full = f'{first} {last}'.strip()
    return full or getattr(u, 'email', '') or f'User {getattr(u, "pk", "?")}'


def _compute_shares(amount_decimal, split_count):
    if split_count <= 0:
        raise serializers.ValidationError('split_members cannot be empty.')
    equal = (amount_decimal / Decimal(split_count)).quantize(TWO_PLACES, rounding=ROUND_HALF_UP)
    shares = [equal] * split_count
    total = sum(shares)
    diff = (amount_decimal - total).quantize(TWO_PLACES)
    if diff != 0:
        shares[-1] = (shares[-1] + diff).quantize(TWO_PLACES)
    return shares


def _validate_tour_membership(tour, user_id, role=None):
    qs = TourMember.objects.filter(tour=tour, user_id=user_id)
    if role:
        qs = qs.filter(role=role)
    return qs.exists()


class ExpenseSplitReadSerializer(serializers.ModelSerializer):
    user_id = serializers.IntegerField()
    full_name = serializers.SerializerMethodField()
    email = serializers.EmailField(source='user.email', read_only=True)

    class Meta:
        model = ExpenseSplit
        fields = ['user_id', 'full_name', 'email', 'share_amount']

    def get_full_name(self, obj):
        return _user_full_name(obj.user)


class _PaidBySerializer(serializers.Serializer):
    id = serializers.IntegerField()
    full_name = serializers.CharField()
    email = serializers.EmailField()


class ExpenseReadSerializer(serializers.ModelSerializer):
    tour_id = serializers.IntegerField()
    category = serializers.SerializerMethodField()
    payment_method = serializers.SerializerMethodField()
    paid_by = serializers.SerializerMethodField()
    splits = ExpenseSplitReadSerializer(many=True, read_only=True)
    is_owner = serializers.SerializerMethodField()
    receipt = serializers.SerializerMethodField()

    class Meta:
        model = Expense
        fields = [
            'id',
            'tour_id',
            'title',
            'notes',
            'amount',
            'category',
            'payment_method',
            'paid_by',
            'splits',
            'paid_at',
            'created_at',
            'is_owner',
            'receipt',
        ]

    def get_category(self, obj):
        return {
            'value': obj.category,
            'label': CATEGORY_MAP.get(obj.category, obj.category),
        }

    def get_payment_method(self, obj):
        return {
            'value': obj.payment_method,
            'label': PAYMENT_METHOD_MAP.get(obj.payment_method, obj.payment_method),
        }

    def get_paid_by(self, obj):
        u = obj.paid_by
        return {
            'id': u.pk,
            'full_name': _user_full_name(u),
            'email': getattr(u, 'email', ''),
        }

    def get_is_owner(self, obj):
        request = self.context.get('request')
        if not request:
            return False
        u = request.user
        return bool(
            obj.paid_by_id == u.pk
            or (obj.created_by_id is not None and obj.created_by_id == u.pk)
            or obj.tour.is_creator(u)
        )

    def get_receipt(self, obj):
        r = getattr(obj, 'receipt', None)
        if r is None:
            return None
        request = self.context.get('request')
        url = r.image.url if r.image else ''
        if request and url and not url.startswith('http'):
            try:
                url = request.build_absolute_uri(url)
            except Exception:
                pass
        return {
            'id': r.pk,
            'url': url,
            'uploaded_by_id': r.uploaded_by_id,
            'verified_by_id': r.verified_by_id,
            'verified_at': r.verified_at,
            'uploaded_at': r.uploaded_at,
        }


class ExpenseCreateUpdateSerializer(serializers.Serializer):
    tour_id = serializers.IntegerField(required=True)
    title = serializers.CharField(max_length=200, required=False, allow_blank=True, default='')
    notes = serializers.CharField(required=False, allow_blank=True, default='')
    amount = serializers.DecimalField(max_digits=12, decimal_places=2, required=True)
    category = serializers.ChoiceField(choices=CATEGORY_CHOICES, required=True)
    payment_method = serializers.ChoiceField(choices=PAYMENT_METHOD_CHOICES, required=True)
    paid_by = serializers.IntegerField(required=True)
    split_members = serializers.ListField(
        child=serializers.IntegerField(),
        required=False,
        allow_empty=True,
        default=list,
    )
    share_amounts = serializers.ListField(
        child=serializers.DecimalField(max_digits=12, decimal_places=2),
        required=False,
        allow_empty=True,
        default=None,
    )
    paid_at = serializers.DateTimeField(required=False, default_timezone=None, allow_null=True)

    def _tour(self, attrs):
        tid = attrs.get('tour_id')
        try:
            return Tour.objects.get(pk=tid)
        except Tour.DoesNotExist:
            raise serializers.ValidationError({'tour_id': 'Tour does not exist.'})

    def validate(self, attrs):
        tour = self._tour(attrs)
        user = self.context['request'].user
        if not tour.is_member(user):
            raise serializers.ValidationError('You are not a member of this tour.')

        amount = attrs.get('amount')
        if amount is None or amount <= 0:
            raise serializers.ValidationError({'amount': 'Amount must be greater than zero.'})

        paid_by_id = attrs.get('paid_by')
        if not _validate_tour_membership(tour, paid_by_id):
            raise serializers.ValidationError({'paid_by': 'paid_by user must be a tour member.'})

        split_members = list(attrs.get('split_members') or [])
        if not split_members:
            from apps.tours.models import TourMember
            all_m = list(TourMember.objects.filter(tour=tour).values_list('user_id', flat=True))
            if getattr(tour, 'created_by_id', None) and tour.created_by_id not in all_m:
                all_m.append(tour.created_by_id)
            split_members = all_m if all_m else [paid_by_id]
        seen = set()
        deduped = []
        for uid in split_members:
            if uid in seen:
                continue
            seen.add(uid)
            deduped.append(uid)
        split_members = deduped
        if not split_members:
            split_members = [paid_by_id]
        for uid in split_members:
            if not _validate_tour_membership(tour, uid):
                raise serializers.ValidationError(
                    {'split_members': f'User {uid} is not a tour member.'}
                )
        share_amounts = attrs.get('share_amounts')
        if share_amounts is not None and len(share_amounts) > 0:
            if len(share_amounts) != len(split_members):
                raise serializers.ValidationError(
                    {'share_amounts': 'share_amounts length must match split_members length.'}
                )
            for sa in share_amounts:
                if sa < 0:
                    raise serializers.ValidationError(
                        {'share_amounts': 'Each share_amount must be >= 0.'}
                    )
            total = sum(share_amounts)
            if (Decimal(total) - amount).quantize(TWO_PLACES) != 0:
                raise serializers.ValidationError(
                    {'share_amounts': f'share_amounts sum ({total}) must equal amount ({amount}).'}
                )
            attrs['share_amounts_resolved'] = [
                Decimal(sa).quantize(TWO_PLACES) for sa in share_amounts
            ]
        else:
            computed = _compute_shares(amount, len(split_members))
            total = sum(computed)
            if (total - amount).quantize(TWO_PLACES) != 0:
                raise serializers.ValidationError('Internal error computing equal shares.')
            attrs['share_amounts_resolved'] = computed

        attrs['split_members_resolved'] = split_members
        attrs['_tour'] = tour
        return attrs

    def _build_expense_fields(self, validated_data, instance=None):
        tour = validated_data['_tour']
        fields = dict(
            tour=tour,
            title=validated_data.get('title') or '',
            notes=validated_data.get('notes') or '',
            amount=Decimal(validated_data['amount']).quantize(TWO_PLACES),
            category=validated_data['category'],
            payment_method=validated_data['payment_method'],
            paid_by_id=validated_data['paid_by'],
        )
        if validated_data.get('paid_at') is not None:
            fields['paid_at'] = validated_data['paid_at']
        return fields

    def create(self, validated_data):
        from django.db import transaction as db_transaction

        with db_transaction.atomic():
            fields = self._build_expense_fields(validated_data)
            request = self.context['request']
            fields['created_by'] = request.user
            expense = Expense.objects.create(**fields)
            splits = []
            user_ids = validated_data['split_members_resolved']
            shares = validated_data['share_amounts_resolved']
            for uid, share in zip(user_ids, shares):
                splits.append(
                    ExpenseSplit(
                        expense=expense,
                        user_id=uid,
                        share_amount=Decimal(share).quantize(TWO_PLACES),
                    )
                )
            ExpenseSplit.objects.bulk_create(splits)
        return expense

    def update(self, instance, validated_data):
        from django.db import transaction as db_transaction

        with db_transaction.atomic():
            fields = self._build_expense_fields(validated_data, instance=instance)
            for k, v in fields.items():
                setattr(instance, k, v)
            update_fields = list(fields.keys()) + ['updated_at']
            instance.save(update_fields=update_fields)
            instance.splits.all().delete()
            splits = []
            user_ids = validated_data['split_members_resolved']
            shares = validated_data['share_amounts_resolved']
            for uid, share in zip(user_ids, shares):
                splits.append(
                    ExpenseSplit(
                        expense=instance,
                        user_id=uid,
                        share_amount=Decimal(share).quantize(TWO_PLACES),
                    )
                )
            ExpenseSplit.objects.bulk_create(splits)
        return instance


MAX_RECEIPT_SIZE_BYTES = 5 * 1024 * 1024
ALLOWED_RECEIPT_CONTENT_TYPES = {'image/png', 'image/jpeg'}
ALLOWED_RECEIPT_EXTS = {'.png', '.jpg', '.jpeg'}


class ReceiptUploadSerializer(serializers.ModelSerializer):
    image = serializers.ImageField(required=True, allow_empty_file=False)

    class Meta:
        model = Receipt
        fields = ['image']

    def validate_image(self, value):
        if value is None:
            raise serializers.ValidationError('An image file is required.')
        size = getattr(value, 'size', None)
        if size is not None and size > MAX_RECEIPT_SIZE_BYTES:
            raise serializers.ValidationError(
                f'Receipt image size must be <= 5MB (got {size} bytes).'
            )
        name = (getattr(value, 'name', None) or '').lower()
        ext_ok = any(name.endswith(ext) for ext in ALLOWED_RECEIPT_EXTS)
        ct = (getattr(value, 'content_type', None) or '').lower()
        ct_ok = ct in ALLOWED_RECEIPT_CONTENT_TYPES
        if not (ext_ok or ct_ok):
            raise serializers.ValidationError(
                'Receipt image must be PNG or JPEG format.'
            )
        return value


class ExpenseLimitWriteSerializer(serializers.Serializer):
    tour_id = serializers.IntegerField(required=True)
    amount = serializers.DecimalField(
        max_digits=12,
        decimal_places=2,
        min_value=0,
        required=True,
    )

    def validate_tour_id(self, value):
        from apps.tours.models import Tour
        if not Tour.objects.filter(pk=value).exists():
            raise serializers.ValidationError('Tour does not exist.')
        return value


class ExpenseLimitReadSerializer(serializers.ModelSerializer):
    tour_id = serializers.IntegerField(read_only=True)
    user_id = serializers.IntegerField(read_only=True)
    total_spent = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    remaining = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    limit_exceeded = serializers.BooleanField(read_only=True)
    last_notified_exceeded = serializers.BooleanField(read_only=True)

    class Meta:
        model = ExpenseLimit
        fields = [
            'id',
            'tour_id',
            'user_id',
            'amount',
            'total_spent',
            'remaining',
            'limit_exceeded',
            'last_notified_exceeded',
            'updated_at',
        ]
