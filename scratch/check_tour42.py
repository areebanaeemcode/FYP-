import os
import sys
import django

sys.path.insert(0, os.path.abspath(os.path.dirname(__file__) + '/..'))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from apps.tours.models import Tour
from apps.expenses.models import Expense
from apps.tours.settlement_engine import compute_settlement

t = Tour.objects.get(id=42)
s = compute_settlement(t)

print("=" * 60)
print("TOUR 42: OVERALL DETAILS")
print("=" * 60)
print(f"Tour Title       : {t.title}")
print(f"Destination      : {t.destination}")
print(f"Budget           : ${t.budget}")
print(f"Total Spent      : ${t.total_spent()}")
print(f"Status           : {t.status}")
print(f"Total Members    : {s['total_members']}")
print("\n" + "=" * 60)
print("EXPENSES LIST (All recorded tour expenses)")
print("=" * 60)
for e in Expense.objects.filter(tour=t):
    payer = e.paid_by.first_name or e.paid_by.email
    print(f"• ID {e.id:2d} | ${e.amount:8.2f} | {e.category:14s} | Paid by: {payer:20s} | {e.title}")

print("\n" + "=" * 60)
print("MEMBER FINANCIAL BREAKDOWN (Total Paid, Fair Share, Net)")
print("=" * 60)
for b in s['balances']:
    name = b['user']['full_name'] or b['user']['email']
    paid = b['paid']
    share = b['owed_shares']
    net = b['net_balance']
    role = b['role'].upper()
    net_str = f"+${net:.2f}" if net >= 0 else f"-${abs(net):.2f}"
    print(f"• {name:25s} | Paid: ${paid:8.2f} | Share: ${share:8.2f} | Net: {net_str:>10s} [{role}]")

print("\n" + "=" * 60)
print("SETTLEMENT SUGGESTED TRANSFERS")
print("=" * 60)
if s['transfers']:
    for tr in s['transfers']:
        f = tr['from_user']['full_name'] or tr['from_user']['email']
        to = tr['to_user']['full_name'] or tr['to_user']['email']
        amt = tr['amount']
        print(f"--> {f} pays ${amt:.2f} to {to}")
else:
    print("[OK] All balances are fully settled! No transfers required.")

print("=" * 60)
