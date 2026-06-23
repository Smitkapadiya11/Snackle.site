from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from enum import Enum

# ─── INPUT ────────────────────────────────────────────


class SalesRecord(BaseModel):
    date: str                  # ISO date string: "2024-03-01"
    units_sold: float          # Daily units sold


class ProductInput(BaseModel):
    name: str
    sku: str
    price: float
    current_stock: float
    sales_history: List[SalesRecord]


class BrandContext(BaseModel):
    brand_name: str
    currency: str = "₹"
    category: str
    avg_lead_time_days: int = 7
    avg_lead_time_std_days: float = 1.5   # Variability in lead time (new!)
    safety_stock_days: int = 14
    ordering_cost: float = 500.0
    holding_cost_pct: float = 0.25         # 25% of product cost/year
    backorder_cost_pct: float = 0.50       # Cost of being out of stock (% of price/year)
    service_level_target: float = 0.95     # 95% fill rate target
    dead_stock_threshold_days: int = 90
    is_seasonal: bool = False
    peak_months: List[int] = []            # e.g. [10, 11, 12] for Oct-Dec
    typical_discount_pct: float = 20.0
    main_channel: str = "Amazon"
    target_gmroi: float = 3.0             # Target Gross Margin ROI


# ─── OUTPUT ───────────────────────────────────────────


class ProductStatus(str, Enum):
    CRITICAL = "CRITICAL"
    DEAD_STOCK = "DEAD_STOCK"
    OPPORTUNITY = "OPPORTUNITY"
    HEALTHY = "HEALTHY"
    MONITOR = "MONITOR"


class ABCClass(str, Enum):
    A = "A"
    B = "B"
    C = "C"


class XYZClass(str, Enum):
    X = "X"   # Stable demand  (CV < 0.5)
    Y = "Y"   # Variable       (0.5 ≤ CV < 1.0)
    Z = "Z"   # Very variable  (CV ≥ 1.0)


class DemandForecast(BaseModel):
    next_7d: float
    next_30d: float
    next_60d: float
    next_90d: float
    daily_avg: float
    trend_pct: float
    # Confidence intervals
    next_30d_lower: float      # 80% CI lower bound
    next_30d_upper: float      # 80% CI upper bound
    forecast_model_used: str   # "holt_winters", "sarima", "ensemble", "simple_ma"
    model_accuracy_mape: float # Mean Absolute Percentage Error (lower = better)


class SafetyStockResult(BaseModel):
    safety_stock_units: float
    safety_stock_days: float
    reorder_point: float
    service_level_achieved: float
    demand_std_dev: float
    z_score_used: float


class MonteCarloResult(BaseModel):
    stockout_probability_30d: float     # 0.0 to 1.0
    stockout_probability_60d: float
    expected_stockout_day: float        # Expected day number of first stockout
    stockout_day_p10: float             # Optimistic scenario (90% confidence still ok)
    stockout_day_p50: float             # Median scenario
    stockout_day_p90: float             # Worst-case scenario
    expected_lost_sales_units: float    # Expected units lost to stockout
    expected_revenue_at_risk: float     # ₹ at risk across all scenarios
    simulations_run: int


class ReorderResult(BaseModel):
    eoq_units: float                    # Economic Order Quantity
    eoq_with_backorder: float           # EOQ adjusted for backorder costs
    reorder_point: float                # Q,R model reorder point
    reorder_cost: float                 # Cost of recommended order
    recommended_order_qty: float        # Final recommendation
    covers_days: float                  # How many days the order covers
    total_inventory_cost_annual: float  # Ordering + Holding cost/year
    cost_savings_vs_current: float      # vs. current ad-hoc ordering pattern


class DeadStockResult(BaseModel):
    is_dead: bool
    is_slow_mover: bool
    velocity_drop_pct: float
    stock_age_days: float
    capital_locked: float
    # Markdown optimization
    optimal_discount_pct: float         # Mathematically optimal markdown
    optimal_clearance_price: float
    price_elasticity_estimate: float    # Estimated elasticity (if data allows)
    units_to_clear_at_optimal: float
    capital_recovered_at_optimal: float
    weeks_to_clear_full_stock: float
    # Bundle recommendation
    bundle_revenue_uplift_pct: float    # Estimated uplift if bundled with top seller


class OpportunityResult(BaseModel):
    is_opportunity: bool
    opportunity_score: float            # 0-100 composite score
    demand_growth_rate_pct: float
    trend_acceleration: float           # Is growth accelerating or slowing?
    opportunity_revenue_30d: float
    opportunity_revenue_90d: float
    recommended_order_qty: float
    recommended_ad_spend: float
    expected_roas: float                # Return on Ad Spend (expected)
    days_until_stockout_at_spike: float
    urgency_level: str                  # "IMMEDIATE", "THIS_WEEK", "THIS_MONTH"


