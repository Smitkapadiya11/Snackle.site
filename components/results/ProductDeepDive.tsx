"use client";

import { useState } from "react";
import { ProductCard as ProductCardType } from "@/lib/types";
import { PythonProductAnalysis } from "@/lib/python-types";
import ForecastChart from "./ForecastChart";
import MonteCarloFanChart from "./MonteCarloFanChart";
import SeasonalHeatmap from "./SeasonalHeatmap";
import ReactMarkdown from "react-markdown";

interface ProductDeepDiveProps {
  card: ProductCardType;
  currency: string;
  onClose: () => void;
}

function MetricRow({ label, value, subValue, color, highlight }: {
  label: string;
  value: string | number;
  subValue?: string;
  color?: string;
  highlight?: boolean;
}) {
  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "10px 0",
      borderBottom: "1px solid rgba(255,255,255,0.05)",
    }}>
      <span style={{ fontSize: 13, color: "rgba(255,255,255,0.5)" }}>{label}</span>
      <div style={{ textAlign: "right" }}>
        <span style={{
          fontSize: 14,
          fontWeight: highlight ? 700 : 500,
          color: color || "rgba(255,255,255,0.9)",
        }}>
          {value}
        </span>
        {subValue && (
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)" }}>{subValue}</div>
        )}
      </div>
    </div>
  );
}

type TabKey = "overview" | "forecast" | "monte_carlo" | "seasonal" | "algorithms";

