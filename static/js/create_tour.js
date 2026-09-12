(function () {
    function collectBody() {
        const tokenInput = document.getElementById('join_token');
        const token = tokenInput ? (tokenInput.value || '').trim() : '';
        const body = {
            title: (document.getElementById('title').value || '').trim(),
            destination: (document.getElementById('destination').value || '').trim(),
            description: (document.getElementById('description').value || '').trim(),
            budget: document.getElementById('budget').value,
            start_date: document.getElementById('start_date').value,
            end_date: document.getElementById('end_date').value,
            status: document.getElementById('status').value || 'planned',
        };
        if (token) {
            body.join_token = token;
        }
        return body;
    }

    document.addEventListener('DOMContentLoaded', function () {
        const api = window.PTApi;
        if (api && typeof api.requireAuthRedirect === 'function') {
            api.requireAuthRedirect();
        } else if (!api || !api.isAuthenticated()) {
            window.location.href = '/login/';
            return;
        }

        const form = document.getElementById('createTourForm');
        const btn = document.getElementById('createTourBtn');

        if (!form) return;

        const modal = document.getElementById('tourCreatedSuccessModal');
        const modalTitle = document.getElementById('createdTourModalTitle');
        const tourNamePreview = document.getElementById('createdTourNamePreview');
        const tourDestPreview = document.getElementById('createdTourDestPreview');
        const joinLinkInput = document.getElementById('createdTourJoinLinkInput');
        const copyLinkBtn = document.getElementById('copyCreatedTourLinkBtn');
        const copyBtnIcon = document.getElementById('copyBtnIcon');
        const copyBtnText = document.getElementById('copyBtnText');
        const whatsappBtn = document.getElementById('shareCreatedTourWhatsappBtn');
        const viewTourBtn = document.getElementById('viewCreatedTourBtn');
        const createAnotherBtn = document.getElementById('createAnotherTourBtn');
        const modalBackdrop = document.getElementById('modalBackdrop');

        let createdTourId = null;
        let createdJoinLink = '';
        let createdJoinToken = '';

        const copyFullLinkBtn = document.getElementById('copyCreatedTourFullLinkBtn');

        function showSuccessModal(tourData) {
            createdTourId = tourData.id;
            createdJoinToken = tourData.join_token || '';
            const relLink = tourData.join_link || ('/client/tours/join/' + (createdJoinToken || '') + '/');
            createdJoinLink = window.location.origin + relLink;

            if (tourNamePreview) tourNamePreview.textContent = tourData.title || 'New Tour';
            if (tourDestPreview) tourDestPreview.textContent = tourData.destination || 'N/A';
            if (joinLinkInput) {
                joinLinkInput.value = createdJoinToken || createdJoinLink;
                joinLinkInput.dataset.token = createdJoinToken;
                joinLinkInput.dataset.link = createdJoinLink;
            }

            if (whatsappBtn) {
                const message = encodeURIComponent(
                    `Hey! Join my tour "${tourData.title}" on PayTogether using 6-Digit Join Code: ${createdJoinToken}`
                );
                whatsappBtn.href = `https://api.whatsapp.com/send?text=${message}`;
            }

            if (copyBtnText) copyBtnText.textContent = 'Copy Join Code';
            if (copyBtnIcon) copyBtnIcon.innerHTML = '<i class="fa-solid fa-copy"></i>';

            if (modal) {
                modal.classList.remove('hidden');
                document.body.classList.add('overflow-hidden');
            }
        }

        function hideSuccessModal() {
            if (modal) {
                modal.classList.add('hidden');
                document.body.classList.remove('overflow-hidden');
            }
        }

        if (copyLinkBtn) {
            copyLinkBtn.addEventListener('click', async function () {
                const textToCopy = createdJoinToken || createdJoinLink;
                if (!textToCopy) return;
                try {
                    if (navigator.clipboard && navigator.clipboard.writeText) {
                        await navigator.clipboard.writeText(textToCopy);
                    } else if (joinLinkInput) {
                        joinLinkInput.select();
                        document.execCommand('copy');
                    }
                    if (copyBtnText) copyBtnText.textContent = 'Copied Code!';
                    if (copyBtnIcon) copyBtnIcon.innerHTML = '<i class="fa-solid fa-check"></i>';
                    copyLinkBtn.classList.remove('from-emerald-600', 'to-teal-600');
                    copyLinkBtn.classList.add('from-emerald-500', 'to-green-500');

                    if (window.PTApi && typeof window.PTApi.showMessageBox === 'function') {
                        window.PTApi.showMessageBox('Join Code copied: ' + textToCopy, 'success');
                    }

                    setTimeout(function () {
                        if (copyBtnText) copyBtnText.textContent = 'Copy Join Code';
                        if (copyBtnIcon) copyBtnIcon.innerHTML = '<i class="fa-solid fa-copy"></i>';
                        copyLinkBtn.classList.remove('from-emerald-500', 'to-green-500');
                        copyLinkBtn.classList.add('from-emerald-600', 'to-teal-600');
                    }, 2500);
                } catch (e) {
                    prompt('Copy this join code:', textToCopy);
                }
            });
        }

        if (copyFullLinkBtn) {
            copyFullLinkBtn.addEventListener('click', async function () {
                if (!createdJoinLink) return;
                try {
                    if (navigator.clipboard && navigator.clipboard.writeText) {
                        await navigator.clipboard.writeText(createdJoinLink);
                    }
                    if (window.PTApi && typeof window.PTApi.showMessageBox === 'function') {
                        window.PTApi.showMessageBox('Tour full link copied!', 'success');
                    }
                    copyFullLinkBtn.innerHTML = '<i class="fa-solid fa-check"></i> Copied Full URL!';
                    setTimeout(function () {
                        copyFullLinkBtn.innerHTML = '<i class="fa-solid fa-link"></i> Copy Full URL';
                    }, 2000);
                } catch (_) {
                    prompt('Copy this tour join link:', createdJoinLink);
                }
            });
        }

        if (viewTourBtn) {
            viewTourBtn.addEventListener('click', function () {
                if (createdTourId) {
                    window.location.href = '/client/tours/' + createdTourId + '/';
                } else {
                    window.location.href = '/client/tours/';
                }
            });
        }

        if (createAnotherBtn) {
            createAnotherBtn.addEventListener('click', function () {
                hideSuccessModal();
                form.reset();
                window.scrollTo({ top: 0, behavior: 'smooth' });
            });
        }

        if (modalBackdrop) {
            modalBackdrop.addEventListener('click', function () {
                if (createdTourId) {
                    window.location.href = '/client/tours/' + createdTourId + '/';
                } else {
                    hideSuccessModal();
                }
            });
        }

        form.addEventListener('submit', async function (e) {
            e.preventDefault();
            api.showMessageBox('', 'clear');
            const body = collectBody();

            if (!body.title) {
                api.displayErrorsBox({ title: ['Tour name is required.'] });
                return;
            }

            btn.disabled = true;
            const originalText = btn.textContent || 'Save Tour';
            btn.textContent = 'Creating Tour...';

            try {
                const res = await api.apiFetch('/client/tours/api/create/', {
                    method: 'POST',
                    body: body,
                });
                if (res.ok && res.data && res.data.id) {
                    api.showMessageBox('Tour created successfully! 6-digit Join Code generated.', 'success');
                    showSuccessModal(res.data);
                    return;
                }
                if (res && res.data) {
                    api.displayErrorsBox(res.data);
                } else if (res && res.networkError) {
                    api.showMessageBox('Network error. Please try again.', 'error');
                } else {
                    api.showMessageBox('Unable to create tour. Please try again.', 'error');
                }
            } catch (err) {
                api.showMessageBox('Unexpected error. Please try again.', 'error');
            } finally {
                btn.disabled = false;
                btn.textContent = originalText;
            }
        });
    });
})();
