import { ProductData, BrandContext } from "../types";

export function calculateReorderQty(product: ProductData, brand: BrandContext) {
  const { avg_daily_sales, price, current_stock } = product;
  const { avg_lead_time_days, safety_stock_days, ordering_cost, holding_cost_pct } = brand;

  // Annual demand
  const annual_demand = avg_daily_sales * 365;

  // Holding cost per unit per year
  const holding_cost_per_unit = price * holding_cost_pct;

  // Economic Order Quantity (EOQ) formula: sqrt(2DS/H)
  const eoq =
    holding_cost_per_unit > 0
      ? Math.ceil(Math.sqrt((2 * annual_demand * ordering_cost) / holding_cost_per_unit))
      : Math.ceil(avg_daily_sales * 30); // fallback: 30 days supply

  // Safety stock
  const safety_stock = Math.ceil(avg_daily_sales * safety_stock_days);

  // How much to order: cover lead time + safety stock, minus current stock
  const reorder_qty = Math.max(
    eoq,
    Math.ceil(avg_daily_sales * (avg_lead_time_days + safety_stock_days)) - current_stock,
  );

  const reorder_cost = reorder_qty * price;

  return {
    eoq,
    safety_stock,
    reorder_qty: Math.ceil(reorder_qty),
    reorder_cost: Math.round(reorder_cost),
    covers_days: avg_daily_sales > 0 ? Math.round(reorder_qty / avg_daily_sales) : 0,
  };
}
