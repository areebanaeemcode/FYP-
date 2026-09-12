import os, sys, django
sys.path.insert(0, '.')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from apps.tours.models import Tour, TourMember
from apps.expenses.models import Expense, ExpenseSplit
from apps.tours.settlement_engine import compute_settlement

for t in Tour.objects.all():
    print(f"=== TOUR {t.id}: '{t.title}' (destination: {t.destination}) ===")
    members = list(TourMember.objects.filter(tour=t).select_related('user'))
    print(f"  Members count: {len(members)}")
    for m in members:
        print(f"    - {m.user.id}: {m.user.first_name} {m.user.last_name} ({m.user.email}) role={m.role}")
    expenses = list(Expense.objects.filter(tour=t).select_related('paid_by'))
    print(f"  Expenses count: {len(expenses)}")
    for e in expenses:
        splits = list(e.splits.select_related('user'))
        splits_str = ", ".join([f"{s.user.first_name or s.user.email}: ${s.share_amount}" for s in splits])
        print(f"    - Expense #{e.id}: '{e.title}' amt=${e.amount} paid_by={e.paid_by.first_name} | Splits: [{splits_str}]")
    
    s = compute_settlement(t)
    print("  Settlement summary:", s.get('summary'))
    print("  Transfers:", s.get('transfers'))
    for pm in s.get('per_member', []):
        print(f"    Member {pm['user']['full_name']}: paid=${pm['paid']}, owed=${pm['owed_shares']}, net=${pm['net_balance']}, role={pm['role']}")
        for exp in pm.get('expenses', []):
            print(f"        exp: {exp['title']} share=${exp['share_amount']} paid_this={exp['paid_this']}")
