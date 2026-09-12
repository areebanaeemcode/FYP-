import os, sys, django
sys.path.insert(0, '.')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from apps.tours.models import Tour, TourMember
from apps.expenses.models import Expense, ExpenseSplit
from apps.accounts.models import User
from decimal import Decimal, ROUND_HALF_UP

TWOPLACES = Decimal('0.01')
def _round_d(d):
    if d is None: return Decimal('0.00')
    if not isinstance(d, Decimal): d = Decimal(str(d))
    return d.quantize(TWOPLACES, rounding=ROUND_HALF_UP)

def _compute_equal_shares(amount, count):
    if count <= 0: return []
    amt = _round_d(amount)
    base = (amt / Decimal(str(count))).quantize(TWOPLACES, rounding=ROUND_HALF_UP)
    shares = [base] * count
    diff = amt - sum(shares)
    shares[-1] += diff
    return shares

t = Tour.objects.get(id=78)
members = list(User.objects.filter(tour_memberships__tour=t).order_by('id'))
print(f"Tour 78 members: {[m.first_name for m in members]}")

for exp in t.expenses.all():
    splits = list(exp.splits.all())
    # If only 1 split and for paid_by, update it to equal splits among members!
    if len(splits) <= 1 and (len(splits) == 0 or splits[0].user_id == exp.paid_by_id):
        print(f"Fixing splits for exp #{exp.id} '{exp.title}' (${exp.amount})...")
        exp.splits.all().delete()
        shares = _compute_equal_shares(exp.amount, len(members))
        for m, s in zip(members, shares):
            ExpenseSplit.objects.create(expense=exp, user=m, share_amount=s)

print("\nUpdated splits on Tour 78:")
for exp in t.expenses.all():
    splits = [(s.user.first_name, float(s.share_amount)) for s in exp.splits.all()]
    print(f"  Exp #{exp.id}: '{exp.title}' amt=${exp.amount} splits: {splits}")
