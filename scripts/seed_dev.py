import os
import sys
import io
import warnings
import time
import uuid
from decimal import Decimal
from pathlib import Path
from datetime import date, datetime, timedelta

BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BASE_DIR))
sys.path.insert(0, str(BASE_DIR / "stdlib_stubs"))

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "core.settings")
import django
django.setup()

warnings.filterwarnings("ignore")

from django.conf import settings
from django.test import Client
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile

User = get_user_model()

from apps.tours.models import Tour, TourMember
from apps.expenses.models import Expense, ExpenseSplit, Receipt, ExpenseLimit
from apps.notifications.models import Notification


SEED_EMAILS = [
    "seed.alice@pay-together.dev",
    "seed.bob@pay-together.dev",
    "seed.charlie@pay-together.dev",
    "seed.diana@pay-together.dev",
    "seed.ethan@pay-together.dev",
]


def cleanup_seed():
    for email in SEED_EMAILS:
        try:
            u = User.objects.get(email=email)
            ExpenseSplit.objects.filter(user=u).delete()
            Expense.objects.filter(paid_by=u).delete()
            Notification.objects.filter(recipient=u).delete()
            ExpenseLimit.objects.filter(user=u).delete()
            Receipt.objects.filter(expense__paid_by=u).delete()
            TourMember.objects.filter(user=u).delete()
            Tour.objects.filter(created_by=u).delete()
            u.delete()
        except User.DoesNotExist:
            pass


def create_users():
    users = []
    for i, email in enumerate(SEED_EMAILS, 1):
        names = ["Alice", "Bob", "Charlie", "Diana", "Ethan"]
        first = names[i - 1]
        last = f"Seed{i}"
        u = User.objects.create_user(
            email=email,
            password="SeedTest123!",
            first_name=first,
            last_name=last,
            phone_number=f"+90000000100{i}",
        )
        users.append(u)
        print(f"  + created user {i}: {first} ({email})")
    return users


def auth_headers(user):
    refresh = RefreshToken.for_user(user)
    return {"HTTP_AUTHORIZATION": f"Bearer {str(refresh.access_token)}"}


def tiny_png_bytes():
    return bytes.fromhex(
        "89504e470d0a1a0a"
        "0000000d49484452"
        "0000000100000001"
        "08060000001f15c4"
        "890000000d494441"
        "5478da6300010000"
        "0500010d0a2db400"
        "00000049454e44ae"
        "426082"
    )


