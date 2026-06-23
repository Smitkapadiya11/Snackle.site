"""
Seasonal Events & Holiday Detection Engine
Detects Indian and global holidays, seasonal patterns, and event-based demand shifts.
Returns seasonal uplift factors and monthly demand profiles.
"""

import numpy as np
import pandas as pd
from typing import Optional
from models.schemas import SalesRecord
from algorithms.demand_forecast import prepare_daily_series


# ─── Indian Holidays & Events Calendar ───────────────────────────────────────

INDIAN_EVENTS = {
    # Fixed-date holidays
    "diwali": {"months": [10, 11], "uplift": 2.5, "category_boost": {"food": 3.0, "electronics": 3.5, "apparel": 2.8, "skincare": 2.0}},
    "navratri": {"months": [10], "uplift": 1.8, "category_boost": {"apparel": 3.0, "food": 2.0}},
    "holi": {"months": [3], "uplift": 1.6, "category_boost": {"apparel": 2.0, "food": 1.8, "skincare": 1.5}},
    "eid": {"months": [4, 5], "uplift": 1.7, "category_boost": {"apparel": 2.5, "food": 2.0}},
    "christmas_new_year": {"months": [12, 1], "uplift": 1.5, "category_boost": {"electronics": 2.0, "apparel": 1.8, "food": 1.5}},
    "republic_day_sale": {"months": [1], "uplift": 1.4, "category_boost": {}},
    "independence_day_sale": {"months": [8], "uplift": 1.4, "category_boost": {}},
    "amazon_great_indian_festival": {"months": [10], "uplift": 3.0, "category_boost": {"electronics": 4.0, "apparel": 3.0}},
    "flipkart_big_billion_days": {"months": [10], "uplift": 2.8, "category_boost": {"electronics": 3.5, "apparel": 2.5}},
    "end_of_season_sale": {"months": [6, 12], "uplift": 1.6, "category_boost": {"apparel": 2.5, "skincare": 1.8}},
    "monsoon_season": {"months": [6, 7, 8, 9], "uplift": 0.85, "category_boost": {"skincare": 1.3, "haircare": 1.4}},
    "wedding_season": {"months": [11, 12, 2], "uplift": 1.5, "category_boost": {"apparel": 2.5, "skincare": 2.0, "home": 2.0}},
    "summer_peak": {"months": [4, 5], "uplift": 0.9, "category_boost": {"skincare": 1.5, "electronics": 1.2}},
    "back_to_school": {"months": [6, 7], "uplift": 1.2, "category_boost": {"stationery": 2.5, "bags": 2.0}},
}

# Monthly seasonality indices (1.0 = baseline, >1 = above average, <1 = below)
BASE_MONTHLY_INDEX = {
    1: 0.85,   # Jan — post-holiday slump
    2: 0.90,   # Feb — Valentine's pickup
    3: 0.95,   # Mar — financial year end
    4: 0.88,   # Apr — summer heat
    5: 0.85,   # May — summer low
    6: 0.90,   # Jun — end of season
    7: 0.92,   # Jul — monsoon
    8: 0.95,   # Aug — Independence Day
    9: 1.05,   # Sep — pre-festive
    10: 1.35,  # Oct — FESTIVE PEAK (Navratri/Diwali/Amazon GIF)
    11: 1.25,  # Nov — post-Diwali + wedding
    12: 1.15,  # Dec — Christmas/New Year
}


