/**
 * Pay-Together Landing Page Interactive Engine
 * Handles interactive demo mini-settlement, FAQ accordion, smooth scrolling & mobile menu.
 */
(function () {
    'use strict';

    // -------------------------------------------------------------
    // 1. Live Interactive Settlement Demo
    // -------------------------------------------------------------
    var defaultDemoMembers = [
        { id: 1, name: 'Ali (Petrol & Tolls)', paid: 18000, color: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
        { id: 2, name: 'Sara (Hotel Booking)', paid: 12000, color: 'bg-indigo-100 text-indigo-800 border-indigo-300' },
        { id: 3, name: 'Bilal (Dinners & Chai)', paid: 6000, color: 'bg-amber-100 text-amber-800 border-amber-300' },
        { id: 4, name: 'Hamza (Snacks & Water)', paid: 0, color: 'bg-rose-100 text-rose-800 border-rose-300' }
    ];

    var demoMembers = JSON.parse(JSON.stringify(defaultDemoMembers));

    function formatMoney(amount) {
        var n = Number(amount || 0);
        return 'Rs. ' + n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
    }

    function calculateSettlement(members) {
        var total = 0;
        members.forEach(function (m) {
            total += Number(m.paid || 0);
        });

        var count = members.length;
        var fairShare = count > 0 ? (total / count) : 0;

        var debtors = [];
        var creditors = [];

        members.forEach(function (m) {
            var net = Number(m.paid || 0) - fairShare;
            if (net < -0.01) {
                debtors.push({ name: m.name, owes: Math.abs(net) });
            } else if (net > 0.01) {
                creditors.push({ name: m.name, receives: net });
            }
        });

        // Greedy matching to minimize transactions
        debtors.sort(function (a, b) { return b.owes - a.owes; });
        creditors.sort(function (a, b) { return b.receives - a.receives; });

        var transfers = [];
        var dIdx = 0;
        var cIdx = 0;

        while (dIdx < debtors.length && cIdx < creditors.length) {
            var debtor = debtors[dIdx];
            var creditor = creditors[cIdx];
            var settleAmt = Math.min(debtor.owes, creditor.receives);

            if (settleAmt > 0.01) {
                transfers.push({
                    from: debtor.name,
                    to: creditor.name,
                    amount: settleAmt
                });
            }

            debtor.owes -= settleAmt;
            creditor.receives -= settleAmt;

            if (debtor.owes <= 0.01) dIdx++;
            if (creditor.receives <= 0.01) cIdx++;
        }

        return {
            total: total,
            fairShare: fairShare,
            transfers: transfers
        };
    }

    function renderDemo() {
        var inputsContainer = document.getElementById('demoInputsList');
        if (!inputsContainer) return;

        inputsContainer.innerHTML = '';

        demoMembers.forEach(function (m, idx) {
            var row = document.createElement('div');
            row.className = 'flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 transition hover:border-indigo-300';
            row.innerHTML =
                '<div class="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ' + m.color + '">' +
                    m.name.charAt(0).toUpperCase() +
                '</div>' +
                '<input type="text" value="' + m.name + '" data-idx="' + idx + '" class="demo-name-input flex-1 min-w-0 bg-transparent text-sm font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 rounded px-1.5 py-0.5" />' +
                '<div class="relative w-28 shrink-0">' +
                    '<span class="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">Rs.</span>' +
                    '<input type="number" step="100" min="0" value="' + m.paid + '" data-idx="' + idx + '" class="demo-paid-input w-full pl-8 pr-2 py-1 text-sm font-bold text-right text-slate-900 dark:text-white bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />' +
                '</div>' +
                (demoMembers.length > 2 ? '<button type="button" data-idx="' + idx + '" class="demo-remove-btn text-slate-400 hover:text-rose-500 p-1 font-bold text-sm cursor-pointer" title="Remove member"><i class="fa-solid fa-xmark"></i></button>' : '');

            inputsContainer.appendChild(row);
        });

        // Wire inputs
        inputsContainer.querySelectorAll('.demo-paid-input').forEach(function (inp) {
            inp.addEventListener('input', function (e) {
                var idx = Number(e.target.dataset.idx);
                var val = parseFloat(e.target.value) || 0;
                demoMembers[idx].paid = val;
                updateDemoResults();
            });
        });

        inputsContainer.querySelectorAll('.demo-name-input').forEach(function (inp) {
            inp.addEventListener('change', function (e) {
                var idx = Number(e.target.dataset.idx);
                demoMembers[idx].name = e.target.value.trim() || ('Member ' + (idx + 1));
                updateDemoResults();
            });
        });

        inputsContainer.querySelectorAll('.demo-remove-btn').forEach(function (btn) {
            btn.addEventListener('click', function (e) {
                var idx = Number(e.currentTarget.dataset.idx);
                demoMembers.splice(idx, 1);
                renderDemo();
                updateDemoResults();
            });
        });

        updateDemoResults();
    }

    function updateDemoResults() {
        var res = calculateSettlement(demoMembers);

        var totalEl = document.getElementById('demoTotalSpent');
        var shareEl = document.getElementById('demoFairShare');
        var transfersList = document.getElementById('demoTransfersList');

        if (totalEl) totalEl.textContent = formatMoney(res.total);
        if (shareEl) shareEl.textContent = formatMoney(res.fairShare) + ' / person';

        if (!transfersList) return;

        if (res.transfers.length === 0) {
            transfersList.innerHTML =
                '<div class="p-6 text-center rounded-2xl border border-emerald-200 dark:border-emerald-800/60 bg-emerald-50/70 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300">' +
                    '<div class="text-2xl block mb-1 text-emerald-500"><i class="fa-solid fa-circle-check"></i></div>' +
                    '<p class="font-bold text-sm">Everyone is square!</p>' +
                    '<p class="text-xs text-emerald-600 dark:text-emerald-400 mt-0.5">No transfers needed. Perfect equal contribution.</p>' +
                '</div>';
            return;
        }

        var html = '';
        res.transfers.forEach(function (t) {
            html +=
                '<div class="flex items-center justify-between p-3.5 rounded-xl bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 shadow-xs hover:shadow-md transition">' +
                    '<div class="flex items-center gap-2 min-w-0">' +
                        '<span class="text-sm font-bold text-slate-800 dark:text-slate-100 truncate max-w-[110px] sm:max-w-[140px]">' + t.from + '</span>' +
                        '<span class="text-indigo-600 dark:text-indigo-400 font-extrabold text-xs px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/60 shrink-0">pays →</span>' +
                        '<span class="text-sm font-bold text-slate-800 dark:text-slate-100 truncate max-w-[110px] sm:max-w-[140px]">' + t.to + '</span>' +
                    '</div>' +
                    '<span class="font-black text-sm text-emerald-600 dark:text-emerald-400 shrink-0 ml-2">' + formatMoney(t.amount) + '</span>' +
                '</div>';
        });

        transfersList.innerHTML = html;
    }

    // -------------------------------------------------------------
    // 2. FAQ Accordion Setup
    // -------------------------------------------------------------
    function initFaq() {
        var faqToggles = document.querySelectorAll('.faq-toggle');
        faqToggles.forEach(function (btn) {
            btn.addEventListener('click', function () {
                var content = this.nextElementSibling;
                var icon = this.querySelector('.faq-icon');
                var isExpanded = this.getAttribute('aria-expanded') === 'true';

                // Close all others
                faqToggles.forEach(function (other) {
                    if (other !== btn) {
                        other.setAttribute('aria-expanded', 'false');
                        if (other.nextElementSibling) other.nextElementSibling.classList.add('hidden');
                        var otherIcon = other.querySelector('.faq-icon');
                        if (otherIcon) otherIcon.style.transform = 'rotate(0deg)';
                    }
                });

                if (isExpanded) {
                    this.setAttribute('aria-expanded', 'false');
                    content.classList.add('hidden');
                    if (icon) icon.style.transform = 'rotate(0deg)';
                } else {
                    this.setAttribute('aria-expanded', 'true');
                    content.classList.remove('hidden');
                    if (icon) icon.style.transform = 'rotate(180deg)';
                }
            });
        });
    }

    // -------------------------------------------------------------
    // 3. Mobile Menu Toggle
    // -------------------------------------------------------------
    function initMobileMenu() {
        var menuBtn = document.getElementById('mobileMenuBtn');
        var mobileNav = document.getElementById('mobileNav');
        if (!menuBtn || !mobileNav) return;

        menuBtn.addEventListener('click', function () {
            var isHidden = mobileNav.classList.contains('hidden');
            if (isHidden) {
                mobileNav.classList.remove('hidden');
            } else {
                mobileNav.classList.add('hidden');
            }
        });

        // Close when clicking nav link
        mobileNav.querySelectorAll('a').forEach(function (link) {
            link.addEventListener('click', function () {
                mobileNav.classList.add('hidden');
            });
        });
    }

    // -------------------------------------------------------------
    // Initialize Everything on DOM Load
    // -------------------------------------------------------------
    document.addEventListener('DOMContentLoaded', function () {
        renderDemo();
        initFaq();
        initMobileMenu();

        // Add member button for demo
        var addBtn = document.getElementById('demoAddMemberBtn');
        if (addBtn) {
            addBtn.addEventListener('click', function () {
                var newId = demoMembers.length + 1;
                demoMembers.push({
                    id: newId,
                    name: 'Friend ' + newId,
                    paid: 0,
                    color: 'bg-purple-100 text-purple-800 border-purple-300'
                });
                renderDemo();
            });
        }

        // Reset demo button
        var resetBtn = document.getElementById('demoResetBtn');
        if (resetBtn) {
            resetBtn.addEventListener('click', function () {
                demoMembers = JSON.parse(JSON.stringify(defaultDemoMembers));
                renderDemo();
            });
        }
    });

})();
