import { ProductCard as ProductCardType } from "@/lib/types";
import StatusBadge from "./StatusBadge";
import ActionButton from "./ActionButton";

interface Props {
  card: ProductCardType;
  currency: string;
}

const STATUS_COLORS = {
  CRITICAL: "bg-red-50 border-red-200",
  DEAD_STOCK: "bg-yellow-50 border-yellow-200",
  OPPORTUNITY: "bg-green-50 border-green-200",
  HEALTHY: "bg-blue-50 border-blue-200",
  MONITOR: "bg-gray-50 border-gray-200",
};

export default function ProductCard({ card, currency }: Props) {
  return (
    <div className={`rounded-2xl border-2 p-6 ${STATUS_COLORS[card.status]} transition-all hover:shadow-md`}>
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-bold text-gray-900">{card.product_name}</h3>
          <span className="font-medium text-gray-500">
            — {currency}
            {card.price.toLocaleString("en-IN")}
          </span>
        </div>
        <StatusBadge status={card.status} />
      </div>

      {/* AI Summary */}
      <div className="mb-5 whitespace-pre-line text-sm leading-relaxed text-gray-700">{card.ai_summary}</div>

      {/* Action Tags */}
      <div className="flex flex-wrap gap-2">
        {card.action_tags.map((tag, i) => (
          <ActionButton key={i} label={tag} index={i} />
        ))}
      </div>
    </div>
  );
}
