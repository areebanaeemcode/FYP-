(function (global) {
    'use strict';

    var QUEUE_KEY = 'pt_offline_pending_v1';
    var HEARTBEAT_MS = 15 * 1000;
    var SYNC_URL = '/client/api/offline/sync-expenses/';

    function _readQueue() {
        try {
            var raw = localStorage.getItem(QUEUE_KEY);
            if (!raw) return [];
            var arr = JSON.parse(raw);
            return Array.isArray(arr) ? arr : [];
        } catch (e) {
            return [];
        }
    }

    function _writeQueue(arr) {
        try {
            localStorage.setItem(QUEUE_KEY, JSON.stringify(Array.isArray(arr) ? arr : []));
        } catch (e) {
            console.warn('offline queue write failed', e);
        }
    }

    function _uuid() {
        if (global.crypto && typeof global.crypto.randomUUID === 'function') {
            try { return global.crypto.randomUUID(); } catch (_) {}
        }
        return 'p_' + Date.now() + '_' + Math.floor(Math.random() * 1000000);
    }

    function pendingCount() {
        return _readQueue().length;
    }

    function getPending() {
        return _readQueue().slice();
    }

    function pushPending(payload, metadata) {
        if (!payload || typeof payload !== 'object') return null;
        var item = {
            client_id: _uuid(),
            payload: JSON.parse(JSON.stringify(payload)),
            created_at: Date.now(),
            attempts: 0,
            last_error: null,
        };
        if (metadata && typeof metadata === 'object') {
            if (metadata.tour_id) item.tour_id = metadata.tour_id;
        }
        var arr = _readQueue();
        arr.push(item);
        _writeQueue(arr);
        _fireChanged();
        return item.client_id;
    }

    function removeByClientIds(idsToRemove) {
        if (!idsToRemove || idsToRemove.length === 0) return 0;
        var set = {};
        for (var i = 0; i < idsToRemove.length; i++) set[idsToRemove[i]] = true;
        var arr = _readQueue();
        var kept = [];
        for (var j = 0; j < arr.length; j++) {
            if (!set[arr[j].client_id]) kept.push(arr[j]);
        }
        var removed = arr.length - kept.length;
        if (removed > 0) {
            _writeQueue(kept);
            _fireChanged();
        }
        return removed;
    }

    function updateLastError(client_id, err) {
        var arr = _readQueue();
        var found = false;
        for (var i = 0; i < arr.length; i++) {
            if (arr[i].client_id === client_id) {
                arr[i].last_error = (err && (err.detail || err.message || String(err))) || null;
                arr[i].attempts = Number(arr[i].attempts || 0) + 1;
                found = true;
                break;
            }
        }
        if (found) {
            _writeQueue(arr);
            _fireChanged();
        }
    }

    function clearAll() {
        _writeQueue([]);
        _fireChanged();
    }

    var _listeners = [];
    function onQueueChanged(cb) {
        if (typeof cb === 'function') _listeners.push(cb);
        return function () {
            _listeners = _listeners.filter(function (f) { return f !== cb; });
        };
    }
    function _fireChanged() {
        var count = pendingCount();
        try {
            for (var i = 0; i < _listeners.length; i++) {
                try { _listeners[i](count, getPending()); } catch (_) {}
            }
        } catch (_) {}
    }

    async function syncNow() {
        var pending = getPending();
        if (pending.length === 0) return { synced: 0, failed: 0, remaining: 0, results: [] };
        var body = { pending: pending.map(function (it) {
            return { client_id: it.client_id, payload: it.payload };
        })};
        var resp;
        var hadNetworkErr = false;
        try {
            resp = await window.PTApi.apiFetch(SYNC_URL, {
                method: 'POST',
                body: body,
                requireAuth: true,
            });
        } catch (err) {
            resp = { ok: false, networkError: true, status: 0, data: null, error: err };
            hadNetworkErr = true;
        }
        if (!resp || !resp.ok) {
            var errMsg = (resp && resp.data && (resp.data.detail || resp.data.error)) ||
                         (resp && resp.text) ||
                         (hadNetworkErr ? 'Network unavailable — will retry later.' : 'Sync request failed.');
            var q = _readQueue();
            for (var i = 0; i < q.length; i++) {
                q[i].last_error = errMsg;
                q[i].attempts = Number(q[i].attempts || 0) + 1;
            }
            _writeQueue(q);
            _fireChanged();
            return { synced: 0, failed: pending.length, remaining: pendingCount(), results: [], error: errMsg };
        }
        var data = resp.data || {};
        var results = data.results || [];
        var oks = [];
        for (var k = 0; k < results.length; k++) {
            var r = results[k];
            if (r && r.status === 'ok') oks.push(r.client_id);
            else if (r && r.client_id) updateLastError(r.client_id, r.error || r);
        }
        removeByClientIds(oks);
        return {
            synced: oks.length,
            failed: results.length - oks.length,
            remaining: pendingCount(),
            results: results,
        };
    }

    function _startHeartbeat() {
        if (global.__PT_OFFLINE_HEARTBEAT__) return;
        global.__PT_OFFLINE_HEARTBEAT__ = true;
        var timer = null;
        function tick() {
            if (!global.navigator || global.navigator.onLine === false) return;
            if (pendingCount() > 0) syncNow().catch(function () {});
        }
        function start() {
            if (timer) return;
            timer = setInterval(tick, HEARTBEAT_MS);
        }
        if (global.addEventListener) {
            global.addEventListener('online', function () {
                setTimeout(function () { syncNow().catch(function () {}); }, 250);
            });
            global.addEventListener('beforeunload', function () {
                if (timer) clearInterval(timer);
            });
            if (document.visibilityState === 'visible') {
                start();
            }
            global.document && document.addEventListener && document.addEventListener('visibilitychange', function () {
                if (document.visibilityState === 'visible') {
                    start();
                    if (pendingCount() > 0) syncNow().catch(function () {});
                } else if (timer) {
                    clearInterval(timer);
                    timer = null;
                }
            });
        }
        start();
    }

    function interceptExpenseCreateTourDetail(origResult, payloadForQueue) {
        if (origResult && origResult.networkError === true && payloadForQueue) {
            var cid = pushPending(payloadForQueue);
            return { queued: true, client_id: cid, status: 0 };
        }
        return origResult;
    }

    function init() {
        _startHeartbeat();
    }

    global.PTOffline = {
        QUEUE_KEY: QUEUE_KEY,
        pendingCount: pendingCount,
        getPending: getPending,
        pushPending: pushPending,
        removeByClientIds: removeByClientIds,
        updateLastError: updateLastError,
        clearAll: clearAll,
        onQueueChanged: onQueueChanged,
        syncNow: syncNow,
        interceptExpenseCreateTourDetail: interceptExpenseCreateTourDetail,
        init: init,
    };

    if (global.document && document.readyState !== 'loading') {
        init();
    } else if (global.addEventListener) {
        global.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})(window);
