// Raw data from CSV/Excel upload
export interface RawSalesRow {
  date: string;
  product_name: string;
  sku?: string;
  units_sold: number;
  revenue?: number;
  stock_on_hand?: number;
  price?: number;
}

// Brand context from onboarding questions
export interface BrandContext {
  brand_name: string;
  currency: string; // ₹, $, €
  category: string; // skincare, food, electronics, etc.
  avg_lead_time_days: number; // How many days to restock?
  safety_stock_days: number; // How many days of buffer stock?
  ordering_cost: number; // Cost per purchase order
  holding_cost_pct: number; // % of product cost per year (e.g. 0.25 = 25%)
  is_seasonal: boolean; // Does demand vary by season?
  peak_season: string; // Which months are peak?
  typical_discount_pct: number; // % discount they usually run
  competitor_brands: string; // Main competitors (free text)
  main_channel: string; // Amazon, D2C, Flipkart, etc.
  dead_stock_threshold_days: number; // Days after which stock is "dead" (default 90)
  answers_raw: Record<string, string>; // All raw answers
  // V2 engine fields (optional)
  avg_lead_time_std_days?: number;
  backorder_cost_pct?: number;
  service_level_target?: number;
  peak_months?: number[];
  target_gmroi?: number;
}

// Processed product data
export interface ProductData {
  name: string;
  sku: string;
  price: number;
  current_stock: number;
  sales_history: { date: string; units_sold: number }[];
  // Computed from sales history:
  avg_daily_sales: number;
  sales_trend_pct: number; // % change vs prior period
  days_of_stock: number;
  stockout_date: string;
  total_stock_value: number;
  stock_age_days: number; // How long this batch has been sitting
  sales_velocity_30d: number; // Units/day in last 30 days
  sales_velocity_60d: number; // Units/day in 30-60 days ago
}

// Algorithm output per product
export interface AlgorithmOutput {
  product: ProductData;
  status: "CRITICAL" | "DEAD_STOCK" | "OPPORTUNITY" | "HEALTHY" | "MONITOR";
  priority_score: number; // 0-100, higher = more urgent

  // Stockout analysis
  days_of_stock: number;
  stockout_date: string;
  revenue_at_risk: number;

  // Reorder analysis
  reorder_qty: number;
  reorder_cost: number;
  eoq: number; // Economic Order Quantity

  // Dead stock analysis
  units_stuck: number;
  capital_locked: number;
  recommended_discount_pct: number;
  units_to_clear: number;
  capital_freed: number;

  // Opportunity analysis
  competitor_gap_days: number; // How many days competitor is out
  demand_spike_multiplier: number;
  opportunity_revenue: number;
  recommended_ad_spend: number;

  // Demand forecast
  forecast_next_30d: number;
  forecast_next_60d: number;
  forecast_next_90d: number;

  // ABC classification
  abc_class: "A" | "B" | "C";
  revenue_contribution_pct: number;

  // Raw numbers for AI summary
  raw_metrics: Record<string, number | string>;
}

// Final card displayed to user
export interface ProductCard {
  product_name: string;
  price: number;
  status: AlgorithmOutput["status"];
  priority_score: number;
  ai_summary: string; // Natural language paragraph
  action_tags: string[]; // Dark pill buttons e.g. ["Order 112 units NOW", "Stockout in 5 days"]
  algorithm_output: AlgorithmOutput;
  engine_v2?: import("./python-types").PythonProductAnalysis;
}

// Portfolio-level summary from the engine
export interface PortfolioSummary {
  total_revenue_at_risk: number;
  total_capital_locked: number;
  total_opportunity_value_30d: number;
  total_opportunity_value_90d?: number;
  critical_count: number;
  dead_stock_count: number;
  opportunity_count: number;
  healthy_count: number;
  monitor_count: number;
  avg_forecast_mape: number;
  // ABC breakdown
  a_class_count?: number;
  b_class_count?: number;
  c_class_count?: number;
  a_class_revenue_pct?: number;
  b_class_revenue_pct?: number;
  c_class_revenue_pct?: number;
  // Financials
  total_stock_value?: number;
  total_annual_revenue_estimate?: number;
  total_annual_holding_cost?: number;
  total_reorder_investment_needed?: number;
  total_capital_recoverable?: number;
  avg_gmroi?: number;
  avg_days_of_stock?: number;
  products_below_reorder_point?: number;
  products_with_anomalies?: number;
  products_below_gmroi_target?: number;
  portfolio_health_score?: number;
  immediate_reorder_count?: number;
  total_lost_sales_at_risk_units?: number;
}

// Full analysis result
export interface AnalysisResult {
  brand_context: BrandContext;
  total_products: number;
  critical_count: number;
  dead_stock_count: number;
  opportunity_count: number;
  total_revenue_at_risk: number;
  total_capital_locked: number;
  total_opportunity_value: number;
  product_cards: ProductCard[];
  generated_at: string;
  engine_version?: string;
  portfolio_summary?: PortfolioSummary;
  processing_time_ms?: number;
}

