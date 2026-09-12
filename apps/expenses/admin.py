from django.contrib import admin

from .models import Expense, ExpenseSplit, Receipt, ExpenseLimit


class ExpenseSplitInline(admin.TabularInline):
    model = ExpenseSplit
    extra = 0
    raw_id_fields = ("user",)


class ReceiptInline(admin.StackedInline):
    model = Receipt
    max_num = 1
    can_delete = True
    raw_id_fields = ("uploaded_by", "verified_by")


@admin.register(Expense)
class ExpenseAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "tour",
        "category",
        "amount",
        "payment_method",
        "paid_by",
        "paid_at",
        "created_by",
    )
    list_filter = ("category", "payment_method", "paid_at", "created_at")
    search_fields = ("tour__title", "notes", "paid_by__email", "title")
    raw_id_fields = ("tour", "paid_by", "created_by")
    readonly_fields = ("created_at", "updated_at")
    inlines = [ExpenseSplitInline, ReceiptInline]


@admin.register(ExpenseSplit)
class ExpenseSplitAdmin(admin.ModelAdmin):
    list_display = ("id", "expense", "user", "share_amount")
    list_filter = ("user",)
    search_fields = ("expense__tour__title", "user__email")
    raw_id_fields = ("expense", "user")


@admin.register(Receipt)
class ReceiptAdmin(admin.ModelAdmin):
    list_display = ("id", "expense", "uploaded_by", "verified_by", "verified_at", "uploaded_at")
    list_filter = ("verified_at", "uploaded_at")
    search_fields = ("expense__tour__title", "uploaded_by__email")
    raw_id_fields = ("expense", "uploaded_by", "verified_by")
    readonly_fields = ("uploaded_at",)


@admin.register(ExpenseLimit)
class ExpenseLimitAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "tour", "amount", "last_notified_exceeded", "updated_at")
    list_filter = ("last_notified_exceeded", "updated_at")
    search_fields = ("user__email", "tour__title")
    raw_id_fields = ("user", "tour")
