import fs from "fs";
import path from "path";
import Papa from "papaparse";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const csvPath = path.join(__dirname, "../public/sample-data.csv");
const csv = fs.readFileSync(csvPath, "utf8");

const { data: rows } = Papa.parse(csv, { header: true, skipEmptyLines: true });

const productMap = {};
for (const row of rows) {
  const name = String(row.product_name || "").trim();
  if (!name) continue;
  if (!productMap[name]) {
    productMap[name] = {
      name,
      sku: row.sku || name,
      price: 0,
      current_stock: 0,
      sales_history: [],
      prices: [],
      stocks: [],
    };
  }
  const units = parseFloat(row.units_sold || 0);
  const date = row.date || "";
  const price = parseFloat(row.price || 0);
  const stock = parseFloat(row.stock_on_hand || 0);
  if (date && !isNaN(units)) productMap[name].sales_history.push({ date, units_sold: units });
  if (price > 0) productMap[name].prices.push(price);
  if (stock > 0) productMap[name].stocks.push(stock);
}

const raw_products = Object.values(productMap).map((p) => ({
  name: p.name,
  sku: p.sku,
  price: p.prices.at(-1) || 0,
  current_stock: p.stocks.at(-1) || 0,
  sales_history: p.sales_history,
}));

const brand_context = {
  brand_name: "Sample Brand",
  currency: "₹",
  category: "skincare",
  avg_lead_time_days: 7,
  avg_lead_time_std_days: 1.5,
  safety_stock_days: 14,
  ordering_cost: 500,
  holding_cost_pct: 0.25,
  backorder_cost_pct: 0.5,
  service_level_target: 0.95,
  dead_stock_threshold_days: 90,
  is_seasonal: false,
  peak_months: [],
  typical_discount_pct: 20,
  main_channel: "Amazon India",
  target_gmroi: 3.0,
};

console.log(`Parsed ${raw_products.length} products from sample-data.csv`);

const res = await fetch("http://localhost:3000/api/analyze", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ raw_products, brand_context }),
});

const json = await res.json();
if (!res.ok || !json.success) {
  console.error("FAIL:", json.error || res.status);
  process.exit(1);
}

const cards = json.data?.product_cards || [];
console.log(`API success: ${cards.length} product cards`);
for (const c of cards) {
  console.log(`  - ${c.product_name}: ${c.status}, summary=${(c.ai_summary || "").slice(0, 60)}...`);
}
console.log(`Portfolio: critical=${json.data.critical_count}, dead=${json.data.dead_stock_count}, engine=${json.data.engine_version}`);
