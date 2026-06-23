"""
Scenario Planning Engine
Generates Optimistic / Baseline / Pessimistic demand scenarios using the
real 80% confidence intervals computed by the forecasting engine, plus
an optional price-markdown scenario using price elasticity.
"""

import numpy as np
from typing import Dict, Any
from models.schemas import DemandForecast


def generate_scenarios(
    forecast: DemandForecast,
    current_stock: float,
    price: float,
    price_elasticity: float = -1.5,
) -> Dict[str, Any]:
    """
    Generate 3 demand scenarios for the next 30 days using real CI bounds.

    Optimistic  = 80% CI upper bound (forecast.next_30d_upper)
    Baseline    = point forecast (forecast.next_30d)
    Pessimistic = 80% CI lower bound (forecast.next_30d_lower)

    Also computes a Markdown Scenario: what happens to revenue if the brand
    applies the optimal clearance discount (using price elasticity)?
    """
    baseline_30d   = max(0.0, forecast.next_30d)
    optimistic_30d = max(baseline_30d, forecast.next_30d_upper)
    pessimistic_30d = max(0.0, min(forecast.next_30d_lower, baseline_30d))

    # Ensure meaningful spread — at least ±10% from baseline
    if optimistic_30d < baseline_30d * 1.05:
        optimistic_30d = baseline_30d * 1.20
    if pessimistic_30d > baseline_30d * 0.95:
        pessimistic_30d = baseline_30d * 0.80

    def _stockout_units(demand: float) -> float:
        return max(0.0, demand - current_stock)

    def _lost_revenue(demand: float) -> float:
        return round(_stockout_units(demand) * price, 2)

    # ── Markdown scenario ─────────────────────────────────────────────────
    # Optimal discount that maximises revenue for slow-moving stock.
    # Using point-elasticity: %ΔQ = ε × %ΔP
    opt_discount_pct, markdown_demand_30d, markdown_revenue = _markdown_scenario(
        baseline_30d, current_stock, price, price_elasticity
    )

    return {
        "optimistic": {
            "label": "Demand Surge (+20%)",
            "demand_30d": round(optimistic_30d, 1),
            "stockout_units": round(_stockout_units(optimistic_30d), 1),
            "revenue_opportunity": round(min(optimistic_30d, current_stock) * price, 2),
            "lost_sales_risk": _lost_revenue(optimistic_30d),
            "action": (
                "Reorder immediately to avoid a stockout. "
                f"Expected demand: {optimistic_30d:.0f} units in 30 days."
            ),
        },
        "baseline": {
            "label": "Expected Trajectory",
            "demand_30d": round(baseline_30d, 1),
            "stockout_units": round(_stockout_units(baseline_30d), 1),
            "revenue_opportunity": round(min(baseline_30d, current_stock) * price, 2),
            "lost_sales_risk": _lost_revenue(baseline_30d),
            "action": (
                "Monitor weekly. Reorder when stock drops below reorder point."
            ),
        },
        "pessimistic": {
            "label": "Demand Slowdown (−20%)",
            "demand_30d": round(pessimistic_30d, 1),
            "stockout_units": 0.0,
            "revenue_opportunity": round(pessimistic_30d * price, 2),
            "capital_lock_risk": round(max(0.0, current_stock - pessimistic_30d) * price, 2),
            "action": (
                "Run promotions or bundle with top sellers to accelerate sell-through. "
                f"If demand drops to {pessimistic_30d:.0f} units, you risk locking capital."
            ),
        },
        "markdown": {
            "label": f"Markdown at {opt_discount_pct:.0f}% Discount",
            "discount_pct": round(opt_discount_pct, 1),
            "new_price": round(price * (1 - opt_discount_pct / 100), 2),
            "demand_30d": round(markdown_demand_30d, 1),
            "revenue_30d": round(markdown_revenue, 2),
            "revenue_vs_no_action": round(
                markdown_revenue - (min(baseline_30d, current_stock) * price), 2
            ),
            "action": (
                f"Apply a {opt_discount_pct:.0f}% discount (₹{price * (1 - opt_discount_pct / 100):.0f}) "
                "to maximise clearance revenue from slow-moving units."
            ),
        },
    }


def _markdown_scenario(
    baseline_demand_30d: float,
    current_stock: float,
    price: float,
    elasticity: float,
) -> tuple[float, float, float]:
    """
    Find the discount % that maximises revenue for the available stock.
    Uses a simple grid search over [0%, 50%] discount range.
    """
    best_rev = baseline_demand_30d * price
    best_disc = 0.0
    best_demand = baseline_demand_30d

    for disc_pct in np.arange(5, 55, 5):
        discount_frac = disc_pct / 100
        # Point-elasticity: %ΔQ = ε × %ΔP
        demand_multiplier = 1 + (elasticity * (-discount_frac))
        demand_multiplier = max(0.5, demand_multiplier)  # floor at 50% of baseline
        new_demand = baseline_demand_30d * demand_multiplier
        new_price  = price * (1 - discount_frac)
        sellable   = min(new_demand, current_stock)
        revenue    = sellable * new_price

        if revenue > best_rev:
            best_rev   = revenue
            best_disc  = disc_pct
            best_demand = new_demand

    return best_disc, best_demand, best_rev
