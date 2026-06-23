# market_intelligence/router.py

from fastapi import APIRouter, Query
from fastapi.responses import JSONResponse
from .engine import MarketIntelligenceEngine
import time

router = APIRouter(prefix="/market", tags=["market-intelligence"])


def get_engine() -> MarketIntelligenceEngine:
    """
    Seed rotates every 30 seconds — creates "live data" feel
    while remaining reproducible within that window.
    """
    seed = int(time.time()) // 30
    return MarketIntelligenceEngine(seed=seed)


@router.get("/summary")
async def market_summary():
    """Top-line market intelligence KPIs."""
    engine = get_engine()
    return JSONResponse(engine.get_market_summary())


@router.get("/competitors")
async def competitor_tracker(
    category: str = Query(None, description="Filter by category e.g. Skincare"),
):
    """
    Returns competitor brand intelligence with OOS rates,
    trend direction, and Monte Carlo OOS probability.
    """
    engine = get_engine()
    data = engine.get_competitors()
    if category:
        data = [d for d in data if d["category"].lower() == category.lower()]
    return JSONResponse({"competitors": data, "count": len(data)})


@router.get("/demand")
async def category_demand(
    n_periods: int = Query(30, ge=7, le=90, description="Number of days of history"),
):
    """
    Returns Holt-Winters demand series for each product category.
    Includes spike detection and trend classification.
    """
    engine = get_engine()
    data = engine.get_category_demand_series(n_periods=n_periods)
    return JSONResponse({"categories": data})


@router.get("/opportunities")
async def market_opportunities(
    n: int = Query(8, ge=1, le=20),
    urgency: str = Query(None, description="Filter: HIGH / MEDIUM / LOW"),
):
    """
    Returns scored market opportunity alerts.
    Sorted by urgency × ML confidence score.
    """
    engine = get_engine()
    opps = engine.get_opportunities(n=n)
    if urgency:
        opps = [o for o in opps if o["urgency"] == urgency.upper()]
    return JSONResponse({"opportunities": opps, "total": len(opps)})


@router.get("/prices")
async def price_intelligence(
    category: str = Query(None, description="Filter by category"),
):
    """
    Returns price intelligence using Gaussian KDE market price modeling.
    Includes position classification and price elasticity estimate.
    """
    engine = get_engine()
    data = engine.get_price_intelligence()
    if category:
        data = [d for d in data if d["category"].lower() == category.lower()]
    return JSONResponse({"prices": data, "count": len(data)})


@router.get("/heatmap")
async def market_heatmap():
    """
    Returns market-level ABC-XYZ 9-cell matrix.
    Each cell includes SKU counts, avg demand, variability, and strategic note.
    """
    engine = get_engine()
    cells = engine.get_market_heatmap()
    return JSONResponse({"heatmap": cells, "grid": "3x3 ABC-XYZ"})


@router.get("/health")
async def health():
    """Market intelligence engine health check."""
    return JSONResponse({"status": "ok", "engine": "MarketIntelligenceEngine v2.0"})
