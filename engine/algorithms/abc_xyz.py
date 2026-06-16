"""
ABC-XYZ Inventory Classification
"""

import numpy as np
import pandas as pd
from models.schemas import ABCXYZResult, ABCClass, XYZClass, SalesRecord
from algorithms.demand_forecast import prepare_daily_series


ABC_XYZ_STRATEGY = {
    "AX": ("Tight control, lean safety stock. High-value, predictable. Automate reorders.", "Daily", 1.0),
    "AY": ("MRP / DRP system recommended. Buffer stock at 95th percentile demand.", "Daily", 1.3),
    "AZ": ("Expensive to be wrong. Build large safety stock. Hedge with supplier agreements.", "Daily", 1.8),
    "BX": ("Standard EOQ with moderate safety stock. Weekly review sufficient.", "Weekly", 1.0),
    "BY": ("Increase safety stock by 30%. Consider demand shaping (promotions).", "Weekly", 1.3),
    "BZ": ("High variability, medium value. Order on demand. Minimize holding.", "Weekly", 1.5),
    "CX": ("Stable but low value. Minimal stock. Consolidated ordering.", "Monthly", 1.0),
    "CY": ("Low value, variable. Order only when below minimum. Low priority.", "Monthly", 1.2),
    "CZ": ("Candidate for elimination or dropshipping. Do not overstock.", "Monthly", 2.0),
}


def classify_xyz(weekly_sales: pd.Series) -> tuple[XYZClass, float]:
    """Classify a product by demand variability using Coefficient of Variation."""
    if len(weekly_sales) < 4:
        return XYZClass.Y, 0.75

    mu = float(weekly_sales.mean())
    sigma = float(weekly_sales.std())

    cv = sigma / (mu + 1e-6)

    if cv < 0.5:
        return XYZClass.X, round(cv, 3)
    elif cv < 1.0:
        return XYZClass.Y, round(cv, 3)
    else:
        return XYZClass.Z, round(cv, 3)


def run_abc_xyz_analysis(
    products: list[dict],
) -> dict[str, ABCXYZResult]:
    """Run full ABC-XYZ analysis across all products simultaneously."""
    product_revenues = []
    for p in products:
        series = prepare_daily_series(p["sales_history"])
        avg_daily = float(series.mean()) if len(series) > 0 else 0
        annual_rev = avg_daily * 365 * p["price"]
        product_revenues.append({
            "name": p["name"],
            "annual_revenue": annual_rev,
            "series": series,
            "price": p["price"],
        })

    product_revenues.sort(key=lambda x: x["annual_revenue"], reverse=True)
    total_revenue = sum(p["annual_revenue"] for p in product_revenues) + 1e-6

    cumulative = 0
    results = {}

    for p in product_revenues:
        cumulative += p["annual_revenue"]
        cum_pct = (cumulative / total_revenue) * 100
        contrib_pct = (p["annual_revenue"] / total_revenue) * 100

        if cum_pct <= 80:
            abc_class = ABCClass.A
        elif cum_pct <= 95:
            abc_class = ABCClass.B
        else:
            abc_class = ABCClass.C

        weekly = p["series"].resample("W").sum() if len(p["series"]) >= 14 else p["series"]
        xyz_class, cv = classify_xyz(weekly)

        cell = f"{abc_class.value}{xyz_class.value}"
        strategy, review_freq, ss_multiplier = ABC_XYZ_STRATEGY.get(
            cell, ("Standard inventory management.", "Weekly", 1.0)
        )

        results[p["name"]] = ABCXYZResult(
            abc_class=abc_class,
            xyz_class=xyz_class,
            abc_xyz_cell=cell,
            revenue_contribution_pct=round(contrib_pct, 2),
            cumulative_revenue_pct=round(cum_pct, 2),
            coefficient_of_variation=cv,
            recommended_strategy=strategy,
            review_frequency=review_freq,
            safety_stock_multiplier=ss_multiplier,
        )

    return results
