(function (global) {
    "use strict";

    const ACCESS_KEY = "pt_access_token";
    const REFRESH_KEY = "pt_refresh_token";
    const USER_KEY = "pt_user";

    function getTokens() {
        return {
            access: localStorage.getItem(ACCESS_KEY) || null,
            refresh: localStorage.getItem(REFRESH_KEY) || null,
        };
    }

    function setTokens(tokens) {
        if (tokens && typeof tokens.access === "string") {
            localStorage.setItem(ACCESS_KEY, tokens.access);
        }
        if (tokens && typeof tokens.refresh === "string") {
            localStorage.setItem(REFRESH_KEY, tokens.refresh);
        }
    }

    function clearTokens() {
        localStorage.removeItem(ACCESS_KEY);
        localStorage.removeItem(REFRESH_KEY);
        localStorage.removeItem(USER_KEY);
    }

    function getUser() {
        try {
            const raw = localStorage.getItem(USER_KEY);
            if (raw) return JSON.parse(raw);
            if (typeof window !== "undefined" && window.DJANGO_USER) return window.DJANGO_USER;
            return null;
        } catch (e) {
            if (typeof window !== "undefined" && window.DJANGO_USER) return window.DJANGO_USER;
            return null;
        }
    }

    function setUser(user) {
        if (user) {
            localStorage.setItem(USER_KEY, JSON.stringify(user));
        }
    }

    function authHeaders(extra) {
        const headers = Object.assign({}, extra || {});
        const t = getTokens();
        if (t.access) {
            headers["Authorization"] = "Bearer " + t.access;
        }
        return headers;
    }

    function getCookie(name) {
        if (!document || !document.cookie) return null;
        const parts = document.cookie.split(";");
        for (let i = 0; i < parts.length; i++) {
            let p = parts[i];
            while (p.charAt(0) === " ") p = p.substring(1);
            if (p.substring(0, name.length + 1) === (name + "=")) {
                try { return decodeURIComponent(p.substring(name.length + 1)); } catch (_) { return p.substring(name.length + 1); }
            }
        }
        return null;
    }

    function isAuthenticated() {
        if (getTokens().access) return true;
        if (typeof window !== "undefined" && window.DJANGO_USER && window.DJANGO_USER.isAuthenticated) {
            return true;
        }
        return false;
    }

    function requireAuthRedirect(fallback) {
        if (typeof window !== "undefined" && window.DJANGO_USER && window.DJANGO_USER.isAuthenticated) {
            return true;
        }
        if (!isAuthenticated()) {
            window.location.href = fallback || "/login/";
            return false;
        }
        return true;
    }

    async function apiFetch(url, options) {
        options = options || {};
        const opts = Object.assign({}, options);
        const method = (opts.method || "GET").toUpperCase();
        const isMultipart = opts.body && (opts.body instanceof FormData);
        const baseHeaders = {};
        if (!isMultipart && opts.body) {
            if (!(opts.headers && opts.headers["Content-Type"])) {
                baseHeaders["Content-Type"] = "application/json";
            }
            if (typeof opts.body !== "string") {
                opts.body = JSON.stringify(opts.body);
            }
        }
        opts.headers = authHeaders(Object.assign(baseHeaders, opts.headers || {}));
        if (method !== "GET" && method !== "HEAD" && method !== "OPTIONS") {
            const csrf = getCookie("csrftoken");
            if (csrf && !opts.headers["X-CSRFToken"]) {
                opts.headers["X-CSRFToken"] = csrf;
            }
        }
        opts.credentials = opts.credentials || "same-origin";
        let response;
        try {
            response = await fetch(url, opts);
        } catch (err) {
            return { ok: false, networkError: true, error: err, status: 0, data: null };
        }

        // Automatic Token Recovery on 401 (Expired / Invalid JWT)
        if (response.status === 401 && !options._retried) {
            const tokens = getTokens();
            if (tokens.refresh) {
                try {
                    const refRes = await fetch("/api/token/refresh/", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ refresh: tokens.refresh }),
                    });
                    if (refRes.ok) {
                        const refData = await refRes.json();
                        if (refData && refData.access) {
                            setTokens({ access: refData.access });
                            const retryOpts = Object.assign({}, options, { _retried: true });
                            delete retryOpts.headers;
                            return apiFetch(url, retryOpts);
                        }
                    }
                } catch (_) {}
            }
            // If refresh fails or no refresh token, remove expired token and retry using Django session
            clearTokens();
            const sessionRetryOpts = Object.assign({}, options, { _retried: true });
            delete sessionRetryOpts.headers;
            return apiFetch(url, sessionRetryOpts);
        }

        const text = await response.text();
        let data = null;
        try {
            if (text) data = JSON.parse(text);
        } catch (_) {
            data = text;
        }
        return {
            ok: response.ok,
            status: response.status,
            headers: response.headers,
            data: data,
            text: text,
            networkError: false,
        };
    }

    function showMessageBox(elementOrMsg, messageOrColor, color) {
        let el = elementOrMsg;
        let msg = messageOrColor;
        let col = color;

        if (typeof elementOrMsg === "string" || arguments.length <= 2) {
            el = document.getElementById("messageBox");
            msg = elementOrMsg;
            col = messageOrColor;
        }

        if (!el || !(el instanceof HTMLElement)) {
            el = document.getElementById("messageBox");
            if (!el) {
                el = document.createElement("div");
                el.id = "messageBox";
                el.className = "fixed top-5 right-5 z-50 max-w-md pointer-events-auto transition-all";
                document.body.appendChild(el);
            }
        }

        if (col === "clear" || !msg) {
            el.innerHTML = "";
            return;
        }

        const isSuccess = col === "success" || col === "green";
        const isError = col === "error" || col === "red";
        const isWarn = col === "warning" || col === "warn" || col === "amber";

        const bgCls = isSuccess ? "bg-emerald-600 text-white shadow-emerald-500/20" :
                      isError ? "bg-rose-600 text-white shadow-rose-500/20" :
                      isWarn ? "bg-amber-500 text-white shadow-amber-500/20" :
                      "bg-indigo-600 text-white shadow-indigo-500/20";
        const icon = isSuccess ? '<i class="fa-solid fa-circle-check"></i>' :
                     isError ? '<i class="fa-solid fa-triangle-exclamation"></i>' :
                     isWarn ? '<i class="fa-solid fa-bolt"></i>' :
                     '<i class="fa-solid fa-circle-info"></i>';

        el.innerHTML = `
            <div class="p-4 rounded-2xl shadow-xl flex items-center justify-between gap-3 text-sm font-black animate-fade-in ${bgCls}">
                <div class="flex items-center gap-2.5">
                    <span class="text-base">${icon}</span>
                    <span>${msg}</span>
                </div>
                <button type="button" onclick="this.parentElement.remove();" class="text-white/80 hover:text-white text-lg font-black leading-none ml-2">×</button>
            </div>
        `;

        if (isSuccess || col === "info") {
            setTimeout(function () {
                if (el && el.innerHTML) {
                    el.innerHTML = "";
                }
            }, 4000);
        }
    }

    function displayErrorsBox(arg1, arg2) {
        let el = null;
        let data = null;

        if (arg1 instanceof HTMLElement) {
            el = arg1;
            data = arg2;
        } else if (arg2 instanceof HTMLElement) {
            el = arg2;
            data = arg1;
        } else {
            el = document.getElementById("messageBox");
            data = arg1 || arg2;
        }

        if (!el || !(el instanceof HTMLElement)) {
            el = document.getElementById("messageBox");
        }
        if (!el) return;

        if (!data || data instanceof HTMLElement) {
            el.innerHTML = "";
            return;
        }

        let html = "";
        if (typeof data === "string") {
            html = `<p class="text-rose-600 font-bold text-xs">${data}</p>`;
        } else if (data.detail) {
            html = `<p class="text-rose-600 font-bold text-xs">${data.detail}</p>`;
        } else if (data.message) {
            html = `<p class="text-rose-600 font-bold text-xs">${data.message}</p>`;
        } else if (typeof data === "object") {
            for (let field in data) {
                if (!Object.prototype.hasOwnProperty.call(data, field)) continue;
                const value = data[field];
                const fieldLabel = field.replace(/_/g, " ");
                if (Array.isArray(value)) {
                    html += `<p class="text-rose-600 font-bold text-xs"><span class="capitalize">${fieldLabel}:</span> ${value[0]}</p>`;
                } else if (typeof value === "object" && value !== null) {
                    html += `<p class="text-rose-600 font-bold text-xs"><span class="capitalize">${fieldLabel}:</span> ${JSON.stringify(value)}</p>`;
                } else {
                    html += `<p class="text-rose-600 font-bold text-xs"><span class="capitalize">${fieldLabel}:</span> ${value}</p>`;
                }
            }
        }
        el.innerHTML = html ? `<div class="p-3 bg-rose-50 border border-rose-200 rounded-xl space-y-1">${html}</div>` : "";
    }

    global.PTApi = {
        ACCESS_KEY: ACCESS_KEY,
        REFRESH_KEY: REFRESH_KEY,
        USER_KEY: USER_KEY,
        getTokens: getTokens,
        setTokens: setTokens,
        clearTokens: clearTokens,
        getUser: getUser,
        setUser: setUser,
        authHeaders: authHeaders,
        isAuthenticated: isAuthenticated,
        requireAuthRedirect: requireAuthRedirect,
        apiFetch: apiFetch,
        showMessageBox: showMessageBox,
        displayErrorsBox: displayErrorsBox,
    };
})(window);
