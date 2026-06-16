"""
Advanced Reorder Optimization
Models:
  1. Classic EOQ (Economic Order Quantity)
  2. EOQ with Backorder Penalty
  3. Q,R Continuous Review Policy
  4. Total Annual Inventory Cost minimization
"""

import numpy as np
from models.schemas import ReorderResult


def eoq_classic(
    annual_demand: float,
    ordering_cost: float,
    unit_price: float,
    holding_cost_pct: float,
) -> float:
    """Classic EOQ: Q* = sqrt(2 × D × S / H)"""
    H = unit_price * holding_cost_pct
    if H <= 0 or annual_demand <= 0:
        return 0.0
    return float(np.sqrt((2 * annual_demand * ordering_cost) / H))


def eoq_with_backorder(
    annual_demand: float,
    ordering_cost: float,
    unit_price: float,
    holding_cost_pct: float,
    backorder_cost_pct: float,
) -> float:
    """EOQ with planned backorders allowed."""
    H = unit_price * holding_cost_pct
    pi = unit_price * backorder_cost_pct
    if H <= 0 or pi <= 0:
        return eoq_classic(annual_demand, ordering_cost, unit_price, holding_cost_pct)

    classic = eoq_classic(annual_demand, ordering_cost, unit_price, holding_cost_pct)
    backorder_factor = np.sqrt((H + pi) / pi)
    return float(classic * backorder_factor)


def total_inventory_cost(
    order_qty: float,
    annual_demand: float,
    ordering_cost: float,
    unit_price: float,
    holding_cost_pct: float,
) -> float:
    """Total Annual Inventory Cost (TIC)."""
    if order_qty <= 0:
        return float("inf")
    H = unit_price * holding_cost_pct
    purchase_cost = annual_demand * unit_price
    ordering = (annual_demand / order_qty) * ordering_cost
    holding = (order_qty / 2) * H
    return purchase_cost + ordering + holding


def compute_reorder(
    daily_sales_avg: float,
    current_stock: float,
    unit_price: float,
    ordering_cost: float,
    holding_cost_pct: float,
    backorder_cost_pct: float,
    avg_lead_time_days: float,
    safety_stock_units: float,
    reorder_point: float,
) -> ReorderResult:
    """Full reorder recommendation engine."""
    annual_demand = daily_sales_avg * 365

    q_classic = eoq_classic(annual_demand, ordering_cost, unit_price, holding_cost_pct)
    q_backorder = eoq_with_backorder(
        annual_demand, ordering_cost, unit_price,
        holding_cost_pct, backorder_cost_pct
    )

    demand_during_lead = daily_sales_avg * avg_lead_time_days
    minimum_coverage_order = max(0, demand_during_lead + safety_stock_units - current_stock)

    recommended_qty = max(q_classic, minimum_coverage_order)
    recommended_qty = np.ceil(recommended_qty)

    current_order_pattern = max(current_stock, daily_sales_avg * 30)
    tic_current = total_inventory_cost(
        current_order_pattern, annual_demand, ordering_cost, unit_price, holding_cost_pct
    )
    tic_recommended = total_inventory_cost(
        recommended_qty, annual_demand, ordering_cost, unit_price, holding_cost_pct
    )
    cost_savings = max(0, tic_current - tic_recommended)

    reorder_cost = recommended_qty * unit_price
    covers_days = (recommended_qty / daily_sales_avg) if daily_sales_avg > 0 else 0

    return ReorderResult(
        eoq_units=round(q_classic, 1),
        eoq_with_backorder=round(q_backorder, 1),
        reorder_point=round(reorder_point, 1),
        reorder_cost=round(reorder_cost, 2),
        recommended_order_qty=round(recommended_qty, 0),
        covers_days=round(covers_days, 1),
        total_inventory_cost_annual=round(tic_recommended, 2),
        cost_savings_vs_current=round(cost_savings, 2),
    )
