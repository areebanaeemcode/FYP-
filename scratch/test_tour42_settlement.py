import os, sys, django
sys.path.insert(0, '.')
sys.path.insert(0, 'stdlib_stubs')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from apps.accounts.models import User
from apps.tours.models import Tour
from apps.expenses.models import Expense, ExpenseSplit
from apps.tours.settlement_engine import compute_settlement
from decimal import Decimal
import json

t = Tour.objects.filter(pk=42).first()
print(f"Tour 42: '{t.title}', creator: {t.created_by.email}")
members = list(t.memberships.select_related('user'))
print(f"Members ({len(members)}):")
for m in members:
    print(f"  id={m.user.id}, name={m.user.get_full_name()}, email={m.user.email}")

u_owner = t.created_by
# Let's add a test expense if none exist
if Expense.objects.filter(tour=t).count() == 0:
    exp = Expense.objects.create(
        tour=t,
        created_by=u_owner,
        paid_by=u_owner,
        title="Murree Hotel & Dinner",
        amount=Decimal("3000.00"),
        category="accommodation",
        payment_method="cash"
    )
    # Split equally among all 3 members (1000 each)
    share = Decimal("1000.00")
    for m in members:
        ExpenseSplit.objects.create(expense=exp, user=m.user, share_amount=share)
    print(f"Created sample expense id={exp.id}, amount=3000.00 split 1000 each")

settle = compute_settlement(t)
print("\n=== COMPUTED SETTLEMENT ===")
print("Total Expenses:", settle['total_expenses'])
print("Total Members:", settle['total_members'])
print("Net Difference:", settle['summary']['net_zero_difference'])
print("\nBalances (Total Paid vs Fair Share):")
for b in settle['per_member']:
    print(f"  {b['user']['full_name']}: Paid = ${b['paid']:.2f}, Fair Share = ${b['owed_shares']:.2f}, Net = {b['net_balance']:+.2f} ({b['role']})")

print("\nSuggested Transfers:")
for tr in settle['transfers']:
    print(f"  {tr['from_user']['full_name']} -> sends ${tr['amount']:.2f} to -> {tr['to_user']['full_name']}")
