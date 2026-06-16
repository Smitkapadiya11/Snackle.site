"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnalysisResult } from "@/lib/types";
import SummaryHeader from "@/components/dashboard/SummaryHeader";
import DashboardGrid from "@/components/dashboard/DashboardGrid";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

type StatusFilter = "ALL" | "CRITICAL" | "DEAD_STOCK" | "OPPORTUNITY" | "HEALTHY" | "MONITOR";
type SortKey = "priority" | "revenue_at_risk" | "capital_locked";

export default function DashboardPage() {
  const router = useRouter();
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [filter, setFilter] = useState<StatusFilter>("ALL");
  const [sortBy, setSortBy] = useState<SortKey>("priority");

  useEffect(() => {
    const stored = sessionStorage.getItem("inventory_analysis");
    if (!stored) {
      router.replace("/use");
      return;
    }
    try {
      setResult(JSON.parse(stored));
    } catch {
      router.replace("/use");
    }
  }, [router]);

  const filteredCards = useMemo(() => {
    if (!result) return [];
    let cards = [...result.product_cards];

    if (filter !== "ALL") {
      cards = cards.filter((c) => c.status === filter);
    }

    cards.sort((a, b) => {
      if (sortBy === "priority") return b.priority_score - a.priority_score;
      if (sortBy === "revenue_at_risk")
        return b.algorithm_output.revenue_at_risk - a.algorithm_output.revenue_at_risk;
      return b.algorithm_output.capital_locked - a.algorithm_output.capital_locked;
    });

    return cards;
  }, [result, filter, sortBy]);

  if (!result) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F9FAFB]">
        <p className="text-gray-500">Loading analysis...</p>
      </div>
    );
  }

  const currency = result.brand_context.currency;

  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      <header className="border-b border-gray-200 bg-white px-6 py-4">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div>
            <Link href="/" className="text-lg font-bold text-gray-900">
              Inventory AI
            </Link>
            <p className="text-sm text-gray-500">
              {result.brand_context.brand_name} · {result.total_products} products ·{" "}
              {new Date(result.generated_at).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </p>
          </div>
          <div className="flex gap-2">
            <Link
              href="/onboarding"
              className="inline-flex h-8 items-center justify-center rounded-lg border border-border bg-background px-2.5 text-sm font-medium hover:bg-muted"
            >
              Re-analyze
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8">
        <SummaryHeader result={result} currency={currency} />

        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <Tabs value={filter} onValueChange={(v) => setFilter(v as StatusFilter)}>
            <TabsList>
              <TabsTrigger value="ALL">All</TabsTrigger>
              <TabsTrigger value="CRITICAL">Critical</TabsTrigger>
              <TabsTrigger value="DEAD_STOCK">Dead Stock</TabsTrigger>
              <TabsTrigger value="OPPORTUNITY">Opportunity</TabsTrigger>
              <TabsTrigger value="HEALTHY">Healthy</TabsTrigger>
            </TabsList>
          </Tabs>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortKey)}
            className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700"
          >
            <option value="priority">Sort: Priority</option>
            <option value="revenue_at_risk">Sort: Revenue at Risk</option>
            <option value="capital_locked">Sort: Capital Locked</option>
          </select>
        </div>

        <DashboardGrid cards={filteredCards} currency={currency} />
      </main>
    </div>
  );
}
