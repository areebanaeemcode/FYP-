import os, sys, django
sys.path.insert(0, '.')
sys.path.insert(0, 'stdlib_stubs')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from apps.tours.models import Tour
from apps.expenses.models import Expense

for t in Tour.objects.all().order_by('-id')[:10]:
    exp_count = Expense.objects.filter(tour=t).count()
    mem_count = t.memberships.count()
    print(f"Tour id={t.id} title='{t.title}' creator='{t.created_by.email}' members={mem_count} expenses={exp_count}")
