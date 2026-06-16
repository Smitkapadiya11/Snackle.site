import { BrandContext, AnalysisResult, AlgorithmOutput, ProductCard } from "./types";
import type { PythonProductAnalysis, PythonEngineResponse } from "./python-types";

export type { PythonProductAnalysis, PythonEngineResponse };

export function toPythonBrandContext(brand: BrandContext) {
  const peakMonths: number[] = [];
  if (brand.peak_months?.length) {
    peakMonths.push(...brand.peak_months);
  } else if (brand.peak_season) {
    const monthMap: Record<string, number> = {
      jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6,
      jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12,
    };
    for (const [name, num] of Object.entries(monthMap)) {
      if (brand.peak_season.toLowerCase().includes(name)) peakMonths.push(num);
    }
  }

  return {
    brand_name: brand.brand_name,
    currency: brand.currency,
    category: brand.category,
    avg_lead_time_days: brand.avg_lead_time_days,
    avg_lead_time_std_days: brand.avg_lead_time_std_days ?? 1.5,
    safety_stock_days: brand.safety_stock_days,
    ordering_cost: brand.ordering_cost,
    holding_cost_pct: brand.holding_cost_pct,
    backorder_cost_pct: brand.backorder_cost_pct ?? 0.5,
    service_level_target: brand.service_level_target ?? 0.95,
    dead_stock_threshold_days: brand.dead_stock_threshold_days,
    is_seasonal: brand.is_seasonal,
    peak_months: peakMonths,
    typical_discount_pct: brand.typical_discount_pct,
    main_channel: brand.main_channel,
    target_gmroi: brand.target_gmroi ?? 3.0,
  };
}

export function toPythonRequest(
  raw_products: Array<{
    name: string;
    sku: string;
    price: number;
    current_stock: number;
    sales_history: { date: string; units_sold: number }[];
  }>,
  brand_context: BrandContext,
) {
  return {
    products: raw_products.map((p) => ({
      name: p.name,
      sku: p.sku,
      price: p.price,
      current_stock: p.current_stock,
      sales_history: p.sales_history.map((s) => ({
        date: s.date,
        units_sold: s.units_sold,
      })),
    })),
    brand_context: toPythonBrandContext(brand_context),
  };
}

export function pythonProductToAlgorithmOutput(
  product: PythonProductAnalysis,
  sales_history: { date: string; units_sold: number }[],
): AlgorithmOutput {
  const km = product.key_metrics;
  const daysOfStock = Number(km.days_of_stock ?? 0);
  const stockoutDate = new Date();
  stockoutDate.setDate(stockoutDate.getDate() + Math.floor(daysOfStock));

  return {
    product: {
      name: product.name,
      sku: product.sku,
      price: product.price,
      current_stock: product.current_stock,
      sales_history,
      avg_daily_sales: Number(km.adj_daily_avg ?? product.forecast.daily_avg),
      sales_trend_pct: product.forecast.trend_pct,
      days_of_stock: daysOfStock,
      stockout_date: stockoutDate.toISOString(),
      total_stock_value: product.current_stock * product.price,
      stock_age_days: product.dead_stock.stock_age_days,
      sales_velocity_30d: Number(km.adj_daily_avg ?? 0),
      sales_velocity_60d: Number(km.adj_daily_avg ?? 0),
    },
    status: product.status,
    priority_score: product.risk_score.overall_risk_score,
    days_of_stock: daysOfStock,
    stockout_date: stockoutDate.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }),
    revenue_at_risk: product.monte_carlo.expected_revenue_at_risk,
    reorder_qty: product.reorder.recommended_order_qty,
    reorder_cost: product.reorder.reorder_cost,
    eoq: product.reorder.eoq_units,
    units_stuck: product.dead_stock.is_dead ? product.current_stock : 0,
    capital_locked: product.dead_stock.capital_locked,
    recommended_discount_pct: product.dead_stock.optimal_discount_pct,
    units_to_clear: product.dead_stock.units_to_clear_at_optimal,
    capital_freed: product.dead_stock.capital_recovered_at_optimal,
    competitor_gap_days: 0,
    demand_spike_multiplier: 1,
    opportunity_revenue: product.opportunity.opportunity_revenue_30d,
    recommended_ad_spend: product.opportunity.recommended_ad_spend,
    forecast_next_30d: product.forecast.next_30d,
    forecast_next_60d: product.forecast.next_60d,
    forecast_next_90d: product.forecast.next_90d,
    abc_class: (product.abc_xyz?.abc_class as "A" | "B" | "C") || "B",
    revenue_contribution_pct: product.abc_xyz?.revenue_contribution_pct ?? 0,
    raw_metrics: {
      ...Object.fromEntries(
        Object.entries(km).map(([k, v]) => [k, v ?? 0]),
      ),
      avg_daily_sales: Number(km.adj_daily_avg ?? 0),
      stockout_date: stockoutDate.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "long",
        year: "numeric",
      }),
      stock_age: product.dead_stock.stock_age_days,
      trend_pct: product.forecast.trend_pct,
      reorder_qty: product.reorder.recommended_order_qty,
      reorder_cost: product.reorder.reorder_cost,
      capital_locked: product.dead_stock.capital_locked,
      discount_price: product.dead_stock.optimal_clearance_price,
      opportunity_revenue: product.opportunity.opportunity_revenue_30d,
      ad_spend: product.opportunity.recommended_ad_spend,
      abc_class: product.abc_xyz?.abc_class ?? "B",
    },
  };
}

export function fromPythonResponse(
  engineResult: PythonEngineResponse,
  brand_context: BrandContext,
  salesHistoryMap: Map<string, { date: string; units_sold: number }[]>,
): AnalysisResult {
  const ps = engineResult.data.portfolio_summary;

  const product_cards: ProductCard[] = engineResult.data.products.map((product) => {
    const history = salesHistoryMap.get(product.name) ?? [];
    const algorithm_output = pythonProductToAlgorithmOutput(product, history);
    return {
      product_name: product.name,
      price: product.price,
      status: product.status,
      priority_score: product.risk_score.overall_risk_score,
      ai_summary: "",
      action_tags: [] as string[],
      algorithm_output,
      engine_v2: product,
    };
  });

  return {
    brand_context,
    total_products: product_cards.length,
    critical_count: ps.critical_count ?? 0,
    dead_stock_count: ps.dead_stock_count ?? 0,
    opportunity_count: ps.opportunity_count ?? 0,
    total_revenue_at_risk: ps.total_revenue_at_risk ?? 0,
    total_capital_locked: ps.total_capital_locked ?? 0,
    total_opportunity_value: ps.total_opportunity_value_30d ?? 0,
    product_cards,
    generated_at: engineResult.data.generated_at,
    engine_version: engineResult.data.engine_version,
    portfolio_summary: ps,
    processing_time_ms: engineResult.processing_time_ms,
  };
}