class ABCXYZResult(BaseModel):
    abc_class: ABCClass
    xyz_class: XYZClass
    abc_xyz_cell: str                   # e.g. "AX", "BZ", "CY"
    revenue_contribution_pct: float
    cumulative_revenue_pct: float
    coefficient_of_variation: float     # σ/μ of weekly sales
    recommended_strategy: str           # Strategy for this cell
    review_frequency: str               # How often to review this product
    safety_stock_multiplier: float      # Adjust SS based on XYZ class


class AnomalyResult(BaseModel):
    has_anomalies: bool
    anomaly_dates: List[str]            # Dates with anomalous sales
    anomaly_scores: List[float]         # Isolation Forest scores
    anomaly_direction: List[str]        # "SPIKE" or "DROP"
    latest_change_point: Optional[str]  # CUSUM change point date
    change_point_direction: Optional[str]  # "INCREASE" or "DECREASE"
    adjusted_avg_daily_sales: float     # Avg after removing anomalies


class ProfitabilityResult(BaseModel):
    gross_margin_pct: float             # Estimated (price vs cost proxy)
    gmroi: float                        # Gross Margin Return on Inventory Investment
    inventory_turnover: float           # Times per year
    days_sales_inventory: float         # DSI
    meets_gmroi_target: bool
    annual_revenue_estimate: float
    annual_holding_cost: float
    net_margin_after_holding: float


class RiskScore(BaseModel):
    overall_risk_score: float           # 0-100 (100 = most urgent action needed)
    stockout_risk: float                # 0-100
    dead_stock_risk: float              # 0-100
    opportunity_score: float            # 0-100
    financial_exposure: float           # ₹ amount at risk
    confidence: float                   # 0-1 (how confident in analysis)
    risk_factors: List[str]             # Human-readable risk drivers


class SeasonalPattern(BaseModel):
    monthly_factors: Dict[str, float]   # "1" -> 0.85, "10" -> 1.35, etc.
    peak_months: List[int]
    trough_months: List[int]
    seasonality_strength: float         # 0-1 (0 = flat, 1 = very seasonal)
    has_seasonality: bool
    detected_from_data: bool


class MonthlyForecast(BaseModel):
    month: str          # "YYYY-MM"
    forecast: float
    lower: float
    upper: float


class WeeklyForecast(BaseModel):
    week: str           # Start date "YYYY-MM-DD"
    forecast: float
    lower: float
    upper: float


class YearlyForecast(BaseModel):
    daily: List[Dict[str, Any]]         # First 90 days
    weekly: List[Dict[str, Any]]        # 26 weeks
    monthly: List[Dict[str, Any]]       # 12 months
    total_365d: float
    peak_month: str
    trough_month: str


class UpcomingEvent(BaseModel):
    name: str
    month: int
    uplift_factor: float
    months_away: int


class HeatmapDataPoint(BaseModel):
    month: int
    month_name: str
    avg_daily: float
    total: float
    days: int
    intensity: float                    # vs average (1.0 = average)


class SeasonalContext(BaseModel):
    seasonal_patterns: Optional[SeasonalPattern] = None
    heatmap_data: List[Dict[str, Any]] = []
    upcoming_events: List[Dict[str, Any]] = []
    yearly_forecast: Optional[Dict[str, Any]] = None
    category: str = ""


class PriceElasticityResult(BaseModel):
    elasticity: float
    is_estimated: bool
    demand_impact_10pct_discount: float
    demand_impact_10pct_markup: float


class ScenarioPlanningResult(BaseModel):
    optimistic: Dict[str, Any]
    baseline: Dict[str, Any]
    pessimistic: Dict[str, Any]
    markdown: Dict[str, Any] = {}   # pricing markdown scenario


class ProductAnalysisResult(BaseModel):
    # Identity
    name: str
    sku: str
    price: float
    current_stock: float

    # Status
    status: ProductStatus
    risk_score: RiskScore

    # All algorithm outputs
    forecast: DemandForecast
    safety_stock: SafetyStockResult
    monte_carlo: MonteCarloResult
    reorder: ReorderResult
    dead_stock: DeadStockResult
    opportunity: OpportunityResult
    abc_xyz: Optional[ABCXYZResult] = None
    anomalies: AnomalyResult
    profitability: ProfitabilityResult
    seasonal: Optional[SeasonalContext] = None
    price_elasticity: Optional[PriceElasticityResult] = None
    scenarios: Optional[ScenarioPlanningResult] = None

    # Summary metrics for the AI layer
    key_metrics: Dict[str, Any]


class FullAnalysisResult(BaseModel):
    brand_context: BrandContext
    products: List[ProductAnalysisResult]
    portfolio_summary: Dict[str, Any]
    generated_at: str
    engine_version: str = "2.0.0"


# ─── API REQUEST/RESPONSE ─────────────────────────────


class AnalyzeRequest(BaseModel):
    products: List[ProductInput]
    brand_context: BrandContext


class AnalyzeResponse(BaseModel):
    success: bool
    data: Optional[FullAnalysisResult] = None
    error: Optional[str] = None
    processing_time_ms: float
