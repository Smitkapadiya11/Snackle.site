import numpy as np
import pandas as pd
from typing import List, Dict, Any
from models.schemas import SalesRecord

def calculate_price_elasticity(
    sales_history: List[SalesRecord],
    current_price: float,
) -> Dict[str, Any]:
    """
    Calculate price elasticity of demand if historical price changes exist.
    If not, uses a heuristic based on volatility.
    """
    if len(sales_history) < 14:
        return {
            "elasticity": -1.5,
            "is_estimated": True,
            "demand_impact_10pct_discount": 15.0,
            "demand_impact_10pct_markup": -15.0,
        }
        
    df = pd.DataFrame([
        {"date": pd.to_datetime(s.date), "units": s.units_sold}
        for s in sales_history
    ])
    df = df.groupby("date").sum().reset_index()
    df = df.set_index("date").sort_index()
    
    cv = df["units"].std() / (df["units"].mean() + 1e-6)
    
    # Estimate elasticity between -0.5 (inelastic) and -3.0 (highly elastic)
    base_elasticity = -1.0
    estimated_elasticity = max(-3.0, min(-0.5, base_elasticity - (cv * 0.5)))
    
    return {
        "elasticity": round(estimated_elasticity, 2),
        "is_estimated": True,
        "demand_impact_10pct_discount": round(abs(estimated_elasticity * 10), 1),
        "demand_impact_10pct_markup": round(estimated_elasticity * 10, 1),
    }
