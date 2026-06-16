"""
Multi-Factor Risk Scoring Engine
"""

from models.schemas import (
    RiskScore, MonteCarloResult, DeadStockResult,
    OpportunityResult, AnomalyResult, ABCXYZResult,
    ProductStatus, ABCClass, XYZClass,
)


def _default_abc_xyz() -> ABCXYZResult:
    return ABCXYZResult(
        abc_class=ABCClass.B,
        xyz_class=XYZClass.Y,
        abc_xyz_cell="BY",
        revenue_contribution_pct=0,
        cumulative_revenue_pct=0,
        coefficient_of_variation=0.75,
        recommended_strategy="Standard inventory management.",
        review_frequency="Weekly",
        safety_stock_multiplier=1.0,
    )


def compute_risk_score(
    monte_carlo: MonteCarloResult,
    dead_stock: DeadStockResult,
    opportunity: OpportunityResult,
    anomalies: AnomalyResult,
    abc_xyz: ABCXYZResult | None,
    price: float,
    current_stock: float,
    daily_sales_avg: float,
) -> tuple[RiskScore, ProductStatus]:
    """Compute composite risk score and determine product status."""
    if abc_xyz is None:
        abc_xyz = _default_abc_xyz()

    risk_factors = []

    prob_stockout_30d = monte_carlo.stockout_probability_30d
    stockout_risk = min(100, prob_stockout_30d * 150)
    if prob_stockout_30d > 0.5:
        risk_factors.append(f"{int(prob_stockout_30d*100)}% chance of stockout in 30 days")
    if prob_stockout_30d > 0.7:
        risk_factors.append(f"Expected stockout in {monte_carlo.stockout_day_p50:.0f} days")

    dead_stock_risk = 0.0
    if dead_stock.is_dead:
        dead_stock_risk = 80 + min(20, dead_stock.stock_age_days / 10)
        risk_factors.append(f"₹{dead_stock.capital_locked:,.0f} locked in non-moving stock")
    elif dead_stock.is_slow_mover:
        dead_stock_risk = 40 + min(30, abs(dead_stock.velocity_drop_pct))
        risk_factors.append(f"Sales velocity dropped {abs(dead_stock.velocity_drop_pct):.0f}%")
    dead_stock_risk = min(100, dead_stock_risk)

    opp_score = opportunity.opportunity_score if opportunity.is_opportunity else 0
    if opportunity.is_opportunity:
        risk_factors.append(f"₹{opportunity.opportunity_revenue_30d:,.0f} opportunity at risk")

    total_exposure = monte_carlo.expected_revenue_at_risk + dead_stock.capital_locked
    financial_risk = min(100, total_exposure / 2000)

    anomaly_risk = 30 if anomalies.has_anomalies else 0
    if anomalies.latest_change_point:
        anomaly_risk = 50
        risk_factors.append(f"Demand change detected since {anomalies.latest_change_point}")

    overall = (
        stockout_risk   * 0.35 +
        dead_stock_risk * 0.25 +
        opp_score       * 0.20 +
        financial_risk  * 0.15 +
        anomaly_risk    * 0.05
    )
    overall = min(100, round(overall, 1))

    abc_modifiers = {"A": 1.10, "B": 1.00, "C": 0.85}
    modifier = abc_modifiers.get(abc_xyz.abc_class.value, 1.0)
    overall = min(100, overall * modifier)

    confidence = 0.5
    if monte_carlo.simulations_run > 0:
        confidence += 0.3
    if not anomalies.has_anomalies or anomalies.adjusted_avg_daily_sales > 0:
        confidence += 0.2

    if prob_stockout_30d >= 0.6 or monte_carlo.stockout_day_p50 <= 14:
        status = ProductStatus.CRITICAL
    elif dead_stock.is_dead:
        status = ProductStatus.DEAD_STOCK
    elif opportunity.is_opportunity:
        status = ProductStatus.OPPORTUNITY
    elif dead_stock.is_slow_mover or prob_stockout_30d > 0.2:
        status = ProductStatus.MONITOR
    else:
        status = ProductStatus.HEALTHY

    return RiskScore(
        overall_risk_score=round(overall, 1),
        stockout_risk=round(stockout_risk, 1),
        dead_stock_risk=round(dead_stock_risk, 1),
        opportunity_score=round(opp_score, 1),
        financial_exposure=round(total_exposure, 2),
        confidence=round(min(1.0, confidence), 2),
        risk_factors=risk_factors[:5],
    ), status
