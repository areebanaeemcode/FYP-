from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.utils.translation import gettext_lazy as _

from .models import User

# Customize Django Admin portal headers
admin.site.site_header = "Pay-Together Administration"
admin.site.site_title = "Pay-Together Admin Portal"
admin.site.index_title = "Platform Overview & Model Management"


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = (
        "id",
        "email",
        "first_name",
        "last_name",
        "phone_number",
        "is_active",
        "is_staff",
        "is_superuser",
        "created_at",
    )
    list_filter = ("is_active", "is_staff", "is_superuser", "created_at")
    search_fields = ("email", "first_name", "last_name", "phone_number")
    ordering = ("-created_at",)

    fieldsets = (
        (None, {"fields": ("email", "password")}),
        (
            _("Personal info"),
            {"fields": ("first_name", "last_name", "phone_number", "profile_image")},
        ),
        (
            _("Permissions"),
            {
                "fields": (
                    "is_active",
                    "is_staff",
                    "is_superuser",
                    "groups",
                    "user_permissions",
                ),
            },
        ),
        (_("Important dates"), {"fields": ("last_login", "created_at", "updated_at")}),
    )

    add_fieldsets = (
        (
            None,
            {
                "classes": ("wide",),
                "fields": (
                    "email",
                    "first_name",
                    "last_name",
                    "phone_number",
                    "password1",
                    "password2",
                    "is_staff",
                    "is_superuser",
                ),
            },
        ),
    )

    readonly_fields = ("created_at", "updated_at", "last_login")
    actions = ["activate_users", "deactivate_users"]

    @admin.action(description="Activate selected users")
    def activate_users(self, request, queryset):
        count = queryset.update(is_active=True)
        self.message_user(request, f"{count} user(s) successfully activated.")

    @admin.action(description="Suspend / Deactivate selected users")
    def deactivate_users(self, request, queryset):
        count = queryset.exclude(pk=request.user.pk).update(is_active=False)
        self.message_user(request, f"{count} user(s) successfully suspended.")
