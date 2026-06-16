"use client";

import { useState } from "react";
import { ProductCard as ProductCardType } from "@/lib/types";
import StatusBadge from "@/components/ui/StatusBadge";
import ActionButton from "@/components/ui/ActionButton";

const STATUS_STYLES = {
  CRITICAL: { border: "#ef4444", bg: "rgba(239,68,68,0.06)" },
  DEAD_STOCK: { border: "#eab308", bg: "rgba(234,179,8,0.06)" },
  OPPORTUNITY: { border: "#22c55e", bg: "rgba(34,197,94,0.06)" },
  HEALTHY: { border: "#3b82f6", bg: "rgba(59,130,246,0.06)" },
  MONITOR: { border: "#6b7280", bg: "rgba(107,114,128,0.06)" },
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

  const summaryPreview = card.ai_summary.split("\n").slice(0, 2).join("\n");

  return (
    <article
      className={`result-card result-card-${index} glass product-card`}
      style={{
        borderLeft: `4px solid ${style.border}`,
        background: style.bg,
        opacity: 0,
      }}
    >
      <div className="product-card-header">
        <div className="product-card-title-wrap">
          <h3 className="product-card-title">{card.product_name}</h3>
          <span className="product-card-price">
            {currency}
            {card.price.toLocaleString("en-IN")}
          </span>
        </div>
        <StatusBadge status={card.status} />
      </div>

      <svg viewBox="0 0 100 32" className="product-sparkline" aria-hidden>
        <path
          d={sparkPath || "M0,16 L100,16"}
          fill="none"
          stroke="var(--c-accent)"
          strokeWidth="1.5"
          className="sparkline-path"
        />
      </svg>

      <div className="product-metrics-grid">
        <div className="product-metric">
          <span className="product-metric-label">Days of stock</span>
          <span className="product-metric-value">{Math.round(card.algorithm_output.days_of_stock)}</span>
        </div>
        <div className="product-metric">
          <span className="product-metric-label">Revenue at risk</span>
          <span className="product-metric-value product-metric-value--accent">
            {currency}
            {Math.round(card.algorithm_output.revenue_at_risk).toLocaleString("en-IN")}
          </span>
        </div>
        <div className="product-metric">
          <span className="product-metric-label">Priority</span>
          <span className="product-metric-value">{card.priority_score}/100</span>
        </div>
      </div>

      <p className="product-summary">{expanded ? card.ai_summary : summaryPreview}</p>

      <div className="product-tags">
        {card.action_tags.map((tag, i) => (
          <ActionButton key={i} label={tag} index={i} />
        ))}
      </div>

      <button type="button" className="product-expand-btn" onClick={() => setExpanded(!expanded)}>
        {expanded ? "Show less ↑" : "View algorithm details ↓"}
      </button>

      {expanded && (
        <div className="product-details">
          <div>Reorder qty: {card.algorithm_output.reorder_qty} units</div>
          <div>EOQ: {Math.round(card.algorithm_output.eoq)}</div>
          <div>
            Capital locked: {currency}
            {Math.round(card.algorithm_output.capital_locked).toLocaleString("en-IN")}
          </div>
          {card.algorithm_output.recommended_discount_pct > 0 && (
            <div>Recommended discount: {card.algorithm_output.recommended_discount_pct}%</div>
          )}
        </div>
      )}
    </article>
  );
}
