"""
Dead Stock Analysis + Optimal Markdown Pricing
"""

import numpy as np
import pandas as pd
from scipy.optimize import minimize_scalar
from models.schemas import DeadStockResult, SalesRecord
from algorithms.demand_forecast import prepare_daily_series


def estimate_price_elasticity(
    sales_history: list[SalesRecord],
    price: float,
    typical_discount_pct: float,
) -> float:
    """Estimate price elasticity from historical velocity changes."""
    series = prepare_daily_series(sales_history)
    n = len(series)

    if n < 30:
        return -1.8

    if n >= 60:
        v_recent = series.iloc[-30:].mean()
        v_prior = series.iloc[-60:-30].mean()
        velocity_change = (v_recent - v_prior) / (v_prior + 1e-6)

        if velocity_change < -0.2:
            return -1.2
        elif velocity_change > 0.1:
            return -2.5

    return -1.8


def optimal_markdown_price(
    current_price: float,
    current_velocity: float,
    price_elasticity: float,
    min_price: float,
) -> tuple[float, float, float]:
    """Find price P* that maximizes total clearance revenue."""
    epsilon = price_elasticity

    def neg_revenue(price_discount_fraction):
        P = current_price * (1 - price_discount_fraction)
        if P < min_price:
            return 0
        demand = current_velocity * ((P / current_price) ** epsilon)
        return -(P * demand)

    result = minimize_scalar(
        neg_revenue,
        bounds=(0.0, 0.50),
        method="bounded",
    )

    optimal_discount = float(result.x) if result.success else 0.20
    optimal_price = current_price * (1 - optimal_discount)
    optimal_price = max(optimal_price, min_price)

    optimal_demand = current_velocity * ((optimal_price / current_price) ** epsilon)

    return (
        round(optimal_discount * 100, 1),
        round(optimal_price, 2),
        round(optimal_demand, 2),
    )


def analyze_dead_stock(
    sales_history: list[SalesRecord],
    current_stock: float,
    price: float,
    dead_stock_threshold_days: int,
    typical_discount_pct: float,
    top_seller_velocity: float = 0,
) -> DeadStockResult:
    """Full dead stock analysis with markdown optimization."""
    series = prepare_daily_series(sales_history)
    n = len(series)

    if n == 0:
        return DeadStockResult(
            is_dead=False, is_slow_mover=False, velocity_drop_pct=0,
            stock_age_days=0, capital_locked=0, optimal_discount_pct=0,
            optimal_clearance_price=price, price_elasticity_estimate=-1.8,
            units_to_clear_at_optimal=0, capital_recovered_at_optimal=0,
            weeks_to_clear_full_stock=999, bundle_revenue_uplift_pct=0,
        )

    v_recent_30d = float(series.iloc[-30:].mean()) if n >= 30 else float(series.mean())
    v_prior_30d = float(series.iloc[-60:-30].mean()) if n >= 60 else v_recent_30d

    velocity_drop_pct = float(
        ((v_recent_30d - v_prior_30d) / (v_prior_30d + 1e-6)) * 100
    )

    if series.index is not None and len(series) > 0:
        stock_age_days = (pd.Timestamp.now() - series.index[0]).days
    else:
        stock_age_days = 0

    is_dead = (stock_age_days >= dead_stock_threshold_days and velocity_drop_pct < -20)
    is_slow_mover = (stock_age_days >= 45 and velocity_drop_pct < -10) and not is_dead

    capital_locked = current_stock * price

    elasticity = estimate_price_elasticity(sales_history, price, typical_discount_pct)

    min_price = price * 0.50
    optimal_discount, optimal_price, optimal_daily_demand = optimal_markdown_price(
        price, v_recent_30d, elasticity, min_price
    )

    units_2w = optimal_daily_demand * 14
    units_to_clear = min(units_2w, current_stock)
    capital_recovered = units_to_clear * optimal_price

    weeks_to_clear = (current_stock / (optimal_daily_demand * 7)) if optimal_daily_demand > 0 else 999

    bundle_uplift = 0.0
    if top_seller_velocity > 0 and v_recent_30d > 0:
        bundle_factor = min(top_seller_velocity / v_recent_30d, 3.0)
        bundle_uplift = (bundle_factor - 1.0) * 30

    return DeadStockResult(
        is_dead=is_dead,
        is_slow_mover=is_slow_mover,
        velocity_drop_pct=round(velocity_drop_pct, 1),
        stock_age_days=stock_age_days,
        capital_locked=round(capital_locked, 2),
        optimal_discount_pct=optimal_discount,
        optimal_clearance_price=round(optimal_price, 2),
        price_elasticity_estimate=round(elasticity, 2),
        units_to_clear_at_optimal=round(units_to_clear, 1),
        capital_recovered_at_optimal=round(capital_recovered, 2),
        weeks_to_clear_full_stock=round(min(weeks_to_clear, 999), 1),
        bundle_revenue_uplift_pct=round(bundle_uplift, 1),
    )
