const STATUS_CONFIG = {
  CRITICAL: { emoji: "🔴", label: "Critical", bg: "bg-red-100 text-red-800" },
  DEAD_STOCK: { emoji: "🟡", label: "Dead stock", bg: "bg-yellow-100 text-yellow-800" },
  OPPORTUNITY: { emoji: "🟢", label: "Opportunity", bg: "bg-green-100 text-green-800" },
  HEALTHY: { emoji: "🔵", label: "Healthy", bg: "bg-blue-100 text-blue-800" },
  MONITOR: { emoji: "⚪", label: "Monitor", bg: "bg-gray-100 text-gray-700" },
};

export default function StatusBadge({ status }: { status: keyof typeof STATUS_CONFIG }) {
  const config = STATUS_CONFIG[status];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${config.bg}`}>
      {config.emoji} {config.label}
    </span>
  );
}
