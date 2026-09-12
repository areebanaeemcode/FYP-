(function () {
    let nextPageURL = null;
    let previousPageURL = null;
    let currentPage = 1;
    let currentSearchQuery = '';
    let searchDebounceTimer = null;

    function formatDate(v) {
        if (!v) return '—';
        return String(v).slice(0, 10);
    }

    function money(n) {
        const v = Number(n || 0);
        return 'Rs. ' + v.toFixed(2);
    }

    function statusClass(s) {
        if (s === 'planned') return 'bg-blue-100 text-blue-700';
        if (s === 'ongoing') return 'bg-amber-100 text-amber-700';
        if (s === 'completed') return 'bg-emerald-100 text-emerald-700';
        if (s === 'cancelled') return 'bg-rose-100 text-rose-700';
        return 'bg-slate-100 text-slate-700';
    }

    function cap(s) {
        if (!s) return '—';
        return s.charAt(0).toUpperCase() + s.slice(1);
    }

    async function loadTours(url, search) {
        const api = window.PTApi;
        if (!api || !api.isAuthenticated()) {
            window.location.href = '/login/';
            return;
        }

        if (typeof search === 'string') {
            currentSearchQuery = search;
        }

        const loading = document.getElementById('loading');
        const container = document.getElementById('toursContainer');
        const empty = document.getElementById('emptyState');
        const tbody = document.getElementById('toursTableBody');
        const resultCount = document.getElementById('searchResultCount');
        const emptyIcon = document.getElementById('emptyStateIcon');
        const emptyTitle = document.getElementById('emptyStateTitle');
        const emptyDesc = document.getElementById('emptyStateDesc');
        const emptyAction = document.getElementById('emptyStateAction');

        if (loading) loading.classList.remove('hidden');
        if (container) container.classList.add('hidden');
        if (empty) empty.classList.add('hidden');

        let target = url;
        if (!target) {
            target = '/client/tours/api/?page=' + currentPage;
            if (currentSearchQuery) {
                target += '&search=' + encodeURIComponent(currentSearchQuery);
            }
        }

        const res = await api.apiFetch(target, { method: 'GET' });

        if (loading) loading.classList.add('hidden');

        if (!res.ok || !res.data) {
            if (window.PTApi && window.PTApi.showMessageBox) {
                window.PTApi.showMessageBox(
                    res && res.networkError ? 'Network error. Please try again.' : 'Unable to load tours.',
                    'error'
                );
            }
            return;
        }

        const payload = res.data;
        const tours = Array.isArray(payload) ? payload : (payload.results || []);
        nextPageURL = payload.next || null;
        previousPageURL = payload.previous || null;

        if (currentSearchQuery) {
            const count = typeof payload.count === 'number' ? payload.count : tours.length;
            if (resultCount) {
                resultCount.textContent = `Found ${count} tour${count === 1 ? '' : 's'}`;
                resultCount.classList.remove('hidden');
            }
        } else {
            if (resultCount) resultCount.classList.add('hidden');
        }

        if (!tours.length) {
            if (empty) {
                if (currentSearchQuery) {
                    if (emptyIcon) emptyIcon.innerHTML = '<i class="fa-solid fa-magnifying-glass"></i>';
                    if (emptyTitle) emptyTitle.textContent = 'No Matching Tours';
                    if (emptyDesc) emptyDesc.textContent = `No tours found matching "${currentSearchQuery}". Try a different keyword or reset your search.`;
                    if (emptyAction) {
                        emptyAction.innerHTML = `
                            <button type="button" id="resetSearchFromEmptyBtn" class="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 rounded-2xl font-black transition btn-ripple shadow-xl shadow-indigo-500/30 text-lg cursor-pointer">
                                <i class="fa-solid fa-rotate-left"></i> Clear Search
                            </button>
                        `;
                        const resetBtn = document.getElementById('resetSearchFromEmptyBtn');
                        if (resetBtn) {
                            resetBtn.addEventListener('click', function () {
                                const input = document.getElementById('tourSearchInput');
                                const clearBtn = document.getElementById('clearSearchBtn');
                                if (input) input.value = '';
                                if (clearBtn) clearBtn.classList.add('hidden');
                                currentPage = 1;
                                loadTours(null, '');
                            });
                        }
                    }
                } else {
                    if (emptyIcon) emptyIcon.innerHTML = '<i class="fa-solid fa-plane"></i>';
                    if (emptyTitle) emptyTitle.textContent = 'No Tours Found';
                    if (emptyDesc) emptyDesc.textContent = "You haven't created any tours yet. Let's start your first adventure together!";
                    if (emptyAction) {
                        emptyAction.innerHTML = `
                            <a href="/client/tours/create/" class="inline-block bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 text-white px-10 py-5 rounded-2xl font-black transition btn-ripple shadow-2xl shadow-indigo-500/50 btn-tilt-3d text-xl flex items-center justify-center gap-2 max-w-xs mx-auto">
                                <i class="fa-solid fa-plus"></i> Create Your First Tour
                            </a>
                        `;
                    }
                }
                empty.classList.remove('hidden');
            }
            return;
        }

        if (container) container.classList.remove('hidden');
        if (!tbody) return;

        tbody.innerHTML = '';
        tours.forEach(function (t) {
            const spent = Number(t.total_spent || 0);
            const budget = Number(t.budget || 0);
            const pct = budget > 0 ? Math.min(100, Math.round((spent / budget) * 100)) : 0;
            const row = document.createElement('tr');
            row.className = 'hover:bg-slate-50 transition border-b';
            row.innerHTML = `
                <td class="px-6 py-4">
                    <div class="font-semibold text-slate-800">${t.title || ''}</div>
                    <div class="text-sm text-slate-500 mt-1">${(t.description || '').toString().slice(0, 80) || 'No description'}</div>
                </td>
                <td class="px-6 py-4 text-slate-600">${t.destination || '—'}</td>
                <td class="px-6 py-4">
                    <div class="font-semibold text-slate-700">${money(t.budget)}</div>
                    <div class="text-xs text-slate-500 mt-1">Spent ${money(spent)} (${pct}%)</div>
                    <div class="w-full bg-slate-100 h-2 rounded-full mt-2 overflow-hidden">
                        <div class="h-full ${pct > 100 ? 'bg-rose-500' : (pct > 80 ? 'bg-amber-500' : 'bg-emerald-500')}" style="width: ${Math.min(100, pct)}%"></div>
                    </div>
                </td>
                <td class="px-6 py-4 text-slate-600">${formatDate(t.start_date)}</td>
                <td class="px-6 py-4 text-slate-600">${formatDate(t.end_date)}</td>
                <td class="px-6 py-4 text-slate-600">${t.member_count || 1}</td>
                <td class="px-6 py-4">
                    <span class="px-3 py-1 rounded-full text-sm font-semibold ${statusClass(t.status)}">${cap(t.status)}</span>
                </td>
                <td class="px-6 py-4">
                    <div class="flex gap-2 flex-wrap">
                        <a href="/client/tours/${t.id}/" class="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition shadow-sm flex items-center gap-1.5">
                            <i class="fa-solid fa-arrow-right"></i> View
                        </a>
                    </div>
                </td>
            `;
            tbody.appendChild(row);
        });

        updatePagination();
    }

    function updatePagination() {
        const prev = document.getElementById('previousBtn');
        const next = document.getElementById('nextBtn');
        const info = document.getElementById('pageInfo');
        if (prev) prev.disabled = !previousPageURL;
        if (next) next.disabled = !nextPageURL;
        if (info) info.textContent = 'Page ' + currentPage;
    }

    async function joinByToken(token) {
        const api = window.PTApi;
        if (!token) {
            api.showMessageBox('Please enter a join token or link.', 'error');
            return;
        }
        const url = '/client/tours/api/join/';
        const res = await api.apiFetch(url, {
            method: 'POST',
            contentType: 'application/json',
            body: JSON.stringify({ join_token: token }),
        });
        if (!res.ok || !res.data) {
            const msg = (res.data && (res.data.detail || (res.data.join_token && res.data.join_token[0]))) || 'Could not join tour.';
            api.showMessageBox(msg, 'error');
            return;
        }
        const tour = res.data.tour;
        if (res.data.already_member) {
            api.showMessageBox('You are already a member/creator of this tour. To add a new member, share this code with another user or friend!', 'info');
        } else {
            api.showMessageBox(res.data.detail || 'Joined tour!', 'success');
        }
        setTimeout(function () {
            if (tour && tour.id) {
                window.location.href = '/client/tours/' + tour.id + '/';
            } else {
                loadTours();
            }
        }, 800);
    }

    document.addEventListener('DOMContentLoaded', function () {
        const api = window.PTApi;

        // Modal wiring for Join Tour
        const modal = document.getElementById('joinTourModal');
        const openModalBtn = document.getElementById('openJoinTourBtnList');
        const closeModalBtn = document.getElementById('joinTourModalCloseBtn');
        const modalBackdrop = document.getElementById('joinTourModalBackdrop');
        const modalInput = document.getElementById('joinModalTokenInput');
        const modalSubmit = document.getElementById('joinModalSubmitBtn');
        const modalErrors = document.getElementById('joinModalErrors');

        function openModal() {
            if (modal) {
                modal.classList.remove('hidden');
                if (modalErrors) modalErrors.classList.add('hidden');
                setTimeout(function () { if (modalInput) modalInput.focus(); }, 40);
            }
        }
        function closeModal() {
            if (modal) modal.classList.add('hidden');
        }

        if (openModalBtn) openModalBtn.addEventListener('click', openModal);
        if (closeModalBtn) closeModalBtn.addEventListener('click', closeModal);
        if (modalBackdrop) modalBackdrop.addEventListener('click', closeModal);
        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape' && modal && !modal.classList.contains('hidden')) closeModal();
        });

        if (modalSubmit) {
            modalSubmit.addEventListener('click', function () {
                const code = (modalInput ? modalInput.value : '').trim();
                if (!code) {
                    if (modalErrors) {
                        modalErrors.textContent = 'Please enter a join code.';
                        modalErrors.classList.remove('hidden');
                    }
                    return;
                }
                modalSubmit.disabled = true;
                const orig = modalSubmit.textContent;
                modalSubmit.textContent = 'Joining...';
                joinByToken(code);
                setTimeout(function () {
                    modalSubmit.disabled = false;
                    modalSubmit.textContent = orig;
                }, 2000);
            });
        }
        if (modalInput) {
            modalInput.addEventListener('keydown', function (e) {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    if (modalSubmit) modalSubmit.click();
                }
            });
        }

        // Tour Search Bar Wiring
        const searchInput = document.getElementById('tourSearchInput');
        const clearSearchBtn = document.getElementById('clearSearchBtn');

        function triggerSearch(q) {
            currentPage = 1;
            loadTours(null, q);
        }

        function clearSearch() {
            if (searchInput) {
                searchInput.value = '';
                searchInput.focus();
            }
            if (clearSearchBtn) clearSearchBtn.classList.add('hidden');
            const resultCount = document.getElementById('searchResultCount');
            if (resultCount) resultCount.classList.add('hidden');
            triggerSearch('');
        }

        if (searchInput) {
            searchInput.addEventListener('input', function () {
                const val = searchInput.value.trim();
                if (clearSearchBtn) {
                    if (val) {
                        clearSearchBtn.classList.remove('hidden');
                    } else {
                        clearSearchBtn.classList.add('hidden');
                    }
                }
                clearTimeout(searchDebounceTimer);
                searchDebounceTimer = setTimeout(function () {
                    triggerSearch(val);
                }, 250);
            });

            searchInput.addEventListener('keydown', function (e) {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    clearTimeout(searchDebounceTimer);
                    triggerSearch(searchInput.value.trim());
                } else if (e.key === 'Escape') {
                    clearSearch();
                }
            });
        }

        if (clearSearchBtn) {
            clearSearchBtn.addEventListener('click', clearSearch);
        }

        if (api && typeof api.requireAuthRedirect === 'function') {
            api.requireAuthRedirect();
        } else if (!api || !api.isAuthenticated()) {
            window.location.href = '/login/';
            return;
        }

        loadTours();

        const prev = document.getElementById('previousBtn');
        const next = document.getElementById('nextBtn');
        if (prev) prev.addEventListener('click', function () {
            if (!previousPageURL) return;
            currentPage = Math.max(1, currentPage - 1);
            loadTours(previousPageURL);
        });
        if (next) next.addEventListener('click', function () {
            if (!nextPageURL) return;
            currentPage++;
            loadTours(nextPageURL);
        });
    });
})();
