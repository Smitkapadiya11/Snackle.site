"use client";

import { ProductCard as ProductCardType } from "@/lib/types";
import ProductCard from "./ProductCard";

interface Props {
  cards: ProductCardType[];
  currency: string;
}

export default function DashboardGrid({ cards, currency }: Props) {
  if (cards.length === 0) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center">
        <p className="text-gray-500">No products match this filter.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      {cards.map((card) => (
        <ProductCard key={card.product_name} card={card} currency={currency} />
      ))}
    </div>
  );
}
