(function () {
    'use strict';

    var currencyPrefix = 'Rs. ';

    function fmtMoney(v) {
        var n = Number(v || 0);
        return currencyPrefix + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }

    function renderSummary(data) {
        var tc = document.getElementById('cardTotalSpent');
        var te = document.getElementById('cardTotalExpenses');
        var tcat = document.getElementById('cardTopCategory');
        var tshare = document.getElementById('cardTopShare');
        if (tc) tc.textContent = fmtMoney(data.total_spent);
        if (te) te.textContent = String(data.total_expenses || 0);
        var top = data.top_category;
        if (top) {
            if (tcat) tcat.textContent = top.label || top.value || '—';
            if (tshare) tshare.textContent = fmtMoney(top.total) + ' (' + Number(top.share_pct || 0).toFixed(1) + '%)';
        } else {
            if (tcat) tcat.textContent = '—';
            if (tshare) tshare.textContent = 'No expenses yet';
        }
    }

    var CATEGORY_COLORS = {
        food: '#f43f5e',          // Vibrant Rose / Coral
        transport: '#6366f1',     // Modern Indigo
        accommodation: '#0ea5e9', // Ocean Sky
        activities: '#10b981',    // Emerald Green
        shopping: '#8b5cf6',      // Royal Violet
        other: '#f59e0b'          // Warm Amber
    };
    var EXTENDED_PALETTE = [
        '#f43f5e', '#6366f1', '#10b981', '#8b5cf6', '#f59e0b',
        '#0ea5e9', '#ec4899', '#14b8a6', '#3b82f6', '#f97316'
    ];

    function getCategoryColor(key) {
        if (!key) return '#8b5cf6';
        var k = String(key).trim().toLowerCase();
        if (CATEGORY_COLORS[k]) return CATEGORY_COLORS[k];
        var h = 0;
        for (var i = 0; i < k.length; i++) h += k.charCodeAt(i);
        return EXTENDED_PALETTE[h % EXTENDED_PALETTE.length];
    }

    function renderCategoryTable(cats) {
        var wrap = document.getElementById('categoryTable');
        if (!wrap) return;
        if (!cats || cats.length === 0) {
            wrap.innerHTML = '<p class="text-slate-400 text-center py-8">No expenses recorded yet.</p>';
            return;
        }
        var rows = '';
        for (var i = 0; i < cats.length; i++) {
            var c = cats[i];
            var pct = Number(c.share_pct || 0).toFixed(1);
            var catRaw = (c.category && (c.category.value || c.category.label)) || c.category || 'other';
            var catColor = c.color && c.color !== '#64748b' ? c.color : getCategoryColor(catRaw);
            rows += (
                '<tr class="border-b border-slate-100 last:border-0">' +
                    '<td class="py-4 px-4">' +
                        '<div class="flex items-center gap-3">' +
                            '<span class="inline-block w-4 h-4 rounded-full" style="background-color: ' + catColor + '"></span>' +
                            '<span class="font-medium text-slate-800">' + (c.category && c.category.label ? c.category.label : (c.category || 'Other')) + '</span>' +
                        '</div>' +
                    '</td>' +
                    '<td class="py-4 px-4 text-right font-semibold text-slate-800">' + fmtMoney(c.total) + '</td>' +
                    '<td class="py-4 px-4 text-right">' +
                        '<div class="flex items-center justify-end gap-3">' +
                            '<div class="w-32 bg-slate-100 rounded-full h-2.5 overflow-hidden">' +
                                '<div class="h-2.5 rounded-full" style="width: ' + Math.max(0, Math.min(100, Number(c.share_pct || 0))) + '%; background-color: ' + catColor + '"></div>' +
                            '</div>' +
                            '<span class="text-sm text-slate-600 w-14 text-right">' + pct + '%</span>' +
                        '</div>' +
                    '</td>' +
                '</tr>'
            );
        }
        wrap.innerHTML = (
            '<table class="w-full min-w-[480px]">' +
                '<thead>' +
                    '<tr class="text-xs uppercase tracking-wider text-slate-500 border-b border-slate-200">' +
                        '<th class="py-3 px-4 text-left font-semibold">Category</th>' +
                        '<th class="py-3 px-4 text-right font-semibold">Total</th>' +
                        '<th class="py-3 px-4 text-right font-semibold">Share</th>' +
                    '</tr>' +
                '</thead>' +
                '<tbody>' + rows + '</tbody>' +
            '</table>'
        );
    }

    function renderTopTours(topTours) {
        var sec = document.getElementById('topToursSection');
        var list = document.getElementById('topToursList');
        if (!sec || !list) return;
        if (!topTours || topTours.length === 0) {
            sec.classList.add('hidden');
            return;
        }
        sec.classList.remove('hidden');
        var html = '';
        for (var i = 0; i < topTours.length; i++) {
            var t = topTours[i];
            html += (
                '<a href="/client/tours/' + String(t.tour_id) + '/" class="flex items-center justify-between p-4 rounded-xl border border-slate-200 hover:bg-slate-50 transition">' +
                    '<div class="flex items-center gap-3 min-w-0">' +
                        '<div class="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm"><i class="fa-solid fa-suitcase-rolling"></i></div>' +
                        '<div class="min-w-0">' +
                            '<p class="font-semibold text-slate-800 truncate">' + (t.tour_title || 'Tour') + '</p>' +
                            '<p class="text-xs text-slate-500">Tour #' + String(t.tour_id) + '</p>' +
                        '</div>' +
                    '</div>' +
                    '<div class="text-right">' +
                        '<p class="font-bold text-slate-800">' + fmtMoney(t.total) + '</p>' +
                    '</div>' +
                '</a>'
            );
        }
        list.innerHTML = html;
    }

    var barChartInstance = null;
    var donutChartInstance = null;

    function renderCharts(data) {
        var labels = data.labels || [];
        var totals = data.totals || [];
        var colors = data.colors || [];
        var Chart = window.Chart;
        if (!Chart) {
            console.warn('Chart.js library not loaded');
            return;
        }

        var chartColors = [];
        for (var i = 0; i < labels.length; i++) {
            var c = (colors && colors[i]) || (data.categories && data.categories[i] && data.categories[i].color);
            if (!c || c === '#64748b') {
                c = getCategoryColor(labels[i]);
            }
            chartColors.push(c);
        }

        var barDataLabelPlugin = {
            id: 'barDataLabelPlugin',
            afterDatasetsDraw: function (chart) {
                var ctx = chart.ctx;
                var isDark = document.documentElement.classList.contains('dark');
                chart.data.datasets.forEach(function (dataset, i) {
                    var meta = chart.getDatasetMeta(i);
                    meta.data.forEach(function (bar, index) {
                        var val = dataset.data[index];
                        if (val == null || val === 0) return;
                        var text = fmtMoney(val);
                        ctx.save();
                        ctx.font = '700 12px "Plus Jakarta Sans", system-ui, -apple-system, sans-serif';
                        
                        // Measure text to draw a clean badge pill
                        var metrics = ctx.measureText(text);
                        var w = metrics.width + 16;
                        var h = 22;
                        var x = bar.x - (w / 2);
                        var y = Math.max(4, bar.y - h - 6);
                        var r = 6;

                        // Pill background
                        ctx.beginPath();
                        ctx.moveTo(x + r, y);
                        ctx.lineTo(x + w - r, y);
                        ctx.quadraticCurveTo(x + w, y, x + w, y + r);
                        ctx.lineTo(x + w, y + h - r);
                        ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
                        ctx.lineTo(x + r, y + h);
                        ctx.quadraticCurveTo(x, y + h, x, y + h - r);
                        ctx.lineTo(x, y + r);
                        ctx.quadraticCurveTo(x, y, x + r, y);
                        ctx.closePath();

                        ctx.fillStyle = isDark ? 'rgba(30, 41, 59, 0.95)' : 'rgba(255, 255, 255, 0.95)';
                        ctx.shadowColor = 'rgba(0, 0, 0, 0.08)';
                        ctx.shadowBlur = 6;
                        ctx.shadowOffsetY = 2;
                        ctx.fill();

                        ctx.shadowColor = 'transparent';
                        ctx.lineWidth = 1;
                        ctx.strokeStyle = isDark ? 'rgba(71, 85, 105, 0.6)' : 'rgba(226, 232, 240, 0.9)';
                        ctx.stroke();

                        // Pill text
                        ctx.fillStyle = isDark ? '#f8fafc' : '#0f172a';
                        ctx.textAlign = 'center';
                        ctx.textBaseline = 'middle';
                        ctx.fillText(text, bar.x, y + (h / 2));
                        ctx.restore();
                    });
                });
            }
        };

        var barCtx = document.getElementById('barChart');
        if (barCtx) {
            if (barChartInstance) {
                try { barChartInstance.destroy(); } catch (e) {}
            }
            var isDark = document.documentElement.classList.contains('dark');
            barChartInstance = new Chart(barCtx.getContext('2d'), {
                type: 'bar',
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'Spending',
                        data: totals,
                        backgroundColor: chartColors,
                        borderWidth: 0,
                        borderRadius: { topLeft: 10, topRight: 10, bottomLeft: 4, bottomRight: 4 },
                        maxBarThickness: 56,
                        minBarLength: 8,
                        barPercentage: 0.65,
                        categoryPercentage: 0.65,
                    }],
                },
                plugins: [barDataLabelPlugin],
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    layout: {
                        padding: {
                            top: 30,
                            left: 8,
                            right: 8,
                            bottom: 8
                        }
                    },
                    plugins: {
                        legend: { display: false },
                        tooltip: {
                            backgroundColor: isDark ? '#0f172a' : '#1e293b',
                            titleFont: { family: '"Plus Jakarta Sans", system-ui, sans-serif', size: 13, weight: '700' },
                            bodyFont: { family: '"Plus Jakarta Sans", system-ui, sans-serif', size: 12, weight: '500' },
                            padding: 12,
                            cornerRadius: 12,
                            callbacks: {
                                label: function (ctx) {
                                    var idx = ctx.dataIndex;
                                    var catObj = data.categories && data.categories[idx];
                                    var cnt = (data.counts && data.counts[idx]) || (catObj && catObj.count) || null;
                                    var cntStr = cnt ? (' (' + cnt + (cnt === 1 ? ' entry' : ' entries') + ')') : '';
                                    return (ctx.dataset.label || 'Spending') + ': ' + fmtMoney(ctx.parsed.y || 0) + cntStr;
                                },
                            },
                        },
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            grid: {
                                color: isDark ? 'rgba(51, 65, 85, 0.4)' : 'rgba(226, 232, 240, 0.7)',
                                drawBorder: false,
                            },
                            ticks: {
                                color: isDark ? '#94a3b8' : '#64748b',
                                font: { family: '"Plus Jakarta Sans", system-ui, sans-serif', size: 11, weight: '600' },
                                padding: 8,
                                callback: function (v) {
                                    var num = Number(v);
                                    return currencyPrefix + num.toLocaleString('en-US');
                                }
                            },
                        },
                        x: {
                            grid: { display: false },
                            ticks: {
                                color: isDark ? '#e2e8f0' : '#1e293b',
                                font: { family: '"Plus Jakarta Sans", system-ui, sans-serif', size: 13, weight: '700' },
                                padding: 10,
                            },
                            offset: true,
                        },
                    },
                },
            });
        }

        var donutCtx = document.getElementById('donutChart');
        if (donutCtx) {
            if (donutChartInstance) {
                try { donutChartInstance.destroy(); } catch (e) {}
            }
            // Slices are sized based on how many times each category was added in the expense list
            var counts = data.counts || (data.categories ? data.categories.map(function (c) { return c.count || 1; }) : []);
            var categoryFrequencySlices = [];
            for (var i = 0; i < labels.length; i++) {
                var cnt = (counts && counts[i] != null && counts[i] > 0) ? counts[i] : 1;
                categoryFrequencySlices.push(cnt);
            }

            donutChartInstance = new Chart(donutCtx.getContext('2d'), {
                type: 'pie',
                data: {
                    labels: labels,
                    datasets: [{
                        data: categoryFrequencySlices,
                        backgroundColor: chartColors,
                        borderWidth: 2,
                        borderColor: '#ffffff',
                    }],
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'bottom',
                            labels: {
                                padding: 20,
                                usePointStyle: true,
                                pointStyle: 'circle',
                                boxWidth: 8,
                                boxHeight: 8,
                                color: isDark ? '#e2e8f0' : '#334155',
                                font: { family: '"Plus Jakarta Sans", system-ui, sans-serif', size: 12, weight: '700' },
                                generateLabels: function (chart) {
                                    var fn = (Chart.overrides.pie && Chart.overrides.pie.plugins && Chart.overrides.pie.plugins.legend && Chart.overrides.pie.plugins.legend.labels && Chart.overrides.pie.plugins.legend.labels.generateLabels)
                                        || (Chart.overrides.doughnut && Chart.overrides.doughnut.plugins && Chart.overrides.doughnut.plugins.legend && Chart.overrides.doughnut.plugins.legend.labels && Chart.overrides.doughnut.plugins.legend.labels.generateLabels);
                                    var original = fn ? fn(chart) : [];
                                    original.forEach(function (lbl, idx) {
                                        var v = totals[idx] != null ? totals[idx] : 0;
                                        var cnt = categoryFrequencySlices[idx] || 1;
                                        lbl.text = (labels[idx] || '') + ' (' + fmtMoney(v) + ' • ' + cnt + 'x)';
                                    });
                                    return original;
                                }
                            },
                        },
                        tooltip: {
                            backgroundColor: isDark ? '#0f172a' : '#1e293b',
                            titleFont: { family: '"Plus Jakarta Sans", system-ui, sans-serif', size: 13, weight: '700' },
                            bodyFont: { family: '"Plus Jakarta Sans", system-ui, sans-serif', size: 12, weight: '500' },
                            padding: 12,
                            cornerRadius: 12,
                            callbacks: {
                                label: function (ctx) {
                                    var idx = ctx.dataIndex;
                                    var lbl = labels[idx] || ctx.label || '';
                                    var cnt = categoryFrequencySlices[idx] || 1;
                                    var actualVal = totals[idx] != null ? totals[idx] : 0;
                                    var totalExp = Number(data.total_expenses || categoryFrequencySlices.reduce(function(a,b){return a+b;},0) || 1);
                                    var pct = ((cnt / totalExp) * 100).toFixed(1);
                                    return lbl + ': ' + cnt + (cnt === 1 ? ' entry' : ' entries') + ' (' + pct + '%) • ' + fmtMoney(actualVal);
                                },
                            },
                        },
                    },
                },
            });
        }
    }

    function loadAnalytics() {
        var mode = window.__PT_ANALYTICS_MODE__ || 'tour';
        var url;
        if (mode === 'global') {
            url = '/client/analytics/api/';
        } else {
            var tourId = window.__PT_TOUR_ID__;
            url = '/client/tours/api/' + String(tourId) + '/analytics/';
        }
        window.PTApi.apiFetch(url, { method: 'GET', requireAuth: true })
            .then(function (res) {
                var data = (res && res.data) ? res.data : res;
                renderSummary(data);
                renderCharts(data);
                renderCategoryTable(data.categories || []);
                if (data.top_tours) {
                    renderTopTours(data.top_tours);
                }
            })
            .catch(function (err) {
                var msg = (err && err.detail) || (err && err.message) || 'Failed to load analytics.';
                var mb = document.getElementById('messageBox');
                if (mb) {
                    mb.innerHTML = (
                        '<div class="bg-rose-50 border border-rose-300 text-rose-800 p-4 rounded-xl shadow-sm">' + msg + '</div>'
                    );
                }
                console.error('analytics load error', err);
            });
    }

    function init() {
        if (typeof window.Chart !== 'undefined') {
            loadAnalytics();
            return;
        }
        var retries = 0;
        var t = setInterval(function () {
            retries += 1;
            if (typeof window.Chart !== 'undefined') {
                clearInterval(t);
                loadAnalytics();
                return;
            }
            if (retries >= 40) {
                clearInterval(t);
                var mb = document.getElementById('messageBox');
                if (mb) {
                    mb.innerHTML = (
                        '<div class="bg-amber-50 border border-amber-300 text-amber-800 p-4 rounded-xl shadow-sm">' +
                            'Chart library failed to load. Please check your connection and refresh.' +
                        '</div>'
                    );
                }
            }
        }, 250);
    }

    document.addEventListener('DOMContentLoaded', init);
})();
