import os, sys, django
sys.path.insert(0, '.')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from apps.tours.models import Tour, TourMember
from apps.expenses.models import Expense, ExpenseSplit
from apps.accounts.models import User

print("USERS matching areeba / nazer:")
for u in User.objects.filter(email__icontains='areeba') | User.objects.filter(first_name__icontains='areeba') | User.objects.filter(first_name__icontains='hhfhf') | User.objects.filter(last_name__icontains='nazer'):
    print(f"User: id={u.id}, email={u.email}, name='{u.first_name} {u.last_name}'")

print("\nEXPENSES matching Advance / Dopahar / Nashta:")
for e in Expense.objects.filter(title__icontains='Advance') | Expense.objects.filter(title__icontains='Dopahar') | Expense.objects.filter(title__icontains='Nashta') | Expense.objects.filter(title__icontains='Shopping'):
    splits = [f"{s.user.first_name or s.user.email}: {s.share_amount}" for s in e.splits.all()]
    print(f"Exp #{e.id} on Tour #{e.tour_id} ('{e.tour.title}'): '{e.title}' amt={e.amount} paid_by={e.paid_by.first_name} | Splits: {splits}")
