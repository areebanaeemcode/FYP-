(function () {
    document.addEventListener('DOMContentLoaded', function () {
        const api = window.PTApi;
        if (api && typeof api.requireAuthRedirect === 'function') {
            api.requireAuthRedirect();
        } else if (!api || !api.isAuthenticated()) {
            window.location.href = '/login/';
            return;
        }

        const form = document.getElementById('joinTourForm');
        const input = document.getElementById('joinTokenInput');

        if (!form || !input) return;

        const submitBtn = document.getElementById('joinSubmitBtn');

        form.addEventListener('submit', async function (e) {
            e.preventDefault();
            api.showMessageBox('', 'clear');

            const raw = (input.value || '').trim();
            if (!raw) {
                api.showMessageBox('Please paste the join link or token.', 'error');
                return;
            }

            let token = raw;
            if (/^https?:\/\//i.test(token) || token.startsWith('/')) {
                token = token.replace(/\/+$/, '').split('/').pop() || '';
            }
            token = token.trim();

            if (!token) {
                api.showMessageBox('Could not parse the join link. Please paste it again.', 'error');
                return;
            }

            let origText = '';
            if (submitBtn) {
                origText = submitBtn.textContent;
                submitBtn.disabled = true;
                submitBtn.textContent = 'Joining Tour...';
            }

            try {
                const url = '/client/tours/api/join/' + encodeURIComponent(token) + '/';
                const res = await api.apiFetch(url, { method: 'POST', body: {} });
                if (!res.ok || !res.data) {
                    const msg = (res.data && (res.data.detail || (res.data.join_token && res.data.join_token[0]))) || 'Could not join tour.';
                    api.showMessageBox(msg, 'error');
                    if (submitBtn) {
                        submitBtn.disabled = false;
                        submitBtn.textContent = origText;
                    }
                    return;
                }
                api.showMessageBox(res.data.detail || 'Joined tour!', 'success');
                const tour = res.data.tour;
                setTimeout(function () {
                    if (tour && tour.id) {
                        window.location.href = '/client/tours/' + tour.id + '/';
                    } else {
                        window.location.href = '/client/tours/';
                    }
                }, 800);
            } catch (err) {
                api.showMessageBox('Unexpected error occurred. Please try again.', 'error');
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.textContent = origText;
                }
            }
        });
    });
})();