def detect_seasonal_patterns(series: pd.Series) -> dict:
    """
    Detect seasonal patterns in historical sales data.
    Returns monthly uplift factors, peak months, and seasonality strength.
    """
    if len(series) < 60:
        return {
            "monthly_factors": {str(m): BASE_MONTHLY_INDEX[m] for m in range(1, 13)},
            "peak_months": [10, 11, 12],
            "trough_months": [1, 4, 5],
            "seasonality_strength": 0.3,
            "has_seasonality": True,
            "detected_from_data": False,
        }

    # Group by month and compute average
    monthly_avg = series.groupby(series.index.month).mean()
    overall_avg = float(series.mean())

    if overall_avg == 0:
        monthly_factors = {str(m): 1.0 for m in range(1, 13)}
    else:
        monthly_factors = {}
        for month in range(1, 13):
            if month in monthly_avg.index:
                factor = float(monthly_avg[month]) / overall_avg
            else:
                # Use base index if no data for that month
                factor = BASE_MONTHLY_INDEX[month]
            monthly_factors[str(month)] = round(factor, 3)

    # Find peaks and troughs
    factors_list = [(m, f) for m, f in monthly_factors.items()]
    factors_sorted = sorted(factors_list, key=lambda x: x[1], reverse=True)

    peak_months = [int(m) for m, _ in factors_sorted[:3]]
    trough_months = [int(m) for m, _ in factors_sorted[-3:]]

    # Seasonality strength = coefficient of variation of monthly factors
    factor_values = list(monthly_factors.values())
    mean_f = np.mean(factor_values)
    std_f = np.std(factor_values)
    seasonality_strength = round(float(std_f / (mean_f + 1e-6)), 3)

    has_seasonality = seasonality_strength > 0.15

    return {
        "monthly_factors": monthly_factors,
        "peak_months": peak_months,
        "trough_months": trough_months,
        "seasonality_strength": round(seasonality_strength, 3),
        "has_seasonality": has_seasonality,
        "detected_from_data": True,
    }


def get_event_uplift_for_month(month: int, category: str) -> float:
    """Get the estimated demand uplift for a given month and product category."""
    base = BASE_MONTHLY_INDEX.get(month, 1.0)
    category_lower = category.lower()

    for event_name, event_data in INDIAN_EVENTS.items():
        if month in event_data["months"]:
            cat_boost = event_data.get("category_boost", {})
            for cat_key, boost in cat_boost.items():
                if cat_key in category_lower:
                    return base * (1 + (boost - 1) * 0.5)

    return base


def compute_yearly_forecast(
    series: pd.Series,
    seasonal_patterns: dict,
    base_daily_forecast: np.ndarray,
) -> dict:
    """
    Extend forecast to 365 days with seasonal adjustments.
    Returns monthly breakdown and weekly time series.
    """
    if len(base_daily_forecast) == 0:
        base_rate = float(series.mean()) if len(series) > 0 else 1.0
        base_daily_forecast = np.full(90, base_rate)

    # Extend forecast beyond 90 days using average + trend
    n_base = len(base_daily_forecast)
    if n_base >= 90:
        daily_avg_from_fc = float(base_daily_forecast.mean())
        # Simple trend extrapolation
        if n_base >= 30:
            early_avg = float(base_daily_forecast[:30].mean())
            late_avg = float(base_daily_forecast[-30:].mean())
            daily_trend = (late_avg - early_avg) / 60
        else:
            daily_trend = 0.0
    else:
        daily_avg_from_fc = float(series.mean()) if len(series) > 0 else 1.0
        daily_trend = 0.0

    # Generate 365-day forecast
    start_date = pd.Timestamp.now().normalize() + pd.Timedelta(days=1)
    date_range = pd.date_range(start=start_date, periods=365, freq='D')

    yearly_forecast = []
    monthly_factors = seasonal_patterns.get("monthly_factors", {})

    for i, date in enumerate(date_range):
        month = date.month
        factor = float(monthly_factors.get(str(month), 1.0))

        if i < n_base:
            base_val = float(base_daily_forecast[i])
        else:
            # Extrapolate beyond 90 days
            base_val = max(0, daily_avg_from_fc + daily_trend * (i - n_base))

        # Apply seasonal factor
        adjusted = max(0, base_val * factor)
        yearly_forecast.append({
            "date": date.strftime("%Y-%m-%d"),
            "forecast": round(adjusted, 2),
            "lower": round(adjusted * 0.75, 2),
            "upper": round(adjusted * 1.35, 2),
            "seasonal_factor": round(factor, 3),
        })

    # Monthly aggregates
    monthly_totals = {}
    for day in yearly_forecast:
        month_key = day["date"][:7]  # YYYY-MM
        if month_key not in monthly_totals:
            monthly_totals[month_key] = {"forecast": 0, "lower": 0, "upper": 0}
        monthly_totals[month_key]["forecast"] += day["forecast"]
        monthly_totals[month_key]["lower"] += day["lower"]
        monthly_totals[month_key]["upper"] += day["upper"]

    monthly_list = [
        {
            "month": k,
            "forecast": round(v["forecast"], 1),
            "lower": round(v["lower"], 1),
            "upper": round(v["upper"], 1),
        }
        for k, v in sorted(monthly_totals.items())
    ]

    # Weekly aggregates (first 52 weeks)
    weekly_list = []
    for week_idx in range(0, min(364, len(yearly_forecast)), 7):
        week_days = yearly_forecast[week_idx:week_idx + 7]
        if week_days:
            weekly_list.append({
                "week": week_days[0]["date"],
                "forecast": round(sum(d["forecast"] for d in week_days), 1),
                "lower": round(sum(d["lower"] for d in week_days), 1),
                "upper": round(sum(d["upper"] for d in week_days), 1),
            })

    return {
        "daily": yearly_forecast[:90],  # First 90 days (detailed)
        "weekly": weekly_list[:26],      # First 26 weeks
        "monthly": monthly_list,
        "total_365d": round(sum(d["forecast"] for d in yearly_forecast), 1),
        "peak_month": max(monthly_list, key=lambda x: x["forecast"])["month"] if monthly_list else "",
        "trough_month": min(monthly_list, key=lambda x: x["forecast"])["month"] if monthly_list else "",
    }


