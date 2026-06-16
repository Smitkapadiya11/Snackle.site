import { ProductData, BrandContext } from "../types";

export function analyzeDeadStock(product: ProductData, brand: BrandContext) {
  const { current_stock, price, sales_velocity_30d, sales_velocity_60d, stock_age_days } = product;
  const { dead_stock_threshold_days, typical_discount_pct } = brand;

  // Is stock moving slowly?
  const velocity_drop_pct =
    sales_velocity_60d > 0 ? ((sales_velocity_30d - sales_velocity_60d) / sales_velocity_60d) * 100 : 0;

  const is_dead = stock_age_days >= dead_stock_threshold_days && velocity_drop_pct < -20;
  const is_slow_mover = stock_age_days >= 45 && velocity_drop_pct < -10;

  // Capital locked in dead stock
  const capital_locked = current_stock * price;

  // Recommended discount to clear: enough to drive 3x normal velocity
  const recommended_discount_pct = Math.min(Math.max(typical_discount_pct, 15), 40);
  const discounted_price = price * (1 - recommended_discount_pct / 100);

  // Units to clear in 2 weeks at 3x velocity
  const clearance_velocity = (sales_velocity_30d || 1) * 3;
  const units_to_clear_2w = Math.min(Math.ceil(clearance_velocity * 14), current_stock);

  // Capital freed
  const capital_freed = units_to_clear_2w * discounted_price;

  // Weeks to clear all stock at discounted velocity
  const weeks_to_clear = clearance_velocity > 0 ? Math.ceil(current_stock / (clearance_velocity * 7)) : 999;

  return {
    is_dead,
    is_slow_mover,
    velocity_drop_pct: Math.round(velocity_drop_pct),
    stock_age_days,
    capital_locked: Math.round(capital_locked),
    recommended_discount_pct,
    discounted_price: Math.round(discounted_price),
    units_to_clear_2w,
    capital_freed: Math.round(capital_freed),
    weeks_to_clear,
  };
}
