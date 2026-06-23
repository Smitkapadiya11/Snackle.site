from datetime import datetime
from typing import List
from models.schemas import (
    ProductInput, BrandContext, ProductAnalysisResult,
    FullAnalysisResult, ABCXYZResult, ABCClass, XYZClass,
    SeasonalContext, SeasonalPattern, PriceElasticityResult, ScenarioPlanningResult
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
from algorithms.seasonal_events import analyze_seasonal_context
from algorithms.demand_forecast import prepare_daily_series
from algorithms.price_elasticity import calculate_price_elasticity
from algorithms.scenario_planning import generate_scenarios



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

    # ── Seasonal Context (new) ──
    try:
        import numpy as np
        series = prepare_daily_series(product.sales_history)
        # Build base forecast array from the forecast object
        daily_fc_rate = forecast.daily_avg
        base_fc = np.full(90, daily_fc_rate)
        seasonal_data = analyze_seasonal_context(
            product.sales_history,
            brand.category,
            base_forecast=base_fc,
        )
        seasonal_ctx = SeasonalContext(
            seasonal_patterns=seasonal_data.get("seasonal_patterns"),
            heatmap_data=seasonal_data.get("heatmap_data", []),
            upcoming_events=seasonal_data.get("upcoming_events", []),
            yearly_forecast=seasonal_data.get("yearly_forecast"),
            category=brand.category,
        )
    except Exception:
        seasonal_ctx = SeasonalContext(category=brand.category)

    # ── Advanced Algorithms (new) ──
    elasticity_data = calculate_price_elasticity(product.sales_history, product.price)
    elasticity_result = PriceElasticityResult(**elasticity_data)
    
    scenarios_data = generate_scenarios(forecast, product.current_stock, product.price)
    scenarios_result = ScenarioPlanningResult(**scenarios_data)

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
        "price_elasticity": elasticity_result.elasticity,
        "opportunity_revenue_30d": opportunity.opportunity_revenue_30d,
        "recommended_ad_spend": opportunity.recommended_ad_spend,
        "expected_roas": opportunity.expected_roas,
        "trend_pct": forecast.trend_pct,
        "forecast_7d": forecast.next_7d,
        "forecast_30d": forecast.next_30d,
        "forecast_60d": forecast.next_60d,
        "forecast_90d": forecast.next_90d,
        "forecast_30d_lower": forecast.next_30d_lower,
        "forecast_30d_upper": forecast.next_30d_upper,
        "forecast_model": forecast.forecast_model_used,
        "model_mape": forecast.model_accuracy_mape,
        "gmroi": profitability.gmroi,
        "dsi": profitability.days_sales_inventory,
        "inventory_turnover": profitability.inventory_turnover,
        "abc_xyz_cell": abc_xyz.abc_xyz_cell,
        "abc_class": abc_xyz.abc_class.value,
        "xyz_class": abc_xyz.xyz_class.value,
        "revenue_contribution_pct": abc_xyz.revenue_contribution_pct,
        "safety_stock_units": safety_stock.safety_stock_units,
        "reorder_point": safety_stock.reorder_point,
        "service_level_achieved": safety_stock.service_level_achieved,
        "has_anomalies": anomalies.has_anomalies,
        "anomaly_count": len(anomalies.anomaly_dates),
        "change_point": anomalies.latest_change_point,
        "change_point_direction": anomalies.change_point_direction,
        "stockout_p10": monte_carlo.stockout_day_p10,
        "stockout_p90": monte_carlo.stockout_day_p90,
        "stockout_prob_60d_pct": round(monte_carlo.stockout_probability_60d * 100, 1),
        "bundle_uplift_pct": dead_stock.bundle_revenue_uplift_pct,
        "weeks_to_clear": dead_stock.weeks_to_clear_full_stock,
        "opportunity_score": opportunity.opportunity_score,
        "opportunity_urgency": opportunity.urgency_level,
        "annual_revenue_estimate": profitability.annual_revenue_estimate,
        "annual_holding_cost": profitability.annual_holding_cost,
        "meets_gmroi_target": profitability.meets_gmroi_target,
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
        seasonal=seasonal_ctx,
        price_elasticity=elasticity_result,
        scenarios=scenarios_result,
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

    total_stock_value = sum(p.current_stock * p.price for p in analyzed)
    total_annual_revenue = sum(p.profitability.annual_revenue_estimate for p in analyzed)
    total_holding_costs = sum(p.profitability.annual_holding_cost for p in analyzed)
    total_reorder_investment = sum(p.reorder.reorder_cost for p in analyzed if p.reorder.reorder_cost > 0)
    avg_gmroi = sum(p.profitability.gmroi for p in analyzed) / max(len(analyzed), 1)
    avg_days_stock = sum(float(p.key_metrics.get("days_of_stock", 0)) for p in analyzed) / max(len(analyzed), 1)

    # ABC distribution
    a_products = [p for p in analyzed if p.abc_xyz and p.abc_xyz.abc_class.value == "A"]
    b_products = [p for p in analyzed if p.abc_xyz and p.abc_xyz.abc_class.value == "B"]
    c_products = [p for p in analyzed if p.abc_xyz and p.abc_xyz.abc_class.value == "C"]

    # ABC revenue shares
    a_revenue_pct = sum(p.abc_xyz.revenue_contribution_pct for p in a_products) if a_products else 0
    b_revenue_pct = sum(p.abc_xyz.revenue_contribution_pct for p in b_products) if b_products else 0
    c_revenue_pct = sum(p.abc_xyz.revenue_contribution_pct for p in c_products) if c_products else 0

    # Health score (100 = perfect portfolio)
    critical_penalty = sum(1 for p in analyzed if p.status.value == "CRITICAL") * 15
    dead_stock_penalty = sum(1 for p in analyzed if p.status.value == "DEAD_STOCK") * 10
    health_score = max(0, min(100, 100 - critical_penalty - dead_stock_penalty))

    portfolio_summary = {
        # Status counts
        "total_revenue_at_risk": round(sum(p.monte_carlo.expected_revenue_at_risk for p in analyzed), 2),
        "total_capital_locked": round(sum(p.dead_stock.capital_locked for p in analyzed), 2),
        "total_opportunity_value_30d": round(sum(p.opportunity.opportunity_revenue_30d for p in analyzed), 2),
        "total_opportunity_value_90d": round(sum(p.opportunity.opportunity_revenue_90d for p in analyzed), 2),
        "critical_count": sum(1 for p in analyzed if p.status.value == "CRITICAL"),
        "dead_stock_count": sum(1 for p in analyzed if p.status.value == "DEAD_STOCK"),
        "opportunity_count": sum(1 for p in analyzed if p.status.value == "OPPORTUNITY"),
        "healthy_count": sum(1 for p in analyzed if p.status.value == "HEALTHY"),
        "monitor_count": sum(1 for p in analyzed if p.status.value == "MONITOR"),
        # Forecast accuracy
        "avg_forecast_mape": round(sum(p.forecast.model_accuracy_mape for p in analyzed) / max(len(analyzed), 1), 4),
        # ABC breakdown
        "a_class_count": len(a_products),
        "b_class_count": len(b_products),
        "c_class_count": len(c_products),
        "a_class_revenue_pct": round(a_revenue_pct, 1),
        "b_class_revenue_pct": round(b_revenue_pct, 1),
        "c_class_revenue_pct": round(c_revenue_pct, 1),
        # Portfolio financials
        "total_stock_value": round(total_stock_value, 2),
        "total_annual_revenue_estimate": round(total_annual_revenue, 2),
        "total_annual_holding_cost": round(total_holding_costs, 2),
        "total_reorder_investment_needed": round(total_reorder_investment, 2),
        "total_capital_recoverable": round(sum(p.dead_stock.capital_recovered_at_optimal for p in analyzed), 2),
        "avg_gmroi": round(avg_gmroi, 2),
        "avg_days_of_stock": round(avg_days_stock, 1),
        "products_below_reorder_point": sum(1 for p in analyzed if p.current_stock < p.safety_stock.reorder_point),
        "products_with_anomalies": sum(1 for p in analyzed if p.anomalies.has_anomalies),
        "products_below_gmroi_target": sum(1 for p in analyzed if not p.profitability.meets_gmroi_target),
        # Health
        "portfolio_health_score": health_score,
        # Immediate actions required
        "immediate_reorder_count": sum(1 for p in analyzed if p.opportunity.urgency_level == "IMMEDIATE"),
        "total_lost_sales_at_risk_units": round(sum(p.monte_carlo.expected_lost_sales_units for p in analyzed), 1),
    }

    return FullAnalysisResult(
        brand_context=brand,
        products=analyzed,
        portfolio_summary=portfolio_summary,
        generated_at=datetime.utcnow().isoformat(),
        engine_version="2.0.0",
    )
