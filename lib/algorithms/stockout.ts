import { ProductData, BrandContext } from "../types";

export function analyzeStockout(product: ProductData, brand: BrandContext) {
  const { avg_daily_sales, current_stock, price } = product;
  const { avg_lead_time_days, safety_stock_days } = brand;

  // Days of stock remaining
  const days_of_stock = avg_daily_sales > 0 ? current_stock / avg_daily_sales : 999;

  // Reorder point: when to order (lead time + safety stock)
  const reorder_point = avg_daily_sales * (avg_lead_time_days + safety_stock_days);

  // Is stock critically low?
  const is_critical = days_of_stock <= avg_lead_time_days + safety_stock_days;

  // Stockout date
  const stockout_date = new Date();
  stockout_date.setDate(stockout_date.getDate() + Math.floor(days_of_stock));

  // Revenue at risk = sales we'll MISS during stockout
  const days_out_of_stock = Math.max(0, avg_lead_time_days - days_of_stock);
  const revenue_at_risk = days_out_of_stock * avg_daily_sales * price;

  return {
    days_of_stock: Math.round(days_of_stock * 10) / 10,
    reorder_point: Math.ceil(reorder_point),
    is_critical,
    stockout_date: stockout_date.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }),
    revenue_at_risk: Math.round(revenue_at_risk),
    days_out_of_stock: Math.ceil(days_out_of_stock),
  };
}
