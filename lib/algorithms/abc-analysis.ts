import { ProductData } from "../types";

export function runABCAnalysis(products: ProductData[]) {
  // Calculate annual revenue per product
  const withRevenue = products.map((p) => ({
    ...p,
    annual_revenue: p.avg_daily_sales * 365 * p.price,
  }));

  // Sort by revenue descending
  const sorted = [...withRevenue].sort((a, b) => b.annual_revenue - a.annual_revenue);
  const total_revenue = sorted.reduce((s, p) => s + p.annual_revenue, 0);

  // Classify
  let cumulative = 0;
  return sorted.map((product) => {
    cumulative += product.annual_revenue;
    const safeTotalRevenue = total_revenue || 1;
    const cumulative_pct = (cumulative / safeTotalRevenue) * 100;
    const contribution_pct = (product.annual_revenue / safeTotalRevenue) * 100;

    return {
      sku: product.sku,
      name: product.name,
      annual_revenue: Math.round(product.annual_revenue),
      contribution_pct: Math.round(contribution_pct * 10) / 10,
      cumulative_pct: Math.round(cumulative_pct * 10) / 10,
      abc_class: (cumulative_pct <= 80 ? "A" : cumulative_pct <= 95 ? "B" : "C") as "A" | "B" | "C",
    };
  });
}
