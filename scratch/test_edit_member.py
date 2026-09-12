import os, sys, django
sys.path.insert(0, '.')
sys.path.insert(0, 'stdlib_stubs')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from rest_framework.test import APIClient
from rest_framework import status
from apps.accounts.models import User
from apps.tours.models import Tour, TourMember

def run_tests():
    print("Testing Edit Member Name & Role API...")
    creator, _ = User.objects.get_or_create(email="owner_edit_test@test.dev", defaults={"phone_number": "+923000000091", "first_name": "Tour", "last_name": "Owner"})
    creator.set_password("pass123")
    creator.save()

    member, _ = User.objects.get_or_create(email="target_member_test@test.dev", defaults={"phone_number": "+923000000092", "first_name": "Old", "last_name": "Name"})
    member.set_password("pass123")
    member.save()

    from datetime import date
    tour, _ = Tour.objects.get_or_create(title="Edit Member Test Tour", created_by=creator, defaults={"destination": "Murree", "budget": 1000, "start_date": date(2026, 10, 1), "end_date": date(2026, 10, 10)})
    TourMember.objects.get_or_create(tour=tour, user=creator, defaults={"role": "creator"})
    tm, _ = TourMember.objects.get_or_create(tour=tour, user=member, defaults={"role": "member"})

    client = APIClient()
    client.force_authenticate(user=creator)

    # Test 1: User saves without changing role or name -> previously returned 400 "User is already a Member."!
    url = f"/client/tours/api/{tour.pk}/change-role/"
    resp = client.post(url, {"user_id": member.pk, "role": "member"}, format="json")
    print("Test 1 (Save unchanged role): status =", resp.status_code, "data =", resp.data.get("message"))
    assert resp.status_code == status.HTTP_200_OK, f"Expected 200, got {resp.status_code}: {resp.data}"

    # Test 2: User changes member name to 'Zainab Fatima'
    resp = client.post(url, {"user_id": member.pk, "role": "member", "full_name": "Zainab Fatima"}, format="json")
    print("Test 2 (Change name): status =", resp.status_code, "data =", resp.data.get("message"))
    assert resp.status_code == status.HTTP_200_OK
    member.refresh_from_db()
    assert member.first_name == "Zainab" and member.last_name == "Fatima"
    assert resp.data["member"]["full_name"] == "Zainab Fatima"
    
    # Also verify tour serializer members in the response contains the new name
    members_in_tour = resp.data["tour"]["members"]
    target_in_tour = [m for m in members_in_tour if m["user_id"] == member.pk][0]
    assert target_in_tour["full_name"] == "Zainab Fatima", f"Expected Zainab Fatima, got {target_in_tour['full_name']}"

    # Test 3: User changes both role to 'creator' (admin) and name to 'Zainab Admin'
    resp = client.post(url, {"user_id": member.pk, "role": "creator", "full_name": "Zainab Admin"}, format="json")
    print("Test 3 (Change role & name): status =", resp.status_code, "data =", resp.data.get("message"))
    assert resp.status_code == status.HTTP_200_OK
    member.refresh_from_db()
    tm.refresh_from_db()
    assert tm.role == "creator"
    assert member.first_name == "Zainab" and member.last_name == "Admin"

    print("ALL 3 EDIT TESTS PASSED SUCCESSFULLY!")

if __name__ == "__main__":
    run_tests()
