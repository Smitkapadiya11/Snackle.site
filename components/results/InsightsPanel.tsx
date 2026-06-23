"use client";

import { AnalysisResult } from "@/lib/types";
import { PythonProductAnalysis } from "@/lib/python-types";

interface InsightsPanelProps {
  result: AnalysisResult;
  currency: string;
}

interface Insight {
  question: string;
  answer: string;
  priority: "critical" | "warning" | "opportunity" | "info";
  icon: string;
}

function fmt(n: number, currency: string): string {
  if (n >= 10_000_000) return `${currency}${(n / 10_000_000).toFixed(1)}Cr`;
  if (n >= 100_000) return `${currency}${(n / 100_000).toFixed(1)}L`;
  if (n >= 1_000) return `${currency}${(n / 1_000).toFixed(1)}K`;
  return `${currency}${Math.round(n).toLocaleString("en-IN")}`;
}

function generateInsights(result: AnalysisResult, currency: string): Insight[] {
  const insights: Insight[] = [];
  const cards = result.product_cards;
  const ps = result.portfolio_summary as Record<string, number> | undefined;

  // Q1: What needs immediate attention?
  const criticalProducts = cards.filter(c => c.status === "CRITICAL");
  if (criticalProducts.length > 0) {
    const top = criticalProducts[0];
    const v2 = top.engine_v2 as PythonProductAnalysis | undefined;
    const daysLeft = v2 ? Math.round(Number(v2.key_metrics?.days_of_stock || top.algorithm_output.days_of_stock)) : Math.round(top.algorithm_output.days_of_stock);
    const riskAmt = v2 ? (v2.monte_carlo?.expected_revenue_at_risk ?? top.algorithm_output.revenue_at_risk) : top.algorithm_output.revenue_at_risk;
    const reorderQty = v2?.reorder?.recommended_order_qty ?? top.algorithm_output.reorder_qty;
    const eoqUnits = v2?.reorder?.eoq_units ?? top.algorithm_output.eoq;
    insights.push({
      question: "⚡ What needs action TODAY?",
      answer: `${criticalProducts.length} products are in CRITICAL state. "${top.product_name}" has only ${daysLeft} days of stock left — stockout in ${daysLeft} days risks ${fmt(riskAmt, currency)} in lost revenue. Order ${Math.round(reorderQty)} units (EOQ: ${Math.round(eoqUnits)}) immediately.`,
      priority: "critical",
      icon: "🚨",
    });
  } else {
    insights.push({
      question: "⚡ What needs action TODAY?",
      answer: `No critical stockout emergencies right now. ${cards.filter(c => c.status === "MONITOR").length} products need monitoring — review their reorder points this week.`,
      priority: "info",
      icon: "✅",
    });
  }

  // Q2: Where is capital stuck?
  const deadStockProducts = cards.filter(c => c.status === "DEAD_STOCK");
  const totalLocked = result.total_capital_locked;
  if (deadStockProducts.length > 0 && totalLocked > 0) {
    const top = deadStockProducts[0];
    const v2 = top.engine_v2 as PythonProductAnalysis | undefined;
    const discountPct = v2?.dead_stock?.optimal_discount_pct ?? top.algorithm_output.recommended_discount_pct;
    const recoverable = v2?.dead_stock?.capital_recovered_at_optimal ?? top.algorithm_output.capital_freed;
    const bundleUplift = v2?.dead_stock?.bundle_revenue_uplift_pct ?? 0;
    insights.push({
      question: "💸 Where is capital stuck?",
      answer: `${fmt(totalLocked, currency)} is locked across ${deadStockProducts.length} dead stock products. "${top.product_name}" is the worst offender — a ${Math.round(discountPct)}% markdown could recover ${fmt(recoverable, currency)} within 2 weeks. ${bundleUplift > 10 ? `Bundling with your top seller could add +${Math.round(bundleUplift)}% revenue uplift.` : ""}`,
      priority: "warning",
      icon: "🔒",
    });
  }

  // Q3: What growth opportunities exist?
  const opportunityProducts = cards.filter(c => c.status === "OPPORTUNITY");
  const totalOpportunity = result.total_opportunity_value;
  if (opportunityProducts.length > 0) {
    const top = opportunityProducts[0];
    const v2 = top.engine_v2 as PythonProductAnalysis | undefined;
    const urgency = v2?.opportunity?.urgency_level || "THIS_WEEK";
    const adSpend = v2?.opportunity?.recommended_ad_spend ?? top.algorithm_output.recommended_ad_spend;
    const roas = v2?.opportunity?.expected_roas ?? 3;
    insights.push({
      question: "📈 What growth opportunities exist?",
      answer: `${fmt(totalOpportunity, currency)} in opportunity revenue over 30 days across ${opportunityProducts.length} products. "${top.product_name}" shows ${urgency === "IMMEDIATE" ? "IMMEDIATE" : "strong"} demand growth — investing ${fmt(adSpend, currency)} in ads could yield ${roas}× ROAS. Act now before competitors fill the gap.`,
      priority: "opportunity",
      icon: "🚀",
    });
  }

  // Q4: How accurate are the forecasts?
  const avgMape = ps?.avg_forecast_mape || 0.2;
  const accuracy = Math.round((1 - avgMape) * 100);
  const bestProduct = cards.length > 0 ? cards.reduce((best, c) => {
    const v2 = c.engine_v2 as PythonProductAnalysis | undefined;
    const mape = v2?.forecast?.model_accuracy_mape || 0.5;
    const bestV2 = best?.engine_v2 as PythonProductAnalysis | undefined;
    const bestMape = bestV2?.forecast?.model_accuracy_mape || 0.5;
    return mape < bestMape ? c : best;
  }, cards[0]) : null;
  const bestV2 = bestProduct?.engine_v2 as PythonProductAnalysis | undefined;

  insights.push({
    question: "🎯 How reliable are these predictions?",
    answer: `Overall forecast accuracy: ${accuracy}% across ${result.total_products} products (${Math.round(avgMape * 100)}% MAPE). ${bestProduct ? `"${bestProduct.product_name}" has the best forecast model (${bestV2?.forecast?.forecast_model_used || "exponential smoothing"}, ${Math.round((bestV2?.forecast?.model_accuracy_mape || 0.2) * 100)}% MAPE).` : ""} The Monte Carlo simulation ran ${(10000).toLocaleString("en-IN")} paths per product for stockout probability.`,
    priority: "info",
    icon: "📊",
  });

  // Q5: What should restock budget be?
  const reorderNeeded = ps?.total_reorder_investment_needed || 0;
  const immediateCount = ps?.immediate_reorder_count || criticalProducts.length;
  if (reorderNeeded > 0) {
    insights.push({
      question: "💰 What should my restock budget be this month?",
      answer: `Based on EOQ optimization across all products needing reorder: ${fmt(reorderNeeded, currency)} total restock investment recommended. ${immediateCount > 0 ? `Prioritize ${immediateCount} urgent orders first — these are stockout-risk products that need restocking within 7 days.` : "No emergency orders needed this week."} Spreading orders optimally reduces total inventory cost.`,
      priority: immediateCount > 0 ? "critical" : "info",
      icon: "🛒",
    });
  }

  // Q6: Which products are driving most value?
  const abcProducts = cards.filter(c => {
    const v2 = c.engine_v2 as PythonProductAnalysis | undefined;
    return (v2?.abc_xyz?.abc_class ?? (c.algorithm_output as { abc_class?: string })?.abc_class) === "A";
  });

  if (abcProducts.length > 0) {
    const aRevenuePct = ps?.a_class_revenue_pct || 0;
    insights.push({
      question: "⭐ Which products are my top performers?",
      answer: `${abcProducts.length} Class-A products generate ${Math.round(aRevenuePct)}% of your total revenue. These are your crown jewels — never let them stockout. ${abcProducts.slice(0, 3).map(c => `"${c.product_name}"`).join(", ")} should have tightest inventory control with daily review frequency as recommended by the ABC-XYZ matrix.`,
      priority: "info",
      icon: "👑",
    });
  }

  // Q7: Seasonal preparation
  const seasonalProduct = cards.find(c => {
    const v2 = c.engine_v2 as PythonProductAnalysis | undefined;
    return v2?.seasonal?.seasonal_patterns?.has_seasonality === true;
  });

  if (seasonalProduct) {
    const v2 = seasonalProduct.engine_v2 as PythonProductAnalysis | undefined;
    const patterns = v2?.seasonal?.seasonal_patterns;
    const peakMonths = patterns?.peak_months?.slice(0, 2).map((m: number) => 
      ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][m-1]
    ).join(" and ") || "festive season";
    const upcomingEvents = (v2?.seasonal?.upcoming_events as { name: string }[] | undefined)?.slice(0, 2).map(e => e.name).join(" and ") || "";
    insights.push({
      question: "🎄 Am I prepared for seasonal demand spikes?",
      answer: `Your category shows ${Math.round((patterns?.seasonality_strength || 0) * 100)}% seasonality strength. Demand peaks in ${peakMonths}. ${upcomingEvents ? `Upcoming events: ${upcomingEvents} could boost demand significantly.` : ""} Start building safety stock 6-8 weeks before peak season to avoid critical stockouts during your highest-revenue period.`,
      priority: "warning",
      icon: "📅",
    });
  }

  return insights.slice(0, 7);
}

