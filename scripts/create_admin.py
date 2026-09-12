import os
import sys
import django

# Setup Django environment
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "core.settings")
django.setup()

from apps.accounts.models import User

ADMIN_EMAIL = "admin@paytogether.com"
ADMIN_PASSWORD = "Admin@PayTogether2026!"
ADMIN_PHONE = "03000000000"
ADMIN_FIRST_NAME = "System"
ADMIN_LAST_NAME = "Admin"

def setup_admin():
    user, created = User.objects.get_or_create(
        email=ADMIN_EMAIL,
        defaults={
            "phone_number": ADMIN_PHONE,
            "first_name": ADMIN_FIRST_NAME,
            "last_name": ADMIN_LAST_NAME,
            "is_staff": True,
            "is_superuser": True,
            "is_active": True,
        }
    )
    user.first_name = ADMIN_FIRST_NAME
    user.last_name = ADMIN_LAST_NAME
    user.phone_number = ADMIN_PHONE
    user.is_staff = True
    user.is_superuser = True
    user.is_active = True
    user.set_password(ADMIN_PASSWORD)
    user.save()

    status = "Created new" if created else "Updated existing"
    print(f"SUCCESS: {status} superuser account: {ADMIN_EMAIL} (Password: {ADMIN_PASSWORD})")

if __name__ == "__main__":
    setup_admin()
