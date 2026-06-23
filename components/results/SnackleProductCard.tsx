"use client";

import { useState } from "react";
import { ProductCard as ProductCardType } from "@/lib/types";
import { PythonProductAnalysis } from "@/lib/python-types";
import ProductDeepDive from "./ProductDeepDive";

const STATUS_STYLES = {
  CRITICAL: { border: "#ef4444", bg: "rgba(239,68,68,0.05)", badge: "#ef4444", badgeBg: "rgba(239,68,68,0.12)" },
  DEAD_STOCK: { border: "#eab308", bg: "rgba(234,179,8,0.05)", badge: "#eab308", badgeBg: "rgba(234,179,8,0.12)" },
  OPPORTUNITY: { border: "#22c55e", bg: "rgba(34,197,94,0.05)", badge: "#22c55e", badgeBg: "rgba(34,197,94,0.12)" },
  HEALTHY: { border: "#3b82f6", bg: "rgba(59,130,246,0.05)", badge: "#3b82f6", badgeBg: "rgba(59,130,246,0.12)" },
  MONITOR: { border: "#6b7280", bg: "rgba(107,114,128,0.05)", badge: "#6b7280", badgeBg: "rgba(107,114,128,0.12)" },
};

function Sparkline({ history, color }: { history: { date: string; units_sold: number }[]; color: string }) {
  const data = history.slice(-30);
  if (data.length < 2) return null;
  const maxUnits = Math.max(...data.map(h => h.units_sold), 1);

  const path = data
    .map((h, i) => {
      const x = (i / (data.length - 1)) * 100;
      const y = 28 - (h.units_sold / maxUnits) * 26;
      return `${i === 0 ? "M" : "L"}${x},${y}`;
    })
    .join(" ");

  return (
    <svg viewBox="0 0 100 32" style={{ width: "100%", height: 40 }} aria-hidden>
      <defs>
        <linearGradient id={`spark-${color.replace("#", "")}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.3} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      <path
        d={path + " L100,32 L0,32 Z"}
        fill={`url(#spark-${color.replace("#", "")})`}
      />
      <path
        d={path}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinejoin="round"
        strokeLinecap="round"
        className="sparkline-path"
      />
    </svg>
  );
}

function RiskRing({ score, color }: { score: number; color: string }) {
  const r = 18;
  const circ = 2 * Math.PI * r;
  const fill = (score / 100) * circ;

  return (
    <svg width={44} height={44} viewBox="0 0 44 44" style={{ flexShrink: 0 }}>
      <circle cx="22" cy="22" r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="4" />
      <circle
        cx="22" cy="22" r={r}
        fill="none"
        stroke={color}
        strokeWidth="4"
        strokeLinecap="round"
        strokeDasharray={`${fill} ${circ}`}
        transform="rotate(-90 22 22)"
        style={{ transition: "stroke-dasharray 1.5s ease" }}
      />
      <text x="22" y="26" textAnchor="middle" fill={color} fontSize="10" fontWeight="700">
        {score}
      </text>
    </svg>
  );
}

export default function SnackleProductCard({
  card,
  currency,
  index,
}: {
  card: ProductCardType;
  currency: string;
  index: number;
}) {
  const [showDeepDive, setShowDeepDive] = useState(false);
  const style = STATUS_STYLES[card.status];
  const v2 = card.engine_v2 as PythonProductAnalysis | undefined;
  const algo = card.algorithm_output;

  const rawDays = v2 ? Number(v2.key_metrics?.days_of_stock ?? algo.days_of_stock) : algo.days_of_stock;
  const daysOfStock = isNaN(rawDays) ? 0 : Math.round(rawDays);
  const stockMissing = daysOfStock < 0;
  const revenueAtRisk = v2 ? (v2.monte_carlo?.expected_revenue_at_risk ?? algo.revenue_at_risk) : algo.revenue_at_risk;
  const capitalLocked = v2 ? (v2.dead_stock?.capital_locked ?? algo.capital_locked) : algo.capital_locked;
  const rawFc30 = v2 ? (v2.forecast?.next_30d ?? v2.forecast?.daily_avg * 30) : (algo.forecast_next_30d || 0);
  const forecast30d = isFinite(rawFc30) && !isNaN(rawFc30) ? Math.round(rawFc30) : 0;
  const trendPct = v2 ? (v2.forecast?.trend_pct ?? 0) : (algo.product?.sales_trend_pct ?? 0);
  const abcCell = v2?.abc_xyz?.abc_xyz_cell || v2?.abc_xyz?.abc_class || (algo as { abc_class?: string })?.abc_class || "C";
  const gmroi = v2 ? (v2.profitability?.gmroi ?? 0) : 0;
  const currentStock = v2 ? (v2.current_stock ?? 0) : (algo.product?.current_stock ?? 0);
  const history = algo.product.sales_history;

  const fmt = (n: number) => {
    if (n >= 100_000) return `${currency}${(n / 100_000).toFixed(1)}L`;
    if (n >= 1_000) return `${currency}${(n / 1_000).toFixed(1)}K`;
    return `${currency}${Math.round(n).toLocaleString("en-IN")}`;
  };

  const summaryLines = card.ai_summary.split("\n").filter(l => l.trim());
  const previewText = summaryLines.slice(0, 2).join(" ").slice(0, 160);

  return (
    <>
      <article
        className={`result-card glass`}
        style={{
          borderLeft: `3px solid ${style.border}`,
          background: style.bg,
          cursor: "pointer",
          position: "relative",
          overflow: "hidden",
        }}
        onClick={() => setShowDeepDive(true)}
      >
        {/* Glow effect */}
        <div style={{
          position: "absolute",
          top: -40,
          right: -40,
          width: 120,
          height: 120,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${style.border}20, transparent 70%)`,
          pointerEvents: "none",
        }} />

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h3 style={{
              fontSize: 15,
              fontWeight: 700,
              color: "#fff",
              fontFamily: "var(--font-display)",
              marginBottom: 4,
              lineHeight: 1.3,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}>
              {card.product_name}
            </h3>
            <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: "#FCA311" }}>
                {currency}{card.price.toLocaleString("en-IN")}
              </span>
              <span style={{
                fontSize: 10,
                fontWeight: 600,
                padding: "2px 8px",
                borderRadius: 999,
                background: style.badgeBg,
                color: style.badge,
                border: `1px solid ${style.border}40`,
                letterSpacing: "0.05em",
              }}>
                {card.status.replace("_", " ")}
              </span>
              {abcCell && (
                <span style={{
                  fontSize: 10,
                  fontWeight: 600,
                  padding: "2px 7px",
                  borderRadius: 999,
                  background: "rgba(252,163,17,0.1)",
                  color: "#FCA311",
                  border: "1px solid rgba(252,163,17,0.3)",
                }}>
                  {abcCell}
                </span>
              )}
            </div>
          </div>
          <RiskRing score={card.priority_score} color={style.border} />
        </div>

        {/* Sparkline */}
        {history.length > 2 && (
          <Sparkline history={history} color={style.border} />
        )}

        {/* Metrics grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginBottom: 12, marginTop: 8 }}>
          {[
            { label: "Days left", value: stockMissing ? "N/A" : `${daysOfStock}d`, urgent: !stockMissing && daysOfStock < 14 },
            { label: "Forecast 30d", value: `${forecast30d}u` },
            { label: "Trend", value: `${trendPct > 0 ? "+" : ""}${(trendPct || 0).toFixed(1)}%`, up: trendPct > 0 },
            { label: "Revenue risk", value: fmt(revenueAtRisk || 0) },
            { label: "Capital locked", value: fmt(capitalLocked || 0) },
            { label: "GMROI", value: `${(gmroi || 0).toFixed(1)}×` },
          ].map((metric) => (
            <div key={metric.label} style={{
              background: "rgba(255,255,255,0.04)",
              borderRadius: 8,
              padding: "8px 10px",
            }}>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", marginBottom: 3 }}>{metric.label}</div>
              <div style={{
                fontSize: 13,
                fontWeight: 600,
                color: metric.urgent ? "#ef4444" : "up" in metric ? (metric.up ? "#22c55e" : "#ef4444") : "rgba(255,255,255,0.85)",
              }}>
                {metric.value}
              </div>
            </div>
          ))}
        </div>

        {/* AI summary preview */}
        <p style={{
          fontSize: 12,
          color: "rgba(255,255,255,0.6)",
          lineHeight: 1.6,
          marginBottom: 12,
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
        }}>
          {previewText}
          {previewText.length >= 160 ? "…" : ""}
        </p>

        {/* Action tags */}
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 14 }}>
          {card.action_tags.slice(0, 3).map((tag, i) => (
            <span
              key={i}
              style={{
                padding: "4px 10px",
                background: i === 0 ? "rgba(252,163,17,0.15)" : "rgba(255,255,255,0.06)",
                color: i === 0 ? "#FCA311" : "rgba(255,255,255,0.6)",
                borderRadius: 999,
                fontSize: 11,
                fontWeight: i === 0 ? 600 : 400,
                border: `1px solid ${i === 0 ? "rgba(252,163,17,0.3)" : "rgba(255,255,255,0.08)"}`,
              }}
            >
              {tag}
            </span>
          ))}
        </div>

        {/* CTA */}
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          paddingTop: 10,
          borderTop: "1px solid rgba(255,255,255,0.06)",
        }}>
          <span style={{ fontSize: 11, color: "rgba(255,255,255,0.35)" }}>
            {currentStock.toLocaleString("en-IN")} units in stock
          </span>
          <span style={{
            fontSize: 12,
            color: "#FCA311",
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            gap: 4,
          }}>
            Deep dive ↗
          </span>
        </div>
      </article>

      {/* Deep dive modal */}
      {showDeepDive && (
        <ProductDeepDive
          card={card}
          currency={currency}
          onClose={() => setShowDeepDive(false)}
        />
      )}
    </>
  );
}
