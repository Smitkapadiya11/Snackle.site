import { ProductData } from "../types";

// Exponential smoothing demand forecast
export function forecastDemand(product: ProductData, alpha: number = 0.3) {
  const { sales_history } = product;

  if (sales_history.length === 0) {
    return { next_30d: 0, next_60d: 0, next_90d: 0, trend: 0 };
  }

  // Sort by date ascending
  const sorted = [...sales_history].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Simple exponential smoothing: S_t = α * Y_t + (1-α) * S_{t-1}
  let smoothed = sorted[0].units_sold;
  for (let i = 1; i < sorted.length; i++) {
    smoothed = alpha * sorted[i].units_sold + (1 - alpha) * smoothed;
  }

  // Daily average from smoothed
  const smoothed_daily = smoothed;

  // Trend: compare last 30 days vs prior 30 days
  const now = new Date();
  const last30 = sorted.filter((s) => {
    const d = new Date(s.date);
    return now.getTime() - d.getTime() <= 30 * 86400000;
  });
  const prior30 = sorted.filter((s) => {
    const d = new Date(s.date);
    const diff = now.getTime() - d.getTime();
    return diff > 30 * 86400000 && diff <= 60 * 86400000;
  });

  const avg_last30 = last30.length
    ? last30.reduce((s, r) => s + r.units_sold, 0) / last30.length
    : smoothed_daily;
  const avg_prior30 = prior30.length
    ? prior30.reduce((s, r) => s + r.units_sold, 0) / prior30.length
    : smoothed_daily;

  const trend = avg_prior30 > 0 ? ((avg_last30 - avg_prior30) / avg_prior30) * 100 : 0;

  // Apply trend growth to forecasts
  const growth_factor = 1 + (trend / 100) * 0.5; // dampened trend

  return {
    next_30d: Math.round(smoothed_daily * 30 * growth_factor),
    next_60d: Math.round(smoothed_daily * 60 * growth_factor * growth_factor),
    next_90d: Math.round(smoothed_daily * 90 * growth_factor * growth_factor * growth_factor),
    daily_avg: Math.round(smoothed_daily * 10) / 10,
    trend_pct: Math.round(trend),
    growth_factor: Math.round(growth_factor * 100) / 100,
  };
}
