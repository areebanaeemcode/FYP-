import time

from django.conf import settings
from django.http import HttpResponseRedirect, HttpResponse
from django.template.response import TemplateResponse
from django.urls import reverse
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from django.views import View

from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.tours.models import Tour
from apps.expenses.serializers import ExpenseCreateUpdateSerializer, ExpenseReadSerializer
from apps.expenses.models import Expense
from apps.expenses.limit_utils import check_expense_limits_for_tour

from apps.cores.middleware import (
    MAX_WRONG_ATTEMPTS,
    LOCKOUT_SECONDS,
    SESSION_PASSED_FLAG,
    SESSION_ATTEMPTS_KEY,
    SESSION_LOCKOUT_KEY,
)


class OfflinePendingExpenseSyncAPI(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        pending = request.data.get('pending') or request.data.get('items') or []
        if not isinstance(pending, list):
            return Response(
                {'detail': "Expected list of pending items under 'pending' key.", 'results': []},
                status=status.HTTP_400_BAD_REQUEST,
            )

        results = []
        for item in pending:
            client_id = None
            if isinstance(item, dict):
                client_id = item.get('client_id') or item.get('id')
                payload = item.get('payload') if isinstance(item.get('payload'), dict) else item
            else:
                payload = None
            if not isinstance(payload, dict):
                results.append({
                    'client_id': client_id,
                    'status': 'error',
                    'error': 'Pending item must be an object with payload dict.',
                })
                continue

            tour_id = payload.get('tour_id')
            if not tour_id:
                results.append({
                    'client_id': client_id,
                    'status': 'error',
                    'error': 'tour_id is required.',
                })
                continue

            try:
                tour = Tour.objects.get(pk=tour_id)
            except (Tour.DoesNotExist, TypeError, ValueError):
                results.append({
                    'client_id': client_id,
                    'status': 'error',
                    'tour_id': tour_id,
                    'error': 'Tour does not exist.',
                })
                continue

            if not tour.is_member(request.user):
                results.append({
                    'client_id': client_id,
                    'tour_id': tour_id,
                    'status': 'error',
                    'error': 'You are not a member of this tour.',
                })
                continue

            ser = ExpenseCreateUpdateSerializer(data=payload, context={'request': request})
            if not ser.is_valid():
                results.append({
                    'client_id': client_id,
                    'tour_id': tour_id,
                    'status': 'error',
                    'error': ser.errors,
                })
                continue

            try:
                e = ser.save()
            except Exception as ex:
                results.append({
                    'client_id': client_id,
                    'tour_id': tour_id,
                    'status': 'error',
                    'error': str(ex),
                })
                continue

            try:
                from apps.notifications.hooks import notify_new_expense
                notify_new_expense(e)
            except Exception:
                pass
            try:
                paid_by_id = getattr(e, 'paid_by_id', None)
                affected = list({paid_by_id} if paid_by_id else set())
                check_expense_limits_for_tour(tour, affected_users=list(affected))
            except Exception:
                pass

            try:
                full = (
                    Expense.objects.filter(pk=e.pk)
                    .select_related('tour', 'paid_by')
                    .prefetch_related('splits', 'splits__user', 'receipt')
                    .first()
                )
                read_ser = ExpenseReadSerializer(full, context={'request': request})
                exp_data = read_ser.data
            except Exception:
                exp_data = {'id': getattr(e, 'pk', None)}

            results.append({
                'client_id': client_id,
                'tour_id': tour_id,
                'status': 'ok',
                'expense_id': getattr(e, 'pk', None),
                'expense': exp_data,
            })

        ok_count = sum(1 for r in results if r.get('status') == 'ok')
        err_count = len(results) - ok_count
        return Response({
            'results': results,
            'total': len(results),
            'ok_count': ok_count,
            'error_count': err_count,
        }, status=status.HTTP_200_OK)


class AdminAccessPassGateView(View):
    template_name = "admin/access_pass_gate.html"

    def get(self, request, *args, **kwargs):
        lockout_until = request.session.get(SESSION_LOCKOUT_KEY, 0)
        remaining = 0
        if lockout_until:
            remaining = int(max(0, lockout_until - time.time()))
            if remaining <= 0:
                request.session.pop(SESSION_LOCKOUT_KEY, None)
                request.session.pop(SESSION_ATTEMPTS_KEY, None)
                lockout_until = 0

        attempts = request.session.get(SESSION_ATTEMPTS_KEY, 0)
        context = {
            "next": request.GET.get("next", "/admin/"),
            "error": None,
            "lockout_seconds": remaining,
            "attempts_used": attempts,
            "max_attempts": MAX_WRONG_ATTEMPTS,
            "attempts_left": max(0, MAX_WRONG_ATTEMPTS - attempts),
        }
        return TemplateResponse(request, self.template_name, context)

    def post(self, request, *args, **kwargs):
        lockout_until = request.session.get(SESSION_LOCKOUT_KEY, 0)
        if lockout_until and time.time() < lockout_until:
            remaining = int(lockout_until - time.time())
            mins = remaining // 60
            secs = remaining % 60
            context = {
                "next": request.POST.get("next", "/admin/"),
                "error": f"Too many attempts. Try again in {mins:02d}:{secs:02d}.",
                "lockout_seconds": remaining,
                "attempts_used": MAX_WRONG_ATTEMPTS,
                "max_attempts": MAX_WRONG_ATTEMPTS,
                "attempts_left": 0,
            }
            resp = TemplateResponse(request, self.template_name, context)
            resp.status_code = 429
            return resp

        submitted = request.POST.get("access_pass", "")
        expected = getattr(settings, "ADMIN_ACCESS_PASS", None) or "FYP-ADMIN-2026"
        next_url = request.POST.get("next", "/admin/")
        if not next_url or not next_url.startswith("/"):
            next_url = "/admin/"

        if submitted == expected:
            request.session[SESSION_PASSED_FLAG] = True
            request.session.pop(SESSION_ATTEMPTS_KEY, None)
            request.session.pop(SESSION_LOCKOUT_KEY, None)
            return HttpResponseRedirect(next_url)

        attempts = request.session.get(SESSION_ATTEMPTS_KEY, 0) + 1
        request.session[SESSION_ATTEMPTS_KEY] = attempts

        error_msg = "Incorrect access pass."
        status_code = 200
        lockout_remaining = 0

        if attempts >= MAX_WRONG_ATTEMPTS:
            lockout_until_new = time.time() + LOCKOUT_SECONDS
            request.session[SESSION_LOCKOUT_KEY] = lockout_until_new
            mins = LOCKOUT_SECONDS // 60
            secs = LOCKOUT_SECONDS % 60
            error_msg = f"Too many incorrect attempts. Locked out for {mins:02d}:{secs:02d}."
            status_code = 429
            lockout_remaining = LOCKOUT_SECONDS

        context = {
            "next": next_url,
            "error": error_msg,
            "lockout_seconds": lockout_remaining,
            "attempts_used": attempts,
            "max_attempts": MAX_WRONG_ATTEMPTS,
            "attempts_left": max(0, MAX_WRONG_ATTEMPTS - attempts),
        }
        resp = TemplateResponse(request, self.template_name, context)
        resp.status_code = status_code
        return resp