def analyze_seasonal_context(
    sales_history: list[SalesRecord],
    category: str,
    base_forecast: Optional[np.ndarray] = None,
) -> dict:
    """
    Full seasonal analysis: patterns + events + yearly forecast.
    """
    series = prepare_daily_series(sales_history)

    seasonal_patterns = detect_seasonal_patterns(series)

    # Compute historical weekly heatmap for visualization
    heatmap_data = []
    if len(series) >= 14:
        # Create week-of-year × day-of-week heatmap
        df = series.reset_index()
        df.columns = ["date", "units"]
        df["week"] = df["date"].dt.isocalendar().week.astype(int)
        df["month"] = df["date"].dt.month

        # Monthly aggregation for heatmap
        monthly_hist = df.groupby("month")["units"].agg(["mean", "sum", "count"]).reset_index()
        for _, row in monthly_hist.iterrows():
            heatmap_data.append({
                "month": int(row["month"]),
                "month_name": pd.Timestamp(2024, int(row["month"]), 1).strftime("%b"),
                "avg_daily": round(float(row["mean"]), 2),
                "total": round(float(row["sum"]), 1),
                "days": int(row["count"]),
                "intensity": round(float(row["mean"]) / (float(series.mean()) + 1e-6), 3),
            })

    # Get upcoming events
    current_month = pd.Timestamp.now().month
    upcoming_events = []
    for event_name, event_data in INDIAN_EVENTS.items():
        for event_month in event_data["months"]:
            if event_month >= current_month or event_month <= (current_month + 3) % 12:
                category_lower = category.lower()
                cat_boost = next(
                    (v for k, v in event_data["category_boost"].items() if k in category_lower),
                    event_data["uplift"]
                )
                upcoming_events.append({
                    "name": event_name.replace("_", " ").title(),
                    "month": event_month,
                    "uplift_factor": round(cat_boost, 2),
                    "months_away": (event_month - current_month) % 12,
                })

    upcoming_events = sorted(upcoming_events, key=lambda x: x["months_away"])[:5]

    # Yearly forecast
    yearly = {}
    if base_forecast is not None and len(base_forecast) > 0:
        yearly = compute_yearly_forecast(series, seasonal_patterns, base_forecast)

    return {
        "seasonal_patterns": seasonal_patterns,
        "heatmap_data": heatmap_data,
        "upcoming_events": upcoming_events,
        "yearly_forecast": yearly,
        "category": category,
    }
