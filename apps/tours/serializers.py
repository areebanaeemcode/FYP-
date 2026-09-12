from rest_framework import serializers
from django.db.models import Count

from .models import Tour, TourMember
from apps.accounts.serializers import UserProfileSerializer


class TourMemberSerializer(serializers.ModelSerializer):
    user = UserProfileSerializer(read_only=True)
    user_id = serializers.PrimaryKeyRelatedField(
        source='user', read_only=True
    )
    full_name = serializers.SerializerMethodField()
    email = serializers.CharField(source='user.email', read_only=True)

    class Meta:
        model = TourMember
        fields = [
            'id',
            'user_id',
            'user',
            'full_name',
            'email',
            'role',
            'joined_at',
        ]
        read_only_fields = fields

    def get_full_name(self, obj):
        u = getattr(obj, 'user', None)
        if u is None:
            return ''
        first = getattr(u, 'first_name', '') or ''
        last = getattr(u, 'last_name', '') or ''
        full = f'{first} {last}'.strip()
        if full:
            return full
        phone = getattr(u, 'phone_number', '') or ''
        if phone:
            return phone
        return getattr(u, 'email', '') or ''


class TourSerializer(serializers.ModelSerializer):
    join_link = serializers.CharField(read_only=True)
    total_spent = serializers.DecimalField(
        max_digits=12, decimal_places=2, read_only=True
    )
    member_count = serializers.IntegerField(read_only=True)
    creator_name = serializers.CharField(read_only=True)
    creator_id = serializers.IntegerField(read_only=True)
    members = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Tour
        fields = [
            'id',
            'title',
            'destination',
            'description',
            'budget',
            'start_date',
            'end_date',
            'status',
            'join_token',
            'join_link',
            'total_spent',
            'member_count',
            'creator_id',
            'creator_name',
            'created_at',
            'updated_at',
            'members',
        ]
        read_only_fields = [
            'id',
            'join_token',
            'join_link',
            'total_spent',
            'member_count',
            'creator_id',
            'creator_name',
            'created_at',
            'updated_at',
            'members',
        ]

    def validate(self, attrs):
        start_date = attrs.get('start_date')
        end_date = attrs.get('end_date')
        if start_date and end_date and end_date < start_date:
            raise serializers.ValidationError({
                'end_date': 'End date cannot be earlier than start date.'
            })
        budget = attrs.get('budget')
        if budget is not None and budget < 0:
            raise serializers.ValidationError({
                'budget': 'Budget cannot be negative.'
            })
        return attrs

    def get_members(self, obj):
        qs = getattr(obj, '_members_prefetched', None)
        if qs is None:
            qs = obj.memberships.select_related('user').all()[:50]
        return TourMemberSerializer(qs, many=True).data


class TourCreateSerializer(serializers.ModelSerializer):
    join_token = serializers.CharField(
        max_length=32, required=False, allow_blank=True
    )

    class Meta:
        model = Tour
        fields = [
            'id',
            'title',
            'destination',
            'description',
            'budget',
            'start_date',
            'end_date',
            'status',
            'join_token',
            'join_link',
            'created_at',
        ]
        read_only_fields = [
            'id',
            'join_link',
            'created_at',
        ]

    def validate_join_token(self, value):
        if value:
            val = str(value).strip().upper()
            if Tour.objects.filter(join_token__iexact=val).exists():
                raise serializers.ValidationError('This join code is already taken. Please choose another code.')
            return val
        return ''

    def validate(self, attrs):
        start_date = attrs.get('start_date')
        end_date = attrs.get('end_date')
        if start_date and end_date and end_date < start_date:
            raise serializers.ValidationError({
                'end_date': 'End date cannot be earlier than start date.'
            })
        budget = attrs.get('budget')
        if budget is not None and budget < 0:
            raise serializers.ValidationError({
                'budget': 'Budget cannot be negative.'
            })
        return attrs


class TourJoinSerializer(serializers.Serializer):
    join_token = serializers.CharField(max_length=128, required=False, allow_blank=True)

    def validate_join_token(self, value):
        if value:
            value = value.strip().rstrip('/')
            if '/' in value:
                value = value.rstrip('/').rsplit('/', 1)[-1]
        return value
