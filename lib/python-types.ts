export interface PythonProductAnalysis {
  name: string;
  sku: string;
  price: number;
  current_stock: number;
  status: "CRITICAL" | "DEAD_STOCK" | "OPPORTUNITY" | "HEALTHY" | "MONITOR";
  risk_score: {
    overall_risk_score: number;
    stockout_risk: number;
    dead_stock_risk: number;
    opportunity_score: number;
    financial_exposure: number;
    confidence: number;
    risk_factors: string[];
  };
  forecast: {
    next_7d: number;
    next_30d: number;
    next_60d: number;
    next_90d: number;
    daily_avg: number;
    trend_pct: number;
    next_30d_lower: number;
    next_30d_upper: number;
    forecast_model_used: string;
    model_accuracy_mape: number;
  };
  safety_stock: {
    safety_stock_units: number;
    safety_stock_days: number;
    reorder_point: number;
    service_level_achieved: number;
    demand_std_dev: number;
    z_score_used: number;
  };
  monte_carlo: {
    stockout_probability_30d: number;
    stockout_probability_60d: number;
    expected_stockout_day: number;
    stockout_day_p10: number;
    stockout_day_p50: number;
    stockout_day_p90: number;
    expected_lost_sales_units: number;
    expected_revenue_at_risk: number;
    simulations_run: number;
  };
  reorder: {
    eoq_units: number;
    eoq_with_backorder: number;
    reorder_point: number;
    reorder_cost: number;
    recommended_order_qty: number;
    covers_days: number;
    total_inventory_cost_annual: number;
    cost_savings_vs_current: number;
  };
  dead_stock: {
    is_dead: boolean;
    is_slow_mover: boolean;
    velocity_drop_pct: number;
    stock_age_days: number;
    capital_locked: number;
    optimal_discount_pct: number;
    optimal_clearance_price: number;
    price_elasticity_estimate: number;
    units_to_clear_at_optimal: number;
    capital_recovered_at_optimal: number;
    weeks_to_clear_full_stock: number;
    bundle_revenue_uplift_pct: number;
  };
  opportunity: {
    is_opportunity: boolean;
    opportunity_score: number;
    demand_growth_rate_pct: number;
    trend_acceleration: number;
    opportunity_revenue_30d: number;
    opportunity_revenue_90d: number;
    recommended_order_qty: number;
    recommended_ad_spend: number;
    expected_roas: number;
    days_until_stockout_at_spike: number;
    urgency_level: string;
  };
  abc_xyz?: {
    abc_class: string;
    xyz_class: string;
    abc_xyz_cell: string;
    revenue_contribution_pct: number;
    cumulative_revenue_pct: number;
    coefficient_of_variation: number;
    recommended_strategy: string;
    review_frequency: string;
    safety_stock_multiplier: number;
  };
  anomalies: {
    has_anomalies: boolean;
    anomaly_dates: string[];
    adjusted_avg_daily_sales: number;
    latest_change_point: string | null;
    change_point_direction: string | null;
  };
  profitability: {
    gross_margin_pct: number;
    gmroi: number;
    inventory_turnover: number;
    days_sales_inventory: number;
    meets_gmroi_target: boolean;
    annual_revenue_estimate: number;
    annual_holding_cost: number;
    net_margin_after_holding: number;
  };
  key_metrics: Record<string, number | string | boolean | null>;
}

export interface PythonEngineResponse {
  success: boolean;
  data: {
    brand_context: Record<string, unknown>;
    products: PythonProductAnalysis[];
    portfolio_summary: Record<string, number>;
    generated_at: string;
    engine_version: string;
  };
  processing_time_ms: number;
}