export default function ProductDeepDive({ card, currency, onClose }: ProductDeepDiveProps) {
  const [activeTab, setActiveTab] = useState<TabKey>("overview");
  const [forecastHorizon, setForecastHorizon] = useState<"30d" | "90d" | "1yr">("30d");

  const v2 = card.engine_v2 as PythonProductAnalysis | undefined;
  const algo = card.algorithm_output;

  const STATUS_COLORS = {
    CRITICAL: "#ef4444",
    DEAD_STOCK: "#eab308",
    OPPORTUNITY: "#22c55e",
    HEALTHY: "#3b82f6",
    MONITOR: "#6b7280",
  };
  const statusColor = STATUS_COLORS[card.status];

  const tabs: { key: TabKey; label: string; emoji: string }[] = [
    { key: "overview", label: "Overview", emoji: "📊" },
    { key: "forecast", label: "Forecast", emoji: "📈" },
    { key: "monte_carlo", label: "Monte Carlo", emoji: "🎲" },
    { key: "seasonal", label: "Seasonal", emoji: "🗓️" },
    { key: "algorithms", label: "All Metrics", emoji: "⚙️" },
  ];

  const fmt = (n: number) => {
    if (n >= 100_000) return `${currency}${(n / 100_000).toFixed(1)}L`;
    if (n >= 1_000) return `${currency}${(n / 1_000).toFixed(1)}K`;
    return `${currency}${Math.round(n).toLocaleString("en-IN")}`;
  };

  return (
    <div style={{
      position: "fixed",
      inset: 0,
      zIndex: 1000,
      background: "rgba(0,0,0,0.8)",
      backdropFilter: "blur(12px)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "20px",
      overflowY: "auto",
    }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        background: "#0d0d0d",
        border: `1px solid ${statusColor}40`,
        borderRadius: 24,
        width: "100%",
        maxWidth: 820,
        maxHeight: "92vh",
        display: "flex",
        flexDirection: "column",
        boxShadow: `0 40px 120px rgba(0,0,0,0.8), 0 0 0 1px ${statusColor}20`,
        overflow: "hidden",
      }}>
        {/* Header */}
        <div style={{
          padding: "24px 28px 20px",
          borderBottom: "1px solid rgba(255,255,255,0.07)",
          background: `linear-gradient(135deg, rgba(8,8,8,0.9), ${statusColor}08)`,
          flexShrink: 0,
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <div style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "4px 10px",
                background: `${statusColor}15`,
                border: `1px solid ${statusColor}40`,
                borderRadius: 999,
                marginBottom: 10,
              }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: statusColor }} />
                <span style={{ fontSize: 11, fontWeight: 600, color: statusColor, letterSpacing: "0.08em" }}>
                  {card.status.replace("_", " ")}
                </span>
              </div>
              <h2 style={{
                fontSize: 22,
                fontWeight: 800,
                color: "#fff",
                fontFamily: "var(--font-display)",
                letterSpacing: "-0.02em",
                marginBottom: 4,
              }}>
                {card.product_name}
              </h2>
              <div style={{ display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
                <span style={{ fontSize: 16, fontWeight: 600, color: "#FCA311" }}>
                  {currency}{card.price.toLocaleString("en-IN")}
                </span>
                {v2?.sku && (
                  <span style={{ fontSize: 12, color: "rgba(255,255,255,0.35)" }}>SKU: {v2.sku}</span>
                )}
                <span style={{ fontSize: 12, color: "rgba(255,255,255,0.35)" }}>
                  Stock: {(v2?.current_stock || 0).toLocaleString("en-IN")} units
                </span>
                <span style={{ fontSize: 12, color: "rgba(255,255,255,0.35)" }}>
                  Risk: <span style={{ color: statusColor, fontWeight: 600 }}>{card.priority_score}/100</span>
                </span>
              </div>
            </div>
            <button
              onClick={onClose}
              style={{
                background: "rgba(255,255,255,0.08)",
                border: "1px solid rgba(255,255,255,0.12)",
                borderRadius: 10,
                width: 36,
                height: 36,
                cursor: "pointer",
                color: "rgba(255,255,255,0.7)",
                fontSize: 18,
                flexShrink: 0,
              }}
            >
              ×
            </button>
          </div>

          {/* Action tags */}
          {card.action_tags.length > 0 && (
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 14 }}>
              {card.action_tags.map((tag, i) => (
                <span
                  key={i}
                  style={{
                    padding: "5px 12px",
                    background: i === 0 ? "#FCA311" : "rgba(252,163,17,0.12)",
                    color: i === 0 ? "#000" : "#FCA311",
                    borderRadius: 999,
                    fontSize: 12,
                    fontWeight: 600,
                    border: i === 0 ? "none" : "1px solid rgba(252,163,17,0.3)",
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Tabs */}
        <div style={{
          display: "flex",
          gap: 2,
          padding: "12px 16px",
          borderBottom: "1px solid rgba(255,255,255,0.07)",
          background: "rgba(0,0,0,0.3)",
          flexShrink: 0,
          overflowX: "auto",
        }}>
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                padding: "7px 14px",
                borderRadius: 8,
                border: "none",
                cursor: "pointer",
                fontSize: 13,
                fontWeight: activeTab === tab.key ? 600 : 400,
                background: activeTab === tab.key ? "rgba(252,163,17,0.15)" : "transparent",
                color: activeTab === tab.key ? "#FCA311" : "rgba(255,255,255,0.5)",
                transition: "all 0.2s ease",
                whiteSpace: "nowrap",
              }}
            >
              {tab.emoji} {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: "auto", padding: "24px 28px" }}>
          {/* ── OVERVIEW ── */}
          {activeTab === "overview" && (
            <div>
              {/* AI Summary */}
              <div style={{
                background: "rgba(252,163,17,0.06)",
                border: "1px solid rgba(252,163,17,0.2)",
                borderRadius: 14,
                padding: "18px 20px",
                marginBottom: 20,
              }}>
                <div style={{ fontSize: 11, color: "#FCA311", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 10 }}>
                  ⚡ AI Analysis
                </div>
                <div style={{ fontSize: 14, color: "rgba(255,255,255,0.8)", lineHeight: 1.75 }} className="prose prose-invert max-w-none">
                  <ReactMarkdown>{card.ai_summary}</ReactMarkdown>
                </div>
              </div>

              {/* Key metrics grid */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                {/* Demand */}
                <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 12, padding: "16px" }}>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12 }}>📦 Demand</div>
                  <MetricRow label="Daily avg sales" value={`${Number(v2?.key_metrics.adj_daily_avg || algo.raw_metrics.avg_daily_sales || 0).toFixed(1)} units`} />
                  <MetricRow label="Sales trend" value={`${Number(v2?.forecast.trend_pct || 0) > 0 ? "+" : ""}${Number(v2?.forecast.trend_pct || 0).toFixed(1)}%`} color={Number(v2?.forecast.trend_pct || 0) > 0 ? "#22c55e" : "#ef4444"} />
                  <MetricRow label="Forecast 30d" value={`${Math.round(v2?.forecast.next_30d || algo.forecast_next_30d || 0)} units`} />
                  <MetricRow label="Forecast 90d" value={`${Math.round(v2?.forecast.next_90d || algo.forecast_next_90d || 0)} units`} />
                  <MetricRow label="Model accuracy" value={`${Math.round((1 - (v2?.forecast.model_accuracy_mape || 0.2)) * 100)}%`} subValue={v2?.forecast.forecast_model_used || "ensemble"} />
                </div>
                {/* Stockout risk */}
                <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 12, padding: "16px" }}>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12 }}>⚠️ Stockout Risk</div>
                  <MetricRow label="Days of stock" value={`${Math.round(Number(v2?.key_metrics.days_of_stock || algo.days_of_stock || 0))} days`} color={Number(v2?.key_metrics.days_of_stock || 30) < 14 ? "#ef4444" : "rgba(255,255,255,0.9)"} highlight />
                  <MetricRow label="P50 stockout" value={`Day ${Math.round(v2?.monte_carlo?.stockout_day_p50 || 90)}`} />
                  <MetricRow label="30d stockout prob" value={`${Math.round((v2?.monte_carlo?.stockout_probability_30d || 0) * 100)}%`} color={v2?.monte_carlo?.stockout_probability_30d && v2.monte_carlo.stockout_probability_30d > 0.5 ? "#ef4444" : "#FCA311"} />
                  <MetricRow label="Revenue at risk" value={fmt(v2?.monte_carlo?.expected_revenue_at_risk || algo.revenue_at_risk || 0)} color="#ef4444" />
                  <MetricRow label="Safety stock" value={`${Math.round(v2?.safety_stock?.safety_stock_units || algo.raw_metrics.safety_stock_units as number || 0)} units`} />
                </div>
                {/* Reorder */}
                <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 12, padding: "16px" }}>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12 }}>🔄 Reorder</div>
                  <MetricRow label="EOQ" value={`${Math.round(v2?.reorder?.eoq_units || algo.eoq || 0)} units`} />
                  <MetricRow label="Recommended qty" value={`${Math.round(v2?.reorder?.recommended_order_qty || algo.reorder_qty || 0)} units`} color="#FCA311" highlight />
                  <MetricRow label="Order cost" value={fmt(v2?.reorder?.reorder_cost || algo.reorder_cost || 0)} />
                  <MetricRow label="Covers (days)" value={`${Math.round(v2?.reorder?.covers_days || 0)} days`} />
                  <MetricRow label="Reorder point" value={`${Math.round(v2?.safety_stock?.reorder_point || 0)} units`} />
                </div>
                {/* Profitability */}
                <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 12, padding: "16px" }}>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12 }}>💰 Profitability</div>
                  <MetricRow label="GMROI" value={`${(v2?.profitability?.gmroi || 0).toFixed(1)}×`} color={v2?.profitability?.meets_gmroi_target ? "#22c55e" : "#ef4444"} highlight />
                  <MetricRow label="Inventory turnover" value={`${(v2?.profitability?.inventory_turnover || 0).toFixed(1)}×/yr`} />
                  <MetricRow label="Days Sales of Inv." value={`${Math.round(v2?.profitability?.days_sales_inventory || 0)} days`} />
                  <MetricRow label="Annual revenue est." value={fmt(v2?.profitability?.annual_revenue_estimate || 0)} />
                  <MetricRow label="Holding cost/yr" value={fmt(v2?.profitability?.annual_holding_cost || 0)} />
                </div>
              </div>

              {/* Dead stock / Markdown if applicable */}
              {(v2?.dead_stock?.is_dead || v2?.dead_stock?.is_slow_mover) && (
                <div style={{
                  marginTop: 16,
                  background: "rgba(234,179,8,0.06)",
                  border: "1px solid rgba(234,179,8,0.2)",
                  borderRadius: 12,
                  padding: "16px",
                }}>
                  <div style={{ fontSize: 11, color: "#eab308", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 12 }}>
                    💸 Markdown Optimization
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
                    {[
                      { label: "Optimal Discount", value: `${v2?.dead_stock?.optimal_discount_pct || 0}%`, color: "#eab308" },
                      { label: "Clearance Price", value: `${currency}${v2?.dead_stock?.optimal_clearance_price || 0}`, color: "#FCA311" },
                      { label: "Capital Recoverable", value: fmt(v2?.dead_stock?.capital_recovered_at_optimal || 0), color: "#22c55e" },
                    ].map((item) => (
                      <div key={item.label} style={{ textAlign: "center" }}>
                        <div style={{ fontSize: 20, fontWeight: 700, color: item.color }}>{item.value}</div>
                        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>{item.label}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ marginTop: 12, fontSize: 12, color: "rgba(255,255,255,0.5)" }}>
                    Price elasticity: {v2?.dead_stock?.price_elasticity_estimate}
                    {" · "}
                    Weeks to clear at optimal: {Math.round(v2?.dead_stock?.weeks_to_clear_full_stock || 0)} weeks
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── FORECAST ── */}
          {activeTab === "forecast" && v2 && (
            <div>
              {/* Horizon selector */}
              <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
                {(["30d", "90d", "1yr"] as const).map((h) => (
                  <button
                    key={h}
                    onClick={() => setForecastHorizon(h)}
                    style={{
                      padding: "7px 18px",
                      borderRadius: 999,
                      border: `1px solid ${forecastHorizon === h ? "#FCA311" : "rgba(255,255,255,0.12)"}`,
                      background: forecastHorizon === h ? "rgba(252,163,17,0.15)" : "transparent",
                      color: forecastHorizon === h ? "#FCA311" : "rgba(255,255,255,0.5)",
                      cursor: "pointer",
                      fontSize: 13,
                      fontWeight: forecastHorizon === h ? 600 : 400,
                    }}
                  >
                    {h === "30d" ? "30 Days" : h === "90d" ? "90 Days" : "1 Year"}
                  </button>
                ))}
              </div>

              <ForecastChart product={v2} currency={currency} horizon={forecastHorizon} />

              {/* Forecast summary numbers */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginTop: 20 }}>
                {[
                  { label: "Next 7 days", value: Math.round(v2.forecast.next_7d) },
                  { label: "Next 30 days", value: Math.round(v2.forecast.next_30d) },
                  { label: "Next 60 days", value: Math.round(v2.forecast.next_60d) },
                  { label: "Next 90 days", value: Math.round(v2.forecast.next_90d) },
                ].map((item) => (
                  <div key={item.label} style={{
                    background: "rgba(255,255,255,0.04)",
                    borderRadius: 10,
                    padding: "12px",
                    textAlign: "center",
                  }}>
                    <div style={{ fontSize: 20, fontWeight: 700, color: "#FCA311" }}>{item.value}</div>
                    <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginTop: 2 }}>units</div>
                    <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)" }}>{item.label}</div>
                  </div>
                ))}
              </div>

              {/* 80% CI */}
              <div style={{ marginTop: 12, fontSize: 12, color: "rgba(255,255,255,0.4)", textAlign: "center" }}>
                80% confidence interval for 30d: {Math.round(v2.forecast.next_30d_lower)}–{Math.round(v2.forecast.next_30d_upper)} units
                {" · "}
                Model: {v2.forecast.forecast_model_used}
              </div>
            </div>
          )}

          {/* ── MONTE CARLO ── */}
          {activeTab === "monte_carlo" && v2 && (
            <div>
              <MonteCarloFanChart product={v2} currency={currency} />
              <div style={{ marginTop: 20 }}>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12 }}>
                  Risk Factors
                </div>
                {v2.risk_score.risk_factors.map((factor, i) => (
                  <div key={i} style={{
                    padding: "8px 12px",
                    background: "rgba(255,255,255,0.04)",
                    borderRadius: 8,
                    marginBottom: 6,
                    fontSize: 13,
                    color: "rgba(255,255,255,0.7)",
                    display: "flex",
                    gap: 8,
                    alignItems: "center",
                  }}>
                    <span style={{ color: "#FCA311" }}>▸</span> {factor}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── SEASONAL ── */}
          {activeTab === "seasonal" && v2 && (
            <div>
              <SeasonalHeatmap product={v2} />
              {/* Yearly forecast summary if available */}
              {v2.seasonal?.yearly_forecast && (
                <div style={{ marginTop: 20 }}>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12 }}>
                    Yearly Forecast Summary
                  </div>
                  <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                    {[
                      { label: "Total 365 days", value: `${Math.round(v2.seasonal.yearly_forecast.total_365d).toLocaleString("en-IN")} units` },
                      { label: "Peak Month", value: v2.seasonal.yearly_forecast.peak_month || "—" },
                      { label: "Slow Month", value: v2.seasonal.yearly_forecast.trough_month || "—" },
                    ].map((item) => (
                      <div key={item.label} style={{
                        background: "rgba(255,255,255,0.04)",
                        borderRadius: 10,
                        padding: "12px 16px",
                        flex: 1,
                        minWidth: 120,
                      }}>
                        <div style={{ fontSize: 16, fontWeight: 700, color: "#FCA311" }}>{item.value}</div>
                        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>{item.label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── ALL METRICS ── */}
          {activeTab === "algorithms" && v2 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              {/* ABC-XYZ */}
              {v2.abc_xyz && (
                <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 12, padding: "16px" }}>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12 }}>
                    🎯 ABC-XYZ Matrix
                  </div>
                  <div style={{ display: "flex", gap: 16, alignItems: "center", marginBottom: 12 }}>
                    <div style={{
                      width: 60,
                      height: 60,
                      borderRadius: 12,
                      background: "rgba(252,163,17,0.15)",
                      border: "2px solid rgba(252,163,17,0.5)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 24,
                      fontWeight: 800,
                      color: "#FCA311",
                      fontFamily: "var(--font-display)",
                    }}>
                      {v2.abc_xyz.abc_xyz_cell}
                    </div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: "rgba(255,255,255,0.9)", marginBottom: 4 }}>
                        {v2.abc_xyz.recommended_strategy}
                      </div>
                      <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)" }}>
                        Review frequency: {v2.abc_xyz.review_frequency}
                        {" · "}
                        SS multiplier: {v2.abc_xyz.safety_stock_multiplier}×
                      </div>
                    </div>
                  </div>
                  <MetricRow label="Revenue contribution" value={`${v2.abc_xyz.revenue_contribution_pct.toFixed(1)}%`} />
                  <MetricRow label="Cumulative revenue %" value={`${v2.abc_xyz.cumulative_revenue_pct.toFixed(1)}%`} />
                  <MetricRow label="Coefficient of variation" value={v2.abc_xyz.coefficient_of_variation.toFixed(3)} />
                </div>
              )}

              {/* Anomalies */}
              <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 12, padding: "16px" }}>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12 }}>
                  🔍 Anomaly Detection (Isolation Forest + CUSUM)
                </div>
                {v2?.anomalies?.has_anomalies ? (
                  <div>
                    <div style={{ color: "#eab308", fontSize: 14, fontWeight: 600, marginBottom: 8 }}>
                      ⚠️ {v2?.anomalies?.anomaly_dates?.length || 0} anomalous days detected
                    </div>
                    {v2?.anomalies?.anomaly_dates?.slice(0, 5).map((date, i) => (
                      <div key={i} style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", marginBottom: 3 }}>
                        • {date}{v2?.anomalies?.anomaly_direction?.[i] ? ` (${v2.anomalies.anomaly_direction[i]})` : ""}
                      </div>
                    ))}
                    {v2?.anomalies?.latest_change_point && (
                      <div style={{ marginTop: 10, padding: "8px 12px", background: "rgba(252,163,17,0.08)", borderRadius: 8, fontSize: 13, color: "#FCA311" }}>
                        📊 Demand shift detected since {v2.anomalies.latest_change_point} ({v2.anomalies.change_point_direction})
                      </div>
                    )}
                  </div>
                ) : (
                  <div style={{ color: "#22c55e", fontSize: 14 }}>✓ No anomalies detected — demand pattern is clean</div>
                )}
              </div>

              {/* Safety Stock */}
              <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 12, padding: "16px" }}>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12 }}>
                  🛡️ Statistical Safety Stock
                </div>
                <MetricRow label="Safety stock" value={`${Math.round(v2?.safety_stock?.safety_stock_units || 0)} units`} highlight />
                <MetricRow label="Safety stock days" value={`${Math.round(v2?.safety_stock?.safety_stock_days || 0)} days`} />
                <MetricRow label="Reorder point" value={`${Math.round(v2?.safety_stock?.reorder_point || 0)} units`} />
                <MetricRow label="Service level achieved" value={`${((v2?.safety_stock?.service_level_achieved || 0) * 100).toFixed(1)}%`} />
                <MetricRow label="Z-score used" value={(v2?.safety_stock?.z_score_used || 0).toFixed(2)} />
                <MetricRow label="Demand std dev" value={`${(v2?.safety_stock?.demand_std_dev || 0).toFixed(2)} units/day`} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
