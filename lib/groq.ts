import Groq from "groq-sdk";
import { AlgorithmOutput, BrandContext } from "./types";
import { generateFallbackSummary } from "./fallback-summary";
import { PythonProductAnalysis } from "./python-types";

const MODELS = ["deepseek-r1-distill-llama-70b", "llama-3.3-70b-versatile"];

function getGroqClient() {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey || apiKey === "your_groq_api_key_here") return null;
  return new Groq({ apiKey });
}

function parseGroqResponse(raw: string, fallbackTags: string[]) {
  const tagsMatch = raw.match(/TAGS:\s*(\[[\s\S]*?\])/);
  let action_tags: string[] = [];
  if (tagsMatch) {
    try {
      action_tags = JSON.parse(tagsMatch[1]);
    } catch {
      action_tags = fallbackTags;
    }
  }
  const summary = raw.replace(/TAGS:[\s\S]*$/, "").trim();
  return { summary, action_tags };
}

async function callGroq(prompt: string, fallbackTags: string[]) {
  const groq = getGroqClient();
  if (!groq) return null;

  let raw = "";
  for (const model of MODELS) {
    try {
      const completion = await groq.chat.completions.create({
        model,
        messages: [{ role: "user", content: prompt }],
        max_tokens: 1500,
        temperature: 0.3,
      });
      raw = completion.choices[0]?.message?.content || "";
      if (raw.trim()) break;
    } catch (err) {
      console.warn(`Groq model ${model} failed:`, err);
    }
  }

  if (!raw.trim()) return null;
  return parseGroqResponse(raw, fallbackTags);
}

export async function generatePythonProductSummary(
  product: PythonProductAnalysis,
  brand: BrandContext,
): Promise<{ summary: string; action_tags: string[] }> {
  const currency = brand.currency;
  const km = product.key_metrics;

  const prompt = `You are a world-class inventory analyst for ${brand.brand_name}.

PRODUCT: ${product.name} | PRICE: ${currency}${product.price} | STATUS: ${product.status}
ABC-XYZ CLASS: ${product.abc_xyz?.abc_xyz_cell ?? "BX"} | RISK SCORE: ${product.risk_score.overall_risk_score}/100

━━ DEMAND INTELLIGENCE ━━
• Average daily sales: ${km.adj_daily_avg} units/day
• Sales trend: ${Number(km.trend_pct) > 0 ? "+" : ""}${km.trend_pct}% vs last month
• Demand forecast (30 days): ${km.forecast_30d} units
• Forecast model: ${km.forecast_model} (MAPE: ${(Number(km.model_mape) * 100).toFixed(1)}%)

━━ STOCKOUT RISK ━━
• Days of stock remaining: ${km.days_of_stock} days
• Probability of stockout in 30 days: ${km.stockout_probability_30d_pct}%
• Expected stockout at: Day ${km.stockout_date_p50}
• Revenue at risk (Monte Carlo): ${currency}${Number(km.revenue_at_risk).toLocaleString("en-IN")}
• Statistical safety stock needed: ${km.safety_stock_units} units

━━ REORDER RECOMMENDATION ━━
• Economic Order Quantity (EOQ): ${km.eoq} units
• Recommended order: ${km.reorder_qty} units
• Order cost: ${currency}${Number(km.reorder_cost).toLocaleString("en-IN")}

━━ DEAD STOCK / CAPITAL ━━
• Capital locked in stock: ${currency}${Number(km.capital_locked).toLocaleString("en-IN")}
• Optimal markdown: ${km.optimal_discount_pct}% off → ${currency}${km.optimal_price}
• Price elasticity estimate: ${km.price_elasticity}
• Capital recoverable at optimal price: ${currency}${Number(km.capital_recovered).toLocaleString("en-IN")}

━━ OPPORTUNITY ━━
• 30-day opportunity value: ${currency}${Number(km.opportunity_revenue_30d).toLocaleString("en-IN")}
• Recommended ad spend: ${currency}${Number(km.recommended_ad_spend).toLocaleString("en-IN")}
• Expected ROAS: ${km.expected_roas}x

━━ BUSINESS HEALTH ━━
• GMROI: ${km.gmroi}x (target: ${brand.target_gmroi ?? 3}x)
• Inventory turnover: ${km.inventory_turnover}x/year
• Days Sales of Inventory: ${km.dsi} days
${km.has_anomalies ? `• ⚠️ ${km.anomaly_count} anomalous sales days detected` : ""}
${km.change_point ? `• 📊 Demand change detected since ${km.change_point}` : ""}

RISK DRIVERS: ${product.risk_score.risk_factors?.join(", ")}

YOUR TASK:
Provide a highly detailed, powerful STRATEGIC INSIGHT report for the brand owner in STRICT MARKDOWN FORMAT. 
Your report must include:
1. An Executive Summary (bolded key financial impacts).
2. A deep dive into the specific data (use bullet points and exact numbers).
3. A Step-by-Step Action Plan to optimize this product (pricing, ordering, marketing).

Make sure to format it beautifully with headings (###), bold text for emphasis, and bulleted lists.

Then, at the very end on a new line, provide action tags exactly like this:
TAGS: ["tag1", "tag2", "tag3"]
Tags: 3-6 words each, use real numbers. Max 4 tags.`;

  const fallbackTags = [
    `${product.status}`,
    `${km.days_of_stock} days stock`,
    `Risk ${product.risk_score.overall_risk_score}/100`,
  ];

  const groqResult = await callGroq(prompt, fallbackTags);
  if (groqResult) return groqResult;

  // Fallback using legacy format adapter
  const legacyAlgo: AlgorithmOutput = {
    product: {
      name: product.name,
      sku: product.sku,
      price: product.price,
      current_stock: product.current_stock,
      sales_history: [],
      avg_daily_sales: Number(km.adj_daily_avg),
      sales_trend_pct: product.forecast.trend_pct,
      days_of_stock: Number(km.days_of_stock),
      stockout_date: new Date().toISOString(),
      total_stock_value: product.current_stock * product.price,
      stock_age_days: product.dead_stock.stock_age_days,
      sales_velocity_30d: Number(km.adj_daily_avg),
      sales_velocity_60d: Number(km.adj_daily_avg),
    },
    status: product.status,
    priority_score: product.risk_score.overall_risk_score,
    days_of_stock: Number(km.days_of_stock),
    stockout_date: String(km.stockout_date_p50),
    revenue_at_risk: product.monte_carlo.expected_revenue_at_risk,
    reorder_qty: product.reorder.recommended_order_qty,
    reorder_cost: product.reorder.reorder_cost,
    eoq: product.reorder.eoq_units,
    units_stuck: product.dead_stock.is_dead ? product.current_stock : 0,
    capital_locked: product.dead_stock.capital_locked,
    recommended_discount_pct: product.dead_stock.optimal_discount_pct,
    units_to_clear: product.dead_stock.units_to_clear_at_optimal,
    capital_freed: product.dead_stock.capital_recovered_at_optimal,
    competitor_gap_days: 0,
    demand_spike_multiplier: 1,
    opportunity_revenue: product.opportunity.opportunity_revenue_30d,
    recommended_ad_spend: product.opportunity.recommended_ad_spend,
    forecast_next_30d: product.forecast.next_30d,
    forecast_next_60d: product.forecast.next_60d,
    forecast_next_90d: product.forecast.next_90d,
    abc_class: (product.abc_xyz?.abc_class as "A" | "B" | "C") || "B",
    revenue_contribution_pct: product.abc_xyz?.revenue_contribution_pct ?? 0,
    raw_metrics: km as Record<string, number | string>,
  };

  return generateFallbackSummary(legacyAlgo, brand);
}

