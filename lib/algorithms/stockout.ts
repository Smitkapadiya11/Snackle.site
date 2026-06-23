import { ProductData, BrandContext } from "../types";

export function analyzeStockout(product: ProductData, brand: BrandContext) {
  const { avg_daily_sales, current_stock, price } = product;
  const { avg_lead_time_days, safety_stock_days } = brand;

  // If current_stock is literally 0 AND avg_daily_sales > 0, the CSV likely had
  // no stock column — treat stock as "unknown" (use 999-day placeholder to avoid
  // false CRITICAL alerts for every single product).
  const stockMissing = current_stock === 0 && avg_daily_sales > 0;
  const effectiveStock = stockMissing ? avg_daily_sales * 14 : current_stock;

  // Days of stock remaining
  const days_of_stock = avg_daily_sales > 0 ? effectiveStock / avg_daily_sales : 999;

  // Reorder point: when to order (lead time + safety stock)
  const reorder_point = avg_daily_sales * (avg_lead_time_days + safety_stock_days);

  // Mark critical only if we have real stock data showing it's actually low
  const is_critical = !stockMissing && days_of_stock <= avg_lead_time_days + safety_stock_days;

  // Stockout date
  const stockout_date = new Date();
  stockout_date.setDate(stockout_date.getDate() + Math.floor(days_of_stock));

  // Revenue at risk = sales we'll MISS during stockout (0 if stock data is missing)
  const days_out_of_stock = stockMissing ? 0 : Math.max(0, avg_lead_time_days - days_of_stock);
  const revenue_at_risk = days_out_of_stock * avg_daily_sales * (price || 0);

  return {
    days_of_stock: stockMissing ? -1 : Math.round(days_of_stock * 10) / 10,
    reorder_point: Math.ceil(reorder_point),
    is_critical,
    stockout_date: stockout_date.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }),
    revenue_at_risk: Math.round(revenue_at_risk),
    days_out_of_stock: Math.ceil(days_out_of_stock),
    stock_data_missing: stockMissing,
  };
}
