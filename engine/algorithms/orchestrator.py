"""
Master Orchestrator — runs ALL algorithms in optimal order.
"""

from datetime import datetime
from typing import List
from models.schemas import (
    ProductInput, BrandContext, ProductAnalysisResult,
    FullAnalysisResult, ABCXYZResult, ABCClass, XYZClass,
)
from algorithms.demand_forecast import forecast_demand
from algorithms.safety_stock import compute_safety_stock
from algorithms.monte_carlo import run_monte_carlo
from algorithms.reorder import compute_reorder
from algorithms.dead_stock import analyze_dead_stock
from algorithms.opportunity import analyze_opportunity
from algorithms.abc_xyz import run_abc_xyz_analysis
from algorithms.anomaly import analyze_anomalies
from algorithms.profitability import analyze_profitability
from algorithms.risk_score import compute_risk_score


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


def analyze_single_product(
    product: ProductInput,
    brand: BrandContext,
    abc_xyz_results: dict,
    top_seller_velocity: float = 0,
) -> ProductAnalysisResult:
    """Run complete analysis pipeline for one product."""
    anomalies = analyze_anomalies(product.sales_history)
    adj_daily_avg = anomalies.adjusted_avg_daily_sales

    forecast = forecast_demand(product.sales_history, brand)

    safety_stock = compute_safety_stock(
        product.sales_history,
        brand.avg_lead_time_days,
        brand.avg_lead_time_std_days,
        brand.service_level_target,
        product.price,
    )

    monte_carlo = run_monte_carlo(
        product.sales_history,
        product.current_stock,
        product.price,
        brand.avg_lead_time_days,
        brand.avg_lead_time_std_days,
        safety_stock.reorder_point,
        0,
    )

    reorder = compute_reorder(
        daily_sales_avg=adj_daily_avg,
        current_stock=product.current_stock,
        unit_price=product.price,
        ordering_cost=brand.ordering_cost,
        holding_cost_pct=brand.holding_cost_pct,
        backorder_cost_pct=brand.backorder_cost_pct,
        avg_lead_time_days=brand.avg_lead_time_days,
        safety_stock_units=safety_stock.safety_stock_units,
        reorder_point=safety_stock.reorder_point,
    )

    dead_stock = analyze_dead_stock(
        product.sales_history,
        product.current_stock,
        product.price,
        brand.dead_stock_threshold_days,
        brand.typical_discount_pct,
        top_seller_velocity=top_seller_velocity,
    )

    abc_xyz = abc_xyz_results.get(product.name) or _default_abc_xyz()

    days_of_stock = (product.current_stock / adj_daily_avg) if adj_daily_avg > 0 else 999
    opportunity = analyze_opportunity(
        product.sales_history,
        product.current_stock,
        product.price,
        days_of_stock,
        forecast.next_30d,
        forecast.next_90d,
        competitor_out_of_stock=(forecast.trend_pct > 20),
        abc_class=abc_xyz.abc_class.value,
        brand_context=brand,
    )

    profitability = analyze_profitability(
        product.sales_history,
        product.current_stock,
        product.price,
        brand.ordering_cost,
        brand.holding_cost_pct,
        brand.category,
        brand.target_gmroi,
    )

    risk_score, status = compute_risk_score(
        monte_carlo=monte_carlo,
        dead_stock=dead_stock,
        opportunity=opportunity,
        anomalies=anomalies,
        abc_xyz=abc_xyz,
        price=product.price,
        current_stock=product.current_stock,
        daily_sales_avg=adj_daily_avg,
    )

    key_metrics = {
        "adj_daily_avg": round(adj_daily_avg, 2),
        "days_of_stock": round(days_of_stock, 1),
        "stockout_date_p50": monte_carlo.stockout_day_p50,
        "stockout_probability_30d_pct": round(monte_carlo.stockout_probability_30d * 100, 1),
        "revenue_at_risk": monte_carlo.expected_revenue_at_risk,
        "reorder_qty": reorder.recommended_order_qty,
        "reorder_cost": reorder.reorder_cost,
        "eoq": reorder.eoq_units,
        "capital_locked": dead_stock.capital_locked,
        "optimal_discount_pct": dead_stock.optimal_discount_pct,
        "optimal_price": dead_stock.optimal_clearance_price,
        "capital_recovered": dead_stock.capital_recovered_at_optimal,
        "price_elasticity": dead_stock.price_elasticity_estimate,
        "opportunity_revenue_30d": opportunity.opportunity_revenue_30d,
        "recommended_ad_spend": opportunity.recommended_ad_spend,
        "expected_roas": opportunity.expected_roas,
        "trend_pct": forecast.trend_pct,
        "forecast_30d": forecast.next_30d,
        "forecast_model": forecast.forecast_model_used,
        "model_mape": forecast.model_accuracy_mape,
        "gmroi": profitability.gmroi,
        "dsi": profitability.days_sales_inventory,
        "inventory_turnover": profitability.inventory_turnover,
        "abc_xyz_cell": abc_xyz.abc_xyz_cell,
        "safety_stock_units": safety_stock.safety_stock_units,
        "has_anomalies": anomalies.has_anomalies,
        "anomaly_count": len(anomalies.anomaly_dates),
        "change_point": anomalies.latest_change_point,
    }

    return ProductAnalysisResult(
        name=product.name,
        sku=product.sku,
        price=product.price,
        current_stock=product.current_stock,
        status=status,
        risk_score=risk_score,
        forecast=forecast,
        safety_stock=safety_stock,
        monte_carlo=monte_carlo,
        reorder=reorder,
        dead_stock=dead_stock,
        opportunity=opportunity,
        abc_xyz=abc_xyz,
        anomalies=anomalies,
        profitability=profitability,
        key_metrics=key_metrics,
    )


