"""
Profitability & GMROI Analysis
"""

from models.schemas import ProfitabilityResult, SalesRecord
from algorithms.demand_forecast import prepare_daily_series


GROSS_MARGIN_ESTIMATES = {
    "skincare": 0.65,
    "haircare": 0.60,
    "food": 0.35,
    "food & nutrition": 0.35,
    "electronics": 0.25,
    "apparel": 0.55,
    "home care": 0.45,
    "baby products": 0.60,
    "default": 0.50,
}


def analyze_profitability(
    sales_history: list[SalesRecord],
    current_stock: float,
    price: float,
    ordering_cost: float,
    holding_cost_pct: float,
    category: str,
    target_gmroi: float,
) -> ProfitabilityResult:
    """Profitability analysis using proxy gross margin."""
    series = prepare_daily_series(sales_history)

    cat_lower = category.lower()
    gm_pct = GROSS_MARGIN_ESTIMATES.get(cat_lower, GROSS_MARGIN_ESTIMATES["default"])

    avg_daily_sales = float(series.mean()) if len(series) > 0 else 0
    annual_revenue = avg_daily_sales * 365 * price
    annual_gross_profit = annual_revenue * gm_pct

    avg_inventory_value = (current_stock / 2) * price

    gmroi = annual_gross_profit / (avg_inventory_value + 1e-6)
    inventory_turnover = annual_revenue / (avg_inventory_value + 1e-6)
    dsi = 365 / (inventory_turnover + 1e-6)

    annual_holding = avg_inventory_value * holding_cost_pct
    net_margin = annual_gross_profit - annual_holding - ordering_cost * (365 / 30)

    return ProfitabilityResult(
        gross_margin_pct=round(gm_pct * 100, 1),
        gmroi=round(gmroi, 2),
        inventory_turnover=round(inventory_turnover, 2),
        days_sales_inventory=round(dsi, 1),
        meets_gmroi_target=(gmroi >= target_gmroi),
        annual_revenue_estimate=round(annual_revenue, 2),
        annual_holding_cost=round(annual_holding, 2),
        net_margin_after_holding=round(net_margin, 2),
    )
