import { AlgorithmOutput, BrandContext } from "./types";

export function generateFallbackSummary(
  algo: AlgorithmOutput,
  brand: BrandContext,
): { summary: string; action_tags: string[] } {
  const { currency } = brand;
  const p = algo.product;
  const days = Math.round(algo.days_of_stock);

  let summary = "";
  let action_tags: string[] = [];

  switch (algo.status) {
    case "CRITICAL":
      summary = `You have only ${days} days of stock left on ${p.name}. At your current pace of ${p.avg_daily_sales} units/day, you'll run out around ${algo.stockout_date} and miss roughly ${currency}${algo.revenue_at_risk.toLocaleString("en-IN")} in sales during the restock gap.\n\nOrder ${algo.reorder_qty} units today for ${currency}${algo.reorder_cost.toLocaleString("en-IN")}. This covers lead time plus your safety buffer — don't wait on this one.`;
      action_tags = [
        `Order ${algo.reorder_qty} units NOW`,
        `Stockout in ${days} days`,
        "No discount needed",
      ];
      break;
    case "DEAD_STOCK":
      summary = `${p.name} has been sitting for ${p.stock_age_days} days with slowing velocity. ${currency}${algo.capital_locked.toLocaleString("en-IN")} is locked in ${p.current_stock} units that aren't moving fast enough.\n\nRun a ${algo.recommended_discount_pct}% clearance to move ${algo.units_to_clear} units in two weeks and free up ${currency}${algo.capital_freed.toLocaleString("en-IN")}. Clear the shelf space for faster movers.`;
      action_tags = [
        `${algo.recommended_discount_pct}% clearance sale`,
        `${currency}${algo.capital_locked.toLocaleString("en-IN")} locked`,
        `Clear ${algo.units_to_clear} units`,
      ];
      break;
    case "OPPORTUNITY":
      summary = `${p.name} is trending up ${p.sales_trend_pct}% with only ${days} days of stock left. Demand is rising and you're positioned to capture ${currency}${algo.opportunity_revenue.toLocaleString("en-IN")} in the next 30 days if you stay in stock.\n\nRestock aggressively and allocate ${currency}${algo.recommended_ad_spend.toLocaleString("en-IN")} to ads this month. Competitors are slow — move now while demand is hot.`;
      action_tags = [
        `Capture ${currency}${algo.opportunity_revenue.toLocaleString("en-IN")}`,
        `Stockout in ${days} days`,
        `Spend ${currency}${algo.recommended_ad_spend.toLocaleString("en-IN")} on ads`,
      ];
      break;
    case "MONITOR":
      summary = `${p.name} is moving slower than last month (velocity down). You have ${days} days of stock — not urgent, but worth watching before it becomes dead stock.\n\nHold off on reorders for now. Review again in 2 weeks and consider a light promotion if velocity doesn't recover.`;
      action_tags = [`Monitor — ${days} days stock`, "Velocity slowing", "Review in 2 weeks"];
      break;
    default:
      summary = `${p.name} is in good shape with ${days} days of stock at ${p.avg_daily_sales} units/day. ABC class ${algo.abc_class} — contributes ${algo.revenue_contribution_pct}% of brand revenue.\n\nNo action needed right now. Maintain current stock levels and reorder when you hit ${Math.ceil(p.avg_daily_sales * (brand.avg_lead_time_days + brand.safety_stock_days))} units threshold.`;
      action_tags = [`${days} days stock`, "Healthy levels", "No action needed"];
  }

  return { summary, action_tags };
}
