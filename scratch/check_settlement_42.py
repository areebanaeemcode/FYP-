import os, sys, django
sys.path.insert(0, '.')
sys.path.insert(0, 'stdlib_stubs')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from apps.tours.models import Tour
from apps.tours.settlement_engine import compute_settlement
import json

t = Tour.objects.filter(pk=42).first()
if t:
    s = compute_settlement(t)
    print("Tour 42 Settlement:")
    print(json.dumps(s, indent=2))
else:
    print("Tour 42 not found")
