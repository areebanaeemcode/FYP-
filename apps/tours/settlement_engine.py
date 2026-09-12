from decimal import Decimal, ROUND_HALF_UP

from django.db.models import Sum, DecimalField
from django.db.models.functions import Coalesce

from apps.accounts.models import User
from apps.expenses.models import Expense, ExpenseSplit
from apps.tours.models import Tour


TWOPLACES = Decimal('0.01')


def _round_d(d):
    if d is None:
        return Decimal('0.00')
    if not isinstance(d, Decimal):
        try:
            d = Decimal(str(d))
        except Exception:
            return Decimal('0.00')
    return d.quantize(TWOPLACES, rounding=ROUND_HALF_UP)


def compute_settlement(tour):
    """
    For a given tour, compute:
    - per_member: { user_id: { user info, paid, owed_shares, net_balance: paid - owed_shares } }
      Net_balance > 0 => user is owed money (creditor).
      Net_balance < 0 => user owes money (debtor).
    - total_expenses: sum of all expense amounts
    - transfers: list of {from_user, to_user, amount} representing the greedy settlement.
    """
    if tour is None:
        return {
            'tour': None,
            'total_expenses': 0.0,
            'total_settled_amount': 0.0,
            'total_members': 0,
            'members_to_pay': 0,
            'members_to_receive': 0,
            'per_member': [],
            'transfers': [],
            'summary': {
                'total_paid': 0.0,
                'total_shares': 0.0,
                'net_zero_difference': 0.0,
                'members_to_pay': 0,
                'members_to_receive': 0,
            },
        }

    member_user_ids = set(User.objects.filter(tour_memberships__tour=tour).values_list('id', flat=True))
    if getattr(tour, 'created_by_id', None):
        member_user_ids.add(tour.created_by_id)
    expense_payer_ids = set(Expense.objects.filter(tour=tour).values_list('paid_by_id', flat=True))
    split_user_ids = set(ExpenseSplit.objects.filter(expense__tour=tour).values_list('user_id', flat=True))
    all_user_ids = member_user_ids | expense_payer_ids | split_user_ids

    members = list(
        User.objects.filter(id__in=all_user_ids)
        .order_by('first_name', 'last_name', 'email')
    )
    member_ids = [m.id for m in members]

    paid_qs = (
        Expense.objects.filter(tour=tour)
        .values('paid_by_id')
        .annotate(total=Coalesce(
            Sum('amount', output_field=DecimalField(max_digits=12, decimal_places=2)),
            0,
            output_field=DecimalField(max_digits=12, decimal_places=2),
        ))
    )
    paid_map = {r['paid_by_id']: r['total'] for r in paid_qs}

    shares_qs = (
        ExpenseSplit.objects.filter(expense__tour=tour)
        .values('user_id')
        .annotate(total=Coalesce(
            Sum('share_amount', output_field=DecimalField(max_digits=12, decimal_places=2)),
            0,
            output_field=DecimalField(max_digits=12, decimal_places=2),
        ))
    )
    shares_map = {r['user_id']: r['total'] for r in shares_qs}

    tour_expenses = list(Expense.objects.filter(tour=tour).order_by('paid_at', 'created_at'))
    splits_qs = list(ExpenseSplit.objects.filter(expense__tour=tour))

    exp_splits_by_id = {}
    for s in splits_qs:
        exp_splits_by_id.setdefault(s.expense_id, []).append(s)

    # Effective share per (expense_id, user_id)
    effective_shares = {}
    for exp in tour_expenses:
        s_list = exp_splits_by_id.get(exp.id, [])
        # If expense has custom splits across multiple users or for someone other than paid_by:
        has_custom_splits = len(s_list) > 1 or (len(s_list) == 1 and s_list[0].user_id != exp.paid_by_id)
        if has_custom_splits:
            for s in s_list:
                effective_shares[(exp.id, s.user_id)] = _round_d(s.share_amount)
        else:
            # Distribute equally among tour members
            if members:
                base_share = _round_d(exp.amount / Decimal(str(len(members))))
                for u in members:
                    effective_shares[(exp.id, u.id)] = base_share

    total_expenses = Decimal('0.00')
    for amt in paid_map.values():
        total_expenses += _round_d(amt)
    total_expenses = _round_d(total_expenses)

    per_member = []
    balances = {}  # user_id -> Decimal (net: paid - share)
    user_map = {}
    for u in members:
        paid = _round_d(paid_map.get(u.id, Decimal('0')))
        owed = sum((effective_shares.get((exp.id, u.id), Decimal('0.00')) for exp in tour_expenses), Decimal('0.00'))
        net = _round_d(paid - owed)

        member_expenses = []
        shares_sum = Decimal('0.00')
        for exp in tour_expenses:
            is_paid = (exp.paid_by_id == u.id)
            share_val = effective_shares.get((exp.id, u.id), Decimal('0.00'))
            if is_paid or share_val > Decimal('0.00'):
                shares_sum += share_val
                t_lower = (exp.title or '').lower()
                n_lower = (exp.notes or '').lower()
                is_adv = 'advance' in t_lower or 'advance' in n_lower
                member_expenses.append({
                    'id': exp.id,
                    'title': exp.title or exp.get_category_display() or 'Expense',
                    'paid_this': is_paid,
                    'paid_amount': float(_round_d(exp.amount)) if is_paid else 0.0,
                    'share_amount': float(share_val),
                    'is_advance': is_adv,
                    'category': exp.category,
                })

        diff_adj = _round_d(owed - shares_sum)
        if abs(diff_adj) >= Decimal('0.01'):
            member_expenses.append({
                'id': 'advance_adj',
                'title': 'Advance payment adjustment',
                'paid_this': False,
                'share_amount': float(abs(diff_adj)),
                'is_advance': True,
                'is_credit': (diff_adj < 0),
                'category': 'advance',
            })

        per_member.append({
            'user_id': u.id,
            'user': _user_info(u),
            'paid': float(paid),
            'owed_shares': float(owed),
            'net_balance': float(net),
            'role': 'creditor' if net > 0 else ('debtor' if net < 0 else 'settled'),
            'expenses': member_expenses,
        })
        balances[u.id] = net
        user_map[u.id] = u

    total_paid = sum((_round_d(paid_map.get(mid, 0)) for mid in member_ids), Decimal('0.00'))
    total_shares = sum((effective_shares.get((exp.id, mid), Decimal('0.00')) for exp in tour_expenses for mid in member_ids), Decimal('0.00'))
    net_zero_diff = _round_d(total_paid - total_shares)

    # Greedy settlement algorithm (classic simplified):
    # debtors = sorted DESCENDING by debt (most negative -> most debt i.e. owes most first — we sort ascending and take abs to get largest debt first)
    # Actually: largest debtor pays largest creditor.
    # Build pos/neg lists sorted:
    debtors = sorted(
        ((uid, bal) for uid, bal in balances.items() if bal < 0),
        key=lambda kv: kv[1],  # most negative first
    )
    creditors = sorted(
        ((uid, bal) for uid, bal in balances.items() if bal > 0),
        key=lambda kv: kv[1],
        reverse=True,
    )
    transfers = []
    i = 0
    j = 0
    while i < len(debtors) and j < len(creditors):
        debtor_id, debt = debtors[i]
        creditor_id, credit = creditors[j]
        transfer_amount = _round_d(min(-debt, credit))  # min of debt abs and credit
        if transfer_amount <= 0:
            # nothing to transfer, advance
            if -debt <= 0:
                i += 1
            if credit <= 0:
                j += 1
            continue
        transfers.append({
            'from_user': _user_info(user_map[debtor_id]),
            'from_user_id': debtor_id,
            'to_user': _user_info(user_map[creditor_id]),
            'to_user_id': creditor_id,
            'amount': float(transfer_amount),
        })
        new_debt = _round_d(debt + transfer_amount)
        new_credit = _round_d(credit - transfer_amount)
        debtors[i] = (debtor_id, new_debt)
        creditors[j] = (creditor_id, new_credit)
        if abs(new_debt) < Decimal('0.005'):
            i += 1
        if abs(new_credit) < Decimal('0.005'):
            j += 1

    members_to_pay = sum(1 for m in per_member if m['net_balance'] < -0.005)
    members_to_receive = sum(1 for m in per_member if m['net_balance'] > 0.005)

    return {
        'tour_id': tour.pk,
        'tour_title': getattr(tour, 'title', None),
        'total_expenses': float(total_expenses),
        'total_settled_amount': float(total_expenses),
        'total_members': len(members),
        'members_to_pay': members_to_pay,
        'members_to_receive': members_to_receive,
        'per_member': per_member,
        'balances': per_member,
        'transfers': transfers,
        'summary': {
            'total_paid': float(_round_d(total_paid)),
            'total_shares': float(_round_d(total_shares)),
            'net_zero_difference': float(net_zero_diff),
            'members_to_pay': members_to_pay,
            'members_to_receive': members_to_receive,
        },
    }


def _user_info(u):
    if u is None:
        return {'id': None, 'full_name': 'Unknown', 'email': '', 'first_name': '', 'last_name': ''}
    first = getattr(u, 'first_name', '') or ''
    last = getattr(u, 'last_name', '') or ''
    full = f"{first} {last}".strip() or (getattr(u, 'email', None) or '').split('@', 1)[0] or 'Unknown'
    return {
        'id': u.id,
        'full_name': full,
        'first_name': first,
        'last_name': last,
        'email': getattr(u, 'email', None) or '',
        'avatar_initial': ((full[:1] or '?').upper()),
    }
