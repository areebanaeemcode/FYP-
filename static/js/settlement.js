(function () {
    'use strict';

    var tourId = window.__PT_TOUR_ID__;
    var currencyPrefix = 'Rs. ';
    var expandedMemberIds = {};

    function fmtMoney(v) {
        var n = Number(v || 0);
        return currencyPrefix + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }

    var avatarPalettes = [
        'bg-[#dbeafe] text-[#1e40af]', // light blue
        'bg-[#dcfce7] text-[#166534]', // light green
        'bg-[#fef3c7] text-[#92400e]', // warm amber
        'bg-[#f3e8ff] text-[#6b21a8]', // soft purple
        'bg-[#ffe4e6] text-[#9f1239]', // soft rose
        'bg-[#ffedd5] text-[#9a3412]', // soft orange
        'bg-[#e0e7ff] text-[#3730a3]', // soft indigo
        'bg-[#ccfbf1] text-[#115e59]'  // soft teal
    ];

    function getAvatarClass(name, offset) {
        var str = (name || '').trim();
        var hash = offset || 0;
        for (var i = 0; i < str.length; i++) {
            hash = ((hash << 5) - hash) + str.charCodeAt(i);
            hash |= 0;
        }
        var idx = Math.abs(hash) % avatarPalettes.length;
        return avatarPalettes[idx];
    }

    function getInitial(name) {
        return (((name || '?').trim().charAt(0) || '?')).toUpperCase();
    }

    function renderSummary(data) {
        if (!data) return;
        var totalExpEl = document.getElementById('cardTotalExpenses');
        var membersToPayEl = document.getElementById('cardMembersToPay');
        var membersToReceiveEl = document.getElementById('cardMembersToReceive');
        var totalMemEl = document.getElementById('cardTotalMembers');
        var netDiffEl = document.getElementById('cardNetDiff');

        if (totalExpEl) totalExpEl.textContent = fmtMoney(data.total_expenses);

        var perMember = data.per_member || [];
        var countToPay = data.members_to_pay != null
            ? data.members_to_pay
            : perMember.filter(function (m) { return Number(m.net_balance) < -0.005; }).length;

        var countToReceive = data.members_to_receive != null
            ? data.members_to_receive
            : perMember.filter(function (m) { return Number(m.net_balance) > 0.005; }).length;

        if (membersToPayEl) membersToPayEl.textContent = String(countToPay);
        if (membersToReceiveEl) membersToReceiveEl.textContent = String(countToReceive);
        if (totalMemEl) totalMemEl.textContent = String(data.total_members || perMember.length || 0);
        if (netDiffEl && data.summary) {
            netDiffEl.textContent = fmtMoney(data.summary.net_zero_difference || 0);
        }
    }

    function renderTransfers(transfers) {
        var box = document.getElementById('transfersList');
        if (!box) return;

        if (!transfers || transfers.length === 0) {
            box.innerHTML = (
                '<div class="bg-white dark:bg-slate-800 border border-slate-200/90 dark:border-slate-700/80 rounded-2xl p-6 text-center text-slate-500 dark:text-slate-400 font-medium">' +
                    'All balances are settled! No payments needed.' +
                '</div>'
            );
            return;
        }

        var html = '';
        for (var i = 0; i < transfers.length; i++) {
            var t = transfers[i];
            var from = t.from_user || {};
            var to = t.to_user || {};
            var fromName = from.full_name || 'Member';
            var toName = to.full_name || 'Member';
            var fromInitial = getInitial(fromName);
            var toInitial = getInitial(toName);

            var fromColor = getAvatarClass(fromName, 0);
            var toColor = getAvatarClass(toName, 2);

            // Payment state comes from the settlement API, not browser storage.
            var isPaid = Boolean(t.paid);

            var buttonHtml = '';
            if (isPaid) {
                buttonHtml = (
                        '<button type="button" disabled class="inline-flex items-center gap-1.5 px-4 py-2 border border-emerald-300 dark:border-emerald-600 rounded-xl text-sm font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 cursor-default shadow-xs">' +
                        '<svg class="w-4 h-4 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/></svg>' +
                        '<span>Paid</span>' +
                    '</button>'
                );
            } else {
                buttonHtml = (
                        '<button type="button" class="mark-paid-btn inline-flex items-center gap-1.5 px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-xl text-sm font-medium text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 transition cursor-pointer shadow-xs" data-from-user-id="' + (t.from_user_id || from.id || '') + '" data-to-user-id="' + (t.to_user_id || to.id || '') + '" data-amount="' + Number(t.amount || 0).toFixed(2) + '">' +
                        '<span>Mark paid</span>' +
                    '</button>'
                );
            }

            html += (
                '<div class="bg-white dark:bg-slate-800 border border-slate-200/90 dark:border-slate-700/80 rounded-2xl p-4 sm:p-5 flex items-center justify-between shadow-none hover:border-slate-300 dark:hover:border-slate-600 transition gap-4">' +
                    '<div class="flex items-center gap-2.5 sm:gap-3.5 min-w-0 flex-wrap sm:flex-nowrap">' +
                        '<div class="w-9 h-9 sm:w-10 sm:h-10 rounded-full ' + fromColor + ' font-bold text-sm flex items-center justify-center shrink-0">' +
                            fromInitial +
                        '</div>' +
                        '<span class="text-sm sm:text-base font-semibold text-slate-800 dark:text-slate-100 truncate max-w-[140px] sm:max-w-none">' + fromName + '</span>' +
                        '<span class="text-slate-400 mx-1 text-base shrink-0">→</span>' +
                        '<div class="w-9 h-9 sm:w-10 sm:h-10 rounded-full ' + toColor + ' font-bold text-sm flex items-center justify-center shrink-0">' +
                            toInitial +
                        '</div>' +
                        '<span class="text-sm sm:text-base font-semibold text-slate-800 dark:text-slate-100 truncate max-w-[140px] sm:max-w-none">' + toName + '</span>' +
                    '</div>' +
                    '<div class="flex items-center gap-3 sm:gap-6 shrink-0">' +
                        '<span class="text-base sm:text-lg font-bold text-slate-900 dark:text-white">' + fmtMoney(t.amount) + '</span>' +
                        buttonHtml +
                    '</div>' +
                '</div>'
            );
        }

        box.innerHTML = html;
        bindMarkPaidButtons(box);
    }

    function bindMarkPaidButtons(container) {
        var btns = container.querySelectorAll('.mark-paid-btn');
        btns.forEach(function (btn) {
            btn.addEventListener('click', function (e) {
                e.stopPropagation();
                var fromUserId = btn.getAttribute('data-from-user-id');
                var toUserId = btn.getAttribute('data-to-user-id');
                var amount = btn.getAttribute('data-amount');
                if (!fromUserId || !toUserId || !amount || !window.PTApi || !window.PTApi.apiFetch) return;
                btn.disabled = true;
                btn.textContent = 'Saving...';
                window.PTApi.apiFetch('/client/tours/api/' + tourId + '/settlement/mark-paid/', {
                    method: 'POST', requireAuth: true,
                    body: { from_user_id: fromUserId, to_user_id: toUserId, amount: amount }
                }).then(function (res) {
                    if (res && res.ok) {
                        window.__PT_INITIAL_SETTLEMENT__ = null;
                        loadSettlement();
                    } else {
                        btn.disabled = false;
                        btn.textContent = 'Mark paid';
                        var message = (res && res.data && res.data.detail) || 'Could not save payment status.';
                        var messageBox = document.getElementById('messageBox');
                        if (messageBox) messageBox.textContent = message;
                    }
                }).catch(function () {
                    btn.disabled = false;
                    btn.textContent = 'Mark paid';
                });
            });
        });
    }

    function renderMemberChips(perMember) {
        var box = document.getElementById('memberChips');
        if (!box) return;

        if (!perMember || perMember.length === 0) {
            box.innerHTML = (
                '<div class="bg-white dark:bg-slate-800 border border-slate-200/90 dark:border-slate-700/80 rounded-2xl p-6 text-center text-slate-400">' +
                    'No members found in this tour.' +
                '</div>'
            );
            return;
        }

        // Expand the first member with expenses by default if none expanded yet
        var hasExpanded = Object.keys(expandedMemberIds).length > 0;
        if (!hasExpanded && perMember.length > 0) {
            expandedMemberIds[perMember[0].user_id] = true;
        }

        var html = '';
        for (var i = 0; i < perMember.length; i++) {
            var m = perMember[i];
            var u = m.user || {};
            var name = u.full_name || 'Member';
            var initial = getInitial(name);
            var colorClass = getAvatarClass(name, i);
            var uid = m.user_id;

            var isExpanded = Boolean(expandedMemberIds[uid]);
            var chevron = isExpanded ? '<i class="fa-solid fa-chevron-up text-xs"></i>' : '<i class="fa-solid fa-chevron-down text-xs"></i>';

            var net = Number(m.net_balance || 0);
            var balanceHtml = '';

            if (net > 0.005) {
                balanceHtml = (
                    '<div class="flex items-center gap-2">' +
                        '<p class="text-lg sm:text-xl font-bold text-[#15803d] dark:text-emerald-400">+' + fmtMoney(net) + '</p>' +
                        '<span class="text-slate-400 font-bold text-base chevron-indicator">' + chevron + '</span>' +
                    '</div>' +
                    '<p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">to receive</p>'
                );
            } else if (net < -0.005) {
                balanceHtml = (
                    '<div class="flex items-center gap-2">' +
                        '<p class="text-lg sm:text-xl font-bold text-[#b91c1c] dark:text-red-400">-' + fmtMoney(Math.abs(net)) + '</p>' +
                        '<span class="text-slate-400 font-bold text-base chevron-indicator">' + chevron + '</span>' +
                    '</div>' +
                    '<p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">to pay</p>'
                );
            } else {
                balanceHtml = (
                    '<div class="flex items-center gap-2">' +
                        '<p class="text-lg sm:text-xl font-bold text-slate-600 dark:text-slate-400">' + fmtMoney(0) + '</p>' +
                        '<span class="text-slate-400 font-bold text-base chevron-indicator">' + chevron + '</span>' +
                    '</div>' +
                    '<p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">settled</p>'
                );
            }

            // Build individual expense list breakdown
            var expenses = m.expenses || [];
            var expensesHtml = '';
            if (expenses.length > 0) {
                for (var j = 0; j < expenses.length; j++) {
                    var exp = expenses[j];
                    var expTitle = exp.title || 'Expense';
                    var paidBadge = exp.paid_this ? ' <span class="text-slate-400 dark:text-slate-500 font-normal">· paid this</span>' : '';
                    var rightLabel = '';

                    if (exp.is_advance && exp.is_credit) {
                        rightLabel = '<span class="text-[#15803d] dark:text-emerald-400 font-medium">+' + fmtMoney(exp.share_amount) + ' credit</span>';
                    } else if (exp.is_advance && !exp.is_credit) {
                        rightLabel = '<span class="text-[#b91c1c] dark:text-red-400 font-medium">-' + fmtMoney(exp.share_amount) + ' debit</span>';
                    } else {
                        rightLabel = '<span class="text-slate-600 dark:text-slate-400 font-normal">share ' + fmtMoney(exp.share_amount) + '</span>';
                    }

                    expensesHtml += (
                        '<div class="flex items-center justify-between text-sm py-1 border-b border-slate-50 dark:border-slate-800/60 last:border-0">' +
                            '<span class="text-slate-800 dark:text-slate-200">' + expTitle + paidBadge + '</span>' +
                            rightLabel +
                        '</div>'
                    );
                }
            } else {
                expensesHtml = '<p class="text-xs text-slate-400 py-2">No individual expenses assigned to this member yet.</p>';
            }

            var detailsContainerClass = isExpanded ? '' : 'hidden';

            html += (
                '<div class="member-accordion-card bg-white dark:bg-slate-800 border border-slate-200/90 dark:border-slate-700/80 rounded-2xl p-4 sm:p-5 shadow-none hover:border-slate-300 dark:hover:border-slate-600 transition cursor-pointer" data-uid="' + uid + '">' +
                    '<div class="flex items-center justify-between gap-4">' +
                        '<div class="flex items-center gap-3.5 min-w-0">' +
                            '<div class="w-10 h-10 rounded-full ' + colorClass + ' font-bold text-sm flex items-center justify-center shrink-0">' +
                                initial +
                            '</div>' +
                            '<div class="min-w-0">' +
                                '<p class="text-sm sm:text-base font-bold text-slate-900 dark:text-white truncate">' + name + '</p>' +
                                '<p class="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5 truncate">' +
                                    'Paid ' + fmtMoney(m.paid) + ' · fair share ' + fmtMoney(m.owed_shares) +
                                '</p>' +
                            '</div>' +
                        '</div>' +
                        '<div class="text-right shrink-0 ml-4">' +
                            balanceHtml +
                        '</div>' +
                    '</div>' +

                    '<div class="member-detail-box ' + detailsContainerClass + ' border-t border-slate-100 dark:border-slate-700/80 pt-3 mt-3 space-y-2">' +
                        expensesHtml +
                    '</div>' +
                '</div>'
            );
        }

        box.innerHTML = html;
        bindMemberAccordions(box);
    }

    function bindMemberAccordions(container) {
        var cards = container.querySelectorAll('.member-accordion-card');
        cards.forEach(function (card) {
            card.addEventListener('click', function () {
                var uid = card.getAttribute('data-uid');
                var detailBox = card.querySelector('.member-detail-box');
                var chevron = card.querySelector('.chevron-indicator');
                if (!detailBox) return;

                var isCurrentlyOpen = !detailBox.classList.contains('hidden');
                if (isCurrentlyOpen) {
                    detailBox.classList.add('hidden');
                    if (chevron) chevron.innerHTML = '<i class="fa-solid fa-chevron-down text-xs"></i>';
                    expandedMemberIds[uid] = false;
                } else {
                    detailBox.classList.remove('hidden');
                    if (chevron) chevron.innerHTML = '<i class="fa-solid fa-chevron-up text-xs"></i>';
                    expandedMemberIds[uid] = true;
                }
            });
        });
    }

    function setupAddMemberModal() {
        var openBtn = document.getElementById('openAddMemberBtn');
        var modal = document.getElementById('addMemberModal');
        var closeBtn = document.getElementById('closeAddMemberBtn');
        var cancelBtn = document.getElementById('cancelAddMemberBtn');
        var form = document.getElementById('addMemberForm');
        var input = document.getElementById('memberIdentifierInput');
        var msgBox = document.getElementById('addMemberModalMsg');
        var submitBtn = document.getElementById('submitAddMemberBtn');

        // The settlement page does not expose an add-member trigger. Avoid
        // binding an unreachable modal; member management remains on tour detail.
        if (!openBtn || !modal) return;

        function openModal() {
            modal.classList.remove('hidden');
            if (input) {
                input.value = '';
                input.focus();
            }
            if (msgBox) {
                msgBox.className = 'text-xs hidden p-3 rounded-xl';
                msgBox.textContent = '';
            }
        }

        function closeModal() {
            modal.classList.add('hidden');
        }

        openBtn.addEventListener('click', openModal);
        if (closeBtn) closeBtn.addEventListener('click', closeModal);
        if (cancelBtn) cancelBtn.addEventListener('click', closeModal);

        modal.addEventListener('click', function (e) {
            if (e.target === modal) closeModal();
        });

        if (form) {
            form.addEventListener('submit', function (e) {
                e.preventDefault();
                var val = (input.value || '').trim();
                if (!val) return;

                if (submitBtn) {
                    submitBtn.disabled = true;
                    submitBtn.textContent = 'Adding…';
                }

                var url = '/client/tours/api/' + tourId + '/invite/';
                if (window.PTApi && window.PTApi.apiFetch) {
                    window.PTApi.apiFetch(url, {
                        method: 'POST',
                        requireAuth: true,
                        body: { identifier: val, role: 'member' }
                    })
                    .then(function (res) {
                        if (submitBtn) {
                            submitBtn.disabled = false;
                            submitBtn.textContent = 'Add Member';
                        }
                        if (res && res.ok) {
                            if (msgBox) {
                                msgBox.className = 'text-xs block p-3 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200';
                                msgBox.textContent = 'Member added successfully!';
                            }
                            setTimeout(function () {
                                closeModal();
                                loadSettlement();
                            }, 700);
                        } else {
                            var errMsg = (res && res.data && (res.data.detail || res.data.message)) || 'Could not add member.';
                            if (msgBox) {
                                msgBox.className = 'text-xs block p-3 rounded-xl bg-rose-50 text-rose-800 border border-rose-200';
                                msgBox.textContent = errMsg;
                            }
                        }
                    })
                    .catch(function (err) {
                        if (submitBtn) {
                            submitBtn.disabled = false;
                            submitBtn.textContent = 'Add Member';
                        }
                        if (msgBox) {
                            msgBox.className = 'text-xs block p-3 rounded-xl bg-rose-50 text-rose-800 border border-rose-200';
                            msgBox.textContent = (err && (err.detail || err.message)) || 'Network error.';
                        }
                    });
                }
            });
        }
    }

    function loadSettlement() {
        if (window.__PT_INITIAL_SETTLEMENT__ && typeof window.__PT_INITIAL_SETTLEMENT__ === 'object') {
            var initData = window.__PT_INITIAL_SETTLEMENT__;
            renderSummary(initData);
            renderTransfers(initData.transfers || []);
            renderMemberChips(initData.per_member || []);
        }

        var url = '/client/tours/api/' + tourId + '/settlement/';
        if (window.PTApi && window.PTApi.apiFetch) {
            window.PTApi.apiFetch(url, { method: 'GET', requireAuth: true })
                .then(function (res) {
                    if (!res || !res.ok) {
                        if (!window.__PT_INITIAL_SETTLEMENT__ ||
                            !Array.isArray(window.__PT_INITIAL_SETTLEMENT__.per_member)) {
                            var msg = (res && res.data && (res.data.detail || res.data.message)) || (res && res.text) || 'Failed to load settlement.';
                            var mb = document.getElementById('messageBox');
                            if (mb) {
                                mb.innerHTML = '<div class="bg-rose-50 border border-rose-300 text-rose-800 p-4 rounded-xl text-sm font-medium mb-4">' + msg + '</div>';
                            }
                        }
                        return;
                    }
                    var data = (res && res.data) ? res.data : res;
                    renderSummary(data);
                    renderTransfers(data.transfers || []);
                    renderMemberChips(data.per_member || []);
                })
                .catch(function (err) {
                    console.error('settlement api fetch error', err);
                });
        }
    }

    document.addEventListener('DOMContentLoaded', function () {
        loadSettlement();
        setupAddMemberModal();
    });
})();