def run_full_analysis(
    products: List[ProductInput],
    brand: BrandContext,
) -> FullAnalysisResult:
    """Run the complete analysis for all products in the portfolio."""
    abc_xyz_input = [
        {
            "name": p.name,
            "sales_history": p.sales_history,
            "price": p.price,
        }
        for p in products
    ]
    abc_xyz_results = run_abc_xyz_analysis(abc_xyz_input)

    # Find top seller velocity for bundle recommendations
    top_velocity = 0.0
    for p in products:
        from algorithms.demand_forecast import prepare_daily_series
        series = prepare_daily_series(p.sales_history)
        if len(series) > 0:
            top_velocity = max(top_velocity, float(series.mean()))

    analyzed = [
        analyze_single_product(p, brand, abc_xyz_results, top_seller_velocity=top_velocity)
        for p in products
    ]

    analyzed.sort(key=lambda x: x.risk_score.overall_risk_score, reverse=True)

    portfolio_summary = {
        "total_revenue_at_risk": sum(p.monte_carlo.expected_revenue_at_risk for p in analyzed),
        "total_capital_locked": sum(p.dead_stock.capital_locked for p in analyzed),
        "total_opportunity_value_30d": sum(p.opportunity.opportunity_revenue_30d for p in analyzed),
        "critical_count": sum(1 for p in analyzed if p.status.value == "CRITICAL"),
        "dead_stock_count": sum(1 for p in analyzed if p.status.value == "DEAD_STOCK"),
        "opportunity_count": sum(1 for p in analyzed if p.status.value == "OPPORTUNITY"),
        "healthy_count": sum(1 for p in analyzed if p.status.value == "HEALTHY"),
        "monitor_count": sum(1 for p in analyzed if p.status.value == "MONITOR"),
        "avg_forecast_mape": sum(p.forecast.model_accuracy_mape for p in analyzed) / max(len(analyzed), 1),
        "a_class_products": sum(1 for p in analyzed if p.abc_xyz and p.abc_xyz.abc_class.value == "A"),
    }

    return FullAnalysisResult(
        brand_context=brand,
        products=analyzed,
        portfolio_summary=portfolio_summary,
        generated_at=datetime.utcnow().isoformat(),
        engine_version="2.0.0",
    )
