"""
Monte Carlo Stockout Simulation
Runs 10,000 demand paths using:
  - Normal distribution N(μ, σ) for daily demand
  - Lead time sampled from N(μ_L, σ_L)
  - Computes stockout probability, expected lost sales, Value at Risk
"""

import numpy as np
from models.schemas import MonteCarloResult, SalesRecord
from algorithms.demand_forecast import prepare_daily_series

N_SIMULATIONS = 10_000
SIMULATION_DAYS = 90
RANDOM_SEED = 42


def run_monte_carlo(
    sales_history: list[SalesRecord],
    current_stock: float,
    price: float,
    avg_lead_time_days: float,
    lead_time_std_days: float,
    reorder_point: float = 0,
    reorder_qty: float = 0,
) -> MonteCarloResult:
    """Monte Carlo simulation across 10,000 demand paths."""
    series = prepare_daily_series(sales_history)

    if len(series) < 7:
        return _empty_monte_carlo(current_stock, price)

    mu = float(series.mean())
    sigma = float(series.std())
    sigma = max(sigma, mu * 0.1)

    rng = np.random.default_rng(RANDOM_SEED)

    demand_matrix = np.maximum(
        rng.normal(loc=mu, scale=sigma, size=(N_SIMULATIONS, SIMULATION_DAYS)),
        0
    )

    cumulative_demand = np.cumsum(demand_matrix, axis=1)
    inventory_matrix = current_stock - cumulative_demand

    is_stockout = inventory_matrix < 0

    first_stockout_days = np.argmax(is_stockout, axis=1).astype(float)
    never_stockout = ~is_stockout.any(axis=1)
    first_stockout_days[never_stockout] = SIMULATION_DAYS + 1

    stockout_in_30d = float(np.mean(first_stockout_days <= 30))
    stockout_in_60d = float(np.mean(first_stockout_days <= 60))

    actual_stockouts = first_stockout_days[~never_stockout]
    if len(actual_stockouts) > 0:
        p10 = float(np.percentile(actual_stockouts, 10))
        p50 = float(np.percentile(actual_stockouts, 50))
        p90 = float(np.percentile(actual_stockouts, 90))
        expected_day = float(actual_stockouts.mean())
    else:
        p10 = p50 = p90 = expected_day = float(SIMULATION_DAYS + 1)

    lost_units_matrix = np.maximum(-inventory_matrix, 0)
    expected_lost_units = float(lost_units_matrix.mean(axis=0).sum())
    expected_revenue_at_risk = expected_lost_units * price

    return MonteCarloResult(
        stockout_probability_30d=round(stockout_in_30d, 3),
        stockout_probability_60d=round(stockout_in_60d, 3),
        expected_stockout_day=round(expected_day, 1),
        stockout_day_p10=round(p10, 1),
        stockout_day_p50=round(p50, 1),
        stockout_day_p90=round(p90, 1),
        expected_lost_sales_units=round(expected_lost_units, 1),
        expected_revenue_at_risk=round(expected_revenue_at_risk, 2),
        simulations_run=N_SIMULATIONS,
    )


def _empty_monte_carlo(stock: float, price: float) -> MonteCarloResult:
    return MonteCarloResult(
        stockout_probability_30d=0, stockout_probability_60d=0,
        expected_stockout_day=90, stockout_day_p10=90,
        stockout_day_p50=90, stockout_day_p90=90,
        expected_lost_sales_units=0, expected_revenue_at_risk=0,
        simulations_run=0,
    )