const PRIORITY_STYLES = {
  critical: { border: "rgba(239,68,68,0.3)", badge: "#ef4444", badgeBg: "rgba(239,68,68,0.1)" },
  warning: { border: "rgba(234,179,8,0.3)", badge: "#eab308", badgeBg: "rgba(234,179,8,0.1)" },
  opportunity: { border: "rgba(34,197,94,0.3)", badge: "#22c55e", badgeBg: "rgba(34,197,94,0.1)" },
  info: { border: "rgba(59,130,246,0.3)", badge: "#3b82f6", badgeBg: "rgba(59,130,246,0.1)" },
};

export default function InsightsPanel({ result, currency }: InsightsPanelProps) {
  let insights: Insight[] = [];
  try {
    insights = generateInsights(result, currency);
  } catch (err) {
    console.error("InsightsPanel error:", err);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ marginBottom: 4 }}>
        <p style={{ fontSize: 14, color: "rgba(255,255,255,0.55)", lineHeight: 1.6 }}>
          Snackle answers the questions that matter most for your business, backed by real numbers from all 9 algorithms.
        </p>
      </div>

      {insights.map((insight, i) => {
        const style = PRIORITY_STYLES[insight.priority];
        return (
          <div
            key={i}
            style={{
              background: "rgba(255,255,255,0.03)",
              border: `1px solid ${style.border}`,
              borderRadius: 14,
              padding: "20px 22px",
              transition: "border-color 0.25s ease, transform 0.25s ease",
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)"; (e.currentTarget as HTMLElement).style.borderColor = style.badge + "60"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(0)"; (e.currentTarget as HTMLElement).style.borderColor = style.border; }}
          >
            <div style={{ display: "flex", gap: 12, alignItems: "flex-start", marginBottom: 12 }}>
              <span style={{ fontSize: 22, flexShrink: 0 }}>{insight.icon}</span>
              <h3 style={{
                fontSize: 15,
                fontWeight: 700,
                color: "rgba(255,255,255,0.9)",
                fontFamily: "var(--font-display)",
                lineHeight: 1.4,
              }}>
                {insight.question}
              </h3>
              <div style={{
                marginLeft: "auto",
                flexShrink: 0,
                fontSize: 10,
                fontWeight: 600,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: style.badge,
                background: style.badgeBg,
                padding: "3px 8px",
                borderRadius: 999,
                border: `1px solid ${style.badge}40`,
              }}>
                {insight.priority === "critical" ? "URGENT" : insight.priority === "opportunity" ? "GROWTH" : insight.priority === "warning" ? "CAUTION" : "INSIGHT"}
              </div>
            </div>
            <p style={{
              fontSize: 14,
              color: "rgba(255,255,255,0.75)",
              lineHeight: 1.7,
              marginLeft: 34,
            }}>
              {insight.answer}
            </p>
          </div>
        );
      })}

      {/* AI powered note */}
      <div style={{
        textAlign: "center",
        padding: "16px",
        color: "rgba(255,255,255,0.25)",
        fontSize: 11,
        borderTop: "1px solid rgba(255,255,255,0.05)",
      }}>
        ⚡ Insights powered by 9 algorithms · {(10000).toLocaleString("en-IN")} Monte Carlo simulations per product · Groq DeepSeek R1
      </div>
    </div>
  );
}
