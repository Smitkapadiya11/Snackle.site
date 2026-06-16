"""
Safety Stock Calculator
Uses statistical service-level approach with lead time variability.
Formula: SS = Z × sqrt(L × σ_d² + d̄² × σ_L²)
"""

import numpy as np
from models.schemas import SafetyStockResult, SalesRecord
from algorithms.demand_forecast import prepare_daily_series


SERVICE_LEVEL_Z = {
    0.80: 0.842,
    0.85: 1.036,
    0.90: 1.282,
    0.95: 1.645,
    0.97: 1.881,
    0.99: 2.326,
    0.999: 3.090,
}


def compute_safety_stock(
    sales_history: list[SalesRecord],
    avg_lead_time_days: float,
    lead_time_std_days: float,
    service_level_target: float,
    current_price: float,
) -> SafetyStockResult:
    """Statistical safety stock with FULL lead time variability model."""
    series = prepare_daily_series(sales_history)

    if len(series) == 0:
        return SafetyStockResult(
            safety_stock_units=0, safety_stock_days=0,
            reorder_point=0, service_level_achieved=0,
            demand_std_dev=0, z_score_used=1.645,
        )

    d_bar = float(series.mean())
    sigma_d = float(series.std())

    available_levels = list(SERVICE_LEVEL_Z.keys())
    closest_level = min(available_levels, key=lambda x: abs(x - service_level_target))
    z = SERVICE_LEVEL_Z[closest_level]

    L = avg_lead_time_days
    sigma_L = lead_time_std_days

    variance_demand_during_lt = L * (sigma_d ** 2)
    variance_lt_effect = (d_bar ** 2) * (sigma_L ** 2)

    safety_stock = z * np.sqrt(variance_demand_during_lt + variance_lt_effect)
    safety_stock = max(0, round(safety_stock, 1))

    demand_during_lt = d_bar * L
    reorder_point = demand_during_lt + safety_stock

    safety_stock_days_val = (safety_stock / d_bar) if d_bar > 0 else 0

    return SafetyStockResult(
        safety_stock_units=round(safety_stock, 1),
        safety_stock_days=round(safety_stock_days_val, 1),
        reorder_point=round(reorder_point, 1),
        service_level_achieved=closest_level,
        demand_std_dev=round(sigma_d, 3),
        z_score_used=z,
    )
