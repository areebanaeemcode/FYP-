from decimal import Decimal, ROUND_HALF_UP

from apps.accounts.models import User
from apps.expenses.models import Expense, ExpenseSplit


TWO_PLACES = Decimal('0.01')


def _round(value):
    return Decimal(str(value or 0)).quantize(TWO_PLACES, rounding=ROUND_HALF_UP)


def _equal_shares(amount, user_ids, remainder_offset=0):
    """Split exactly to cents, assigning any rounding remainder to the last user."""
    if not user_ids:
        return {}
    share = _round(Decimal(amount) / len(user_ids))
    shares = {user_id: share for user_id in user_ids}
    # Rotate the one-cent remainder across otherwise equal expenses. This keeps
    # a sequence of equal payments fair instead of always charging one member.
    recipient = user_ids[remainder_offset % len(user_ids)]
    shares[recipient] = _round(shares[recipient] + (_round(amount) - sum(shares.values())))
    return shares


def _user_info(user):
    first = user.first_name or ''
    last = user.last_name or ''
    full_name = f'{first} {last}'.strip() or user.email.split('@', 1)[0] or 'Unknown'
    return {'id': user.id, 'full_name': full_name, 'first_name': first, 'last_name': last,
            'email': user.email or '', 'avatar_initial': full_name[:1].upper() or '?'}


def compute_settlement(tour):
    """Return balances and suggested transfers for one tour only.

    A stored ExpenseSplit is authoritative, including a single split to the payer.
    Expenses without valid, complete splits retain the legacy equal-split behaviour.
    """
    empty = {'total_expenses': 0.0, 'total_settled_amount': 0.0, 'total_members': 0,
             'members_to_pay': 0, 'members_to_receive': 0, 'per_member': [],
             'balances': [], 'transfers': [],
             'summary': {'total_paid': 0.0, 'total_shares': 0.0, 'net_zero_difference': 0.0,
                         'members_to_pay': 0, 'members_to_receive': 0}}
    if tour is None:
        return empty

    member_ids = list(tour.memberships.order_by('user_id').values_list('user_id', flat=True))
    if tour.created_by_id and tour.created_by_id not in member_ids:
        member_ids.append(tour.created_by_id)
    members = list(User.objects.filter(id__in=member_ids).order_by('first_name', 'last_name', 'email'))
    member_ids = [member.id for member in members]
    member_set = set(member_ids)
    users = {member.id: member for member in members}
    expenses = list(Expense.objects.filter(tour=tour, paid_by_id__in=member_set)
                    .order_by('paid_at', 'created_at')) if member_set else []
    split_map = {}
    for split in ExpenseSplit.objects.filter(expense__in=expenses).select_related('user'):
        split_map.setdefault(split.expense_id, []).append(split)

    paid = {user_id: Decimal('0.00') for user_id in member_ids}
    owed = {user_id: Decimal('0.00') for user_id in member_ids}
    details = {user_id: [] for user_id in member_ids}
    total_expenses = Decimal('0.00')
    for expense_index, expense in enumerate(expenses):
        amount = _round(expense.amount)
        total_expenses += amount
        paid[expense.paid_by_id] += amount
        expense_splits = split_map.get(expense.id, [])
        # Only trust a complete split belonging to current members. This keeps
        # legacy/bad rows balanced while keeping valid one-person splits intact.
        declared = {split.user_id: _round(split.share_amount) for split in expense_splits
                    if split.user_id in member_set}
        valid_splits = (len(declared) == len(expense_splits) and declared and
                        _round(sum(declared.values())) == amount)
        is_equal_split = (valid_splits and len(declared) == len(member_ids) and
                          max(declared.values()) - min(declared.values()) <= TWO_PLACES)
        shares = (_equal_shares(amount, member_ids, expense_index)
                  if is_equal_split or not valid_splits else declared)
        for user_id, share in shares.items():
            owed[user_id] += share
        for user_id in member_ids:
            share = shares.get(user_id, Decimal('0.00'))
            if expense.paid_by_id == user_id or share:
                details[user_id].append({'id': expense.id,
                    'title': expense.title or expense.get_category_display() or 'Expense',
                    'paid_this': expense.paid_by_id == user_id,
                    'paid_amount': float(amount) if expense.paid_by_id == user_id else 0.0,
                    'share_amount': float(share), 'is_advance': False, 'category': expense.category})

    balances = {user_id: _round(paid[user_id] - owed[user_id]) for user_id in member_ids}
    per_member = [{'user_id': user_id, 'user': _user_info(users[user_id]),
        'paid': float(_round(paid[user_id])), 'owed_shares': float(_round(owed[user_id])),
        'net_balance': float(balance),
        'role': 'creditor' if balance > 0 else ('debtor' if balance < 0 else 'settled'),
        'expenses': details[user_id]} for user_id, balance in balances.items()]

    debtors = sorted(((uid, value) for uid, value in balances.items() if value < 0), key=lambda item: item[1])
    creditors = sorted(((uid, value) for uid, value in balances.items() if value > 0), key=lambda item: item[1], reverse=True)
    transfers, debtor_index, creditor_index = [], 0, 0
    while debtor_index < len(debtors) and creditor_index < len(creditors):
        debtor_id, debt = debtors[debtor_index]
        creditor_id, credit = creditors[creditor_index]
        amount = _round(min(-debt, credit))
        if amount:
            transfers.append({'from_user': _user_info(users[debtor_id]), 'from_user_id': debtor_id,
                              'to_user': _user_info(users[creditor_id]), 'to_user_id': creditor_id,
                              'amount': float(amount)})
        debtors[debtor_index] = (debtor_id, _round(debt + amount))
        creditors[creditor_index] = (creditor_id, _round(credit - amount))
        if debtors[debtor_index][1] == 0:
            debtor_index += 1
        if creditors[creditor_index][1] == 0:
            creditor_index += 1

    total_paid, total_shares = _round(sum(paid.values())), _round(sum(owed.values()))
    to_pay = sum(1 for value in balances.values() if value < 0)
    to_receive = sum(1 for value in balances.values() if value > 0)
    return {'tour_id': tour.pk, 'tour_title': tour.title, 'total_expenses': float(_round(total_expenses)),
            'total_settled_amount': float(_round(total_expenses)), 'total_members': len(members),
            'members_to_pay': to_pay, 'members_to_receive': to_receive, 'per_member': per_member,
            'balances': per_member, 'transfers': transfers,
            'summary': {'total_paid': float(total_paid), 'total_shares': float(total_shares),
                        'net_zero_difference': float(_round(total_paid - total_shares)),
                        'members_to_pay': to_pay, 'members_to_receive': to_receive}}
