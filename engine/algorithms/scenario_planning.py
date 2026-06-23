import numpy as np
from typing import Dict, Any
from models.schemas import DemandForecast

def generate_scenarios(
    forecast: DemandForecast,
    current_stock: float,
    price: float,
) -> Dict[str, Any]:
    """
    Generate Optimistic, Baseline, and Pessimistic scenarios 
    for the next 30 days.
    """
    baseline_30d = forecast.next_30d
    optimistic_30d = baseline_30d * 1.20
    pessimistic_30d = baseline_30d * 0.80
    
    # Calculate stockout risk points for each scenario
    opt_stockout = max(0, optimistic_30d - current_stock)
    base_stockout = max(0, baseline_30d - current_stock)
    pess_stockout = max(0, pessimistic_30d - current_stock)
    
    return {
        "optimistic": {
            "demand_30d": round(optimistic_30d, 1),
            "stockout_units": round(opt_stockout, 1),
            "revenue_opportunity": round(optimistic_30d * price, 2),
            "lost_sales_risk": round(opt_stockout * price, 2)
        },
        "baseline": {
            "demand_30d": round(baseline_30d, 1),
            "stockout_units": round(base_stockout, 1),
            "revenue_opportunity": round(baseline_30d * price, 2),
            "lost_sales_risk": round(base_stockout * price, 2)
        },
        "pessimistic": {
            "demand_30d": round(pessimistic_30d, 1),
            "stockout_units": round(pess_stockout, 1),
            "revenue_opportunity": round(pessimistic_30d * price, 2),
            "lost_sales_risk": round(pess_stockout * price, 2)
        }
    }
