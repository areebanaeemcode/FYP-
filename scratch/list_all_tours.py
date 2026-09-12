import os, sys, django
sys.path.insert(0, '.')
sys.path.insert(0, 'stdlib_stubs')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from apps.accounts.models import User
from apps.tours.models import Tour, TourMember
from apps.expenses.models import Expense

print("=== ALL TOURS ===")
for t in Tour.objects.all().order_by('id'):
    exps = Expense.objects.filter(tour=t)
    total_amt = sum(e.amount for e in exps)
    print(f"Tour {t.id}: '{t.title}' | Creator: {t.created_by.email} | Members: {t.memberships.count()} | Expenses: {exps.count()} (Total: ${total_amt})")
