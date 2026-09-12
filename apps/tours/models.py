import secrets
import string
from django.db import models

from apps.accounts.models import User


def default_join_token():
    letters = ''.join(secrets.choice(string.ascii_uppercase) for _ in range(3))
    digits = f"{secrets.randbelow(900) + 100:03d}"
    return f"{letters}{digits}"


ROLE_CHOICES = (
    ("creator", "Tour Creator"),
    ("member", "Tour Member"),
)


class Tour(models.Model):

    STATUS_CHOICES = (
        ("planned", "Planned"),
        ("ongoing", "Ongoing"),
        ("completed", "Completed"),
        ("cancelled", "Cancelled"),
    )

    created_by = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="tours",
    )

    title = models.CharField(max_length=255)

    destination = models.CharField(max_length=255)

    description = models.TextField(blank=True, null=True)

    budget = models.DecimalField(max_digits=12, decimal_places=2)

    start_date = models.DateField()

    end_date = models.DateField()

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default="planned",
    )

    join_token = models.CharField(max_length=64, unique=True, db_index=True)

    created_at = models.DateTimeField(auto_now_add=True)

    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return self.title

    def save(self, *args, **kwargs):
        if self.join_token:
            self.join_token = str(self.join_token).strip().upper()
        else:
            dest_source = self.destination or self.title or ""
            clean_letters = "".join(c for c in dest_source.upper() if c.isalpha())
            prefix = clean_letters[:3]
            if len(prefix) < 3:
                prefix = (prefix + "".join(secrets.choice(string.ascii_uppercase) for _ in range(3)))[:3]
            for _ in range(50):
                digits = f"{secrets.randbelow(900) + 100:03d}"
                token = f"{prefix}{digits}"
                if not Tour.objects.filter(join_token=token).exists():
                    self.join_token = token
                    break
            else:
                self.join_token = default_join_token()
        super().save(*args, **kwargs)

    def is_member(self, user):
        user_id = getattr(user, "id", user)
        return self.memberships.filter(user_id=user_id).exists()

    def is_creator(self, user):
        user_id = getattr(user, "id", user)
        return self.memberships.filter(user_id=user_id, role="creator").exists()

    @property
    def join_link(self):
        return f"/client/tours/join/{self.join_token}/"

    def total_spent(self):
        from django.db.models import Sum
        result = self.expenses.aggregate(total=Sum("amount"))
        return result["total"] or 0


class TourMember(models.Model):
    tour = models.ForeignKey(
        Tour,
        on_delete=models.CASCADE,
        related_name="memberships",
    )
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="tour_memberships",
    )
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default="member")
    joined_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = [("tour", "user")]
        ordering = ["-joined_at"]

    def __str__(self):
        return f"{self.user} on {self.tour} ({self.role})"

