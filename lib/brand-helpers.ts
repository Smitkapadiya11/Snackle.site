import { BrandContext } from "./types";

const CURRENCY_MAP: Record<string, string> = {
  "₹ (INR)": "₹",
  "$ (USD)": "$",
  "€ (EUR)": "€",
  "£ (GBP)": "£",
};

const HOLDING_COST_MAP: Record<string, number> = {
  "Less than 15%": 0.12,
  "15-25%": 0.2,
  "25-35%": 0.3,
  "More than 35%": 0.38,
};

export function buildBrandContext(answers: Record<string, string>): BrandContext {
  const seasonalAnswer = answers.is_seasonal ?? "";
  const isSeasonal =
    seasonalAnswer.includes("very seasonal") || seasonalAnswer.includes("Somewhat");

  return {
    brand_name: answers.brand_name || "My Brand",
    currency: CURRENCY_MAP[answers.currency] || answers.currency?.charAt(0) || "₹",
    category: answers.category || "Skincare",
    avg_lead_time_days: Number(answers.avg_lead_time_days) || 7,
    safety_stock_days: Number(answers.safety_stock_days) || 14,
    ordering_cost: Number(answers.ordering_cost) || 500,
    holding_cost_pct: HOLDING_COST_MAP[answers.holding_cost_pct] ?? 0.25,
    is_seasonal: isSeasonal,
    peak_season: answers.peak_season || "",
    typical_discount_pct: Number(answers.typical_discount_pct) || 20,
    competitor_brands: answers.competitor_brands || "",
    main_channel: answers.main_channel || "Own Website (D2C)",
    dead_stock_threshold_days: Number(answers.dead_stock_threshold_days) || 90,
    answers_raw: answers,
    avg_lead_time_std_days: 1.5,
    backorder_cost_pct: 0.5,
    service_level_target: 0.95,
    target_gmroi: 3.0,
  };
}