def run_checks():
    fail = 0
    cleanup_seed()
    print("=" * 72)
    print("TASK 15b  Seed Dev Script  All Flows Exercise")
    print("=" * 72)

    # =======================================================================
    # 1. CREATE 5 USERS
    # =======================================================================
    print("\n[1] Creating 5 seed users...")
    users = create_users()
    alice, bob, charlie, diana, ethan = users
    print("  -> OK 5 users created")

    # =======================================================================
    # 2. ALICE CREATES A TOUR
    # =======================================================================
    print("\n[2] Creating tour (Alice as creator)...")
    client = APIClient()
    headers = auth_headers(alice)
    tour_payload = {
        "title": "Istanbul City Break 2026",
        "destination": "Istanbul, Turkey",
        "budget": "5000.00",
        "start_date": "2026-09-10",
        "end_date": "2026-09-15",
    }
    resp = client.post("/client/tours/api/create/", data=tour_payload, format="json", **headers)
    try:
        assert resp.status_code in (200, 201), f"Create tour expected 200/201, got {resp.status_code}: {resp.content}"
        data = resp.json() if hasattr(resp, "json") else resp.data
        tour_id = data.get("id") or data.get("tour_id")
        join_token = data.get("join_token")
        assert tour_id, f"Tour id missing: {data}"
        assert join_token, f"join_token missing: {data}"
        tour = Tour.objects.get(pk=tour_id)
        print(f"  -> Tour created id={tour_id}, join_token={join_token[:10]}...")
    except Exception as e:
        fail += 1
        print(f"  FAIL -> {e}")
        return fail

    # =======================================================================
    # 3. BOB, CHARLIE, DIANA JOIN THE TOUR (4 members total)
    # =======================================================================
    print("\n[3] Bob, Charlie, Diana join tour...")
    join_headers_list = [auth_headers(u) for u in [bob, charlie, diana]]
    for name, h in zip(["Bob", "Charlie", "Diana"], join_headers_list):
        resp = client.post(
            "/client/tours/api/join/",
            data={"join_token": join_token},
            format="json",
            **h,
        )
        try:
            assert resp.status_code in (200, 201), f"{name} join expected 200, got {resp.status_code}: {resp.content}"
            print(f"  -> {name} joined OK")
        except Exception as e:
            fail += 1
            print(f"  FAIL {name} join -> {e}")
    member_count = TourMember.objects.filter(tour=tour).count()
    print(f"  -> Tour now has {member_count} members (expect 4)")

    # =======================================================================
    # 4. ADD 4 EXPENSES IN DIFFERENT CATEGORIES
    # =======================================================================
    print("\n[4] Adding 4 expenses (transport / accommodation / food / activities)...")
    all_members = [alice, bob, charlie, diana]
    member_ids = [u.id for u in all_members]

    expenses_to_create = [
        # (payer, category, title, amount, pmethod, notes)
        (alice, "transport",      "Airport Taxi",     "480.00", "card",            "IST airport -> Sultanahmet"),
        (bob,   "accommodation",  "Hotel - 4 nights", "1200.00", "online_transfer", "Double rooms x2"),
        (charlie, "food",         "Grand Bazaar Lunch","350.00","cash",            "Street food + baklava"),
        (diana, "activities",     "Bosphorus Cruise", "270.00",  "card",            "Sunset cruise tickets"),
    ]
    created_expenses = []
    for payer, cat, title, amount, pm, notes in expenses_to_create:
        h = auth_headers(payer)
        payload = {
            "tour_id": tour.id,
            "title": title,
            "notes": notes,
            "amount": amount,
            "category": cat,
            "payment_method": pm,
            "paid_by": payer.id,
            "split_members": member_ids,
        }
        resp = client.post("/client/expenses/api/create/", data=payload, format="json", **h)
        try:
            assert resp.status_code in (200, 201), f"Expense '{title}' expected 200/201, got {resp.status_code}: {resp.content}"
            data = resp.json() if hasattr(resp, "json") else resp.data
            eid = data.get("id") or data.get("expense_id")
            assert eid, f"Expense id missing: {data}"
            created_expenses.append((cat, Expense.objects.get(pk=eid), amount))
            print(f"  -> [{cat}] {title} ${amount} by {payer.first_name}: id={eid}")
        except Exception as e:
            fail += 1
            print(f"  FAIL expense '{title}' -> {e}")

    # =======================================================================
    # 5. UPLOAD + VERIFY RECEIPT for first expense (Airport Taxi)
    # =======================================================================
    print("\n[5] Uploading receipt image + verifying receipt...")
    if created_expenses:
        cat, first_exp, amt = created_expenses[0]
        png = tiny_png_bytes()
        f = SimpleUploadedFile(f"receipt_{first_exp.id}.png", png, content_type="image/png")
        h = auth_headers(alice)
        resp = client.post(
            f"/client/expenses/api/{first_exp.id}/receipt/",
            data={"image": f},
            format="multipart",
            **h,
        )
        try:
            assert resp.status_code in (200, 201), f"Receipt upload expected 200, got {resp.status_code}: {resp.content}"
            rdata = resp.json() if hasattr(resp, "json") else resp.data
            print(f"  -> Receipt uploaded ok: {rdata}")
            # Reload expense with receipt
            first_exp.refresh_from_db()
            assert hasattr(first_exp, "receipt") or Receipt.objects.filter(expense=first_exp).exists(), "Receipt not linked"
        except Exception as e:
            fail += 1
            print(f"  FAIL receipt upload -> {e}")

        # Now verify receipt as different member (Bob)
        h2 = auth_headers(bob)
        resp = client.post(
            f"/client/expenses/api/{first_exp.id}/receipt/verify/",
            data={"notes": "Looks correct - Bob"},
            format="json",
            **h2,
        )
        try:
            assert resp.status_code in (200, 201), f"Receipt verify expected 200, got {resp.status_code}: {resp.content}"
            rdata = resp.json() if hasattr(resp, "json") else resp.data
            print(f"  -> Receipt verified by Bob: status={resp.status_code}")
        except Exception as e:
            fail += 1
            print(f"  FAIL receipt verify -> {e}")

    # =======================================================================
    # 6. EXPENSE LIMIT FOR CHARLIE = $200, he paid $350 -> should trigger limit_exceeded notification
    # =======================================================================
    print("\n[6] Setting expense limit for Charlie = $200 (he already spent $350)...")
    h_charlie = auth_headers(charlie)
    resp = client.put(
        "/client/expenses/api/limits/",
        data={"tour_id": tour.id, "amount": "200.00"},
        format="json",
        **h_charlie,
    )
    try:
        assert resp.status_code in (200, 201), f"Limit PUT expected 200, got {resp.status_code}: {resp.content}"
        ldata = resp.json() if hasattr(resp, "json") else resp.data
        alerts = ldata.get("alerts", {}) if isinstance(ldata, dict) else {}
        exceeded = alerts.get("limit_exceeded", False) if isinstance(alerts, dict) else getattr(ldata, "limit_exceeded", None)
        print(f"  -> limit set. alerts={alerts}, limit_exceeded={exceeded}")
        notif_count = Notification.objects.filter(
            recipient=charlie, type="limit_exceeded"
        ).count()
        print(f"  -> Charlie has {notif_count} limit_exceeded notification(s)")
    except Exception as e:
        fail += 1
        print(f"  FAIL limit set -> {e}")

    # =======================================================================
    # 7. SETTLEMENT: Page 200 + API 200
    # =======================================================================
    print("\n[7] Settlement: HTML page + JSON API...")
    djc = Client()
    djc.force_login(alice, backend="django.contrib.auth.backends.ModelBackend")
    page_resp = djc.get(f"/client/tours/{tour.id}/settlement/")
    try:
        assert page_resp.status_code == 200, f"Settlement page expected 200, got {page_resp.status_code}"
        print(f"  -> Settlement HTML page 200 OK")
    except Exception as e:
        fail += 1
        print(f"  FAIL settlement page -> {e}")

    api_resp = client.get(f"/client/tours/api/{tour.id}/settlement/", **auth_headers(alice))
    try:
        assert api_resp.status_code == 200, f"Settlement API expected 200, got {api_resp.status_code}"
        sdata = api_resp.json() if hasattr(api_resp, "json") else api_resp.data
        balances = (sdata or {}).get("balances", []) if isinstance(sdata, dict) else []
        transfers = (sdata or {}).get("transfers", []) if isinstance(sdata, dict) else []
        print(f"  -> Settlement API 200: {len(balances)} balances, {len(transfers)} transfers")
    except Exception as e:
        fail += 1
        print(f"  FAIL settlement API -> {e}")

    # =======================================================================
    # 8. ANALYTICS: Global + Tour pages 200, Tour API 200
    # =======================================================================
    print("\n[8] Analytics: Global page / Tour page / Tour API...")
    global_resp = djc.get("/client/analytics/")
    try:
        assert global_resp.status_code == 200, f"Global analytics page expected 200, got {global_resp.status_code}"
        print(f"  -> Global analytics HTML 200 OK")
    except Exception as e:
        fail += 1
        print(f"  FAIL analytics global page -> {e}")

    tour_an_page = djc.get(f"/client/tours/{tour.id}/analytics/")
    try:
        assert tour_an_page.status_code == 200, f"Tour analytics page expected 200, got {tour_an_page.status_code}"
        print(f"  -> Tour analytics HTML 200 OK")
    except Exception as e:
        fail += 1
        print(f"  FAIL analytics tour page -> {e}")

    tour_an_api = client.get(f"/client/tours/api/{tour.id}/analytics/", **auth_headers(alice))
    try:
        assert tour_an_api.status_code == 200, f"Tour analytics API expected 200, got {tour_an_api.status_code}"
        adata = tour_an_api.json() if hasattr(tour_an_api, "json") else tour_an_api.data
        cats = (adata or {}).get("by_category", []) if isinstance(adata, dict) else []
        total = (adata or {}).get("total", None) if isinstance(adata, dict) else None
        print(f"  -> Tour analytics API 200: total=${total}, {len(cats)} categories")
    except Exception as e:
        fail += 1
        print(f"  FAIL analytics tour API -> {e}")

    # =======================================================================
    # 9. OFFLINE: Create 1 pending offline expense -> sync endpoint ok_count=1
    # =======================================================================
    print("\n[9] Offline sync: 1 pending expense -> POST /client/api/offline/sync-expenses...")
    pending = [
        {
            "client_id": str(uuid.uuid4()),
            "payload": {
                "tour_id": tour.id,
                "title": "Offline - Simit Cart Breakfast",
                "notes": "Uploaded offline on ferry, synced after wifi returned.",
                "amount": "64.50",
                "category": "food",
                "payment_method": "cash",
                "paid_by": alice.id,
                "split_members": member_ids,
            },
        }
    ]
    sync_resp = client.post(
        "/client/api/offline/sync-expenses/",
        data={"pending": pending},
        format="json",
        **auth_headers(alice),
    )
    try:
        assert sync_resp.status_code == 200, f"Offline sync expected 200, got {sync_resp.status_code}"
        sdata = sync_resp.json() if hasattr(sync_resp, "json") else sync_resp.data
        ok_count = sdata.get("ok_count", -1) if isinstance(sdata, dict) else -1
        err_count = sdata.get("error_count", -1) if isinstance(sdata, dict) else -1
        results = sdata.get("results", []) if isinstance(sdata, dict) else []
        first_status = (results[0] or {}).get("status") if results else None
        print(f"  -> Sync: total={sdata.get('total')} ok={ok_count} err={err_count} first.status={first_status}")
        assert ok_count == 1, f"Expected ok_count=1, got ok={ok_count} err={err_count} results={results}"
        new_exp = Expense.objects.filter(tour=tour, title__startswith="Offline").first()
        if new_exp:
            print(f"  -> Synced expense created in DB: id={new_exp.id} amount=${new_exp.amount} [{new_exp.category}]")
    except Exception as e:
        fail += 1
        print(f"  FAIL offline sync -> {e}")

    # =======================================================================
    # 10. DASHBOARD + TOUR LIST + PROFILE pages 200 sanity
    # =======================================================================
    print("\n[10] Pages sanity: Dashboard 200, Tours list 200, Profile 200...")
    for name, url in [
        ("Dashboard",   "/client/dashboard/"),
        ("My Tours",    "/client/tours/"),
        ("Profile",     "/client/profile/"),
        ("Notifications","/client/notifications/"),
    ]:
        r = djc.get(url)
        try:
            assert r.status_code == 200, f"{name} expected 200, got {r.status_code}"
            print(f"  -> {name} [{url}] 200 OK")
        except Exception as e:
            fail += 1
            print(f"  FAIL {name} -> {e}")

    print("\n" + "=" * 72)
    if fail == 0:
        print("=== TASK 15b SEED DEV: ALL 10 SECTIONS PASS ===")
        print(f"     - Users:       5 created")
        print(f"     - Tour:        '{tour.title}' id={tour.id}")
        print(f"     - Members:     {member_count}")
        print(f"     - Expenses:    {len(created_expenses) + 1} (4 seeded + 1 offline-synced)")
        print(f"     - Receipt:     uploaded + verified")
        print(f"     - Limit notif: Charlie limit_exceeded notifications = {Notification.objects.filter(recipient=charlie, type='limit_exceeded').count()}")
        print(f"     - Settlement:  HTML + API both 200")
        print(f"     - Analytics:   3x endpoints 200")
        print(f"     - Offline:     ok_count=1")
    else:
        print(f"=== TASK 15b SEED DEV FAILED: {fail} assertion(s) ===")
    print("=" * 72)
    return fail


if __name__ == "__main__":
    f = run_checks()
    sys.exit(0 if f == 0 else 1)
