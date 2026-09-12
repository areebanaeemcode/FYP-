(function () {
    'use strict';

    var usersData = [];
    var toursData = [];
    var currentFilter = 'all';
    var currentTourFilter = 'all';
    var searchTimeout = null;

    // Mobile nav drawer
    window.toggleMobileNav = function (open) {
        var d = document.getElementById('mobileNavDrawer');
        if (!d) return;
        if (open) {
            d.classList.remove('hidden');
            document.body.classList.add('overflow-hidden');
        } else {
            d.classList.add('hidden');
            document.body.classList.remove('overflow-hidden');
        }
    };

    // Tab switching
    window.switchAdminTab = function (tabName) {
        var usersTab = document.getElementById('tabContentUsers');
        var toursTab = document.getElementById('tabContentTours');
        var securityTab = document.getElementById('tabContentSecurity');

        var btnUsers = document.getElementById('tabBtnUsers');
        var btnTours = document.getElementById('tabBtnTours');
        var btnSecurity = document.getElementById('tabBtnSecurity');

        var sBtnUsers = document.getElementById('sidebarBtnUsers');
        var sBtnTours = document.getElementById('sidebarBtnTours');
        var sBtnSecurity = document.getElementById('sidebarBtnSecurity');

        if (!usersTab || !toursTab || !securityTab) return;

        usersTab.classList.add('hidden');
        toursTab.classList.add('hidden');
        securityTab.classList.add('hidden');

        [btnUsers, btnTours, btnSecurity].forEach(function (btn) {
            if (btn) {
                btn.className = "px-5 py-2.5 rounded-2xl font-bold text-sm transition cursor-pointer bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 flex items-center gap-2 whitespace-nowrap";
            }
        });

        var sInactive = "w-full flex items-center px-4 py-3 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/60 font-medium rounded-xl transition cursor-pointer text-left";
        var sActive = "w-full flex items-center px-4 py-3 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 font-bold rounded-xl border-l-4 border-amber-500 transition cursor-pointer text-left";

        [sBtnUsers, sBtnTours, sBtnSecurity].forEach(function (btn) {
            if (btn) btn.className = sInactive;
        });

        if (tabName === 'users') {
            usersTab.classList.remove('hidden');
            if (btnUsers) btnUsers.className = "px-5 py-2.5 rounded-2xl font-black text-sm transition cursor-pointer bg-indigo-600 text-white shadow-sm flex items-center gap-2 whitespace-nowrap";
            if (sBtnUsers) sBtnUsers.className = sActive;
        } else if (tabName === 'tours') {
            toursTab.classList.remove('hidden');
            if (btnTours) btnTours.className = "px-5 py-2.5 rounded-2xl font-black text-sm transition cursor-pointer bg-indigo-600 text-white shadow-sm flex items-center gap-2 whitespace-nowrap";
            if (sBtnTours) sBtnTours.className = sActive;
            if (toursData.length === 0) loadTours();
        } else if (tabName === 'security') {
            securityTab.classList.remove('hidden');
            if (btnSecurity) btnSecurity.className = "px-5 py-2.5 rounded-2xl font-black text-sm transition cursor-pointer bg-indigo-600 text-white shadow-sm flex items-center gap-2 whitespace-nowrap";
            if (sBtnSecurity) sBtnSecurity.className = sActive;
        }
    };

    // Toast message
    window.showAdminToast = function (msg, type) {
        var box = document.getElementById('adminToastBox');
        if (!box) return;
        var bg = type === 'success' ? 'bg-emerald-50 text-emerald-800 border-emerald-300' : 'bg-rose-50 text-rose-800 border-rose-300';
        var icon = type === 'success' ? 'fa-check-circle text-emerald-600' : 'fa-triangle-exclamation text-rose-600';
        box.innerHTML = '<div class="p-4 rounded-2xl border ' + bg + ' flex items-center justify-between gap-3 shadow-xs animate-fade-in"><div class="flex items-center gap-2.5 font-bold text-sm"><i class="fa-solid ' + icon + ' text-base"></i> ' + msg + '</div><button onclick="this.parentElement.remove()" class="text-xs font-bold opacity-70 hover:opacity-100 cursor-pointer">✕</button></div>';
        setTimeout(function () {
            if (box.firstChild) box.innerHTML = '';
        }, 3500);
    };

    function money(val) {
        return 'Rs. ' + Number(val || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }

    // Load Stats
    function loadStats() {
        if (!window.PTApi) return;
        window.PTApi.get('/client/admin/api/stats/').then(function (res) {
            if (res && res.users) {
                var elUsers = document.getElementById('kpiTotalUsers');
                var elActiveUsers = document.getElementById('kpiActiveUsers');
                var elTours = document.getElementById('kpiTotalTours');
                var elSpend = document.getElementById('kpiTotalSpend');
                var elExpenses = document.getElementById('kpiTotalExpenses');

                if (elUsers) elUsers.textContent = res.users.total;
                var sbUsers = document.getElementById('sidebarCountUsers');
                if (sbUsers) sbUsers.textContent = res.users.total;
                if (elActiveUsers) elActiveUsers.textContent = res.users.active + ' active';
                if (elTours) elTours.textContent = res.tours.total;
                var sbTours = document.getElementById('sidebarCountTours');
                if (sbTours) sbTours.textContent = res.tours.total;
                if (elSpend) elSpend.textContent = money(res.financials.total_spend);
                if (elExpenses) elExpenses.textContent = res.financials.total_expenses;
            }
        }).catch(function (err) {
            console.warn('Failed to fetch admin stats:', err);
        });
    }

    // Load Users
    function loadUsers() {
        var tbody = document.getElementById('usersTableBody');
        if (!tbody) return;

        var q = document.getElementById('userSearchInput') ? document.getElementById('userSearchInput').value.trim() : '';
        var url = '/client/admin/api/users/?filter=' + encodeURIComponent(currentFilter) + '&q=' + encodeURIComponent(q);

        window.PTApi.get(url).then(function (res) {
            usersData = (res && res.users) ? res.users : [];
            var countEl = document.getElementById('tabCountUsers');
            if (countEl) countEl.textContent = usersData.length;
            renderUsersTable(usersData);
        }).catch(function (err) {
            tbody.innerHTML = '<tr><td colspan="7" class="px-6 py-8 text-center text-rose-500">Failed to load users list.</td></tr>';
        });
    }

    function renderUsersTable(users) {
        var tbody = document.getElementById('usersTableBody');
        if (!tbody) return;

        if (users.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="px-6 py-12 text-center text-slate-400">No users found matching query.</td></tr>';
            return;
        }

        var html = '';
        users.forEach(function (u) {
            var initials = (u.first_name ? u.first_name.charAt(0) : '') + (u.last_name ? u.last_name.charAt(0) : '');
            if (!initials) initials = u.email ? u.email.charAt(0).toUpperCase() : 'U';

            var statusBadge = u.is_active
                ? '<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"><i class="fa-solid fa-circle text-[6px] mr-1.5 text-emerald-500"></i> Active</span>'
                : '<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800"><i class="fa-solid fa-circle text-[6px] mr-1.5 text-rose-500"></i> Suspended</span>';

            var roleBadge = u.is_superuser
                ? '<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-black bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300"><i class="fa-solid fa-crown mr-1 text-amber-500"></i> Super Admin</span>'
                : (u.is_staff
                    ? '<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200"><i class="fa-solid fa-shield-halved mr-1 text-indigo-500"></i> Staff</span>'
                    : '<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">Member</span>');

            var actionBtn = '';
            if (!u.is_current_user) {
                var toggleStatusText = u.is_active ? 'Suspend' : 'Activate';
                var toggleStatusClass = u.is_active ? 'text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40' : 'text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40';
                actionBtn += '<button onclick="toggleUserStatus(' + u.id + ')" class="px-3 py-1.5 rounded-xl font-bold text-xs transition ' + toggleStatusClass + '">' + toggleStatusText + '</button>';

                var toggleRoleText = u.is_staff ? 'Revoke Staff' : 'Make Staff';
                actionBtn += '<button onclick="toggleUserRole(' + u.id + ')" class="px-3 py-1.5 rounded-xl font-bold text-xs text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition">' + toggleRoleText + '</button>';
            } else {
                actionBtn = '<span class="text-xs text-slate-400 font-bold italic">Current User</span>';
            }

            html += '<tr class="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition">';
            html += '<td class="px-6 py-4"><div class="flex items-center gap-3"><div class="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 text-white font-black text-xs flex items-center justify-center shadow-xs shrink-0">' + initials + '</div><div><p class="font-bold text-slate-900 dark:text-white leading-tight">' + (u.full_name || 'No Name') + '</p><p class="text-xs text-slate-400 mt-0.5">Joined ' + u.created_at + '</p></div></div></td>';
            html += '<td class="px-6 py-4"><p class="font-mono text-xs text-slate-700 dark:text-slate-300">' + u.email + '</p><p class="text-xs text-slate-400 mt-0.5">' + (u.phone_number || '—') + '</p></td>';
            html += '<td class="px-6 py-4 font-bold text-slate-800 dark:text-slate-200">' + u.tours_count + ' tours</td>';
            html += '<td class="px-6 py-4 font-bold text-slate-800 dark:text-slate-200">' + money(u.total_paid) + '</td>';
            html += '<td class="px-6 py-4">' + roleBadge + '</td>';
            html += '<td class="px-6 py-4">' + statusBadge + '</td>';
            html += '<td class="px-6 py-4 text-right space-x-1 whitespace-nowrap">' + actionBtn + '</td>';
            html += '</tr>';
        });

        tbody.innerHTML = html;
    }

    // Toggle user status (suspend/activate)
    window.toggleUserStatus = function (userId) {
        if (!confirm('Are you sure you want to change this user\'s account active status?')) return;
        window.PTApi.post('/client/admin/api/users/' + userId + '/toggle-status/').then(function (res) {
            window.showAdminToast(res.message || 'Status updated', 'success');
            loadUsers();
            loadStats();
        }).catch(function (err) {
            var msg = err.responseJSON ? (err.responseJSON.detail || err.responseJSON.message) : 'Action failed';
            window.showAdminToast(msg, 'error');
        });
    };

    // Toggle user role (staff promote/demote)
    window.toggleUserRole = function (userId) {
        if (!confirm('Are you sure you want to toggle staff/admin permissions for this user?')) return;
        window.PTApi.post('/client/admin/api/users/' + userId + '/toggle-role/').then(function (res) {
            window.showAdminToast(res.message || 'Role updated', 'success');
            loadUsers();
            loadStats();
        }).catch(function (err) {
            var msg = err.responseJSON ? (err.responseJSON.detail || err.responseJSON.message) : 'Action failed';
            window.showAdminToast(msg, 'error');
        });
    };

    // User filters
    window.filterUsers = function (f) {
        currentFilter = f;
        document.querySelectorAll('.user-filter-btn').forEach(function (btn) {
            if (btn.getAttribute('data-filter') === f) {
                btn.className = "user-filter-btn px-4 py-2 rounded-xl text-xs font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800";
            } else {
                btn.className = "user-filter-btn px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-200";
            }
        });
        loadUsers();
    };

    window.debounceUserSearch = function () {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(loadUsers, 300);
    };

    // Load Tours
    function loadTours() {
        var tbody = document.getElementById('toursTableBody');
        if (!tbody) return;

        var q = document.getElementById('tourSearchInput') ? document.getElementById('tourSearchInput').value.trim() : '';
        var url = '/client/admin/api/tours/?status=' + encodeURIComponent(currentTourFilter) + '&q=' + encodeURIComponent(q);

        window.PTApi.get(url).then(function (res) {
            toursData = (res && res.tours) ? res.tours : [];
            var countEl = document.getElementById('tabCountTours');
            if (countEl) countEl.textContent = toursData.length;
            renderToursTable(toursData);
        }).catch(function (err) {
            tbody.innerHTML = '<tr><td colspan="8" class="px-6 py-8 text-center text-rose-500">Failed to load tours list.</td></tr>';
        });
    }

    function renderToursTable(tours) {
        var tbody = document.getElementById('toursTableBody');
        if (!tbody) return;

        if (tours.length === 0) {
            tbody.innerHTML = '<tr><td colspan="8" class="px-6 py-12 text-center text-slate-400">No tours found.</td></tr>';
            return;
        }

        var html = '';
        tours.forEach(function (t) {
            var statusBadge = t.status === 'active'
                ? '<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200"><i class="fa-solid fa-circle text-[6px] mr-1.5 text-emerald-500"></i> Active</span>'
                : '<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200"><i class="fa-solid fa-scale-balanced mr-1"></i> Settled</span>';

            html += '<tr class="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition">';
            html += '<td class="px-6 py-4"><p class="font-bold text-slate-900 dark:text-white leading-tight">' + t.title + '</p><p class="text-xs text-slate-400 mt-0.5 font-mono">Token: ' + t.join_token + '</p></td>';
            html += '<td class="px-6 py-4 text-slate-700 dark:text-slate-300"><i class="fa-solid fa-location-dot text-rose-500 mr-1.5"></i> ' + (t.destination || '—') + '</td>';
            html += '<td class="px-6 py-4"><p class="font-semibold text-slate-800 dark:text-slate-200">' + t.created_by + '</p><p class="text-xs text-slate-400">' + t.creator_email + '</p></td>';
            html += '<td class="px-6 py-4 font-bold text-slate-700 dark:text-slate-300">' + t.members_count + ' members</td>';
            html += '<td class="px-6 py-4 font-bold text-slate-800 dark:text-slate-200">' + money(t.budget) + '</td>';
            html += '<td class="px-6 py-4 font-black text-indigo-600 dark:text-indigo-400">' + money(t.total_spent) + '</td>';
            html += '<td class="px-6 py-4">' + statusBadge + '</td>';
            html += '<td class="px-6 py-4 text-right"><a href="/client/tours/' + t.id + '/" target="_blank" class="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-700 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 text-indigo-600 dark:text-indigo-300 font-bold text-xs transition inline-flex items-center gap-1.5">View <i class="fa-solid fa-arrow-up-right-from-square text-[10px]"></i></a></td>';
            html += '</tr>';
        });

        tbody.innerHTML = html;
    }

    window.filterTours = function (s) {
        currentTourFilter = s;
        document.querySelectorAll('.tour-filter-btn').forEach(function (btn) {
            if (btn.getAttribute('data-filter') === s) {
                btn.className = "tour-filter-btn px-4 py-2 rounded-xl text-xs font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800";
            } else {
                btn.className = "tour-filter-btn px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-200";
            }
        });
        loadTours();
    };

    window.debounceTourSearch = function () {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(loadTours, 300);
    };

    // Initialize
    document.addEventListener('DOMContentLoaded', function () {
        loadStats();
        loadUsers();
    });
})();
