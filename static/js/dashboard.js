(function () {
    "use strict";

    const api = (typeof window !== "undefined" && window.PTApi) ? window.PTApi : null;
    const offline = (typeof window !== "undefined" && window.PTOffline) ? window.PTOffline : null;
    if (!api) {
        console.error("dashboard.js requires api.js (window.PTApi)");
        return;
    }

    const { isAuthenticated, requireAuthRedirect, apiFetch, getUser, setUser, clearTokens } = api;

    document.addEventListener("DOMContentLoaded", function () {
        initDropdowns();
        wireJoinTourModal();

        if (!requireAuthRedirect()) return;

        fillPendingOfflineCard();
        refreshUserProfile();

        if (offline && typeof offline.onQueueChanged === "function") {
            offline.onQueueChanged(function () {
                fillPendingOfflineCard();
            });
        }
    });

    // ----------------------------------------------------------------
    // Pending offline card (uses PTOffline.pendingCount which reads localStorage)
    // ----------------------------------------------------------------
    function fillPendingOfflineCard() {
        const el = document.getElementById("cardPendingOffline");
        if (!el) return;
        const hint = document.getElementById("offlineCardHint");
        let n = 0;
        if (offline && typeof offline.pendingCount === "function") {
            try { n = Number(offline.pendingCount()) || 0; }
            catch (_) { n = 0; }
        } else {
            try {
                const raw = localStorage.getItem("pt_offline_pending_v1");
                if (raw) {
                    const arr = JSON.parse(raw);
                    if (Array.isArray(arr)) n = arr.length;
                }
            } catch (_) {}
        }
        el.textContent = String(n);
        el.dataset.value = String(n);
        if (hint) {
            hint.textContent = n === 0
                ? "Nothing pending. Offline expenses appear here automatically."
                : (n === 1
                    ? "1 expense saved locally. Will auto-sync when online."
                    : String(n) + " expenses saved locally. Will auto-sync when online.");
        }
    }

    // ----------------------------------------------------------------
    // Generic dropdown toggle + click-outside close (bell + profile)
    // ----------------------------------------------------------------
    function initDropdowns() {
        const pairs = [
            { btnId: "bellBtn", panelId: "bellDropdown", wrapId: "bellDropdownWrap" },
            { btnId: "profileBtn", panelId: "profileDropdown", wrapId: "profileDropdownWrap" },
        ];
        pairs.forEach(function (pair) {
            const btn = document.getElementById(pair.btnId);
            const panel = document.getElementById(pair.panelId);
            const wrap = document.getElementById(pair.wrapId);
            if (!btn || !panel) return;
            btn.addEventListener("click", function (ev) {
                ev.stopPropagation();
                const willOpen = panel.classList.contains("hidden");
                // Close all first
                document.querySelectorAll("[id$='Dropdown']").forEach(function (p) {
                    if (p.id.endsWith("Dropdown")) p.classList.add("hidden");
                });
                if (willOpen) {
                    panel.classList.remove("hidden");
                    // If bell, populate notifications lazily
                    if (pair.btnId === "bellBtn") loadBellNotifications();
                }
            });
            if (wrap) {
                wrap.addEventListener("click", function (ev) { ev.stopPropagation(); });
            }
        });
        document.addEventListener("click", function () {
            document.querySelectorAll("[id$='Dropdown']").forEach(function (p) {
                if (p.id.endsWith("Dropdown")) p.classList.add("hidden");
            });
        });
    }

    // ----------------------------------------------------------------
    // Bell dropdown: load top 5 unread/read notifications via API
    // ----------------------------------------------------------------
    function loadBellNotifications() {
        const wrap = document.getElementById("bellDropdownList");
        if (!wrap) return;
        wrap.innerHTML = '<p class="px-4 py-6 text-sm text-slate-400 text-center">Loading…</p>';
        apiFetch("/client/notifications/api/?page_size=5", { method: "GET" }).then(function (r) {
            if (!r.ok) {
                wrap.innerHTML = '<p class="px-4 py-6 text-sm text-slate-400 text-center">Could not load notifications.</p>';
                return;
            }
            let items = [];
            const d = r.data || {};
            if (Array.isArray(d)) items = d;
            else if (Array.isArray(d.results)) items = d.results;
            if (items.length === 0) {
                wrap.innerHTML = '<p class="px-4 py-6 text-sm text-slate-400 text-center">No recent notifications.</p>';
                return;
            }
            const TYPE_LABELS = {
                new_expense: '<i class="fa-solid fa-receipt mr-1"></i> Expense',
                member_joined: '<i class="fa-solid fa-user-plus mr-1"></i> Member',
                limit_exceeded: '<i class="fa-solid fa-triangle-exclamation mr-1"></i> Limit',
            };
            const TYPE_TINT = {
                new_expense: "bg-blue-50 text-blue-700",
                member_joined: "bg-emerald-50 text-emerald-700",
                limit_exceeded: "bg-amber-50 text-amber-700",
            };
            const html = items.map(function (n) {
                const t = (n && n.type) || "";
                const isRead = !!(n && n.is_read);
                const title = (n && n.title) || "Notification";
                const msg = (n && n.message) || "";
                const label = TYPE_LABELS[t] || '<i class="fa-solid fa-bell mr-1"></i> Info';
                const tint = TYPE_TINT[t] || "bg-slate-50 text-slate-700";
                return (
                    '<div class="px-4 py-3 ' + (isRead ? "" : "bg-sky-50/60") + ' hover:bg-slate-50 cursor-pointer notif-row" data-id="' + ((n && n.id) || "") + '">' +
                        '<div class="flex items-start gap-3">' +
                            '<span class="inline-flex shrink-0 items-center px-2 py-0.5 rounded text-xs font-bold ' + tint + '">' + label + '</span>' +
                            '<div class="min-w-0 flex-1">' +
                                '<p class="text-sm font-semibold text-slate-800 ' + (isRead ? "" : "") + '">' + esc(title) + (isRead ? "" : ' <i class="fa-solid fa-circle text-[7px] text-rose-500 ml-1"></i>') + '</p>' +
                                (msg ? '<p class="text-xs text-slate-500 mt-1 line-clamp-2">' + esc(msg) + '</p>' : '') +
                            '</div>' +
                        '</div>' +
                    '</div>'
                );
            }).join("");
            wrap.innerHTML = html;
            // Wire click-to-mark-as-read on rows
            wrap.querySelectorAll(".notif-row").forEach(function (row) {
                row.addEventListener("click", function () {
                    const id = row.getAttribute("data-id");
                    if (id) markOneRead(id);
                });
            });
            // Update badge count on bell + unread card to stay in sync
            refreshUnreadCounts();
        }).catch(function () {
            wrap.innerHTML = '<p class="px-4 py-6 text-sm text-slate-400 text-center">Network error loading notifications.</p>';
        });
    }

    function markOneRead(id) {
        if (!id) return;
        apiFetch("/client/notifications/api/mark-read/", {
            method: "POST",
            body: JSON.stringify({ ids: [Number(id)] }),
            contentType: "application/json",
        }).then(function () {
            refreshUnreadCounts();
        }).catch(function () {});
    }

    function refreshUnreadCounts() {
        const badge = document.getElementById("bellBadge");
        const card = document.getElementById("cardUnreadNotifs");
        apiFetch("/client/notifications/api/count/", { method: "GET" }).then(function (r) {
            if (!r.ok) return;
            const n = Number((r.data && r.data.unread) != null ? r.data.unread : (r.data && r.data.count)) || 0;
            if (badge) {
                badge.textContent = String(n);
                badge.dataset.count = String(n);
                badge.classList.toggle("hidden", n === 0);
            }
            if (card) {
                card.textContent = String(n);
                card.dataset.value = String(n);
            }
        }).catch(function () {});
    }

    // ----------------------------------------------------------------
    // User profile async refresh (keeps names in UI consistent)
    // ----------------------------------------------------------------
    function refreshUserProfile() {
        apiFetch("/client/api/profile/", { method: "GET" }).then(function (r) {
            if (r.ok && r.data) {
                const u = r.data;
                setUser(u);
            }
        }).catch(function () {});
    }

    // ----------------------------------------------------------------
    // Join Tour modal (open / close / submit)
    // ----------------------------------------------------------------
    function wireJoinTourModal() {
        const modal = document.getElementById("joinTourModal");
        if (!modal) return;
        const openBtns = [
            document.getElementById("openJoinTourBtn"),
            document.getElementById("emptyJoinTourBtn"),
        ].filter(Boolean);
        const closeBtns = [
            document.getElementById("joinTourModalClose"),
        ].concat(Array.prototype.slice.call(modal.querySelectorAll("[data-close-join-modal]")));
        const input = document.getElementById("joinTourToken");
        const errors = document.getElementById("joinTourModalErrors");
        const submit = document.getElementById("joinTourSubmitBtn");

        openBtns.forEach(function (b) {
            b.addEventListener("click", function () { openModal(); });
        });
        closeBtns.forEach(function (b) {
            b.addEventListener("click", function () { closeModal(); });
        });
        document.addEventListener("keydown", function (ev) {
            if (ev.key === "Escape" && !modal.classList.contains("hidden")) closeModal();
        });

        function openModal() {
            modal.classList.remove("hidden");
            modal.setAttribute("aria-hidden", "false");
            hideErrors();
            setTimeout(function () { if (input) input.focus(); }, 30);
        }
        function closeModal() {
            modal.classList.add("hidden");
            modal.setAttribute("aria-hidden", "true");
            hideErrors();
        }
        function hideErrors() {
            if (errors) { errors.classList.add("hidden"); errors.innerHTML = ""; }
        }
        function showErrors(msg) {
            if (!errors) return;
            errors.classList.remove("hidden");
            errors.textContent = msg || "";
        }
        if (submit) {
            submit.addEventListener("click", function () {
                const token = (input && input.value || "").trim();
                if (!token) {
                    showErrors("Please paste a join link or token.");
                    return;
                }
                submit.disabled = true;
                const orig = submit.textContent;
                submit.textContent = "Joining…";
                hideErrors();
                apiFetch("/client/tours/api/join/", {
                    method: "POST",
                    body: JSON.stringify({ join_token: token }),
                    contentType: "application/json",
                }).then(function (r) {
                    submit.disabled = false;
                    submit.textContent = orig;
                    if (r.ok && r.data) {
                        const d = r.data;
                        const tourId = (d.tour && d.tour.id) || d.tour_id || null;
                        if (d.already_member) {
                            api.showMessageBox(
                                "You are already a member/creator of this tour. To add a new member, share this code with another user or friend!",
                                "info"
                            );
                        } else {
                            api.showMessageBox(
                                d.detail || d.message || "Successfully joined the tour!",
                                "success"
                            );
                        }
                        closeModal();
                        setTimeout(function () {
                            if (tourId) {
                                window.location.href = "/client/tours/" + String(tourId) + "/";
                            } else {
                                window.location.reload();
                            }
                        }, 500);
                        return;
                    }
                    // Handle validation errors
                    const d = r.data || {};
                    let msg = (typeof d === "string") ? d : (d.detail || d.non_field_errors || "Could not join.");
                    if (Array.isArray(d.join_token)) msg = d.join_token.join(" ");
                    else if (typeof d.join_token === "string") msg = d.join_token;
                    showErrors(String(msg || "Join failed. Please check the link/token."));
                }).catch(function () {
                    submit.disabled = false;
                    submit.textContent = orig;
                    showErrors("Network error. Please try again.");
                });
            });
        }
        if (input) {
            input.addEventListener("keydown", function (ev) {
                if (ev.key === "Enter" && submit) submit.click();
            });
        }
    }

    // ----------------------------------------------------------------
    // Small helpers
    // ----------------------------------------------------------------
    function esc(str) {
        if (str == null) return "";
        return String(str)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#39;");
    }
})();
