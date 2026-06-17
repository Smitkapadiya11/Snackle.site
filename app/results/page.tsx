"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import SnackleProductCard from "@/components/results/SnackleProductCard";
import { AnalysisResult } from "@/lib/types";
import { animateCounter, prefersReducedMotion } from "@/lib/animation/useAnime";
import { useSiteAnimations } from "@/lib/animation/useSiteAnimations";

type StatusFilter = "ALL" | "CRITICAL" | "DEAD_STOCK" | "OPPORTUNITY" | "HEALTHY" | "MONITOR";
type SortKey = "priority" | "revenue_at_risk" | "capital_locked";

const FILTERS: StatusFilter[] = ["ALL", "CRITICAL", "DEAD_STOCK", "OPPORTUNITY", "HEALTHY", "MONITOR"];

export default function ResultsPage() {
  const router = useRouter();
  useSiteAnimations();
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
    if (filter !== "ALL") cards = cards.filter((c) => c.status === filter);
    cards.sort((a, b) => {
      if (sortBy === "priority") return b.priority_score - a.priority_score;
      if (sortBy === "revenue_at_risk")
        return b.algorithm_output.revenue_at_risk - a.algorithm_output.revenue_at_risk;
      return b.algorithm_output.capital_locked - a.algorithm_output.capital_locked;
    });
    return cards;
  }, [result, filter, sortBy]);

  useEffect(() => {
    if (!result) return;

    if (prefersReducedMotion()) {
      document.querySelectorAll(".result-card, .results-hero, .kpi-card, .results-toolbar").forEach((el) => {
        (el as HTMLElement).style.opacity = "1";
      });
      return;
    }

    import("animejs").then(({ animate, stagger, createTimeline }) => {
      const tl = createTimeline();
      tl.add(".results-hero", { opacity: [0, 1], translateY: [16, 0], duration: 500 }, 0);
      tl.add(".kpi-card", { opacity: [0, 1], translateY: [12, 0], delay: stagger(80), duration: 450 }, 150);
      tl.add(".results-toolbar", { opacity: [0, 1], duration: 350 }, 350);
      tl.add(".result-card", { opacity: [0, 1], translateY: [20, 0], delay: stagger(60), duration: 500 }, 450);

      document.querySelectorAll(".kpi-value").forEach((el) => {
        const target = parseInt(el.getAttribute("data-target") || "0", 10);
        animateCounter(el as HTMLElement, target, 1500);
      });

      animate(".sparkline-path", {
        strokeDashoffset: [100, 0],
        duration: 1200,
        delay: stagger(80, { start: 600 }),
        easing: "easeOutExpo",
      });
    });
  }, [result]);

  if (!result) {
    return (
      <div className="results-page results-page--loading">
        <p style={{ color: "var(--c-text-dim)" }}>Loading analysis...</p>
      </div>
    );
  }

  const currency = result.brand_context.currency;
  const counts = {
    CRITICAL: result.product_cards.filter((c) => c.status === "CRITICAL").length,
    DEAD_STOCK: result.product_cards.filter((c) => c.status === "DEAD_STOCK").length,
    OPPORTUNITY: result.product_cards.filter((c) => c.status === "OPPORTUNITY").length,
    HEALTHY: result.product_cards.filter((c) => c.status === "HEALTHY").length,
  };

  const dateLabel = new Date(result.generated_at).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <div className="results-page">
      <main className="results-main section-wrap">
        <header className="results-hero glass">
          <div className="results-hero-text">
            <p className="section-label">Intelligence Report</p>
            <h1 className="results-title">{result.brand_context.brand_name}</h1>
            <p className="results-meta">
              {result.total_products} products · Snackle 1.0 · {dateLabel}
            </p>
          </div>
          <div className="results-hero-actions">
            <Link href="/use" className="btn-ghost results-action-btn">
              Re-analyze
            </Link>
            <button type="button" className="btn-primary results-action-btn" onClick={() => window.print()}>
              Export
            </button>
          </div>
        </header>

        <div className="kpi-row">
          {[
            { label: "Critical", value: counts.CRITICAL, color: "#ef4444" },
            { label: "Dead Stock", value: counts.DEAD_STOCK, color: "#eab308" },
            { label: "Opportunity", value: counts.OPPORTUNITY, color: "#22c55e" },
            { label: "Healthy", value: counts.HEALTHY, color: "#3b82f6" },
          ].map((kpi) => (
            <div key={kpi.label} className="kpi-card glass">
              <div className="kpi-label">{kpi.label}</div>
              <div className="kpi-value" data-target={kpi.value} style={{ color: kpi.color }}>
                0
              </div>
            </div>
          ))}
        </div>

        <div className="results-toolbar glass">
          <div className="filter-tabs-scroll">
            {FILTERS.map((f) => (
              <button
                key={f}
                type="button"
                className={`filter-chip${filter === f ? " filter-chip--active" : ""}`}
                onClick={() => setFilter(f)}
              >
                {f === "ALL" ? "All" : f.replace("_", " ")}
              </button>
            ))}
          </div>
          <select
            className="results-sort"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortKey)}
            aria-label="Sort products"
          >
            <option value="priority">Sort: Priority</option>
            <option value="revenue_at_risk">Sort: Revenue at Risk</option>
            <option value="capital_locked">Sort: Capital Locked</option>
          </select>
        </div>

        <div className="results-grid">
          {filteredCards.map((card, i) => (
            <SnackleProductCard key={card.product_name} card={card} currency={currency} index={i} />
          ))}
        </div>

        {filteredCards.length === 0 && (
          <p className="results-empty">No products match this filter.</p>
        )}
      </main>
    </div>
  );
}
