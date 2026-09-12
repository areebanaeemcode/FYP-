import os, sys, django
sys.path.insert(0, '.')
sys.path.insert(0, 'stdlib_stubs')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()
from apps.tours.models import Tour
t = Tour.objects.filter(pk=42).first()
if t:
    print('Tour 42:', t.title, 'created_by:', t.created_by.email)
    for m in t.memberships.select_related('user'):
        u = m.user
        print(f'  member id={u.pk} name={u.get_full_name()} email={u.email} role={m.role}')
