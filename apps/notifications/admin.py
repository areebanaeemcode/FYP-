from django.contrib import admin

from .models import Notification


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ("id", "recipient", "type", "title", "tour", "is_read", "created_at")
    list_filter = ("type", "is_read", "created_at")
    search_fields = ("recipient__email", "title", "message")
    raw_id_fields = ("recipient", "tour")
    readonly_fields = ("created_at",)
    actions = ["mark_selected_read"]

    def mark_selected_read(self, request, queryset):
        from django.utils import timezone
        queryset.update(is_read=True, read_at=timezone.now())
        self.message_user(request, f"Marked {queryset.count()} notifications read.")
    mark_selected_read.short_description = "Mark selected as read"
