import { ProductData, BrandContext, AlgorithmOutput } from "../types";
import { analyzeStockout } from "./stockout";
import { calculateReorderQty } from "./reorder";
import { analyzeDeadStock } from "./deadstock";
import { analyzeOpportunity } from "./opportunity";
import { forecastDemand } from "./forecast";
import { runABCAnalysis } from "./abc-analysis";

export function computeProductMetrics(raw: {
  name: string;
  sku: string;
  price: number;
  current_stock: number;
  sales_history: { date: string; units_sold: number }[];
}): ProductData {
  const { sales_history, price, current_stock } = raw;

  // Sort history
  const sorted = [...sales_history].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Average daily sales (all time)
  const total_units = sorted.reduce((s, r) => s + r.units_sold, 0);
  const avg_daily_sales = sorted.length > 0 ? total_units / sorted.length : 0;

  // Last 30 days velocity
  const now = new Date();
  const last30 = sorted.filter((s) => {
    return now.getTime() - new Date(s.date).getTime() <= 30 * 86400000;
  });
  const prior30 = sorted.filter((s) => {
    const diff = now.getTime() - new Date(s.date).getTime();
    return diff > 30 * 86400000 && diff <= 60 * 86400000;
  });

  const velocity_30d = last30.length ? last30.reduce((s, r) => s + r.units_sold, 0) / 30 : avg_daily_sales;
  const velocity_60d = prior30.length ? prior30.reduce((s, r) => s + r.units_sold, 0) / 30 : avg_daily_sales;

  // Trend vs prior 30d
  const trend = velocity_60d > 0 ? ((velocity_30d - velocity_60d) / velocity_60d) * 100 : 0;

  // Days of stock
  const days_of_stock = avg_daily_sales > 0 ? current_stock / avg_daily_sales : 999;

  // Stockout date
  const stockout_date_obj = new Date();
  stockout_date_obj.setDate(stockout_date_obj.getDate() + Math.floor(days_of_stock));

  // Stock age (assume first sale date = stock arrival proxy)
  const first_sale = sorted.length ? new Date(sorted[0].date) : new Date();
  const stock_age_days = Math.floor((now.getTime() - first_sale.getTime()) / 86400000);

  return {
    ...raw,
    avg_daily_sales: Math.round(avg_daily_sales * 10) / 10,
    sales_trend_pct: Math.round(trend * 10) / 10,
    days_of_stock: Math.round(days_of_stock * 10) / 10,
    stockout_date: stockout_date_obj.toISOString(),
    total_stock_value: current_stock * price,
    stock_age_days,
    sales_velocity_30d: Math.round(velocity_30d * 10) / 10,
    sales_velocity_60d: Math.round(velocity_60d * 10) / 10,
  };
}

export function runFullAnalysis(products: ProductData[], brand: BrandContext): AlgorithmOutput[] {
  // Run ABC analysis across all products
  const abc_map = Object.fromEntries(runABCAnalysis(products).map((p) => [p.name, p]));

  return products.map((product) => {
    const stockout = analyzeStockout(product, brand);
    const reorder = calculateReorderQty(product, brand);
    const deadstock = analyzeDeadStock(product, brand);
    const opportunity = analyzeOpportunity(
      product,
      brand,
      product.sales_trend_pct > 15, // simplified competitor logic
      product.sales_trend_pct > 20 ? 1.5 : 1.2,
    );
    const forecast = forecastDemand(product);
    const abc = abc_map[product.name];

    // Determine status
    let status: AlgorithmOutput["status"] = "HEALTHY";
    let priority_score = 0;

    if (stockout.is_critical) {
      status = "CRITICAL";
      priority_score = 90 + Math.max(0, 10 - stockout.days_of_stock);
    } else if (deadstock.is_dead) {
      status = "DEAD_STOCK";
      priority_score = 60 + Math.min(30, deadstock.stock_age_days / 10);
    } else if (opportunity.is_opportunity) {
      status = "OPPORTUNITY";
      priority_score = 70 + Math.min(20, opportunity.opportunity_revenue / 10000);
    } else if (deadstock.is_slow_mover) {
      status = "MONITOR";
      priority_score = 30;
    } else {
      status = "HEALTHY";
      priority_score = 10;
    }

    return {
      product,
      status,
      priority_score: Math.min(100, Math.round(priority_score)),
      days_of_stock: stockout.days_of_stock,
      stockout_date: stockout.stockout_date,
      revenue_at_risk: stockout.revenue_at_risk,
      reorder_qty: reorder.reorder_qty,
      reorder_cost: reorder.reorder_cost,
      eoq: reorder.eoq,
      units_stuck: deadstock.is_dead ? product.current_stock : 0,
      capital_locked: deadstock.capital_locked,
      recommended_discount_pct: deadstock.recommended_discount_pct,
      units_to_clear: deadstock.units_to_clear_2w,
      capital_freed: deadstock.capital_freed,
      competitor_gap_days: 0,
      demand_spike_multiplier: opportunity.demand_spike_multiplier || 1,
      opportunity_revenue: opportunity.opportunity_revenue,
      recommended_ad_spend: opportunity.recommended_ad_spend,
      forecast_next_30d: forecast.next_30d,
      forecast_next_60d: forecast.next_60d,
      forecast_next_90d: forecast.next_90d,
      abc_class: abc?.abc_class || "C",
      revenue_contribution_pct: abc?.contribution_pct || 0,
      raw_metrics: {
        avg_daily_sales: product.avg_daily_sales,
        current_stock: product.current_stock,
        price: product.price,
        days_of_stock: stockout.days_of_stock,
        stockout_date: stockout.stockout_date,
        velocity_30d: product.sales_velocity_30d,
        velocity_60d: product.sales_velocity_60d,
        trend_pct: product.sales_trend_pct,
        stock_age: product.stock_age_days,
        reorder_qty: reorder.reorder_qty,
        reorder_cost: reorder.reorder_cost,
        capital_locked: deadstock.capital_locked,
        discount_price: deadstock.discounted_price,
        opportunity_revenue: opportunity.opportunity_revenue,
        ad_spend: opportunity.recommended_ad_spend,
        abc_class: abc?.abc_class || "C",
      },
    };
  });
}
