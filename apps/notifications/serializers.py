from rest_framework import serializers
from rest_framework.fields import IntegerField, BooleanField, CharField, DateTimeField

from apps.notifications.models import Notification, NOTIFICATION_TYPES


NOTIFICATION_TYPE_LABELS = dict(NOTIFICATION_TYPES)


class NotificationReadSerializer(serializers.ModelSerializer):
    type_label = serializers.SerializerMethodField()
    tour_title = serializers.SerializerMethodField()

    class Meta:
        model = Notification
        fields = [
            'id',
            'type',
            'type_label',
            'title',
            'message',
            'tour_id',
            'tour_title',
            'related_object_id',
            'is_read',
            'read_at',
            'created_at',
        ]

    def get_type_label(self, obj):
        return NOTIFICATION_TYPE_LABELS.get(getattr(obj, 'type', ''), getattr(obj, 'type', ''))

    def get_tour_title(self, obj):
        tour = getattr(obj, 'tour', None)
        if tour is None:
            return None
        return getattr(tour, 'title', None)


class MarkNotificationsReadSerializer(serializers.Serializer):
    ids = serializers.ListField(
        child=IntegerField(min_value=1),
        required=False,
        allow_empty=True,
        default=None,
    )
    all = BooleanField(required=False, default=False)
