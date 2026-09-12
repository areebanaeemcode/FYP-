import os, sys, django
sys.path.insert(0, '.')
sys.path.insert(0, 'stdlib_stubs')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from django.test import RequestFactory
from apps.accounts.models import User
from apps.expenses.views import ExpenseListAPI

u = User.objects.filter(email='nazirmuzammal282@gmail.com').first()
factory = RequestFactory()
req = factory.get('/client/expenses/api/?tour_id=42')
req.user = u

view = ExpenseListAPI.as_view()
resp = view(req)
print("Status code:", resp.status_code)
print("Data type:", type(resp.data))
if isinstance(resp.data, dict):
    print("Keys:", resp.data.keys())
    results = resp.data.get('results', [])
    print("Results count:", len(results))
    for r in results:
        print("Expense:", r.get('id'), r.get('title'), r.get('amount'), "splits:", r.get('splits'))
elif isinstance(resp.data, list):
    print("List count:", len(resp.data))
    for r in resp.data:
        print("Expense:", r.get('id'), r.get('title'), r.get('amount'), "splits:", r.get('splits'))
