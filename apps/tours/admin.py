from django.contrib import admin

from .models import Tour, TourMember


class TourMemberInline(admin.TabularInline):
    model = TourMember
    extra = 0
    raw_id_fields = ("user",)


@admin.register(Tour)
class TourAdmin(admin.ModelAdmin):
    list_display = ("id", "title", "destination", "status", "budget", "start_date", "end_date", "created_by", "created_at")
    list_filter = ("status", "created_at")
    search_fields = ("title", "destination", "created_by__email", "created_by__first_name", "join_token")
    raw_id_fields = ("created_by",)
    readonly_fields = ("join_token", "created_at", "updated_at")
    inlines = [TourMemberInline]


@admin.register(TourMember)
class TourMemberAdmin(admin.ModelAdmin):
    list_display = ("id", "tour", "user", "role", "joined_at")
    list_filter = ("role", "joined_at")
    search_fields = ("tour__title", "user__email", "user__first_name")
    raw_id_fields = ("tour", "user")
