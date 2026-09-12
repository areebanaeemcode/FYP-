(function () {
    const CATEGORY_OPTIONS = [
        { value: 'transport', label: 'Transport' },
        { value: 'accommodation', label: 'Accommodation' },
        { value: 'food', label: 'Food' },
        { value: 'activities', label: 'Activities' },
        { value: 'shopping', label: 'Shopping' },
        { value: 'other', label: 'Other' },
    ];
    const PAYMENT_OPTIONS = [
        { value: 'cash', label: 'Cash' },
        { value: 'card', label: 'Card' },
        { value: 'online_transfer', label: 'Online Transfer' },
        { value: 'other', label: 'Other' },
    ];

    // Comprehensive presets for all things that occur during tours
    const TOUR_EXPENSE_PRESETS = [
        // Food & Dining
        { icon: '<i class="fa-solid fa-egg"></i>', title: 'Breakfast / Nashta', category: 'food' },
        { icon: '<i class="fa-solid fa-bowl-food"></i>', title: 'Lunch (Dopahar ka Khana)', category: 'food' },
        { icon: '<i class="fa-solid fa-utensils"></i>', title: 'Group Dinner (Raat ka Khana)', category: 'food' },
        { icon: '<i class="fa-solid fa-mug-saucer"></i>', title: 'Chai / Tea & Coffee', category: 'food' },
        { icon: '<i class="fa-solid fa-bread-slice"></i>', title: 'Snacks & Refreshments', category: 'food' },
        { icon: '<i class="fa-solid fa-bottle-water"></i>', title: 'Mineral Water & Drinks', category: 'food' },
        { icon: '<i class="fa-solid fa-fire-burner"></i>', title: 'BBQ & Bonfire Night Dinner', category: 'food' },
        { icon: '<i class="fa-solid fa-burger"></i>', title: 'Fast Food / Cafe Meal', category: 'food' },
        { icon: '<i class="fa-solid fa-ice-cream"></i>', title: 'Ice Cream & Desserts', category: 'food' },
        { icon: '<i class="fa-solid fa-basket-shopping"></i>', title: 'Groceries & Cooking Items', category: 'food' },
        { icon: '<i class="fa-solid fa-drumstick-bite"></i>', title: 'Meat / Chicken for Cooking', category: 'food' },

        // Transport & Travel
        { icon: '<i class="fa-solid fa-gas-pump"></i>', title: 'Fuel / Petrol / Diesel', category: 'transport' },
        { icon: '<i class="fa-solid fa-car-side"></i>', title: 'Jeep Rental / 4x4 Offroad Hire', category: 'transport' },
        { icon: '<i class="fa-solid fa-van-shuttle"></i>', title: 'Coaster / Van / Bus Fare', category: 'transport' },
        { icon: '<i class="fa-solid fa-road"></i>', title: 'Toll Plaza & Highway Tax', category: 'transport' },
        { icon: '<i class="fa-solid fa-square-parking"></i>', title: 'Parking Fees', category: 'transport' },
        { icon: '<i class="fa-solid fa-taxi"></i>', title: 'Taxi / Cab / Rickshaw Fare', category: 'transport' },
        { icon: '<i class="fa-solid fa-plane"></i>', title: 'Flight / Air Ticket', category: 'transport' },
        { icon: '<i class="fa-solid fa-train"></i>', title: 'Train Ticket', category: 'transport' },
        { icon: '<i class="fa-solid fa-ferry"></i>', title: 'Boat / Ferry Ride', category: 'transport' },
        { icon: '<i class="fa-solid fa-wrench"></i>', title: 'Car Repair / Tyre Puncture', category: 'transport' },
        { icon: '<i class="fa-solid fa-user-tie"></i>', title: 'Driver Allowance & Tips', category: 'transport' },

        // Accommodation & Stay
        { icon: '<i class="fa-solid fa-hotel"></i>', title: 'Hotel / Resort Room Booking', category: 'accommodation' },
        { icon: '<i class="fa-solid fa-campground"></i>', title: 'Camping & Tent Rental', category: 'accommodation' },
        { icon: '<i class="fa-solid fa-house"></i>', title: 'Guest House / Rest House Rent', category: 'accommodation' },
        { icon: '<i class="fa-solid fa-fire"></i>', title: 'Bonfire Wood & Heating', category: 'accommodation' },
        { icon: '<i class="fa-solid fa-bed"></i>', title: 'Extra Mattress / Bedding', category: 'accommodation' },
        { icon: '<i class="fa-solid fa-soap"></i>', title: 'Laundry & Room Service', category: 'accommodation' },

        // Activities & Sightseeing
        { icon: '<i class="fa-solid fa-ticket"></i>', title: 'Sightseeing & Park Entry Ticket', category: 'activities' },
        { icon: '<i class="fa-solid fa-cable-car"></i>', title: 'Chairlift / Cable Car Ticket', category: 'activities' },
        { icon: '<i class="fa-solid fa-sailboat"></i>', title: 'Boating / River Rafting', category: 'activities' },
        { icon: '<i class="fa-solid fa-parachute-box"></i>', title: 'Paragliding & Adventure Sports', category: 'activities' },
        { icon: '<i class="fa-solid fa-horse"></i>', title: 'Horse / Camel Riding', category: 'activities' },
        { icon: '<i class="fa-solid fa-person-skiing"></i>', title: 'Skiing & Snow Gear Rental', category: 'activities' },
        { icon: '<i class="fa-solid fa-mountain"></i>', title: 'Tour Guide / Trekking Guide Fee', category: 'activities' },
        { icon: '<i class="fa-solid fa-camera"></i>', title: 'Photography / Camera & Drone Pass', category: 'activities' },
        { icon: '<i class="fa-solid fa-monument"></i>', title: 'Fort / Museum Entry Ticket', category: 'activities' },

        // Shopping & Souvenirs
        { icon: '<i class="fa-solid fa-gift"></i>', title: 'Souvenirs & Cultural Gifts', category: 'shopping' },
        { icon: '<i class="fa-solid fa-seedling"></i>', title: 'Dry Fruits & Local Specialties', category: 'shopping' },
        { icon: '<i class="fa-solid fa-shirt"></i>', title: 'Warm Clothes / Shawls / Caps', category: 'shopping' },
        { icon: '<i class="fa-solid fa-bag-shopping"></i>', title: 'Personal & Group Shopping', category: 'shopping' },

        // Miscellaneous & Emergency
        { icon: '<i class="fa-solid fa-kit-medical"></i>', title: 'First Aid & Medicines', category: 'other' },
        { icon: '<i class="fa-solid fa-sim-card"></i>', title: 'Mobile SIM & Internet Package', category: 'other' },
        { icon: '<i class="fa-solid fa-hand-holding-dollar"></i>', title: 'Tips / Porter (Coolie) Charges', category: 'other' },
        { icon: '<i class="fa-solid fa-battery-half"></i>', title: 'Power Bank / Mobile Charging Fee', category: 'other' },
        { icon: '<i class="fa-solid fa-tag"></i>', title: 'Miscellaneous Tour Expense', category: 'other' },
    ];

    function detectCategoryFromTitle(titleText) {
        if (!titleText) return null;
        const s = String(titleText).toLowerCase();
        if (s.includes('petrol') || s.includes('fuel') || s.includes('diesel') || s.includes('jeep') || s.includes('coaster') || s.includes('van') || s.includes('bus') || s.includes('taxi') || s.includes('cab') || s.includes('rickshaw') || s.includes('toll') || s.includes('parking') || s.includes('flight') || s.includes('train') || s.includes('ferry') || s.includes('puncture') || s.includes('driver')) return 'transport';
        if (s.includes('hotel') || s.includes('resort') || s.includes('motel') || s.includes('room') || s.includes('stay') || s.includes('tent') || s.includes('camp') || s.includes('guest house') || s.includes('cottage') || s.includes('wood') || s.includes('mattress') || s.includes('laundry')) return 'accommodation';
        if (s.includes('dinner') || s.includes('lunch') || s.includes('breakfast') || s.includes('nashta') || s.includes('food') || s.includes('khana') || s.includes('meal') || s.includes('chai') || s.includes('tea') || s.includes('coffee') || s.includes('water') || s.includes('drink') || s.includes('bbq') || s.includes('burger') || s.includes('snack') || s.includes('grocery') || s.includes('chicken') || s.includes('meat')) return 'food';
        if (s.includes('ticket') || s.includes('chairlift') || s.includes('cable car') || s.includes('rafting') || s.includes('boating') || s.includes('paragliding') || s.includes('ski') || s.includes('horse') || s.includes('camel') || s.includes('guide') || s.includes('museum') || s.includes('fort') || s.includes('entry') || s.includes('sightseeing')) return 'activities';
        if (s.includes('shopping') || s.includes('gift') || s.includes('souvenir') || s.includes('shawl') || s.includes('dry fruit') || s.includes('handicraft')) return 'shopping';
        return null;
    }

    function money(n) {
        const v = Number(n || 0);
        return 'Rs. ' + v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
    function fmtDate(v) {
        if (!v) return '';
        return String(v).slice(0, 10);
    }
    function esc(s) {
        return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
            return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c];
        });
    }
    function optEl(v, label, sel) {
        return `<option value="${esc(v)}" ${sel ? 'selected' : ''}>${esc(label)}</option>`;
    }

    document.addEventListener('DOMContentLoaded', function () {
        const api = window.PTApi;
        if (api && typeof api.requireAuthRedirect === 'function') {
            api.requireAuthRedirect();
        } else if (!api || !api.isAuthenticated()) {
            window.location.href = '/login/';
            return;
        }

        const pathParts = (window.location.pathname || '').split('/').filter(Boolean);
        let tourId = null;
        for (let i = 0; i < pathParts.length; i++) {
            if (pathParts[i] === 'tours' && i + 1 < pathParts.length) {
                const maybe = pathParts[i + 1];
                if (/^\d+$/.test(maybe)) {
                    tourId = maybe;
                    break;
                }
            }
        }
        if (!tourId) {
            try {
                const script = document.getElementById('tourContext');
                if (script) tourId = script.getAttribute('data-tour-id') || null;
            } catch (e) { tourId = null; }
        }
        if (!tourId) {
            api.showMessageBox('Could not determine tour id.', 'error');
            return;
        }

        let state = {
            tour: null,
            members: [],
            expenses: [],
            editingExpenseId: null,
            selectedExpenseReceiptFile: null,
        };

        let viewState = {
            isCreator: false,
            currentUserRole: 'none',
        };

        try {
            const ctxEl = document.getElementById('tourRoleContext');
            if (ctxEl) {
                viewState.isCreator = (ctxEl.getAttribute('data-is-creator') === 'true');
                viewState.currentUserRole = ctxEl.getAttribute('data-role') || 'none';
            }
        } catch (e) {
            viewState.isCreator = false;
            viewState.currentUserRole = 'none';
        }

        const setLink = document.getElementById('settlementLink');
        const aLink = document.getElementById('analyticsLink');
        if (setLink) setLink.href = '/client/tours/' + tourId + '/settlement/';
        if (aLink) aLink.href = '/client/tours/' + tourId + '/analytics/';

        const copyBtn = document.getElementById('copyJoinLinkBtn');

        function memberById(id) {
            for (let i = 0; i < state.members.length; i++) {
                const m = state.members[i];
                const uid = m.user_id || (m.user && m.user.id) || m.id;
                if (uid === id || m.id === id) return m;
            }
            return null;
        }

        function renderTour(t) {
            state.tour = t;
            state.members = (t.members || []).slice();
            if (t.is_creator !== undefined) {
                viewState.isCreator = Boolean(t.is_creator);
            }
            if (api && typeof api.getUser === 'function') {
                const curU = api.getUser();
                if (curU && (curU.id || curU.user_id)) {
                    const cid = curU.id || curU.user_id;
                    const myMem = state.members.find(function (x) {
                        return (x.user_id || (x.user && x.user.id) || x.id) === cid;
                    });
                    if (myMem && (myMem.role === 'creator' || myMem.role === 'admin')) {
                        viewState.isCreator = true;
                    }
                }
            }
            const title = document.getElementById('tourTitle');
            const dates = document.getElementById('tourDates');
            if (title) title.textContent = t.title || 'Untitled Tour';
            if (dates) {
                const s = fmtDate(t.start_date);
                const e = fmtDate(t.end_date);
                dates.textContent = (s && e ? `${s} — ${e}` : (s || e || '')) + (t.destination ? ' • ' + t.destination : '');
            }
            const statB = document.getElementById('statBudget');
            const statS = document.getElementById('statSpent');
            const statR = document.getElementById('statRemaining');
            const statM = document.getElementById('statMembers');
            const budget = Number(t.budget || 0);
            const spent = Number(t.total_spent || 0);
            const rem = budget - spent;
            if (statB) {
                const bVal = money(budget);
                statB.textContent = bVal;
                statB.title = bVal;
            }
            if (statS) {
                const sVal = money(spent);
                statS.textContent = sVal;
                statS.title = sVal;
            }
            if (statR) {
                const rVal = money(rem);
                statR.textContent = rVal;
                statR.title = rVal;
                statR.classList.toggle('text-emerald-600', rem >= 0);
                statR.classList.toggle('dark:text-emerald-400', rem >= 0);
                statR.classList.toggle('text-rose-600', rem < 0);
                statR.classList.toggle('dark:text-rose-400', rem < 0);
            }
            if (statM) {
                statM.textContent = t.member_count || 0;
                statM.title = (t.member_count || 0) + ' members';
            }
            if (t.join_token || t.join_link) {
                const token = t.join_token || '';

                const inlineInp = document.getElementById('inlineJoinLinkInput');
                if (inlineInp) {
                    inlineInp.value = token;
                    inlineInp.dataset.token = token;
                }

                const modalInp = document.getElementById('modalJoinLinkInput');
                if (modalInp) modalInp.value = token;

                const msg = encodeURIComponent(
                    `Hey! Join my tour "${t.title || 'Tour'}" on PayTogether using 6-Digit Join Code: ${token}`
                );
                const waUrl = `https://api.whatsapp.com/send?text=${msg}`;

                const inlineWa = document.getElementById('inlineWhatsappShareBtn');
                if (inlineWa) inlineWa.href = waUrl;

                const modalWa = document.getElementById('modalWhatsappJoinBtn');
                if (modalWa) modalWa.href = waUrl;

                if (copyBtn) {
                    copyBtn.onclick = function (e) {
                        if (e && e.preventDefault) e.preventDefault();
                        if (window.copyTourCodeDirect) window.copyTourCodeDirect(token, copyBtn);
                    };
                }

                const inlineCopyBtn = document.getElementById('inlineCopyJoinLinkBtn');
                if (inlineCopyBtn) {
                    inlineCopyBtn.onclick = function (e) {
                        if (e && e.preventDefault) e.preventDefault();
                        if (token && window.copyTourCodeDirect) {
                            window.copyTourCodeDirect(token, inlineCopyBtn);
                        }
                    };
                }

                const modalCopyBtn = document.getElementById('modalCopyJoinLinkBtn');
                if (modalCopyBtn) {
                    modalCopyBtn.onclick = function (e) {
                        if (e && e.preventDefault) e.preventDefault();
                        if (token && window.copyTourCodeDirect) {
                            window.copyTourCodeDirect(token, modalCopyBtn);
                        }
                    };
                }
            }

            renderMembersList();
            renderModalMembersList();
        }

        function getMemberStats(userId) {
            let paid = 0;
            let share = 0;
            (state.expenses || []).forEach(function (e) {
                const pId = e.paid_by ? (e.paid_by.id || e.paid_by.user_id || e.paid_by) : null;
                if (pId === userId) {
                    paid += parseFloat(e.amount || 0);
                }
                (e.splits || []).forEach(function (sp) {
                    const sId = sp.user_id || (sp.user && sp.user.id) || sp.id;
                    if (sId === userId) {
                        const notes = (e.notes || '').toLowerCase();
                        const title = (e.title || '').toLowerCase();
                        const isOpeningOrAssignedShare = notes.includes('editing member') ||
                                                         notes.includes('initial expense share') ||
                                                         notes.includes('opening balance') ||
                                                         notes.includes('initial paid amount') ||
                                                         title.includes('registration share') ||
                                                         title.includes('opening contribution') ||
                                                         title.includes('tour registration') ||
                                                         title.includes('advance payment');
                        if (isOpeningOrAssignedShare) {
                            share += parseFloat(sp.share_amount || 0);
                        }
                    }
                });
            });
            return { paid: paid, share: share, net: paid - share };
        }

        function renderMembersList() {
            const membersList = document.getElementById('membersList');
            const countBadge = document.getElementById('membersCountBadge');
            if (!membersList) return;
            const members = state.members || [];
            if (countBadge) {
                countBadge.textContent = members.length + (members.length === 1 ? ' Member' : ' Members');
            }
            if (!members.length) {
                membersList.innerHTML = '<p class="text-slate-400 text-sm">No members loaded.</p>';
                return;
            }
            membersList.innerHTML = '';
            members.forEach(function (m, idx) {
                const chip = document.createElement('div');
                const isCreator = (m.role || '') === 'creator';
                const targetUserId = m.user_id || (m.user && m.user.id) || m.id;
                const canRemove = viewState.isCreator && !isCreator;
                const mStats = getMemberStats(targetUserId);

                chip.className = 'p-4 rounded-2xl bg-white member-item-card shadow-sm border border-slate-200/80 transition-all duration-300 expense-row-in flex flex-col gap-3';
                chip.style.animationDelay = (idx * 0.05) + 's';

                const displayName = m.full_name || (m.user && (m.user.first_name ? (m.user.first_name + ' ' + (m.user.last_name || '')).trim() : m.user.full_name)) || (m.user && m.user.phone_number) || m.email || 'Member';
                const subText = (m.email && !m.email.endsWith('@pay-together.dev')) ? m.email : ((m.user && m.user.phone_number) ? m.user.phone_number : (m.email && !m.email.endsWith('@pay-together.dev') ? m.email : ''));
                chip.innerHTML = `
                    <div class="flex items-center justify-between gap-3">
                        <div class="flex items-center gap-3 min-w-0 flex-1">
                            <div class="w-11 h-11 min-w-[44px] shrink-0 rounded-2xl flex items-center justify-center font-black text-sm text-white shadow-md ${isCreator ? 'bg-gradient-to-br from-amber-500 via-orange-500 to-amber-600 avatar-admin-ring' : 'bg-gradient-to-br from-indigo-500 to-purple-600'}">
                                ${esc(((displayName || '?').charAt(0) || '?').toUpperCase())}
                            </div>
                            <div class="min-w-0 flex-1">
                                <div class="font-black text-slate-800 text-sm flex items-center gap-1.5">
                                    <span class="font-bold">${esc(displayName)}</span>
                                    ${isCreator ? '<span class="text-amber-500 text-xs shrink-0" title="Tour Admin / Creator"><i class="fa-solid fa-crown"></i></span>' : ''}
                                </div>
                                <div class="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                                    <span class="font-bold text-[10px] uppercase tracking-wider shrink-0 ${isCreator ? 'text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200' : 'text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200'}">
                                        ${isCreator ? 'Manager' : 'Participant'}
                                    </span>
                                    ${subText ? `<span class="truncate text-slate-400 text-[11px]">${esc(subText)}</span>` : ''}
                                </div>
                            </div>
                        </div>
                        <span class="${isCreator ? 'role-badge-admin' : 'role-badge-member'} text-xs shrink-0 font-bold px-2.5 py-1">
                            ${isCreator ? '<i class="fa-solid fa-shield-halved"></i> Admin' : '<i class="fa-solid fa-user"></i> Member'}
                        </span>
                    </div>

                    <!-- Member Financial Summary: Total Paid, Fair Share, Net -->
                    <div class="grid grid-cols-3 gap-2 px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200/70 text-[11px]">
                        <div>
                            <span class="text-slate-400 font-bold uppercase text-[9px] block">Total Paid</span>
                            <span class="font-black text-emerald-700 text-xs">${money(mStats.paid)}</span>
                        </div>
                        <div class="center">
                            <span class="text-slate-400 font-bold uppercase text-[9px] block">Fair Share</span>
                            <span class="font-black text-indigo-700 text-xs">${money(mStats.share)}</span>
                        </div>
                        <div class="text-right">
                            <span class="text-slate-400 font-bold uppercase text-[9px] block">Net</span>
                            <span class="font-black text-xs ${mStats.net >= 0 ? 'text-emerald-600' : 'text-rose-600'}">
                                ${mStats.net >= 0 ? ('+' + money(mStats.net)) : ('-' + money(Math.abs(mStats.net)))}
                            </span>
                        </div>
                    </div>

                    <div class="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                        <button type="button" class="open-edit-member-btn px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs border border-indigo-200 transition flex items-center gap-1.5 btn-ripple cursor-pointer"
                                data-user-id="${targetUserId}" data-current-role="${m.role}" data-user-name="${esc(displayName || m.email)}" data-user-email="${esc(m.email || '')}">
                            <i class="fa-solid fa-pen-to-square"></i> Edit
                        </button>
                        ${!isCreator ? `
                        <button type="button" class="remove-member-btn px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs border border-rose-200 transition flex items-center gap-1.5 btn-ripple cursor-pointer"
                                data-user-id="${targetUserId}" data-user-name="${esc(displayName || m.email)}" title="Remove this member from tour">
                            <i class="fa-solid fa-trash-can"></i> Delete
                        </button>` : `
                        <span class="text-[11px] font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-xl border border-amber-200">
                            Tour Owner
                        </span>`}
                    </div>
                `;
                membersList.appendChild(chip);
            });

            // Wire up Delete buttons in list
            membersList.querySelectorAll('.remove-member-btn').forEach(function (btn) {
                btn.addEventListener('click', function () {
                    const uid = parseInt(btn.getAttribute('data-user-id'), 10);
                    const mem = state.members.find(function (x) {
                        return (x.user_id || (x.user && x.user.id) || x.id) === uid;
                    });
                    const who = mem ? (mem.full_name || mem.email) : 'member';
                    if (!window.confirm('Are you sure you want to remove ' + who + ' from this tour?')) return;
                    btn.disabled = true;
                    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Removing…';
                    api.apiFetch('/client/tours/api/' + tourId + '/remove-member/', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ user_id: uid }),
                    }).then(function (r) {
                        if (r.ok) {
                            api.showMessageBox(r.data && r.data.message ? r.data.message : 'Member removed.', 'success');
                            if (r.data && r.data.tour) {
                                renderTour(r.data.tour);
                                loadExpenses();
                            } else {
                                loadTour();
                            }
                        } else {
                            api.displayErrorsBox(r.data || r.text || 'Could not remove member.');
                            btn.disabled = false;
                            btn.innerHTML = '<i class="fa-solid fa-trash-can"></i> Delete';
                        }
                    }).catch(function () {
                        api.showMessageBox('Network error removing member.', 'error');
                        btn.disabled = false;
                        btn.innerHTML = '<i class="fa-solid fa-trash-can"></i> Delete';
                    });
                });
            });

            // Wire up Edit Role buttons in list (opens Edit Member Modal)
            membersList.querySelectorAll('.open-edit-member-btn').forEach(function (btn) {
                btn.addEventListener('click', function () {
                    const uid = parseInt(btn.getAttribute('data-user-id'), 10);
                    const currentRole = btn.getAttribute('data-current-role') || 'member';
                    const userName = btn.getAttribute('data-user-name') || 'Member';
                    const userEmail = btn.getAttribute('data-user-email') || '';
                    openEditMemberModal(uid, userName, userEmail, currentRole);
                });
            });
        }

        function renderModalMembersList() {
            const modalMembersList = document.getElementById('modalMembersList');
            const modalMemberCount = document.getElementById('modalMemberCount');
            const members = state.members || [];
            if (modalMemberCount) modalMemberCount.textContent = String(members.length);
            if (!modalMembersList) return;
            if (!members.length) {
                modalMembersList.innerHTML = '<p class="text-slate-400 text-xs py-3 text-center">No members added yet.</p>';
                return;
            }
            modalMembersList.innerHTML = '';
            members.forEach(function (m) {
                const isCreator = (m.role || '') === 'creator';
                const displayName = m.full_name || (m.user && (m.user.first_name ? (m.user.first_name + ' ' + (m.user.last_name || '')).trim() : m.user.full_name)) || (m.user && m.user.phone_number) || m.email || 'Member';
                const subText = (m.email && !m.email.endsWith('@pay-together.dev')) ? m.email : ((m.user && m.user.phone_number) ? m.user.phone_number : '');
                const row = document.createElement('div');
                row.className = 'flex items-center justify-between gap-2.5 p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200/70 transition';
                row.innerHTML = `
                    <div class="flex items-center gap-2.5 min-w-0">
                        <div class="w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs text-white shadow-sm ${isCreator ? 'bg-gradient-to-br from-amber-500 to-amber-600 avatar-admin-ring' : 'bg-gradient-to-br from-indigo-500 to-purple-600'}">
                            ${esc(((displayName || '?').charAt(0) || '?').toUpperCase())}
                        </div>
                        <div class="min-w-0">
                            <p class="font-bold text-slate-800 text-xs truncate flex items-center gap-1">
                                <span class="truncate">${esc(displayName)}</span>
                                ${isCreator ? '<span class="text-amber-500 text-[10px]" title="Admin"><i class="fa-solid fa-crown"></i></span>' : ''}
                            </p>
                            ${subText ? `<p class="text-[10px] text-slate-400 truncate">${esc(subText)}</p>` : ''}
                        </div>
                    </div>
                    <span class="${isCreator ? 'role-badge-admin' : 'role-badge-member'} text-[10px] py-0.5 px-2 shrink-0">
                        ${isCreator ? '<i class="fa-solid fa-shield-halved"></i> Admin' : '<i class="fa-solid fa-user"></i> Member'}
                    </span>
                `;
                modalMembersList.appendChild(row);
            });
        }

        function renderExpenses(items) {
            state.expenses = items || [];
            if (typeof renderMembersList === 'function') {
                renderMembersList();
            }
            const expensesList = document.getElementById('expensesList');
            if (!expensesList) return;
            if (!state.expenses.length) {
                expensesList.innerHTML = '<p class="text-slate-400 text-center py-10">No expenses yet. Click "Add Expense" to record the first one.</p>';
                return;
            }
            expensesList.innerHTML = '';
            state.expenses.forEach(function (exp) {
                const card = document.createElement('div');
                card.className = 'bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 transition hover:border-slate-300';
                const cat = exp.category && typeof exp.category === 'object' ? exp.category : { value: exp.category, label: exp.category };
                const catVal = String(cat.value || cat.label || exp.category || 'other').toLowerCase();
                let catBadgeStyle = 'bg-purple-50 text-purple-700 border border-purple-200';
                if (catVal === 'food') {
                    catBadgeStyle = 'bg-rose-50 text-rose-700 border border-rose-200';
                } else if (catVal === 'transport') {
                    catBadgeStyle = 'bg-blue-50 text-blue-700 border border-blue-200';
                } else if (catVal === 'accommodation') {
                    catBadgeStyle = 'bg-sky-50 text-sky-700 border border-sky-200';
                } else if (catVal === 'activities') {
                    catBadgeStyle = 'bg-emerald-50 text-emerald-700 border border-emerald-200';
                } else if (catVal === 'shopping') {
                    catBadgeStyle = 'bg-pink-50 text-pink-700 border border-pink-200';
                }
                const pm = exp.payment_method && typeof exp.payment_method === 'object' ? exp.payment_method : { value: exp.payment_method, label: exp.payment_method };
                const splits = exp.splits || [];
                const splitsHtml = splits.map(function (sp) {
                    return `<span class="inline-flex items-center gap-1 text-xs text-slate-700 bg-white border border-slate-200 px-2 py-1 rounded-full">${esc(sp.full_name || ('U' + sp.user_id))}: <b>${money(sp.share_amount)}</b></span>`;
                }).join(' ');
                const pb = exp.paid_by || { full_name: '', email: '' };
                const r = exp.receipt;
                let receiptHtml = '';
                if (r && r.url) {
                    const verified = r.verified_at ? '<i class="fa-solid fa-circle-check text-emerald-600"></i> Verified' : 'Pending verify';
                    receiptHtml = `
                        <div class="mt-4 flex flex-wrap items-center gap-3 p-3 bg-white rounded-xl border border-slate-200">
                            <a href="${esc(r.url)}" target="_blank" rel="noopener noreferrer" class="shrink-0">
                                <img src="${esc(r.url)}" alt="Receipt thumbnail" class="w-20 h-20 object-cover rounded-lg border border-slate-200 bg-slate-100" onerror="this.style.display='none'"/>
                            </a>
                            <div class="min-w-0 flex-1">
                                <p class="text-sm font-semibold text-slate-700"><i class="fa-solid fa-receipt text-indigo-500 mr-1"></i> Receipt attached</p>
                                <p class="text-xs text-slate-500">${verified}</p>
                            </div>
                            <div class="flex gap-2 flex-wrap">
                                <button class="receipt-attach-btn text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg px-3 py-1 text-sm font-semibold" data-id="${exp.id}">Replace</button>
                                ${!r.verified_at ? `<button class="receipt-verify-btn text-emerald-700 bg-white hover:bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-1 text-sm font-semibold" data-id="${exp.id}">Verify</button>` : ''}
                            </div>
                        </div>`;
                } else {
                    receiptHtml = `
                        <div class="mt-4 flex items-center justify-between gap-3 p-3 bg-white rounded-xl border border-dashed border-slate-300">
                            <p class="text-sm text-slate-500"><i class="fa-solid fa-receipt text-slate-400 mr-1"></i> No receipt attached</p>
                            <button class="receipt-attach-btn text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg px-3 py-1 text-sm font-semibold" data-id="${exp.id}">Attach Receipt</button>
                        </div>`;
                }
                const actionsHtml = exp.is_owner ? `
                    <div class="flex gap-2">
                        <button class="expense-edit-btn text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg px-3 py-1 text-sm font-semibold" data-id="${exp.id}">Edit</button>
                        <button class="expense-delete-btn text-rose-700 bg-white hover:bg-rose-50 border border-rose-200 rounded-lg px-3 py-1 text-sm font-semibold" data-id="${exp.id}">Delete</button>
                    </div>
                ` : '';
                card.innerHTML = `
                    <div class="flex items-start justify-between gap-4 mb-3">
                        <div class="min-w-0 flex-1">
                            <div class="flex items-center gap-2 mb-1 flex-wrap">
                                <h3 class="text-lg font-bold text-slate-800 truncate">${esc(exp.title || cat.label || 'Expense')}</h3>
                                <span class="text-xs px-2.5 py-0.5 rounded-full font-semibold ${catBadgeStyle}">${esc(cat.label || cat.value)}</span>
                                <span class="text-xs px-2 py-1 rounded-full bg-slate-200 text-slate-700 font-semibold">${esc(pm.label || pm.value)}</span>
                            </div>
                            <p class="text-sm text-slate-500">Paid by <b>${esc(pb.full_name || pb.email || 'Unknown')}</b> • ${fmtDate(exp.paid_at)}</p>
                            ${exp.notes ? `<p class="text-sm text-slate-600 mt-2">${esc(exp.notes)}</p>` : ''}
                        </div>
                        <div class="text-right shrink-0">
                            <p class="text-2xl font-bold text-slate-800">${money(exp.amount)}</p>
                        </div>
                    </div>
                    <div class="flex flex-wrap gap-2 items-center justify-between">
                        <div class="flex flex-wrap gap-2 items-center">${splitsHtml || '<span class="text-xs text-slate-400">No splits loaded</span>'}</div>
                        ${actionsHtml}
                    </div>
                    ${receiptHtml}
                `;
                expensesList.appendChild(card);
            });
            expensesList.querySelectorAll('.expense-edit-btn').forEach(function (btn) {
                btn.addEventListener('click', function () {
                    const id = parseInt(btn.getAttribute('data-id'), 10);
                    const exp = state.expenses.find(x => x.id === id);
                    if (exp) openExpenseModal(exp);
                });
            });
            expensesList.querySelectorAll('.expense-delete-btn').forEach(function (btn) {
                btn.addEventListener('click', function () {
                    const id = parseInt(btn.getAttribute('data-id'), 10);
                    if (!id) return;
                    if (!window.confirm('Delete this expense? This cannot be undone.')) return;
                    api.apiFetch('/client/expenses/api/' + id + '/delete/', { method: 'DELETE' }).then(function (r) {
                        if (r.ok) {
                            api.showMessageBox('Expense deleted.', 'success');
                            loadExpenses();
                            loadSmart();
                            loadLimit();
                        } else {
                            api.displayErrorsBox(r.data || r.text || 'Could not delete expense.');
                        }
                    });
                });
            });
            expensesList.querySelectorAll('.receipt-attach-btn').forEach(function (btn) {
                btn.addEventListener('click', function () {
                    const id = parseInt(btn.getAttribute('data-id'), 10);
                    if (id) openReceiptUploadModal(id);
                });
            });
            expensesList.querySelectorAll('.receipt-verify-btn').forEach(function (btn) {
                btn.addEventListener('click', function () {
                    const id = parseInt(btn.getAttribute('data-id'), 10);
                    if (!id) return;
                    api.apiFetch('/client/expenses/api/' + id + '/receipt/verify/', { method: 'POST' }).then(function (r) {
                        if (r.ok) {
                            api.showMessageBox('Receipt verified.', 'success');
                            loadExpenses();
                        } else {
                            api.displayErrorsBox(r.data || r.text || 'Could not verify receipt.');
                        }
                    });
                });
            });
        }

        function ensureReceiptModalMounted() {
            if (document.getElementById('receiptModalWrap')) return;
            const wrap = document.createElement('div');
            wrap.id = 'receiptModalWrap';
            wrap.className = 'fixed inset-0 z-50 hidden';
            wrap.innerHTML = `
                <div id="receiptModalBackdrop" class="absolute inset-0 bg-slate-900/60"></div>
                <div class="absolute inset-0 flex items-center justify-center p-4 md:p-8">
                    <div class="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg">
                        <div class="p-6 border-b border-slate-200 flex items-center justify-between">
                            <h3 id="receiptModalTitle" class="text-2xl font-bold text-slate-800">Attach Receipt</h3>
                            <button id="receiptModalClose" type="button" class="text-slate-500 hover:text-slate-700 text-2xl leading-none">&times;</button>
                        </div>
                        <div id="receiptModalErrors" class="px-6 pt-4"></div>
                        <div class="p-6 space-y-4">
                            <input type="hidden" id="receiptFieldExpenseId" />
                            <div>
                                <label class="block text-sm font-semibold text-slate-700 mb-1">Receipt Image (PNG or JPG, max 5MB)</label>
                                <input type="file" id="receiptFieldImage" accept="image/png,image/jpeg" class="w-full border border-slate-300 rounded-lg p-2 bg-white file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-blue-100 file:text-blue-700 hover:file:bg-blue-200" />
                            </div>
                            <div id="receiptPreviewWrap" class="hidden">
                                <img id="receiptPreviewImg" alt="Preview" class="w-full max-h-60 object-contain rounded-lg border border-slate-200 bg-slate-50" />
                            </div>
                            <div class="flex items-center justify-end gap-3 pt-2">
                                <button type="button" id="receiptModalCancel" class="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 font-semibold">Cancel</button>
                                <button type="button" id="receiptModalSubmit" class="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed">Upload</button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            document.body.appendChild(wrap);
            const bd = document.getElementById('receiptModalBackdrop');
            const cx = document.getElementById('receiptModalClose');
            const cn = document.getElementById('receiptModalCancel');
            bd.addEventListener('click', closeReceiptUploadModal);
            cx.addEventListener('click', closeReceiptUploadModal);
            cn.addEventListener('click', closeReceiptUploadModal);
            const file = document.getElementById('receiptFieldImage');
            file.addEventListener('change', function () {
                const prev = document.getElementById('receiptPreviewImg');
                const prevWrap = document.getElementById('receiptPreviewWrap');
                const f = file.files && file.files[0];
                if (!f || !URL) {
                    prevWrap.classList.add('hidden');
                    return;
                }
                try {
                    const reader = new FileReader();
                    reader.onload = function (e) {
                        prev.src = e.target.result;
                        prevWrap.classList.remove('hidden');
                    };
                    reader.readAsDataURL(f);
                } catch (err) {
                    prevWrap.classList.add('hidden');
                }
            });
            document.getElementById('receiptModalSubmit').addEventListener('click', onReceiptSubmit);
        }

        function openReceiptUploadModal(expenseId) {
            ensureReceiptModalMounted();
            const errorsEl = document.getElementById('receiptModalErrors');
            errorsEl.innerHTML = '';
            document.getElementById('receiptFieldExpenseId').value = String(expenseId);
            document.getElementById('receiptFieldImage').value = '';
            document.getElementById('receiptPreviewWrap').classList.add('hidden');
            document.getElementById('receiptModalWrap').classList.remove('hidden');
        }

        function closeReceiptUploadModal() {
            const w = document.getElementById('receiptModalWrap');
            if (w) w.classList.add('hidden');
        }

        function onReceiptSubmit() {
            const expenseId = document.getElementById('receiptFieldExpenseId').value;
            const files = document.getElementById('receiptFieldImage').files;
            const errorsEl = document.getElementById('receiptModalErrors');
            const submitBtn = document.getElementById('receiptModalSubmit');
            errorsEl.innerHTML = '';
            if (!expenseId) return;
            if (!files || !files[0]) {
                api.displayErrorsBox('Please select a receipt image.', errorsEl);
                return;
            }
            const fd = new FormData();
            fd.append('image', files[0]);
            submitBtn.disabled = true;
            api.apiFetch('/client/expenses/api/' + expenseId + '/receipt/', { method: 'POST', body: fd }).then(function (r) {
                submitBtn.disabled = false;
                if (r.ok && r.data) {
                    api.showMessageBox('Receipt uploaded.', 'success');
                    closeReceiptUploadModal();
                    loadExpenses();
                } else {
                    api.displayErrorsBox(r.data || r.text || 'Could not upload receipt.', errorsEl);
                }
            }).catch(function () {
                submitBtn.disabled = false;
                api.showMessageBox('Network error uploading receipt.', 'error');
            });
        }

        function loadExpenses() {
            const expensesList = document.getElementById('expensesList');
            if (expensesList) expensesList.innerHTML = '<p class="text-slate-400 text-center py-10">Loading expenses…</p>';
            return api.apiFetch('/client/expenses/api/?tour_id=' + encodeURIComponent(tourId), { method: 'GET' }).then(function (r) {
                if (r.ok && r.data) {
                    const items = Array.isArray(r.data) ? r.data : (r.data.results || []);
                    renderExpenses(items);
                    return items;
                }
                if (r && r.status === 403) {
                    api.showMessageBox('You are not authorized to view these expenses.', 'error');
                } else {
                    api.showMessageBox('Could not load expenses.', 'error');
                }
                return [];
            });
        }

        function ensureModalMounted() {
            if (document.getElementById('expenseModalWrap')) return;
            const wrap = document.createElement('div');
            wrap.id = 'expenseModalWrap';
            wrap.className = 'fixed inset-0 z-50 hidden';
            wrap.innerHTML = `
                <div id="expenseModalBackdrop" class="absolute inset-0 bg-slate-900/60"></div>
                <div class="absolute inset-0 flex items-start justify-center p-4 md:p-8 overflow-y-auto">
                    <div id="expenseModalPanel" class="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl my-auto">
                        <div class="p-6 border-b border-slate-200 flex items-center justify-between">
                            <h3 id="expenseModalTitle" class="text-2xl font-bold text-slate-800">Add Expense</h3>
                            <button id="expenseModalClose" type="button" class="text-slate-500 hover:text-slate-700 text-2xl leading-none">&times;</button>
                        </div>
                        <div id="expenseModalErrors" class="px-6 pt-4"></div>
                        <form id="expenseForm" class="p-6 space-y-4">
                            <input type="hidden" id="expenseFieldTourId" />
                            <input type="hidden" id="expenseFieldId" />
                            <div class="relative">
                                <div class="flex items-center justify-between mb-1.5">
                                    <label for="expenseFieldTitle" class="block text-sm font-semibold text-slate-700 dark:text-slate-200">
                                        Title <span class="text-slate-400 font-normal">(select from list or type custom)</span>
                                    </label>
                                    <button type="button" id="expenseTitleSuggestionsToggle" class="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 hover:underline flex items-center gap-1.5 cursor-pointer">
                                        <i class="fa-solid fa-wand-magic-sparkles text-amber-500"></i> <span>Browse Tour Items</span> <span class="text-[10px]" id="browseArrow"><i class="fa-solid fa-chevron-down text-xs"></i></span>
                                    </button>
                                </div>
                                <div class="relative">
                                    <input type="text" id="expenseFieldTitle" list="tourExpenseDatalist" autocomplete="off"
                                           class="w-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 text-sm font-medium transition"
                                           placeholder="Click or type e.g. Breakfast, Fuel, Hotel, Jeep, Dinner..." maxlength="200" />
                                    <datalist id="tourExpenseDatalist"></datalist>

                                    <!-- Dropdown Suggestions Menu -->
                                    <div id="expenseTitleDropdown" class="hidden absolute left-0 right-0 top-full mt-1.5 bg-white dark:bg-[#131b2e] rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 z-50 overflow-hidden text-sm">
                                        <div class="p-2.5 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80 flex items-center justify-between text-xs text-slate-600 dark:text-slate-300 font-bold">
                                            <span class="flex items-center gap-1.5"><i class="fa-solid fa-suitcase-rolling text-indigo-600"></i> Tour Expenses & Items (Click to Auto-fill)</span>
                                            <span class="text-[10px] text-slate-400 font-normal">Auto-sets category</span>
                                        </div>
                                        <div id="expenseTitleDropdownList" class="max-h-56 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800"></div>
                                    </div>
                                </div>

                                <!-- Quick Tour Expense Chips -->
                                <div class="mt-2 flex items-center gap-1.5 flex-wrap" id="expenseTitleQuickChips">
                                    <span class="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mr-1">Quick:</span>
                                    <button type="button" class="exp-preset-chip text-xs px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-indigo-50 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 border border-slate-200 dark:border-slate-700 transition cursor-pointer flex items-center gap-1.5" data-title="Breakfast / Nashta" data-category="food"><i class="fa-solid fa-egg text-amber-500"></i> Breakfast</button>
                                    <button type="button" class="exp-preset-chip text-xs px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-indigo-50 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 border border-slate-200 dark:border-slate-700 transition cursor-pointer flex items-center gap-1.5" data-title="Lunch (Dopahar ka Khana)" data-category="food"><i class="fa-solid fa-bowl-food text-orange-500"></i> Lunch</button>
                                    <button type="button" class="exp-preset-chip text-xs px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-indigo-50 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 border border-slate-200 dark:border-slate-700 transition cursor-pointer flex items-center gap-1.5" data-title="Group Dinner (Raat ka Khana)" data-category="food"><i class="fa-solid fa-utensils text-rose-500"></i> Dinner</button>
                                    <button type="button" class="exp-preset-chip text-xs px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-indigo-50 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 border border-slate-200 dark:border-slate-700 transition cursor-pointer flex items-center gap-1.5" data-title="Fuel / Petrol / Diesel" data-category="transport"><i class="fa-solid fa-gas-pump text-blue-500"></i> Fuel</button>
                                    <button type="button" class="exp-preset-chip text-xs px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-indigo-50 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 border border-slate-200 dark:border-slate-700 transition cursor-pointer flex items-center gap-1.5" data-title="Hotel / Resort Room Booking" data-category="accommodation"><i class="fa-solid fa-hotel text-purple-500"></i> Hotel</button>
                                    <button type="button" class="exp-preset-chip text-xs px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-indigo-50 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 border border-slate-200 dark:border-slate-700 transition cursor-pointer flex items-center gap-1.5" data-title="Jeep Rental / 4x4 Offroad Hire" data-category="transport"><i class="fa-solid fa-car-side text-indigo-500"></i> Jeep</button>
                                    <button type="button" class="exp-preset-chip text-xs px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-indigo-50 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 border border-slate-200 dark:border-slate-700 transition cursor-pointer flex items-center gap-1.5" data-title="Chai / Tea & Coffee" data-category="food"><i class="fa-solid fa-mug-saucer text-amber-600"></i> Chai</button>
                                    <button type="button" class="exp-preset-chip text-xs px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-indigo-50 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 border border-slate-200 dark:border-slate-700 transition cursor-pointer flex items-center gap-1.5" data-title="Sightseeing & Park Entry Ticket" data-category="activities"><i class="fa-solid fa-ticket text-emerald-500"></i> Tickets</button>
                                    <button type="button" class="exp-preset-chip text-xs px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-indigo-50 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 border border-slate-200 dark:border-slate-700 transition cursor-pointer flex items-center gap-1.5" data-title="Toll Plaza & Highway Tax" data-category="transport"><i class="fa-solid fa-road text-slate-600"></i> Toll Tax</button>
                                </div>
                            </div>
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label class="block text-sm font-semibold text-slate-700 mb-1">Amount</label>
                                    <input type="number" id="expenseFieldAmount" step="0.01" min="0.01" class="w-full border border-slate-300 rounded-lg px-3 py-2" placeholder="0.00" required />
                                </div>
                                <div>
                                    <label class="block text-sm font-semibold text-slate-700 mb-1">Paid Date</label>
                                    <input type="date" id="expenseFieldPaidAt" class="w-full border border-slate-300 rounded-lg px-3 py-2" />
                                </div>
                            </div>
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label class="block text-sm font-semibold text-slate-700 mb-1">Category</label>
                                    <select id="expenseFieldCategory" class="w-full border border-slate-300 rounded-lg px-3 py-2" required></select>
                                </div>
                                <div>
                                    <label class="block text-sm font-semibold text-slate-700 mb-1">Payment Method</label>
                                    <select id="expenseFieldPayment" class="w-full border border-slate-300 rounded-lg px-3 py-2" required></select>
                                </div>
                            </div>
                            <div>
                                <label class="block text-sm font-semibold text-slate-700 mb-1">Paid By</label>
                                <select id="expenseFieldPaidBy" class="w-full border border-slate-300 rounded-lg px-3 py-2" required></select>
                            </div>
                            <div>
                                <div class="flex items-center justify-between mb-1">
                                    <label class="block text-sm font-semibold text-slate-700">Split Between</label>
                                    <div class="flex gap-2">
                                        <button type="button" id="expenseSplitSelectAll" class="text-xs font-semibold px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700">Select All</button>
                                        <button type="button" id="expenseSplitClear" class="text-xs font-semibold px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700">Clear</button>
                                        <button type="button" id="expenseSplitEqualize" class="text-xs font-semibold px-2 py-1 rounded bg-blue-100 hover:bg-blue-200 text-blue-700">Equalize Shares</button>
                                    </div>
                                </div>
                                <div id="expenseFieldSplitMembers" class="space-y-2"></div>
                            </div>
                            <div>
                                <label class="block text-sm font-semibold text-slate-700 mb-1">Notes <span class="text-slate-400">(optional)</span></label>
                                <textarea id="expenseFieldNotes" rows="2" class="w-full border border-slate-300 rounded-lg px-3 py-2" placeholder="Any extra details"></textarea>
                            </div>
                            <!-- Receipt Attachment Field -->
                            <div>
                                <div id="expenseModalReceiptBox" class="flex items-center justify-between gap-3 p-3 bg-white rounded-xl border border-dashed border-slate-300">
                                    <p id="expenseModalReceiptLabel" class="text-sm text-slate-500"><i class="fa-solid fa-receipt text-slate-400 mr-1"></i> No receipt attached</p>
                                    <div class="flex items-center gap-2 shrink-0">
                                        <button type="button" id="expenseModalAttachReceiptBtn" class="receipt-attach-btn text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg px-3 py-1 text-sm font-semibold cursor-pointer">Attach Receipt</button>
                                        <button type="button" id="expenseModalRemoveReceiptBtn" class="hidden text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg px-2.5 py-1 text-xs font-semibold cursor-pointer">Remove</button>
                                    </div>
                                    <input type="file" id="expenseModalReceiptInput" accept="image/png,image/jpeg,image/webp,image/jpg" class="hidden" />
                                </div>
                                <div id="expenseModalReceiptPreviewRow" class="hidden mt-2 p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-3">
                                    <a id="expenseModalReceiptPreviewLink" href="#" target="_blank" rel="noopener noreferrer" class="shrink-0">
                                        <img id="expenseModalReceiptPreviewImg" src="" alt="Receipt preview" class="w-16 h-16 object-cover rounded-lg border border-slate-200 bg-white" />
                                    </a>
                                    <div class="min-w-0 flex-1">
                                        <p id="expenseModalReceiptPreviewTitle" class="text-xs font-bold text-slate-700 truncate"></p>
                                        <p id="expenseModalReceiptPreviewSubtitle" class="text-[11px] text-slate-500"></p>
                                    </div>
                                </div>
                            </div>
                            <div class="flex items-center justify-end gap-3 pt-2">
                                <button type="button" id="expenseModalCancel" class="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 font-semibold">Cancel</button>
                                <button type="submit" id="expenseModalSubmit" class="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold">Save Expense</button>
                            </div>
                        </form>
                    </div>
                </div>
            `;
            document.body.appendChild(wrap);
            const bd = document.getElementById('expenseModalBackdrop');
            const cx = document.getElementById('expenseModalClose');
            const cn = document.getElementById('expenseModalCancel');
            bd.addEventListener('click', closeExpenseModal);
            cx.addEventListener('click', closeExpenseModal);
            cn.addEventListener('click', closeExpenseModal);
            const form = document.getElementById('expenseForm');
            form.addEventListener('submit', onExpenseFormSubmit);
            const am = document.getElementById('expenseFieldAmount');
            am.addEventListener('input', function () { updateShareSum(); });
            const selAll = document.getElementById('expenseSplitSelectAll');
            const clear = document.getElementById('expenseSplitClear');
            const eq = document.getElementById('expenseSplitEqualize');
            selAll.addEventListener('click', function () { toggleAllSplit(true); });
            clear.addEventListener('click', function () { toggleAllSplit(false); });
            eq.addEventListener('click', recalcEqualShares);

            const receiptInput = document.getElementById('expenseModalReceiptInput');
            const attachBtn = document.getElementById('expenseModalAttachReceiptBtn');
            const removeBtn = document.getElementById('expenseModalRemoveReceiptBtn');

            if (attachBtn && receiptInput) {
                attachBtn.addEventListener('click', function (e) {
                    e.preventDefault();
                    receiptInput.click();
                });
            }

            if (receiptInput) {
                receiptInput.addEventListener('change', function () {
                    const file = receiptInput.files && receiptInput.files[0];
                    if (!file) return;
                    state.selectedExpenseReceiptFile = file;
                    const label = document.getElementById('expenseModalReceiptLabel');
                    const attach = document.getElementById('expenseModalAttachReceiptBtn');
                    const remove = document.getElementById('expenseModalRemoveReceiptBtn');
                    const prevRow = document.getElementById('expenseModalReceiptPreviewRow');
                    const prevImg = document.getElementById('expenseModalReceiptPreviewImg');
                    const prevLink = document.getElementById('expenseModalReceiptPreviewLink');
                    const prevTitle = document.getElementById('expenseModalReceiptPreviewTitle');
                    const prevSub = document.getElementById('expenseModalReceiptPreviewSubtitle');

                    if (label) label.innerHTML = '<i class="fa-solid fa-receipt text-indigo-600 mr-1"></i> <span class="font-semibold text-slate-800">' + esc(file.name) + '</span>';
                    if (attach) attach.textContent = 'Change';
                    if (remove) remove.classList.remove('hidden');

                    try {
                        const reader = new FileReader();
                        reader.onload = function (ev) {
                            if (prevImg) prevImg.src = ev.target.result;
                            if (prevLink) prevLink.href = ev.target.result;
                            if (prevTitle) prevTitle.textContent = file.name;
                            if (prevSub) prevSub.textContent = (file.size / 1024).toFixed(1) + ' KB · Ready to attach on save';
                            if (prevRow) prevRow.classList.remove('hidden');
                        };
                        reader.readAsDataURL(file);
                    } catch (e) {
                        if (prevRow) prevRow.classList.add('hidden');
                    }
                });
            }

            if (removeBtn) {
                removeBtn.addEventListener('click', function (e) {
                    e.preventDefault();
                    state.selectedExpenseReceiptFile = null;
                    if (receiptInput) receiptInput.value = '';
                    const label = document.getElementById('expenseModalReceiptLabel');
                    const attach = document.getElementById('expenseModalAttachReceiptBtn');
                    const prevRow = document.getElementById('expenseModalReceiptPreviewRow');
                    if (label) label.innerHTML = '<i class="fa-solid fa-receipt text-slate-400 mr-1"></i> No receipt attached';
                    if (attach) attach.textContent = 'Attach Receipt';
                    removeBtn.classList.add('hidden');
                    if (prevRow) prevRow.classList.add('hidden');
                });
            }

            const catSel = document.getElementById('expenseFieldCategory');
            CATEGORY_OPTIONS.forEach(function (c) { catSel.insertAdjacentHTML('beforeend', optEl(c.value, c.label, false)); });
            const pmSel = document.getElementById('expenseFieldPayment');
            PAYMENT_OPTIONS.forEach(function (p) { pmSel.insertAdjacentHTML('beforeend', optEl(p.value, p.label, false)); });

            // Initialize Title suggestions & presets
            initExpenseTitlePresets();
        }

        function initExpenseTitlePresets() {
            const titleInput = document.getElementById('expenseFieldTitle');
            const dropdown = document.getElementById('expenseTitleDropdown');
            const dropdownList = document.getElementById('expenseTitleDropdownList');
            const toggleBtn = document.getElementById('expenseTitleSuggestionsToggle');
            const datalist = document.getElementById('tourExpenseDatalist');
            const browseArrow = document.getElementById('browseArrow');

            // Populate HTML5 datalist
            if (datalist) {
                datalist.innerHTML = TOUR_EXPENSE_PRESETS.map(function (p) {
                    return `<option value="${esc(p.title)}">${esc(p.category)}</option>`;
                }).join('');
            }

            const CAT_LABELS = {
                transport: 'Transport',
                accommodation: 'Accommodation',
                food: 'Food',
                activities: 'Activities',
                shopping: 'Shopping',
                other: 'Other'
            };

            const CAT_BADGES = {
                transport: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800',
                accommodation: 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/60 dark:text-sky-300 dark:border-sky-800',
                food: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800',
                activities: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800',
                shopping: 'bg-pink-50 text-pink-700 border-pink-200 dark:bg-pink-950/60 dark:text-pink-300 dark:border-pink-800',
                other: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-800'
            };

            function renderDropdown(filterText) {
                if (!dropdownList) return;
                const query = String(filterText || '').trim().toLowerCase();
                const items = query
                    ? TOUR_EXPENSE_PRESETS.filter(function (p) {
                        return p.title.toLowerCase().includes(query) || p.category.toLowerCase().includes(query);
                    })
                    : TOUR_EXPENSE_PRESETS;

                if (items.length === 0) {
                    dropdownList.innerHTML = '<div class="p-3 text-xs text-slate-400 text-center">No matching tour item. You can type any custom title!</div>';
                    return;
                }

                let html = '';
                items.forEach(function (item) {
                    const badgeClass = CAT_BADGES[item.category] || CAT_BADGES.other;
                    const badgeLabel = CAT_LABELS[item.category] || item.category;
                    html += `
                        <div class="exp-preset-item flex items-center justify-between px-3.5 py-2.5 hover:bg-indigo-50/70 dark:hover:bg-slate-800/80 cursor-pointer transition select-none"
                             data-title="${esc(item.title)}" data-category="${esc(item.category)}">
                            <div class="flex items-center gap-2.5 min-w-0">
                                <span class="text-xl shrink-0">${item.icon}</span>
                                <span class="font-semibold text-slate-800 dark:text-slate-100 text-sm truncate">${esc(item.title)}</span>
                            </div>
                            <span class="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${badgeClass} shrink-0 ml-2">
                                ${esc(badgeLabel)}
                            </span>
                        </div>
                    `;
                });
                dropdownList.innerHTML = html;

                dropdownList.querySelectorAll('.exp-preset-item').forEach(function (el) {
                    el.addEventListener('mousedown', function (e) {
                        e.preventDefault(); // prevent blur before click
                        const t = el.getAttribute('data-title');
                        const c = el.getAttribute('data-category');
                        applyPreset(t, c);
                    });
                });
            }

            function applyPreset(title, category) {
                if (titleInput) titleInput.value = title;
                const catSel = document.getElementById('expenseFieldCategory');
                if (catSel && category) catSel.value = category;
                hideDropdown();
                const am = document.getElementById('expenseFieldAmount');
                if (am) {
                    setTimeout(function () {
                        try { am.focus(); } catch (e) {}
                    }, 50);
                }
            }

            function showDropdown() {
                if (!dropdown) return;
                renderDropdown(titleInput ? titleInput.value : '');
                dropdown.classList.remove('hidden');
                if (browseArrow) browseArrow.innerHTML = '<i class="fa-solid fa-chevron-up text-xs"></i>';
            }

            function hideDropdown() {
                if (!dropdown) return;
                dropdown.classList.add('hidden');
                if (browseArrow) browseArrow.innerHTML = '<i class="fa-solid fa-chevron-down text-xs"></i>';
            }

            if (titleInput) {
                titleInput.addEventListener('focus', function () {
                    showDropdown();
                });
                titleInput.addEventListener('click', function () {
                    showDropdown();
                });
                titleInput.addEventListener('input', function () {
                    showDropdown();
                    const detected = detectCategoryFromTitle(titleInput.value);
                    if (detected) {
                        const catSel = document.getElementById('expenseFieldCategory');
                        if (catSel) catSel.value = detected;
                    }
                });
                titleInput.addEventListener('keydown', function (e) {
                    if (e.key === 'Escape') {
                        hideDropdown();
                    }
                });
            }

            if (toggleBtn) {
                toggleBtn.addEventListener('click', function (e) {
                    e.preventDefault();
                    e.stopPropagation();
                    if (dropdown && !dropdown.classList.contains('hidden')) {
                        hideDropdown();
                    } else {
                        showDropdown();
                        if (titleInput) titleInput.focus();
                    }
                });
            }

            // Quick-pick chips
            document.querySelectorAll('.exp-preset-chip').forEach(function (chip) {
                chip.addEventListener('click', function (e) {
                    e.preventDefault();
                    const t = chip.getAttribute('data-title');
                    const c = chip.getAttribute('data-category');
                    applyPreset(t, c);
                });
            });

            // Click outside closes dropdown
            document.addEventListener('click', function (e) {
                if (!e.target.closest('#expenseFieldTitle') &&
                    !e.target.closest('#expenseTitleDropdown') &&
                    !e.target.closest('#expenseTitleSuggestionsToggle')) {
                    hideDropdown();
                }
            });
        }

        function toggleAllSplit(on) {
            document.querySelectorAll('#expenseFieldSplitMembers .exp-split-check').forEach(function (cb) {
                cb.checked = !!on;
            });
            renderShareInputs();
            if (on) {
                recalcEqualShares();
            } else {
                document.querySelectorAll('#expenseFieldSplitMembers .exp-split-share').forEach(function (inp) {
                    inp.value = '';
                });
                updateShareSum();
            }
        }

        function renderMemberSelects() {
            const pbSel = document.getElementById('expenseFieldPaidBy');
            pbSel.innerHTML = '';
            state.members.forEach(function (m) {
                const uid = m.user_id || (m.user && m.user.id) || m.id;
                pbSel.insertAdjacentHTML('beforeend', optEl(uid, (m.full_name || m.email || 'User ' + uid), false));
            });
            const splitWrap = document.getElementById('expenseFieldSplitMembers');
            splitWrap.innerHTML = '';
            state.members.forEach(function (m) {
                const uid = m.user_id || (m.user && m.user.id) || m.id;
                const row = document.createElement('div');
                row.className = 'grid grid-cols-12 gap-3 items-center bg-slate-50 p-3 rounded-xl';
                row.innerHTML = `
                    <div class="col-span-5 flex items-center gap-3 min-w-0">
                        <input type="checkbox" class="exp-split-check w-5 h-5 shrink-0" data-id="${uid}" checked />
                        <div class="min-w-0">
                            <div class="font-semibold text-slate-800 truncate">${esc(m.full_name || 'Member')}</div>
                            <div class="text-xs text-slate-500 truncate">${esc(m.email || '')}</div>
                        </div>
                    </div>
                    <div class="col-span-7">
                        <div class="flex items-center gap-2">
                            <span class="text-sm text-slate-500 font-medium">Rs.</span>
                            <input type="number" step="0.01" min="0" class="exp-split-share flex-1 border border-slate-300 rounded-lg px-3 py-2" data-id="${uid}" placeholder="0.00" />
                        </div>
                    </div>
                `;
                splitWrap.appendChild(row);
            });
            splitWrap.querySelectorAll('.exp-split-check').forEach(function (cb) {
                cb.addEventListener('change', function () {
                    renderShareInputs();
                    updateShareSum();
                });
            });
            splitWrap.querySelectorAll('.exp-split-share').forEach(function (inp) {
                inp.addEventListener('input', function () { updateShareSum(); });
            });
            renderShareInputs();
            recalcEqualShares();
        }

        function renderShareInputs() {
            const shareInputs = document.querySelectorAll('#expenseFieldSplitMembers .exp-split-share');
            const checks = document.querySelectorAll('#expenseFieldSplitMembers .exp-split-check');
            shareInputs.forEach(function (inp) {
                const id = inp.getAttribute('data-id');
                const cb = Array.from(checks).find(c => c.getAttribute('data-id') === id);
                const row = inp.closest('.grid');
                if (!row) return;
                inp.disabled = !(cb && cb.checked);
                if (!cb || !cb.checked) inp.value = '';
                row.classList.toggle('opacity-50', !(cb && cb.checked));
            });
        }

        function collectSelectedSplitUserIds() {
            const ids = [];
            document.querySelectorAll('#expenseFieldSplitMembers .exp-split-check').forEach(function (cb) {
                if (cb.checked) ids.push(parseInt(cb.getAttribute('data-id'), 10));
            });
            return ids;
        }

        function recalcEqualShares() {
            let ids = collectSelectedSplitUserIds();
            if (!ids.length) {
                // If none checked, check all and split
                document.querySelectorAll('#expenseFieldSplitMembers .exp-split-check').forEach(function (cb) { cb.checked = true; });
                renderShareInputs();
                ids = collectSelectedSplitUserIds();
            }
            const amtEl = document.getElementById('expenseFieldAmount');
            const raw = parseFloat(amtEl.value);
            const amount = isNaN(raw) ? 0 : raw;
            const n = ids.length;
            if (!n) { updateShareSum(); return; }
            const eachRaw = Math.floor((amount / n) * 100) / 100;
            let sum = 0;
            const inputs = document.querySelectorAll('#expenseFieldSplitMembers .exp-split-share');
            let last = null;
            inputs.forEach(function (inp) {
                const id = parseInt(inp.getAttribute('data-id'), 10);
                const cb = document.querySelector('#expenseFieldSplitMembers .exp-split-check[data-id="' + id + '"]');
                if (cb && cb.checked) {
                    inp.value = eachRaw.toFixed(2);
                    sum += eachRaw;
                    last = inp;
                } else {
                    inp.value = '';
                }
            });
            if (last) {
                const diff = Math.round((amount - sum) * 100) / 100;
                last.value = (parseFloat(last.value) + diff).toFixed(2);
            }
            updateShareSum();
        }

        function updateShareSum() {
            let sum = 0;
            let n = 0;
            document.querySelectorAll('#expenseFieldSplitMembers .exp-split-share').forEach(function (inp) {
                const id = inp.getAttribute('data-id');
                const cb = document.querySelector('#expenseFieldSplitMembers .exp-split-check[data-id="' + id + '"]');
                if (cb && cb.checked && !inp.disabled) {
                    const v = parseFloat(inp.value);
                    if (!isNaN(v) && v > 0) { sum += v; n++; }
                }
            });
            const submit = document.getElementById('expenseModalSubmit');
            if (submit) {
                const amtEl = document.getElementById('expenseFieldAmount');
                const amount = parseFloat(amtEl.value || 0);
                if (n === 0) {
                    // No manual split members selected -> allowed (assigned to payer only)
                    submit.disabled = !(amount > 0);
                } else {
                    // Manual split members selected -> sum must match amount
                    submit.disabled = !(amount > 0 && Math.abs(sum - amount) < 0.01);
                }
            }
        }

        function openExpenseModal(exp) {
            ensureModalMounted();
            renderMemberSelects();
            const titleEl = document.getElementById('expenseModalTitle');
            const errorsEl = document.getElementById('expenseModalErrors');
            const tourIdInput = document.getElementById('expenseFieldTourId');
            const idInput = document.getElementById('expenseFieldId');
            const titleInput = document.getElementById('expenseFieldTitle');
            const amountInput = document.getElementById('expenseFieldAmount');
            const paidAtInput = document.getElementById('expenseFieldPaidAt');
            const catSel = document.getElementById('expenseFieldCategory');
            const pmSel = document.getElementById('expenseFieldPayment');
            const pbSel = document.getElementById('expenseFieldPaidBy');
            const notesInput = document.getElementById('expenseFieldNotes');
            errorsEl.innerHTML = '';
            tourIdInput.value = String(tourId);
            if (exp) {
                state.editingExpenseId = exp.id;
                titleEl.textContent = 'Edit Expense';
                idInput.value = String(exp.id);
                titleInput.value = exp.title || '';
                amountInput.value = Number(exp.amount || 0).toFixed(2);
                if (exp.paid_at) paidAtInput.value = fmtDate(exp.paid_at); else paidAtInput.value = '';
                catSel.value = (exp.category && exp.category.value) || exp.category || 'other';
                pmSel.value = (exp.payment_method && exp.payment_method.value) || exp.payment_method || 'cash';
                const payerId = (exp.paid_by && (exp.paid_by.id || exp.paid_by.user_id || exp.paid_by)) || '';
                pbSel.value = String(payerId);
                notesInput.value = exp.notes || '';
                document.querySelectorAll('#expenseFieldSplitMembers .exp-split-check').forEach(function (cb) { cb.checked = false; });
                const checks = document.querySelectorAll('#expenseFieldSplitMembers .exp-split-check');
                const inputs = document.querySelectorAll('#expenseFieldSplitMembers .exp-split-share');
                const splits = exp.splits || [];
                splits.forEach(function (sp) {
                    const uid = String(sp.user_id || (sp.user && sp.user.id) || sp.id);
                    checks.forEach(function (cb) { if (cb.getAttribute('data-id') === uid) cb.checked = true; });
                    inputs.forEach(function (inp) { if (inp.getAttribute('data-id') === uid) inp.value = Number(sp.share_amount || 0).toFixed(2); });
                });
                renderShareInputs();
                updateShareSum();

                state.selectedExpenseReceiptFile = null;
                const rInp = document.getElementById('expenseModalReceiptInput');
                if (rInp) rInp.value = '';
                const rLbl = document.getElementById('expenseModalReceiptLabel');
                const rAtt = document.getElementById('expenseModalAttachReceiptBtn');
                const rRem = document.getElementById('expenseModalRemoveReceiptBtn');
                const rPrev = document.getElementById('expenseModalReceiptPreviewRow');
                const rImg = document.getElementById('expenseModalReceiptPreviewImg');
                const rLnk = document.getElementById('expenseModalReceiptPreviewLink');
                const rTit = document.getElementById('expenseModalReceiptPreviewTitle');
                const rSub = document.getElementById('expenseModalReceiptPreviewSubtitle');

                if (exp.receipt && exp.receipt.url) {
                    const verified = exp.receipt.verified_at ? '<i class="fa-solid fa-circle-check text-emerald-600"></i> Verified' : 'Pending verify';
                    if (rLbl) rLbl.innerHTML = '<i class="fa-solid fa-receipt text-indigo-500 mr-1"></i> <span class="font-semibold text-slate-700">Receipt attached</span>';
                    if (rAtt) rAtt.textContent = 'Replace';
                    if (rRem) rRem.classList.remove('hidden');
                    if (rImg) rImg.src = exp.receipt.url;
                    if (rLnk) rLnk.href = exp.receipt.url;
                    if (rTit) rTit.textContent = 'Attached Receipt';
                    if (rSub) rSub.textContent = verified;
                    if (rPrev) rPrev.classList.remove('hidden');
                } else {
                    if (rLbl) rLbl.innerHTML = '<i class="fa-solid fa-receipt text-slate-400 mr-1"></i> No receipt attached';
                    if (rAtt) rAtt.textContent = 'Attach Receipt';
                    if (rRem) rRem.classList.add('hidden');
                    if (rPrev) rPrev.classList.add('hidden');
                }
            } else {
                state.editingExpenseId = null;
                titleEl.textContent = 'Add Expense';
                idInput.value = '';
                titleInput.value = '';
                amountInput.value = '';
                paidAtInput.value = new Date().toISOString().slice(0, 10);
                catSel.value = 'other';
                pmSel.value = 'cash';
                const roleEl = document.getElementById('tourRoleContext');
                const serverUid = roleEl ? roleEl.getAttribute('data-user-id') : null;
                const currentUserId = (api.getUser && api.getUser()) ? (api.getUser().id || api.getUser().user_id) : (serverUid || api.currentUserId || '');
                if (currentUserId && pbSel.querySelector('option[value="' + currentUserId + '"]')) {
                    pbSel.value = String(currentUserId);
                }
                notesInput.value = '';
                // Do not auto-check all members or auto-divide shares; only split when user explicitly chooses to
                document.querySelectorAll('#expenseFieldSplitMembers .exp-split-check').forEach(function (cb) { cb.checked = false; });
                renderShareInputs();
                updateShareSum();

                state.selectedExpenseReceiptFile = null;
                const rInp = document.getElementById('expenseModalReceiptInput');
                if (rInp) rInp.value = '';
                const rLbl = document.getElementById('expenseModalReceiptLabel');
                if (rLbl) rLbl.innerHTML = '<i class="fa-solid fa-receipt text-slate-400 mr-1"></i> No receipt attached';
                const rAtt = document.getElementById('expenseModalAttachReceiptBtn');
                if (rAtt) rAtt.textContent = 'Attach Receipt';
                const rRem = document.getElementById('expenseModalRemoveReceiptBtn');
                if (rRem) rRem.classList.add('hidden');
                const rPrev = document.getElementById('expenseModalReceiptPreviewRow');
                if (rPrev) rPrev.classList.add('hidden');
            }
            const wrap = document.getElementById('expenseModalWrap');
            wrap.classList.remove('hidden');
            const titleDropdown = document.getElementById('expenseTitleDropdown');
            if (titleDropdown) titleDropdown.classList.add('hidden');
            setTimeout(function () {
                try {
                    if (exp) {
                        amountInput.focus();
                    } else {
                        titleInput.focus();
                    }
                } catch (e) {}
            }, 50);
        }

        function closeExpenseModal() {
            const wrap = document.getElementById('expenseModalWrap');
            if (wrap) wrap.classList.add('hidden');
            const titleDropdown = document.getElementById('expenseTitleDropdown');
            if (titleDropdown) titleDropdown.classList.add('hidden');
            state.editingExpenseId = null;
        }

        function collectFormPayload() {
            const titleInput = document.getElementById('expenseFieldTitle');
            const amountInput = document.getElementById('expenseFieldAmount');
            const paidAtInput = document.getElementById('expenseFieldPaidAt');
            const catSel = document.getElementById('expenseFieldCategory');
            const pmSel = document.getElementById('expenseFieldPayment');
            const pbSel = document.getElementById('expenseFieldPaidBy');
            const notesInput = document.getElementById('expenseFieldNotes');
            const ids = [];
            const shares = [];
            const checks = document.querySelectorAll('#expenseFieldSplitMembers .exp-split-check');
            const inputs = document.querySelectorAll('#expenseFieldSplitMembers .exp-split-share');
            checks.forEach(function (cb) {
                if (!cb.checked) return;
                const uid = parseInt(cb.getAttribute('data-id'), 10);
                const inp = Array.from(inputs).find(i => i.getAttribute('data-id') === cb.getAttribute('data-id'));
                const v = inp ? parseFloat(inp.value) : NaN;
                if (!isNaN(v) && v > 0) {
                    ids.push(uid);
                    shares.push(Number(v.toFixed(2)));
                }
            });
            const payerId = parseInt(pbSel.value, 10);
            const totalAmt = parseFloat(amountInput.value);
            const allMemberIds = (state.members || []).map(m => m.user_id || (m.user && m.user.id) || m.id).filter(Boolean);
            const resolvedSplitIds = ids.length > 0 ? ids : (allMemberIds.length > 0 ? allMemberIds : [payerId]);
            const payload = {
                tour_id: parseInt(tourId, 10),
                title: (titleInput.value || '').slice(0, 200),
                amount: totalAmt,
                category: catSel.value,
                payment_method: pmSel.value,
                paid_by: payerId,
                split_members: resolvedSplitIds,
                share_amounts: shares.length > 0 ? shares : [],
                notes: notesInput.value || '',
            };
            if (paidAtInput && paidAtInput.value) {
                payload.paid_at = paidAtInput.value + 'T12:00:00Z';
            }
            return payload;
        }

        function onExpenseFormSubmit(e) {
            if (e && e.preventDefault) e.preventDefault();
            const errorsEl = document.getElementById('expenseModalErrors');
            errorsEl.innerHTML = '';
            const payload = collectFormPayload();
            const editingId = state.editingExpenseId ? String(state.editingExpenseId) : '';
            const method = editingId ? 'PATCH' : 'POST';
            const url = editingId ? ('/client/expenses/api/' + editingId + '/') : '/client/expenses/api/create/';
            const submitBtn = document.getElementById('expenseModalSubmit');
            if (submitBtn) submitBtn.disabled = true;
            api.apiFetch(url, { method: method, body: JSON.stringify(payload), contentType: 'application/json' }).then(function (r) {
                if (submitBtn) submitBtn.disabled = false;
                if (r.ok && r.data) {
                    const alerts = r.data.alerts || {};
                    const actor = alerts.actor || {};
                    const paidBy = alerts.paid_by || {};
                    let crossedMsg = null;
                    if (actor.just_crossed) {
                        crossedMsg = `You just exceeded your personal spending limit (spent ${money(actor.total_spent)} of ${money(actor.limit_amount)}).`;
                    } else if (paidBy.just_crossed) {
                        crossedMsg = `Payer exceeded their spending limit (spent ${money(paidBy.total_spent)} of ${money(paidBy.limit_amount)}).`;
                    }
                    api.showMessageBox(editingId ? 'Expense updated.' : 'Expense added.', 'success');
                    if (crossedMsg) {
                        setTimeout(function () { api.showMessageBox(crossedMsg, 'warning'); }, 350);
                    }
                    closeExpenseModal();

                    const savedExpId = (r.data && (r.data.id || (r.data.expense && r.data.expense.id))) || editingId;
                    const chosenReceipt = state.selectedExpenseReceiptFile;

                    function refreshAll() {
                        Promise.all([
                            api.apiFetch('/client/tours/api/' + tourId + '/', { method: 'GET' }),
                            loadExpenses(),
                            loadSmart(),
                            loadLimit(),
                        ]).then(function (resps) {
                            if (resps[0] && resps[0].ok && resps[0].data) renderTour(resps[0].data);
                        });
                    }

                    if (chosenReceipt && savedExpId) {
                        const rfd = new FormData();
                        rfd.append('image', chosenReceipt);
                        api.apiFetch('/client/expenses/api/' + savedExpId + '/receipt/', { method: 'POST', body: rfd }).then(function (recR) {
                            if (recR.ok) {
                                api.showMessageBox('Receipt attached successfully.', 'success');
                            }
                            refreshAll();
                        }).catch(function () {
                            refreshAll();
                        });
                    } else {
                        refreshAll();
                    }
                    return;
                }
                if (r && r.networkError === true && !editingId && window.PTOffline && typeof window.PTOffline.pushPending === 'function') {
                    try {
                        const cid = window.PTOffline.pushPending(payload, { tour_id: parseInt(tourId, 10) });
                        if (cid) {
                            closeExpenseModal();
                            api.showMessageBox('Offline — expense saved locally and will sync when online.', 'warning');
                            refreshOfflineBanner();
                            return;
                        }
                    } catch (qerr) {
                        console.warn('offline queue push failed', qerr);
                    }
                }
                api.displayErrorsBox(r.data || r.text || 'Could not save expense.', errorsEl);
            }).catch(function () {
                if (submitBtn) submitBtn.disabled = false;
                if (!editingId && window.PTOffline && typeof window.PTOffline.pushPending === 'function') {
                    try {
                        const cid = window.PTOffline.pushPending(payload, { tour_id: parseInt(tourId, 10) });
                        if (cid) {
                            closeExpenseModal();
                            api.showMessageBox('Offline — expense saved locally and will sync when online.', 'warning');
                            refreshOfflineBanner();
                            return;
                        }
                    } catch (qerr) {
                        console.warn('offline queue push failed (catch)', qerr);
                    }
                }
                api.showMessageBox('Network error saving expense.', 'error');
            });
        }

        function refreshOfflineBanner() {
            const offline = window.PTOffline;
            const banner = document.getElementById('offlineBanner');
            const badge = document.getElementById('offlineBadge');
            const badgeCount = document.getElementById('offlineBadgeCount');
            const cntEl = document.getElementById('offlinePendingCount');
            if (!offline || typeof offline.pendingCount !== 'function') {
                if (banner) banner.classList.add('hidden');
                if (badge) badge.classList.add('hidden');
                return;
            }
            const n = offline.pendingCount();
            if (cntEl) cntEl.textContent = String(n);
            if (badgeCount) badgeCount.textContent = String(n);
            if (banner) banner.classList.toggle('hidden', n === 0);
            if (badge) badge.classList.toggle('hidden', n === 0);
        }

        const addExpenseBtn = document.getElementById('addExpenseBtn');
        if (addExpenseBtn) {
            addExpenseBtn.addEventListener('click', function () { openExpenseModal(null); });
        }
        const setLimitBtn = document.getElementById('setLimitBtn');
        if (setLimitBtn) {
            setLimitBtn.addEventListener('click', function () { openSetLimitModal(state.currentLimit || null); });
        }

        function renderSmart(smart) {
            const smartEl = document.getElementById('smartInsights');
            const bannerEl = document.getElementById('highSpendBanner');
            if (!smartEl) return;
            if (!smart || !smart.top_categories || !smart.top_categories.length) {
                smartEl.innerHTML = `
                    <div class="space-y-3">
                        <p class="text-slate-600 text-sm"><b>Suggested next category:</b> <span class="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold">${esc(smart && smart.suggested_category ? smart.suggested_category.label : 'Other')}</span></p>
                        <p class="text-xs text-slate-500">${esc(smart && smart.reason ? smart.reason : 'Add your first expense to start seeing smart insights.')}</p>
                    </div>`;
                if (bannerEl) { bannerEl.classList.add('hidden'); bannerEl.innerHTML = ''; }
                return;
            }
            const sc = smart.suggested_category || { value: 'other', label: 'Other' };
            const cats = smart.top_categories || [];
            const high = smart.high_spend_categories || [];
            let catsHtml = '<div class="space-y-2 mt-3">';
            cats.slice(0, 5).forEach(function (c) {
                const label = (c.category && c.category.label) ? c.category.label : c.category;
                const pct = (c.share_pct || 0).toFixed(1);
                const barW = Math.min(100, Math.max(4, c.share_pct || 0));
                const isHigh = (c.share_pct || 0) >= 30;
                catsHtml += `
                    <div>
                        <div class="flex items-center justify-between text-xs mb-1">
                            <span class="font-semibold ${isHigh ? 'text-rose-700' : 'text-slate-700'}">${esc(label)} ${isHigh ? '<i class="fa-solid fa-triangle-exclamation text-rose-500"></i>' : ''}</span>
                            <span class="text-slate-500">${money(c.total)} (${pct}%)</span>
                        </div>
                        <div class="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                            <div class="h-full rounded-full ${isHigh ? 'bg-rose-500' : 'bg-blue-500'}" style="width:${barW}%"></div>
                        </div>
                    </div>
                `;
            });
            catsHtml += '</div>';
            smartEl.innerHTML = `
                <div class="space-y-3">
                    <div>
                        <p class="text-sm text-slate-600"><b>Smart category suggestion:</b>
                            <span class="inline-block ml-1 px-2 py-0.5 rounded bg-blue-100 text-blue-700 font-semibold">${esc(sc.label)}</span>
                        </p>
                        <p class="text-xs text-slate-500 mt-1">${esc(smart.reason || '')}</p>
                        <button type="button" id="smartApplyCategoryBtn" class="mt-2 text-xs font-semibold px-3 py-1 rounded bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200">Use this for next expense</button>
                    </div>
                    <div class="border-t border-slate-200 pt-3">
                        <p class="text-sm font-semibold text-slate-800 mb-1">Where the money went</p>
                        ${catsHtml}
                    </div>
                </div>
            `;
            const applyBtn = document.getElementById('smartApplyCategoryBtn');
            if (applyBtn) {
                applyBtn.addEventListener('click', function () {
                    openExpenseModal(null);
                    const catSel = document.getElementById('expenseFieldCategory');
                    if (catSel) {
                        try { catSel.value = sc.value; } catch (e) {}
                    }
                });
            }
            if (bannerEl) {
                if (high && high.length) {
                    const labels = high.map(function (h) {
                        const lbl = (h.category && h.category.label) ? h.category.label : h.category;
                        const pct = (h.share_pct || 0).toFixed(1);
                        return `${esc(lbl)} (${pct}%)`;
                    });
                    bannerEl.innerHTML = `
                        <div class="flex items-start gap-3">
                            <div class="text-2xl text-rose-600"><i class="fa-solid fa-bell"></i></div>
                            <div>
                                <p class="font-bold text-rose-800">High-spend alert</p>
                                <p class="text-sm text-rose-700 mt-1">These categories represent 30% or more of your tour spending: <b>${labels.join(', ')}</b>. Consider adjusting allocations or adding budget checks before more spending.</p>
                            </div>
                        </div>
                    `;
                    bannerEl.classList.remove('hidden');
                } else {
                    bannerEl.classList.add('hidden');
                    bannerEl.innerHTML = '';
                }
            }
        }

        function loadSmart(hintTitle, hintNotes) {
            const smartEl = document.getElementById('smartInsights');
            if (smartEl) smartEl.innerHTML = '<p class="text-slate-400 text-sm">Loading Smart Expense insights…</p>';
            let url = '/client/tours/api/' + tourId + '/smart/';
            const qs = [];
            if (hintTitle) qs.push('title=' + encodeURIComponent(hintTitle));
            if (hintNotes) qs.push('notes=' + encodeURIComponent(hintNotes));
            if (qs.length) url += '?' + qs.join('&');
            return api.apiFetch(url, { method: 'GET' }).then(function (r) {
                if (r.ok && r.data) {
                    renderSmart(r.data);
                    return r.data;
                }
                if (r && (r.status === 403 || r.status === 404)) {
                    if (smartEl) smartEl.innerHTML = '<p class="text-rose-600 text-sm">You are not authorized to view insights for this tour.</p>';
                } else {
                    if (smartEl) smartEl.innerHTML = '<p class="text-slate-400 text-sm">Smart Expense insights temporarily unavailable.</p>';
                }
                return null;
            });
        }

        function renderLimitAlertBanner(limit) {
            const el = document.getElementById('limitAlertBanner');
            if (!el) return;
            if (!limit || limit.amount === null || limit.amount === undefined) {
                el.classList.add('hidden');
                el.innerHTML = '';
                return;
            }
            const exceeded = !!limit.limit_exceeded;
            const amt = money(limit.amount);
            const spent = money(limit.total_spent || 0);
            const remaining = limit.remaining !== null && limit.remaining !== undefined
                ? money(limit.remaining)
                : amt;
            if (exceeded) {
                const overBy = money((limit.total_spent || 0) - (limit.amount || 0));
                el.innerHTML = `
                    <div class="flex items-start gap-3">
                        <div class="text-2xl text-amber-500"><i class="fa-solid fa-triangle-exclamation"></i></div>
                        <div class="flex-1">
                            <p class="font-bold text-amber-900">Personal expense limit exceeded</p>
                            <p class="text-sm text-amber-800 mt-1">You've spent <b>${spent}</b> of your personal <b>${amt}</b> spending limit on this tour — that's <b>${overBy} over budget</b>. Consider adding a larger limit or reviewing recent expenses.</p>
                        </div>
                        <button type="button" id="limitEditFromBannerBtn" class="text-xs font-semibold px-3 py-1.5 rounded bg-white/80 hover:bg-white text-amber-900 border border-amber-300">Update limit</button>
                    </div>
                `;
                el.classList.remove('hidden');
            } else {
                el.innerHTML = `
                    <div class="flex items-start gap-3">
                        <div class="text-2xl text-emerald-600"><i class="fa-solid fa-circle-check"></i></div>
                        <div class="flex-1">
                            <p class="font-bold text-emerald-900">Within your personal spending limit</p>
                            <p class="text-sm text-emerald-800 mt-1">You've spent <b>${spent}</b> of your personal <b>${amt}</b> limit — <b>${remaining} remaining</b>.</p>
                        </div>
                        <button type="button" id="limitEditFromBannerBtn" class="text-xs font-semibold px-3 py-1.5 rounded bg-white/80 hover:bg-white text-emerald-900 border border-emerald-300">Update limit</button>
                    </div>
                `;
                el.classList.remove('hidden');
            }
            const btn = document.getElementById('limitEditFromBannerBtn');
            if (btn) btn.addEventListener('click', function () { openSetLimitModal(limit); });
        }

        function ensureSetLimitModalMounted(initial) {
            const id = 'ptSetLimitModal';
            if (document.getElementById(id)) return;
            const wrap = document.createElement('div');
            wrap.id = id;
            wrap.className = 'fixed inset-0 z-[60] hidden';
            wrap.innerHTML = `
                <div class="absolute inset-0 bg-slate-900/60 backdrop-blur-sm pt-modal-backdrop"></div>
                <div class="relative z-10 min-h-screen flex items-center justify-center p-4">
                    <div class="bg-white rounded-2xl shadow-2xl w-full max-w-md border border-slate-200 overflow-hidden">
                        <div class="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
                            <h3 class="font-bold text-lg text-slate-800">Set your personal spending limit</h3>
                            <button type="button" class="pt-modal-close text-slate-400 hover:text-slate-700 text-2xl leading-none">&times;</button>
                        </div>
                        <form id="setLimitForm" class="p-6 space-y-4">
                            <div>
                                <label class="block text-sm font-semibold text-slate-700 mb-1">Tour</label>
                                <input id="limitTourName" type="text" disabled class="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-slate-700" />
                            </div>
                            <div>
                                <label for="limitAmount" class="block text-sm font-semibold text-slate-700 mb-1">Personal spending limit (total you want to spend on this tour)</label>
                                <input id="limitAmount" name="amount" type="number" step="0.01" min="0" inputmode="decimal" placeholder="e.g. 500.00" class="w-full rounded-lg border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" required />
                                <p class="mt-1 text-xs text-slate-500">Tip: this limit is personal to you — each tour member sets their own limit separately.</p>
                            </div>
                            <div id="limitFormErrors" class="hidden text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded p-2"></div>
                            <div class="flex items-center justify-end gap-2 pt-2">
                                <button type="button" class="pt-modal-close px-4 py-2 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-100 border border-slate-200">Cancel</button>
                                <button type="submit" id="limitFormSubmit" class="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 border border-blue-700 shadow-sm">Save limit</button>
                            </div>
                        </form>
                    </div>
                </div>
            `;
            document.body.appendChild(wrap);
            function closeModal() {
                wrap.classList.add('hidden');
                wrap.querySelectorAll('input, textarea').forEach(function (el) { if (el.id !== 'limitTourName') try { el.value = ''; } catch (e) {} });
                const errorsEl = document.getElementById('limitFormErrors');
                if (errorsEl) { errorsEl.classList.add('hidden'); errorsEl.textContent = ''; }
            }
            wrap.querySelectorAll('.pt-modal-close, .pt-modal-backdrop').forEach(function (el) {
                el.addEventListener('click', closeModal);
            });
            wrap.addEventListener('click', function (e) {
                if (e.target === wrap) closeModal();
            });
            const form = document.getElementById('setLimitForm');
            form.addEventListener('submit', function (e) {
                e.preventDefault();
                const errorsEl = document.getElementById('limitFormErrors');
                if (errorsEl) { errorsEl.classList.add('hidden'); errorsEl.textContent = ''; }
                const amountRaw = document.getElementById('limitAmount').value;
                const amount = amountRaw === '' ? NaN : Number(amountRaw);
                if (Number.isNaN(amount) || amount < 0) {
                    if (errorsEl) { errorsEl.textContent = 'Enter a valid limit (0 or higher).'; errorsEl.classList.remove('hidden'); }
                    return;
                }
                const submitBtn = document.getElementById('limitFormSubmit');
                if (submitBtn) submitBtn.disabled = true;
                api.apiFetch('/client/expenses/api/limits/', {
                    method: 'PUT',
                    contentType: 'application/json',
                    body: JSON.stringify({ tour_id: tourId, amount: amount }),
                }).then(function (r) {
                    if (submitBtn) submitBtn.disabled = false;
                    if (r.ok && r.data) {
                        api.showMessageBox('Your personal spending limit has been saved.', 'success');
                        closeModal();
                        renderLimitAlertBanner(r.data);
                    } else {
                        api.displayErrorsBox(r.data || r.text || 'Could not save limit.', errorsEl || null);
                    }
                }).catch(function () {
                    if (submitBtn) submitBtn.disabled = false;
                    api.showMessageBox('Network error saving limit.', 'error');
                });
            });
        }

        function openSetLimitModal(initial) {
            ensureSetLimitModalMounted(initial || null);
            const wrap = document.getElementById('ptSetLimitModal');
            if (!wrap) return;
            const titleInput = document.getElementById('limitTourName');
            const amtInput = document.getElementById('limitAmount');
            if (titleInput) titleInput.value = state.tourTitle || '';
            if (amtInput && initial && initial.amount !== null && initial.amount !== undefined) {
                amtInput.value = (typeof initial.amount === 'number') ? initial.amount.toFixed(2) : Number(initial.amount).toFixed(2);
            }
            wrap.classList.remove('hidden');
            setTimeout(function () { try { if (amtInput) amtInput.focus(); } catch (e) {} }, 50);
        }

        function loadLimit() {
            return api.apiFetch('/client/expenses/api/limits/?tour_id=' + encodeURIComponent(tourId), { method: 'GET' }).then(function (r) {
                if (r.ok && r.data) {
                    renderLimitAlertBanner(r.data);
                    state.currentLimit = r.data || null;
                    return r.data;
                }
                if (r && (r.status === 403 || r.status === 404)) {
                    api.showMessageBox('You are not authorized to manage a limit on this tour.', 'error');
                }
                return null;
            });
        }

        function loadAll() {
            api.apiFetch('/client/tours/api/' + tourId + '/', { method: 'GET' }).then(function (res) {
                if (res && res.ok && res.data) {
                    renderTour(res.data);
                } else if (res && (res.status === 403 || res.status === 404)) {
                    api.showMessageBox('You are not authorized to view this tour.', 'error');
                } else {
                    api.showMessageBox('Could not load tour details.', 'error');
                }
            }).catch(function (err) {
                console.warn('Error loading tour details:', err);
            });

            try { loadExpenses(); } catch (e) { console.warn('loadExpenses err:', e); }
            try { loadSmart(); } catch (e) { console.warn('loadSmart err:', e); }
            try { loadLimit(); } catch (e) { console.warn('loadLimit err:', e); }
        }

        function openAddMemberModal() {
            const m = document.getElementById('addMemberModal');
            if (!m) return;
            const input = document.getElementById('inviteIdentifier');
            const errs = document.getElementById('inviteModalErrors');
            const hints = document.getElementById('inviteModalHints');
            const totalPaidInput = document.getElementById('inviteTotalPaid');
            const fairShareInput = document.getElementById('inviteFairShare');
            const previewEl = document.getElementById('inviteBalancePreview');
            const netText = document.getElementById('inviteNetPreviewText');

            if (input) { input.value = ''; setTimeout(function () { try { input.focus(); } catch (e) {} }, 50); }
            if (totalPaidInput) totalPaidInput.value = '';
            if (fairShareInput) fairShareInput.value = '';
            if (previewEl) previewEl.classList.add('hidden');
            if (errs) { errs.classList.add('hidden'); errs.innerHTML = ''; }
            if (hints) { hints.classList.add('hidden'); hints.innerHTML = ''; }

            function updateInvitePreview() {
                if (!previewEl || !netText) return;
                const pVal = parseFloat(totalPaidInput ? totalPaidInput.value : 0) || 0;
                const sVal = parseFloat(fairShareInput ? fairShareInput.value : 0) || 0;
                if (pVal > 0 || sVal > 0) {
                    const net = pVal - sVal;
                    previewEl.classList.remove('hidden');
                    const sign = net >= 0 ? '+' : '-';
                    const badgeClass = net >= 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800';
                    const note = net > 0 ? ' (Gets refund)' : (net < 0 ? ' (Needs to pay)' : ' (Balanced)');
                    netText.className = 'text-xs font-black px-2.5 py-1 rounded-lg ' + badgeClass;
                    netText.textContent = sign + money(Math.abs(net)) + note;
                } else {
                    previewEl.classList.add('hidden');
                }
            }

            if (totalPaidInput) totalPaidInput.oninput = updateInvitePreview;
            if (fairShareInput) fairShareInput.oninput = updateInvitePreview;

            try {
                renderModalMembersList();
            } catch (e) {
                console.warn('renderModalMembersList non-fatal:', e);
            }
            m.classList.remove('hidden');
            m.style.display = 'block';
        }

        function closeAddMemberModal() {
            const m = document.getElementById('addMemberModal');
            if (m) {
                m.classList.add('hidden');
                m.style.display = 'none';
            }
        }

        let currentEditingUserId = null;

        function openEditMemberModal(userId, name, email, currentRole) {
            currentEditingUserId = userId;
            const modal = document.getElementById('editMemberModal');
            if (!modal) return;

            const nameEl = document.getElementById('editModalName');
            const nameInput = document.getElementById('editModalNameInput');
            const emailEl = document.getElementById('editModalEmail');
            const avatarEl = document.getElementById('editModalAvatar');
            const errEl = document.getElementById('editModalErrors');

            if (nameEl) nameEl.textContent = name || 'Member';
            if (nameInput) {
                nameInput.value = (name && name !== 'Member' && name !== email) ? name : (name || '');
                nameInput.oninput = function () {
                    if (avatarEl) {
                        const val = nameInput.value.trim();
                        const initial = ((val || email || '?').charAt(0) || '?').toUpperCase();
                        avatarEl.textContent = initial;
                    }
                };
            }
            if (emailEl) emailEl.textContent = email || '';
            if (avatarEl) {
                const initial = ((name || email || '?').charAt(0) || '?').toUpperCase();
                avatarEl.textContent = initial;
            }
            if (errEl) {
                errEl.classList.add('hidden');
                errEl.textContent = '';
            }

            // Populate financial inputs for edited member
            const paidInput = document.getElementById('editModalPaidInput');
            const shareInput = document.getElementById('editModalShareInput');
            const netPreview = document.getElementById('editModalNetPreview');
            const mStats = getMemberStats(userId);

            if (paidInput) paidInput.value = mStats.paid ? Number(mStats.paid).toFixed(2) : '0.00';
            if (shareInput) shareInput.value = mStats.share ? Number(mStats.share).toFixed(2) : '0.00';

            function updateEditNetPreview() {
                if (!netPreview) return;
                const p = parseFloat(paidInput ? paidInput.value : 0) || 0;
                const s = parseFloat(shareInput ? shareInput.value : 0) || 0;
                const net = p - s;
                const sign = net >= 0 ? '+' : '-';
                const note = net > 0 ? ' (Gets refund)' : (net < 0 ? ' (Needs to pay)' : ' (Balanced)');
                const badgeClass = net >= 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800';
                netPreview.className = 'text-xs font-black px-2.5 py-1 rounded-lg ' + badgeClass;
                netPreview.textContent = sign + money(Math.abs(net)) + note;
            }

            if (paidInput) paidInput.oninput = updateEditNetPreview;
            if (shareInput) shareInput.oninput = updateEditNetPreview;
            updateEditNetPreview();

            const radMember = document.getElementById('editRoleMember');
            const radAdmin = document.getElementById('editRoleAdmin');
            if (currentRole === 'creator') {
                if (radAdmin) radAdmin.checked = true;
            } else {
                if (radMember) radMember.checked = true;
            }

            modal.classList.remove('hidden');
            modal.style.display = 'block';
            if (nameInput) {
                setTimeout(function () {
                    nameInput.focus();
                    nameInput.select();
                }, 50);
            }
        }

        function closeEditMemberModal() {
            currentEditingUserId = null;
            const modal = document.getElementById('editMemberModal');
            if (modal) {
                modal.classList.add('hidden');
                modal.style.display = 'none';
            }
        }

        // Expose modal open/close functions globally on window for inline onclick handlers
        window.openAddMemberModal = openAddMemberModal;
        window.closeAddMemberModal = closeAddMemberModal;
        window.openEditMemberModal = openEditMemberModal;
        window.closeEditMemberModal = closeEditMemberModal;

        const addBtn = document.getElementById('addMemberBtn');
        if (addBtn) {
            addBtn.addEventListener('click', openAddMemberModal);
        }
        const closeInvX = document.getElementById('addMemberModalClose');
        if (closeInvX) closeInvX.addEventListener('click', closeAddMemberModal);
        document.querySelectorAll('[data-close-add-member]').forEach(function (el) {
            el.addEventListener('click', closeAddMemberModal);
        });

        const editCloseX = document.getElementById('editMemberModalClose');
        if (editCloseX) editCloseX.addEventListener('click', closeEditMemberModal);
        document.querySelectorAll('[data-close-edit-member]').forEach(function (el) {
            el.addEventListener('click', closeEditMemberModal);
        });

        const editSaveBtn = document.getElementById('editModalSaveBtn');
        if (editSaveBtn) {
            editSaveBtn.addEventListener('click', function () {
                if (!currentEditingUserId) return;
                let selectedRole = 'member';
                const radAdmin = document.getElementById('editRoleAdmin');
                if (radAdmin && radAdmin.checked) selectedRole = 'creator';

                const nameInput = document.getElementById('editModalNameInput');
                const newName = nameInput ? nameInput.value.trim() : '';

                const paidInput = document.getElementById('editModalPaidInput');
                const shareInput = document.getElementById('editModalShareInput');
                const newPaid = paidInput ? (parseFloat(paidInput.value) || 0) : 0;
                const newShare = shareInput ? (parseFloat(shareInput.value) || 0) : 0;

                editSaveBtn.disabled = true;
                const origText = editSaveBtn.innerHTML;
                editSaveBtn.textContent = 'Saving…';
                const errEl = document.getElementById('editModalErrors');
                if (errEl) { errEl.classList.add('hidden'); errEl.textContent = ''; }

                api.apiFetch('/client/tours/api/' + tourId + '/change-role/', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        user_id: currentEditingUserId,
                        role: selectedRole,
                        full_name: newName,
                        total_paid: newPaid,
                        fair_share: newShare,
                    }),
                }).then(function (r) {
                    editSaveBtn.disabled = false;
                    editSaveBtn.innerHTML = origText;
                    if (r && r.ok) {
                        closeEditMemberModal();
                        try {
                            if (api && typeof api.showMessageBox === 'function') {
                                api.showMessageBox((r.data && r.data.message) ? r.data.message : 'Member updated successfully.', 'success');
                            }
                        } catch (e) { console.warn('showMessageBox err:', e); }

                        try {
                            if (r.data && r.data.tour) {
                                renderTour(r.data.tour);
                            } else {
                                loadTour();
                            }
                            loadExpenses();
                        } catch (e) { console.warn('renderTour err:', e); }
                    } else {
                        const msg = (r && r.data && (r.data.detail || r.data.message)) ? (r.data.detail || r.data.message) : 'Could not save member changes.';
                        if (errEl) {
                            errEl.classList.remove('hidden');
                            errEl.textContent = msg;
                        } else if (api && typeof api.showMessageBox === 'function') {
                            api.showMessageBox(msg, 'error');
                        }
                    }
                }).catch(function (err) {
                    editSaveBtn.disabled = false;
                    editSaveBtn.innerHTML = origText;
                    console.error('Error saving member:', err);
                    if (errEl) {
                        errEl.classList.remove('hidden');
                        errEl.textContent = (err && err.message) ? err.message : 'Network error saving member.';
                    }
                });
            });
        }

        const editDelBtn = document.getElementById('editModalDeleteBtn');
        if (editDelBtn) {
            editDelBtn.addEventListener('click', function () {
                if (!currentEditingUserId) return;
                const mem = state.members.find(function (x) {
                    return (x.user_id || (x.user && x.user.id) || x.id) === currentEditingUserId;
                });
                const who = mem ? (mem.full_name || mem.email) : 'this member';
                if (!window.confirm('Are you sure you want to remove ' + who + ' from this tour?')) return;

                editDelBtn.disabled = true;
                const origText = editDelBtn.innerHTML;
                editDelBtn.textContent = 'Removing…';
                const errEl = document.getElementById('editModalErrors');

                api.apiFetch('/client/tours/api/' + tourId + '/remove-member/', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ user_id: currentEditingUserId }),
                }).then(function (r) {
                    editDelBtn.disabled = false;
                    editDelBtn.innerHTML = origText;
                    if (r && r.ok) {
                        closeEditMemberModal();
                        try {
                            if (api && typeof api.showMessageBox === 'function') {
                                api.showMessageBox((r.data && r.data.message) ? r.data.message : 'Member removed from tour.', 'success');
                            }
                        } catch (e) { console.warn('showMessageBox err:', e); }

                        try {
                            if (r.data && r.data.tour) {
                                renderTour(r.data.tour);
                                loadExpenses();
                            } else {
                                loadTour();
                            }
                        } catch (e) { console.warn('renderTour err:', e); }
                    } else {
                        const msg = (r && r.data && (r.data.detail || r.data.message)) ? (r.data.detail || r.data.message) : 'Could not remove member.';
                        if (errEl) {
                            errEl.classList.remove('hidden');
                            errEl.textContent = msg;
                        } else if (api && typeof api.showMessageBox === 'function') {
                            api.showMessageBox(msg, 'error');
                        }
                    }
                }).catch(function (err) {
                    editDelBtn.disabled = false;
                    editDelBtn.innerHTML = origText;
                    console.error('Error removing member:', err);
                    if (errEl) {
                        errEl.classList.remove('hidden');
                        errEl.textContent = (err && err.message) ? err.message : 'Network error removing member.';
                    }
                });
            });
        }
        const invSubmit = document.getElementById('inviteSubmitBtn');
        if (invSubmit) {
            invSubmit.addEventListener('click', function () {
                const input = document.getElementById('inviteIdentifier');
                const errs = document.getElementById('inviteModalErrors');
                const hints = document.getElementById('inviteModalHints');
                const identifier = input ? String(input.value || '').trim() : '';
                let selectedRole = 'member';
                const roleRadios = document.querySelectorAll('input[name="inviteRole"]');
                roleRadios.forEach(function (r) { if (r.checked) selectedRole = r.value; });
                if (errs) { errs.classList.add('hidden'); errs.innerHTML = ''; }
                if (hints) { hints.classList.add('hidden'); hints.innerHTML = ''; }
                if (!identifier) {
                    if (errs) { errs.classList.remove('hidden'); errs.textContent = 'Please enter email or phone number.'; }
                    return;
                }
                const totalPaidInput = document.getElementById('inviteTotalPaid');
                const fairShareInput = document.getElementById('inviteFairShare');
                const totalPaid = totalPaidInput ? (parseFloat(totalPaidInput.value) || 0) : 0;
                const fairShare = fairShareInput ? (parseFloat(fairShareInput.value) || 0) : 0;

                invSubmit.disabled = true;
                invSubmit.textContent = 'Adding…';
                api.apiFetch('/client/tours/api/' + tourId + '/invite/', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        identifier: identifier,
                        role: selectedRole,
                        total_paid: totalPaid,
                        fair_share: fairShare,
                    }),
                }).then(function (r) {
                    invSubmit.disabled = false;
                    invSubmit.textContent = 'Add to Tour';
                    if (r.ok) {
                        api.showMessageBox((r.data && r.data.message) ? r.data.message : 'Member added.', 'success');
                        if (r.data && r.data.tour) {
                            renderTour(r.data.tour);
                            loadExpenses();
                        } else {
                            loadAll();
                        }
                        closeAddMemberModal();
                    } else {
                        if (r.status === 404 && r.data && r.data.state === 'user_not_found') {
                            if (hints) {
                                hints.classList.remove('hidden');
                                hints.textContent = (r.data && r.data.message) || 'This user is not registered yet.';
                            }
                            if (errs) { errs.classList.add('hidden'); errs.innerHTML = ''; }
                        } else {
                            if (errs) {
                                errs.classList.remove('hidden');
                                errs.textContent = (r.data && (r.data.detail || r.data.message)) ? (r.data.detail || r.data.message) : 'Could not add member.';
                            }
                        }
                    }
                }).catch(function () {
                    invSubmit.disabled = false;
                    invSubmit.textContent = 'Add to Tour';
                    api.showMessageBox('Network error inviting member.', 'error');
                });
            });
        }

        const syncBtn = document.getElementById('offlineSyncBtn');
        if (syncBtn && window.PTOffline && typeof window.PTOffline.syncNow === 'function') {
            syncBtn.addEventListener('click', function () {
                syncBtn.disabled = true;
                const origText = syncBtn.textContent;
                syncBtn.textContent = 'Syncing…';
                window.PTOffline.syncNow().then(function (res) {
                    syncBtn.disabled = false;
                    syncBtn.textContent = origText;
                    const done = (res && res.synced) || 0;
                    const remain = (res && res.remaining) || 0;
                    if (done > 0) {
                        api.showMessageBox('Synced ' + String(done) + ' offline expense(s)' + (remain > 0 ? ' — ' + String(remain) + ' still pending.' : '.'), 'success');
                        Promise.all([
                            loadExpenses(),
                            loadSmart(),
                            loadLimit(),
                        ]).then(function () {
                            api.apiFetch('/client/tours/api/' + tourId + '/', { method: 'GET' }).then(function (tr) {
                                if (tr && tr.ok && tr.data) renderTour(tr.data);
                            });
                        });
                    } else if (res && res.error) {
                        api.showMessageBox(res.error, 'error');
                    } else if (remain > 0) {
                        api.showMessageBox(String(remain) + ' expense(s) still pending (invalid items kept for retry).', 'warning');
                    } else {
                        api.showMessageBox('No pending offline expenses.', 'info');
                    }
                    refreshOfflineBanner();
                }).catch(function () {
                    syncBtn.disabled = false;
                    syncBtn.textContent = origText;
                    refreshOfflineBanner();
                });
            });
        }

        refreshOfflineBanner();
        if (window.PTOffline && typeof window.PTOffline.onQueueChanged === 'function') {
            window.PTOffline.onQueueChanged(function () {
                refreshOfflineBanner();
            });
        }

        loadAll();

        // Auto-refresh tour details and members periodically (every 5 seconds)
        setInterval(function () {
            if (document.hidden) return; // don't poll if user is not on this tab
            api.apiFetch('/client/tours/api/' + tourId + '/', { method: 'GET' }).then(function (res) {
                if (res && res.ok && res.data) {
                    const prevCount = (state.members || []).length;
                    const newCount = (res.data.members || []).length;
                    renderTour(res.data);
                    if (newCount > prevCount && prevCount > 0) {
                        try {
                            api.showMessageBox('A new member joined this tour!', 'info');
                        } catch (e) {}
                    }
                }
            }).catch(function () {});
        }, 5000);
    });
})();
