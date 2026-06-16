import { ProductData, BrandContext } from "../types";

export function analyzeOpportunity(
  product: ProductData,
  brand: BrandContext,
  competitor_out_of_stock: boolean = false,
  demand_spike_multiplier: number = 1.0,
) {
  const { avg_daily_sales, current_stock, price, sales_trend_pct, days_of_stock } = product;
  const { avg_lead_time_days } = brand;

  // Is this an opportunity?
  const has_trend = sales_trend_pct > 10; // Growing 10%+ vs last period
  const has_gap = competitor_out_of_stock;
  const has_stock_risk = days_of_stock < 30; // Less than 30 days stock

  const is_opportunity = (has_trend || has_gap) && has_stock_risk;

  // Forecasted daily sales with spike
  const spiked_daily_sales = avg_daily_sales * demand_spike_multiplier;

  // Revenue opportunity in next 30 days
  const opportunity_revenue =
    Math.min(
      spiked_daily_sales * 30,
      (current_stock / Math.max(avg_daily_sales, 1)) * spiked_daily_sales, // capped by stock
    ) * price;

  // How many units to order to capture opportunity
  const recommended_order = Math.ceil(
    spiked_daily_sales * Math.max(60, avg_lead_time_days + 30) - current_stock, // 60 days supply minus current stock
  );

  // Ad spend recommendation: 15% of opportunity revenue, capped at 2x normal
  const recommended_ad_spend = Math.min(
    Math.round(opportunity_revenue * 0.15),
    Math.round(avg_daily_sales * 30 * price * 0.3),
  );

  return {
    is_opportunity,
    has_trend,
    has_gap,
    sales_trend_pct: Math.round(sales_trend_pct),
    spiked_daily_sales: Math.round(spiked_daily_sales * 10) / 10,
    demand_spike_multiplier,
    days_until_stockout: Math.round(days_of_stock),
    opportunity_revenue: Math.round(opportunity_revenue),
    recommended_order: Math.max(0, recommended_order),
    recommended_ad_spend: Math.round(recommended_ad_spend),
  };
}
