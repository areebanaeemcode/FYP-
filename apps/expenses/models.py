from django.db import models
from django.utils import timezone

from apps.accounts.models import User
from apps.tours.models import Tour


CATEGORY_CHOICES = (
    ("transport", "Transport"),
    ("accommodation", "Accommodation"),
    ("food", "Food"),
    ("activities", "Activities"),
    ("shopping", "Shopping"),
    ("other", "Other"),
)

PAYMENT_METHOD_CHOICES = (
    ("cash", "Cash"),
    ("card", "Card"),
    ("online_transfer", "Online Transfer"),
    ("other", "Other"),
)


class Expense(models.Model):
    tour = models.ForeignKey(
        Tour,
        on_delete=models.CASCADE,
        related_name="expenses",
    )
    title = models.CharField(max_length=200, blank=True, default="")
    notes = models.TextField(blank=True, default="")
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    category = models.CharField(max_length=40, choices=CATEGORY_CHOICES, db_index=True)
    payment_method = models.CharField(max_length=40, choices=PAYMENT_METHOD_CHOICES)
    paid_by = models.ForeignKey(
        User,
        on_delete=models.PROTECT,
        related_name="paid_expenses",
    )
    paid_at = models.DateTimeField(default=timezone.now)
    created_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name="created_expenses",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "expenses"
        ordering = ["-paid_at", "-created_at"]

    def __str__(self):
        return f"{self.amount} ({self.category}) for {self.tour}"


class ExpenseSplit(models.Model):
    expense = models.ForeignKey(
        Expense,
        on_delete=models.CASCADE,
        related_name="splits",
    )
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="expense_splits",
    )
    share_amount = models.DecimalField(max_digits=12, decimal_places=2)

    class Meta:
        db_table = "expense_splits"
        unique_together = [("expense", "user")]

    def __str__(self):
        return f"{self.user} owes {self.share_amount} on expense {self.expense_id}"


class Receipt(models.Model):
    expense = models.OneToOneField(
        Expense,
        on_delete=models.CASCADE,
        related_name="receipt",
        null=True,
        blank=True,
    )
    image = models.ImageField(upload_to="receipts/%Y/%m/")
    uploaded_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name="uploaded_receipts",
    )
    verified_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="verified_receipts",
    )
    verified_at = models.DateTimeField(null=True, blank=True)
    uploaded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "receipts"

    def __str__(self):
        return f"Receipt for expense {self.expense_id}"

    def mark_verified(self, user):
        self.verified_by = user
        self.verified_at = timezone.now()
        self.save(update_fields=["verified_by", "verified_at"])


class ExpenseLimit(models.Model):
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="expense_limits",
    )
    tour = models.ForeignKey(
        Tour,
        on_delete=models.CASCADE,
        related_name="user_limits",
    )
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    last_notified_exceeded = models.BooleanField(default=False)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "expense_limits"
        unique_together = [("user", "tour")]

    def __str__(self):
        return f"{self.user} limit on {self.tour} = {self.amount}"
