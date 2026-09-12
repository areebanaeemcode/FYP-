from decimal import Decimal, ROUND_HALF_UP

from django.db.models import Sum, Count, DecimalField
from django.db.models.functions import Coalesce

from apps.expenses.models import Expense
from apps.tours.models import Tour


TWOPLACES = Decimal('0.01')

CATEGORY_LABELS = {
    "transport": "Transport",
    "accommodation": "Accommodation",
    "food": "Food",
    "activities": "Activities",
    "shopping": "Shopping",
    "other": "Other",
}
CATEGORY_ORDER = ["food", "transport", "accommodation", "activities", "shopping", "other"]

CHART_PALETTE = {
    "food": "#f43f5e",          # rose-500 (Vibrant coral rose)
    "transport": "#6366f1",     # indigo-500 (Modern indigo)
    "accommodation": "#0ea5e9", # sky-500 (Ocean blue)
    "activities": "#10b981",    # emerald-500 (Fresh emerald)
    "shopping": "#8b5cf6",      # violet-500 (Royal violet)
    "other": "#f59e0b",         # amber-500 (Warm amber)
}

EXTENDED_PALETTE = [
    "#f43f5e", "#6366f1", "#10b981", "#8b5cf6", "#f59e0b",
    "#0ea5e9", "#ec4899", "#14b8a6", "#3b82f6", "#f97316"
]


def get_category_color(category_key):
    k = str(category_key or "").strip().lower()
    if k in CHART_PALETTE:
        return CHART_PALETTE[k]
    h = sum(ord(c) for c in k) if k else 0
    return EXTENDED_PALETTE[h % len(EXTENDED_PALETTE)]


def _round_d(d):
    if d is None:
        return Decimal('0.00')
    if not isinstance(d, Decimal):
        try:
            d = Decimal(str(d))
        except Exception:
            return Decimal('0.00')
    return d.quantize(TWOPLACES, rounding=ROUND_HALF_UP)


def compute_category_breakdown(expense_qs, include_labels=True):
    rows = (
        expense_qs
        .values('category')
        .annotate(
            total=Coalesce(
                Sum('amount', output_field=DecimalField(max_digits=12, decimal_places=2)),
                0,
                output_field=DecimalField(max_digits=12, decimal_places=2),
            ),
            count=Count('id'),
        )
    )
    totals_by_cat = {r['category']: _round_d(r['total']) for r in rows}
    counts_by_cat = {r['category']: int(r['count']) for r in rows}
    total_spent = sum(totals_by_cat.values(), Decimal('0.00'))

    ordered = []
    items_sorted = sorted(
        totals_by_cat.items(),
        key=lambda kv: (-kv[1], CATEGORY_ORDER.index(kv[0]) if kv[0] in CATEGORY_ORDER else 99),
    )
    for cat, total in items_sorted:
        share = (total / total_spent * Decimal('100')) if total_spent > Decimal('0') else Decimal('0')
        ordered.append({
            'category': {
                'value': cat,
                'label': CATEGORY_LABELS.get(cat, cat) if include_labels else cat,
            },
            'total': float(total),
            'count': counts_by_cat.get(cat, 1),
            'share_pct': round(float(share), 2),
            'color': get_category_color(cat),
        })

    top_category = ordered[0] if ordered else None

    expense_count = expense_qs.count()

    return {
        'categories': ordered,
        'by_category': ordered,
        'labels': [c['category']['label'] for c in ordered],
        'totals': [c['total'] for c in ordered],
        'counts': [c['count'] for c in ordered],
        'colors': [c['color'] for c in ordered],
        'total_spent': float(_round_d(total_spent)),
        'total': float(_round_d(total_spent)),
        'total_expenses': int(expense_count),
        'top_category': {
            'value': top_category['category']['value'],
            'label': top_category['category']['label'],
            'total': top_category['total'],
            'share_pct': top_category['share_pct'],
            'color': top_category['color'],
        } if top_category else None,
    }


def compute_tour_analytics(tour):
    result = compute_category_breakdown(
        Expense.objects.filter(tour=tour),
        include_labels=True,
    )
    result['tour_id'] = getattr(tour, 'pk', None)
    result['tour_title'] = getattr(tour, 'title', None)
    return result


def compute_user_global_analytics(user):
    member_tour_ids = list(
        Tour.objects.filter(
            memberships__user=user,
        ).values_list('id', flat=True)
    )
    expense_qs = Expense.objects.filter(tour_id__in=member_tour_ids)
    result = compute_category_breakdown(expense_qs, include_labels=True)
    result['user_id'] = getattr(user, 'id', None)
    result['total_tours'] = len(member_tour_ids)
    # Per-tour summary table (top 5 tours by spending)
    per_tour_rows = (
        expense_qs
        .values('tour_id', 'tour__title')
        .annotate(total=Coalesce(
            Sum('amount', output_field=DecimalField(max_digits=12, decimal_places=2)),
            0,
            output_field=DecimalField(max_digits=12, decimal_places=2),
        ))
        .order_by('-total')[:5]
    )
    result['top_tours'] = [
        {
            'tour_id': r['tour_id'],
            'tour_title': r.get('tour__title') or f"Tour #{r['tour_id']}",
            'total': float(_round_d(r['total'])),
        }
        for r in per_tour_rows
    ]
    return result
