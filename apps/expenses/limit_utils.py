from decimal import Decimal
from django.db import models
from django.db.models import Sum, DecimalField
from django.db.models.functions import Coalesce
from django.utils import timezone

from apps.expenses.models import ExpenseLimit, Expense


def _sum_paid_for(tour, user):
    qs = Expense.objects.filter(tour=tour, paid_by=user)
    agg = qs.aggregate(t=Coalesce(Sum('amount', output_field=DecimalField(max_digits=12, decimal_places=2)), 0, output_field=DecimalField(max_digits=12, decimal_places=2)))
    return agg.get('t') or Decimal('0.00')


def annotate_limit_with_spending(limit, total_spent=None):
    from decimal import Decimal
    if limit is None:
        return None
    if total_spent is None:
        total_spent = _sum_paid_for(limit.tour, limit.user)
    limit.total_spent = total_spent
    try:
        amt = Decimal(str(limit.amount))
    except Exception:
        amt = Decimal('0')
    remaining = amt - total_spent
    limit.remaining = remaining
    limit.limit_exceeded = bool(total_spent > amt)
    return limit


def _fire_limit_exceeded_notification(limit, total_spent):
    from apps.notifications.models import Notification
    if not limit:
        return
    recipient = limit.user
    tour = limit.tour
    user_name = f"{(getattr(recipient, 'first_name', '') or '')} {(getattr(recipient, 'last_name', '') or '')}".strip() or (getattr(recipient, 'email', '') or 'User')
    title = f"Expense limit exceeded on {tour.title}"
    msg = f"Hi {user_name}, your personal spend on '{tour.title}' is ${float(total_spent):.2f}, which exceeds your limit of ${float(limit.amount):.2f}. You've exceeded by ${float(total_spent - limit.amount):.2f}. Add a larger limit or review recent expenses."
    Notification.objects.create(
        recipient=recipient,
        tour=tour,
        type='limit_exceeded',
        title=title,
        message=msg,
        related_object_id=None,
    )


def check_expense_limits_for_tour(tour, affected_users=None, old_contributions=None):
    """
    After expense create/update/delete: recheck ExpenseLimit for (paid_by) each affected user.
    If limit just crossed (not previously notified) -> fire exactly ONE notification and flip last_notified_exceeded=True.
    If user's spending dropped back below limit (e.g. delete/edit) -> flip last_notified_exceeded=False so next cross fires again.
    Returns dict user_id -> {total_spent, limit_amount, limit_exceeded, just_crossed, remaining, limit_id}
    """
    from decimal import Decimal
    if affected_users is None:
        affected_user_ids = set()
    else:
        affected_user_ids = {u.id if hasattr(u, 'id') else int(u) for u in affected_users}
    # Determine users whose totals might have changed (paid_by users on the tour whose totals we check)
    # We include all users with an ExpenseLimit on this tour, plus affected paid_by users.
    qs = ExpenseLimit.objects.filter(tour=tour).select_related('tour', 'user')
    limits_by_user = {lim.user_id: lim for lim in qs}
    # Include any extra affected paid users even if no limit exists
    for uid in list(affected_user_ids):
        if uid not in limits_by_user:
            lim = ExpenseLimit.objects.filter(tour=tour, user_id=uid).first()
            if lim:
                limits_by_user[uid] = lim

    results = {}
    for user_id, limit in limits_by_user.items():
        total_spent = _sum_paid_for(tour, limit.user)
        prev_notified = bool(limit.last_notified_exceeded)
        limit_amount = limit.amount
        exceeded = total_spent > Decimal(str(limit_amount))
        just_crossed = False
        reset_flag = False
        if exceeded and not prev_notified:
            just_crossed = True
            _fire_limit_exceeded_notification(limit, total_spent)
            limit.last_notified_exceeded = True
            limit.save(update_fields=['last_notified_exceeded', 'updated_at'])
        elif (not exceeded) and prev_notified:
            reset_flag = True
            limit.last_notified_exceeded = False
            limit.save(update_fields=['last_notified_exceeded', 'updated_at'])
        remaining = Decimal(str(limit_amount)) - total_spent
        results[user_id] = {
            'limit_id': limit.id,
            'total_spent': float(total_spent),
            'limit_amount': float(limit_amount),
            'limit_exceeded': exceeded,
            'just_crossed': just_crossed,
            'remaining': float(remaining),
            'prev_notified': prev_notified,
            'reset_flag': reset_flag,
        }
    return results
