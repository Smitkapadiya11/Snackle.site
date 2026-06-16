"use client";

const STATUS_CONFIG = {
  CRITICAL: { emoji: "🔴", label: "Critical", color: "#ef4444" },
  DEAD_STOCK: { emoji: "🟡", label: "Dead Stock", color: "#eab308" },
  OPPORTUNITY: { emoji: "🟢", label: "Opportunity", color: "#22c55e" },
  HEALTHY: { emoji: "🔵", label: "Healthy", color: "#3b82f6" },
  MONITOR: { emoji: "⚪", label: "Monitor", color: "#6b7280" },
} as const;

export default function StatusBadge({
  status,
}: {
  status: keyof typeof STATUS_CONFIG;
}) {
  const config = STATUS_CONFIG[status];
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "4px 12px",
        borderRadius: "var(--r-full)",
        fontSize: 12,
        fontWeight: 600,
        background: `${config.color}18`,
        color: config.color,
        border: `1px solid ${config.color}40`,
      }}
    >
      {config.emoji} {config.label}
    </span>
  );
}

export { STATUS_CONFIG };
