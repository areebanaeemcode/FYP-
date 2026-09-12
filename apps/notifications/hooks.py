from django.db.models import OuterRef, Subquery

from apps.accounts.models import User
from apps.tours.models import Tour, TourMember
from apps.notifications.models import Notification, NOTIFICATION_TYPES


CATEGORY_LABELS = {
    "transport": "Transport",
    "accommodation": "Accommodation",
    "food": "Food",
    "activities": "Activities",
    "shopping": "Shopping",
    "other": "Other",
}

PAYMENT_METHOD_LABELS = {
    "cash": "Cash",
    "card": "Card",
    "online_transfer": "Online Transfer",
    "other": "Other",
}


def _full_name(user):
    if user is None:
        return "Someone"
    first = getattr(user, 'first_name', '') or ''
    last = getattr(user, 'last_name', '') or ''
    name = f"{first} {last}".strip()
    if name:
        return name
    email = getattr(user, 'email', None) or ''
    if email:
        return email.split('@', 1)[0]
    return "Someone"


def notify_new_expense(expense):
    """
    After expense created/modified: notify all tour members except the paid_by user and the expense creator.
    (If paid_by == creator, we skip just one user.)
    Also notifies limit_exceeded separately in limit_utils.
    """
    tour = expense.tour
    category_label = CATEGORY_LABELS.get(expense.category, expense.category or 'Expense')
    amount = float(expense.amount or 0)
    paid_by = expense.paid_by
    created_by = expense.created_by
    title = expense.title or f"New {category_label.lower()} expense"
    recipient_ids = list(
        TourMember.objects.filter(tour=tour)
        .exclude(user_id=expense.paid_by_id)
        .exclude(user_id=expense.created_by_id)
        .values_list('user_id', flat=True)
        .distinct()
    )
    if not recipient_ids:
        return 0
    # Filter to distinct recipient_ids already unique above
    notifs = []
    for uid in recipient_ids:
        notifs.append(Notification(
            recipient_id=uid,
            tour=tour,
            type='new_expense',
            title=f"New {category_label} expense added in {tour.title}",
            message=(
                f"{_full_name(paid_by)} paid {amount:.2f} for '{title}' in {tour.title} "
                f"({category_label}, {PAYMENT_METHOD_LABELS.get(expense.payment_method, expense.payment_method or '')})."
            ),
            related_object_id=expense.pk,
        ))
    if not notifs:
        return 0
    Notification.objects.bulk_create(notifs, batch_size=200)
    return len(notifs)


def notify_member_joined(tour, member_user, added_by=None):
    """After a user joins a tour, notify ALL existing other tour members about the new member."""
    if tour is None or member_user is None:
        return 0
    member_name = _full_name(member_user)
    recipient_ids = list(
        TourMember.objects.filter(tour=tour)
        .exclude(user_id=getattr(member_user, 'id', None))
        .values_list('user_id', flat=True)
        .distinct()
    )
    if not recipient_ids:
        return 0
    notifs = []
    for uid in recipient_ids:
        notifs.append(Notification(
            recipient_id=uid,
            tour=tour,
            type='member_joined',
            title=f"New member joined {tour.title}",
            message=f"{member_name} has joined the tour '{tour.title}'. They can now add and view expenses and settlement.",
            related_object_id=getattr(member_user, 'id', None),
        ))
    Notification.objects.bulk_create(notifs, batch_size=200)
    return len(notifs)
