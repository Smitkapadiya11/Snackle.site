/**
 * Sample inventory data generator for demo purposes.
 * Generates realistic multi-product sales data as a CSV blob.
 */

function generateDates(days: number, endDate = new Date()): string[] {
  const dates: string[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(endDate);
    d.setDate(d.getDate() - i);
    dates.push(d.toISOString().split("T")[0]);
  }
  return dates;
}

// Seasonal modifier for realistic data
function seasonalMultiplier(dateStr: string): number {
  const month = parseInt(dateStr.split("-")[1]);
  const multipliers: Record<number, number> = {
    1: 0.8, 2: 0.85, 3: 0.95, 4: 0.9, 5: 0.85,
    6: 0.9, 7: 0.9, 8: 0.95, 9: 1.1, 10: 1.5, 11: 1.3, 12: 1.2,
  };
  return multipliers[month] || 1.0;
}

function generateSales(
  avgDaily: number,
  dates: string[],
  trend = 0,
  volatility = 0.25,
  stockoutAtDay?: number
): string[][] {
  return dates.map((date, i) => {
    if (stockoutAtDay !== undefined && i >= stockoutAtDay) {
      return [date, "0"];
    }
    const seasonal = seasonalMultiplier(date);
    const trendFactor = 1 + (trend / 100) * (i / dates.length);
    const noise = 1 + (Math.random() - 0.5) * volatility * 2;
    const units = Math.max(0, Math.round(avgDaily * seasonal * trendFactor * noise));
    return [date, units.toString()];
  });
}

interface ProductSpec {
  name: string;
  sku: string;
  price: number;
  stock: number;
  avgDaily: number;
  trend?: number;
  volatility?: number;
  stockoutAt?: number;
  scenario: "critical" | "dead_stock" | "opportunity" | "healthy" | "monitor";
}

const DEMO_PRODUCTS: ProductSpec[] = [
  {
    name: "Niacinamide Serum 30ml",
    sku: "SKN-NIA-001",
    price: 599,
    stock: 45,
    avgDaily: 8.5,
    trend: 15,
    volatility: 0.2,
    scenario: "critical",
  },
  {
    name: "SPF 50 Sunscreen 100g",
    sku: "SKN-SPF-002",
    price: 349,
    stock: 280,
    avgDaily: 12,
    trend: 25,
    volatility: 0.3,
    scenario: "opportunity",
  },
  {
    name: "Vitamin C Moisturiser",
    sku: "SKN-VTC-003",
    price: 849,
    stock: 1200,
    avgDaily: 3,
    trend: -35,
    volatility: 0.15,
    scenario: "dead_stock",
  },
  {
    name: "Retinol Night Cream",
    sku: "SKN-RTN-004",
    price: 1199,
    stock: 380,
    avgDaily: 5.5,
    trend: 5,
    volatility: 0.2,
    scenario: "healthy",
  },
  {
    name: "Hyaluronic Acid Toner",
    sku: "SKN-HYA-005",
    price: 449,
    stock: 220,
    avgDaily: 7,
    trend: 8,
    volatility: 0.25,
    scenario: "healthy",
  },
  {
    name: "Salicylic Acid Face Wash",
    sku: "SKN-SAL-006",
    price: 299,
    stock: 95,
    avgDaily: 9,
    trend: -10,
    volatility: 0.3,
    scenario: "monitor",
  },
  {
    name: "Kojic Acid Soap",
    sku: "SKN-KJC-007",
    price: 199,
    stock: 520,
    avgDaily: 4,
    trend: -20,
    volatility: 0.2,
    scenario: "dead_stock",
  },
  {
    name: "Rose Water Toner",
    sku: "SKN-RSW-008",
    price: 249,
    stock: 60,
    avgDaily: 6,
    trend: 30,
    volatility: 0.35,
    scenario: "critical",
  },
  {
    name: "Peptide Eye Cream",
    sku: "SKN-PEP-009",
    price: 999,
    stock: 450,
    avgDaily: 3.5,
    trend: 12,
    volatility: 0.2,
    scenario: "opportunity",
  },
  {
    name: "Charcoal Face Mask",
    sku: "SKN-CHR-010",
    price: 399,
    stock: 175,
    avgDaily: 4.5,
    trend: 2,
    volatility: 0.3,
    scenario: "monitor",
  },
];

export function generateSampleCSV(): string {
  const dates = generateDates(180);
  const rows: string[] = ["Date,Product Name,SKU,Units Sold,Price,Stock on Hand"];

  for (const product of DEMO_PRODUCTS) {
    const sales = generateSales(
      product.avgDaily,
      dates,
      product.trend || 0,
      product.volatility || 0.25,
      product.stockoutAt,
    );

    for (const [date, units] of sales) {
      rows.push(`${date},${product.name},${product.sku},${units},${product.price},${product.stock}`);
    }
  }

  return rows.join("\n");
}

export function generateSampleFile(): File {
  const csv = generateSampleCSV();
  const blob = new Blob([csv], { type: "text/csv" });
  return new File([blob], "snackle-demo-inventory.csv", { type: "text/csv" });
}

export const SAMPLE_BRAND_INFO = {
  name: "Glow & Go Skincare",
  category: "Skincare",
  currency: "₹",
  products: DEMO_PRODUCTS.length,
};
