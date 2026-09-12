import time
from django.conf import settings
from django.http import HttpResponseRedirect, HttpResponse
from django.urls import reverse
from django.utils.html import escape


GATE_URL_PATH = "/admin/access-pass/"
MAX_WRONG_ATTEMPTS = 5
LOCKOUT_SECONDS = 15 * 60
SESSION_PASSED_FLAG = "admin_access_passed_v1"
SESSION_ATTEMPTS_KEY = "_admin_pass_wrong_attempts"
SESSION_LOCKOUT_KEY = "_admin_pass_lockout_until"


class AdminAccessPassMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        path = request.path

        if not path.lower().startswith("/admin/"):
            return self.get_response(request)

        if path.startswith(GATE_URL_PATH):
            return self.get_response(request)

        if request.session.get(SESSION_PASSED_FLAG) is True:
            return self.get_response(request)

        lockout_until = request.session.get(SESSION_LOCKOUT_KEY, 0)
        if lockout_until and time.time() < lockout_until:
            remaining = int(lockout_until - time.time())
            return HttpResponse(
                self._render_lockout_page(remaining),
                status=429,
                content_type="text/html; charset=utf-8",
            )

        next_url = request.get_full_path()
        gate_url = f"{reverse('admin-access-pass-gate')}?next={escape(next_url)}"
        return HttpResponseRedirect(gate_url)

    def _render_lockout_page(self, remaining_seconds):
        mins = remaining_seconds // 60
        secs = remaining_seconds % 60
        return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Admin Access Locked</title>
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <style>
    body {{ font-family: system-ui, -apple-system, sans-serif; background: #0f172a; color: #e2e8f0; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; }}
    .card {{ background: #1e293b; border: 1px solid #334155; border-radius: 12px; padding: 32px 40px; max-width: 420px; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.4); text-align: center; }}
    h1 {{ font-size: 20px; margin: 0 0 12px; color: #f87171; }}
    p {{ margin: 8px 0; line-height: 1.5; color: #cbd5e1; }}
    .countdown {{ font-size: 32px; font-weight: 700; margin: 16px 0 4px; color: #fbbf24; }}
  </style>
</head>
<body>
  <div class="card">
    <h1>Access Temporarily Locked</h1>
    <p>Too many incorrect access pass attempts.</p>
    <div class="countdown">{mins:02d}:{secs:02d}</div>
    <p>Please wait before trying again.</p>
  </div>
</body>
</html>"""
