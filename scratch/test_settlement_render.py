import os, sys, django
sys.path.insert(0, '.')
sys.path.insert(0, 'stdlib_stubs')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from django.test import RequestFactory
from apps.accounts.models import User
from apps.tours.models import Tour
from apps.tours.views import TourSettlementPageView

u = User.objects.filter(email='nazirmuzammal282@gmail.com').first()
factory = RequestFactory()
req = factory.get('/client/tours/42/settlement/')
req.user = u

view = TourSettlementPageView.as_view()
resp = view(req, pk=42)
resp.render()
content = resp.content.decode('utf-8')

# Check what is inside cardTotalExpenses, cardTotalMembers, cardNetDiff
import re
for id_name in ['cardTotalExpenses', 'cardTotalMembers', 'cardNetDiff', '__PT_INITIAL_SETTLEMENT__']:
    m = re.search(rf'id="{id_name}"[^>]*>(.*?)<', content)
    if m:
        print(f"{id_name}: '{m.group(1)}'")
    else:
        m2 = re.search(rf'{id_name}\s*=\s*(.*?);', content)
        if m2:
            print(f"{id_name}: {m2.group(1)[:100]}")
        else:
            print(f"{id_name}: NOT FOUND")
