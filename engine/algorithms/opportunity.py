"""
Opportunity Scoring Engine
"""

from models.schemas import OpportunityResult, SalesRecord
from algorithms.demand_forecast import prepare_daily_series


def analyze_opportunity(
    sales_history: list[SalesRecord],
    current_stock: float,
    price: float,
    days_of_stock: float,
    forecast_next_30d: float,
    forecast_next_90d: float,
    competitor_out_of_stock: bool,
    abc_class: str,
    brand_context,
) -> OpportunityResult:
    """Score this product's opportunity potential 0-100."""
    series = prepare_daily_series(sales_history)
    n = len(series)

    if n == 0:
        return _empty_opportunity()

    if n > 30:
        v_30d = float(series.iloc[-30:].mean())
    else:
        v_30d = float(series.mean())

    if n > 60:
        v_60d = float(series.iloc[-60:-30].mean())
    else:
        v_60d = v_30d

    if n > 90:
        v_90d = float(series.iloc[-90:-60].mean())
    else:
        v_90d = v_60d

    growth_rate = ((v_30d - v_60d) / (v_60d + 1e-6)) * 100
    prior_growth = ((v_60d - v_90d) / (v_90d + 1e-6)) * 100
    acceleration = growth_rate - prior_growth

    growth_score = min(40, max(0, growth_rate * 2))
    competitor_score = 30 if competitor_out_of_stock else 0
    stock_urgency_score = max(0, 30 - days_of_stock) if growth_rate > 10 else 0

    abc_multipliers = {"A": 1.2, "B": 1.0, "C": 0.7}
    abc_mult = abc_multipliers.get(abc_class, 1.0)

    opportunity_score = min(100, (growth_score + competitor_score + stock_urgency_score) * abc_mult)

    is_opportunity = (
        opportunity_score >= 40 or
        (competitor_out_of_stock and days_of_stock < 30) or
        (growth_rate > 20 and days_of_stock < 45)
    )

    spike_multiplier = 1 + max(0, growth_rate / 100) * (2 if competitor_out_of_stock else 1)
    spiked_daily = v_30d * spike_multiplier

    stock_limited_30d = min(spiked_daily * 30, current_stock)
    opportunity_revenue_30d = stock_limited_30d * price
    opportunity_revenue_90d = min(
        spiked_daily * 90,
        current_stock + _estimate_restock(brand_context, spiked_daily)
    ) * price

    days_supply_needed = 60
    recommended_order = max(0, spiked_daily * days_supply_needed - current_stock)

    incremental_revenue = opportunity_revenue_30d - v_30d * 30 * price
    recommended_ad_spend = max(0, incremental_revenue * 0.20) if incremental_revenue > 0 else 0
    expected_roas = (incremental_revenue / recommended_ad_spend) if recommended_ad_spend > 0 else 0

    if days_of_stock < 7:
        urgency = "IMMEDIATE"
    elif days_of_stock < 21:
        urgency = "THIS_WEEK"
    else:
        urgency = "THIS_MONTH"

    return OpportunityResult(
        is_opportunity=is_opportunity,
        opportunity_score=round(opportunity_score, 1),
        demand_growth_rate_pct=round(growth_rate, 1),
        trend_acceleration=round(acceleration, 1),
        opportunity_revenue_30d=round(opportunity_revenue_30d, 2),
        opportunity_revenue_90d=round(opportunity_revenue_90d, 2),
        recommended_order_qty=round(recommended_order, 0),
        recommended_ad_spend=round(recommended_ad_spend, 2),
        expected_roas=round(expected_roas, 2),
        days_until_stockout_at_spike=round(current_stock / (spiked_daily + 1e-6), 1),
        urgency_level=urgency,
    )


def _estimate_restock(brand_context, daily_demand: float) -> float:
    """Estimate units available after restock during 90-day window."""
    restock_orders = max(0, int(90 / 30) - 1)
    return daily_demand * 30 * restock_orders


def _empty_opportunity() -> OpportunityResult:
    return OpportunityResult(
        is_opportunity=False, opportunity_score=0, demand_growth_rate_pct=0,
        trend_acceleration=0, opportunity_revenue_30d=0, opportunity_revenue_90d=0,
        recommended_order_qty=0, recommended_ad_spend=0, expected_roas=0,
        days_until_stockout_at_spike=999, urgency_level="THIS_MONTH",
    )
