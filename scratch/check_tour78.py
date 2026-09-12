import os, sys, django
sys.path.insert(0, '.')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from apps.tours.models import Tour, TourMember
from apps.expenses.models import Expense, ExpenseSplit

t = Tour.objects.get(id=78)
print(f"Tour 78: {t.title}")
print("Members:")
for m in t.memberships.select_related('user'):
    print(f"  - user_id={m.user_id}, name='{m.user.first_name} {m.user.last_name}', email={m.user.email}, role={m.role}")

print("\nExpenses on Tour 78:")
for e in t.expenses.select_related('paid_by'):
    splits = [(s.user_id, s.user.first_name, str(s.share_amount)) for s in e.splits.select_related('user')]
    print(f"  - Exp #{e.id}: '{e.title}' ${e.amount} paid_by={e.paid_by.first_name} | splits: {splits}")
