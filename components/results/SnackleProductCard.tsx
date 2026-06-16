"use client";

import { useState } from "react";
import { ProductCard as ProductCardType } from "@/lib/types";
import StatusBadge from "@/components/ui/StatusBadge";
import ActionButton from "@/components/ui/ActionButton";

const STATUS_STYLES = {
  CRITICAL: { border: "#ef4444", bg: "rgba(239,68,68,0.05)" },
  DEAD_STOCK: { border: "#eab308", bg: "rgba(234,179,8,0.05)" },
  OPPORTUNITY: { border: "#22c55e", bg: "rgba(34,197,94,0.05)" },
  HEALTHY: { border: "#3b82f6", bg: "rgba(59,130,246,0.05)" },
  MONITOR: { border: "#6b7280", bg: "rgba(107,114,128,0.05)" },
};

export default function SnackleProductCard({
  card,
  currency,
  index,
}: {
  card: ProductCardType;
  currency: string;
  index: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const style = STATUS_STYLES[card.status];
  const history = card.algorithm_output.product.sales_history.slice(-30);
  const maxUnits = Math.max(...history.map((h) => h.units_sold), 1);

  const sparkPath = history
    .map((h, i) => {
      const x = (i / Math.max(history.length - 1, 1)) * 100;
      const y = 30 - (h.units_sold / maxUnits) * 28;
      return `${i === 0 ? "M" : "L"}${x},${y}`;
    })
    .join(" ");

  return (
    <div
      className={`result-card result-card-${index}`}
      style={{
        background: style.bg,
        border: "1px solid var(--border)",
        borderLeft: `4px solid ${style.border}`,
        borderRadius: "var(--r-lg)",
        padding: 24,
        opacity: 0,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16, gap: 12, flexWrap: "wrap" }}>
        <div>
          <h3
            style={{
              fontFamily: "var(--font-display)",
              fontSize: 18,
              fontWeight: 700,
              marginBottom: 4,
            }}
          >
            {card.product_name}
          </h3>
          <span style={{ fontSize: 14, color: "var(--light)", opacity: 0.7 }}>
            {currency}
            {card.price.toLocaleString("en-IN")}
          </span>
        </div>
        <StatusBadge status={card.status} />
      </div>

      <svg
        viewBox="0 0 100 32"
        style={{ width: "100%", height: 48, marginBottom: 16 }}
        aria-hidden
      >
        <path
          d={sparkPath || "M0,16 L100,16"}
          fill="none"
          stroke="var(--amber)"
          strokeWidth="1.5"
          className="sparkline-path"
        />
      </svg>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 12,
          marginBottom: 16,
          fontSize: 12,
        }}
      >
        <div>
          <div style={{ color: "var(--light)", opacity: 0.5, marginBottom: 4 }}>Days of stock</div>
          <div style={{ fontWeight: 600, color: "var(--white)" }}>
            {Math.round(card.algorithm_output.days_of_stock)}
          </div>
        </div>
        <div>
          <div style={{ color: "var(--light)", opacity: 0.5, marginBottom: 4 }}>Revenue at risk</div>
          <div style={{ fontWeight: 600, color: "var(--amber)" }}>
            {currency}
            {Math.round(card.algorithm_output.revenue_at_risk).toLocaleString("en-IN")}
          </div>
        </div>
        <div>
          <div style={{ color: "var(--light)", opacity: 0.5, marginBottom: 4 }}>Priority</div>
          <div style={{ fontWeight: 600, color: "var(--white)" }}>{card.priority_score}/100</div>
        </div>
      </div>

      <div
        style={{
          fontSize: 14,
          color: "var(--light)",
          lineHeight: 1.65,
          marginBottom: 16,
          whiteSpace: "pre-line",
        }}
      >
        {expanded ? card.ai_summary : card.ai_summary.split("\n").slice(0, 2).join("\n")}
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
        {card.action_tags.map((tag, i) => (
          <ActionButton key={i} label={tag} index={i} />
        ))}
      </div>

      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        style={{
          background: "none",
          border: "none",
          color: "var(--amber)",
          fontSize: 13,
          cursor: "pointer",
          padding: 0,
        }}
      >
        {expanded ? "Show less ↑" : "View algorithm details ↓"}
      </button>

      {expanded && (
        <div
          style={{
            marginTop: 16,
            paddingTop: 16,
            borderTop: "1px solid var(--border)",
            fontSize: 12,
            color: "var(--light)",
            opacity: 0.8,
            display: "grid",
            gap: 8,
          }}
        >
          <div>Reorder qty: {card.algorithm_output.reorder_qty} units</div>
          <div>EOQ: {Math.round(card.algorithm_output.eoq)}</div>
          <div>Capital locked: {currency}{Math.round(card.algorithm_output.capital_locked).toLocaleString("en-IN")}</div>
          {card.algorithm_output.recommended_discount_pct > 0 && (
            <div>Recommended discount: {card.algorithm_output.recommended_discount_pct}%</div>
          )}
        </div>
      )}
    </div>
  );
}