export async function generateProductSummary(
  algo: AlgorithmOutput,
  brand: BrandContext,
): Promise<{ summary: string; action_tags: string[] }> {
  const currency = brand.currency;
  const metrics = algo.raw_metrics;

  const prompt = `You are an expert inventory analyst for ${brand.brand_name},
a ${brand.category} brand selling primarily on ${brand.main_channel}.

Analyze this product and write a decision-ready summary for the brand owner.

PRODUCT: ${algo.product.name}
PRICE: ${currency}${algo.product.price}
STATUS: ${algo.status}
CURRENT STOCK: ${algo.product.current_stock} units
DAILY SALES (avg): ${metrics.avg_daily_sales} units/day
DAYS OF STOCK LEFT: ${metrics.days_of_stock} days
STOCKOUT DATE: ${metrics.stockout_date}
SALES TREND (vs last month): ${metrics.trend_pct}% ${Number(metrics.trend_pct) > 0 ? "📈" : "📉"}
STOCK AGE: ${metrics.stock_age} days
CAPITAL LOCKED: ${currency}${metrics.capital_locked}
REVENUE AT RISK: ${currency}${algo.revenue_at_risk}
REORDER QUANTITY: ${metrics.reorder_qty} units
REORDER COST: ${currency}${metrics.reorder_cost}
OPPORTUNITY VALUE: ${currency}${metrics.opportunity_revenue}
ABC CLASS: ${metrics.abc_class} (${algo.revenue_contribution_pct}% of total brand revenue)
RECOMMENDED DISCOUNT: ${algo.recommended_discount_pct}%

YOUR JOB:
Write exactly 2 paragraphs in natural, direct language. No fluff. No bullet points.

Paragraph 1: Describe the exact problem or opportunity using REAL numbers from the data above.
Tell the owner what is happening RIGHT NOW and what will happen if they don't act.

Paragraph 2: Give ONE clear action recommendation with specific numbers (units, cost, price, date).
Make it feel like advice from a smart business partner who knows their brand deeply.

Then give 2-4 ACTION TAGS in this JSON format at the end:
TAGS: ["tag1", "tag2", "tag3"]

Tags must be SHORT (3-6 words), specific, and use real numbers.
Examples: "Order 112 units NOW", "Stockout in 5 days", "No discount needed", "₹52,500 locked in stock"

TONE: Direct, confident, friendly. Like a trusted advisor, not a robot.
NEVER say "I recommend" or "you should consider". Just state the action.`;

  const fallbackTags = [`${algo.status}`, `${metrics.days_of_stock} days stock`];
  const groqResult = await callGroq(prompt, fallbackTags);
  if (groqResult) return groqResult;

  return generateFallbackSummary(algo, brand);
}
