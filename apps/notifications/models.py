from django.db import models
from django.utils import timezone

from apps.accounts.models import User
from apps.tours.models import Tour


NOTIFICATION_TYPES = (
    ("new_expense", "New Expense Added"),
    ("member_joined", "New Tour Member Joined"),
    ("limit_exceeded", "Expense Limit Exceeded"),
)


class Notification(models.Model):
    recipient = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="notifications",
    )
    tour = models.ForeignKey(
        Tour,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="notifications",
    )
    type = models.CharField(max_length=40, choices=NOTIFICATION_TYPES, db_index=True)
    title = models.CharField(max_length=200)
    message = models.TextField(blank=True, default="")
    is_read = models.BooleanField(default=False, db_index=True)
    read_at = models.DateTimeField(null=True, blank=True)
    related_object_id = models.PositiveIntegerField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        db_table = "notifications"
        ordering = ["-created_at"]

    def __str__(self):
        return f"[{self.type}] {self.title} → {self.recipient}"

    def mark_read(self, save=True):
        self.is_read = True
        self.read_at = timezone.now()
        if save:
            self.save(update_fields=["is_read", "read_at"])

    @classmethod
    def mark_all_read(cls, user):
        cls.objects.filter(recipient=user, is_read=False).update(
            is_read=True,
            read_at=timezone.now(),
        )

    @classmethod
    def unread_count(cls, user):
        if user is None or not user.is_authenticated:
            return 0
        return cls.objects.filter(recipient=user, is_read=False).count()
