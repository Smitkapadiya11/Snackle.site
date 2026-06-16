"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/brand/Logo";
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
    if (!result || prefersReducedMotion()) {
      document.querySelectorAll(".result-card").forEach((el) => {
        (el as HTMLElement).style.opacity = "1";
      });
      return;
    }

    import("animejs").then(({ animate, stagger, createTimeline }) => {
      const tl = createTimeline();
      tl.add(".results-header", { opacity: [0, 1], translateY: [-24, 0], duration: 600 }, 0);
      tl.add(
        ".kpi-card",
        { opacity: [0, 1], translateY: [20, 0], delay: stagger(100), duration: 500 },
        200,
      );
      tl.add(".filter-tabs", { opacity: [0, 1], duration: 300 }, 500);
      tl.add(
        ".result-card",
        { opacity: [0, 1], translateY: [32, 0], delay: stagger(80), duration: 600 },
        600,
      );
      tl.add(".accent-line", { scaleX: [0, 1], duration: 800 }, 0);

      document.querySelectorAll(".kpi-value").forEach((el) => {
        const target = parseInt(el.getAttribute("data-target") || "0", 10);
        animateCounter(el as HTMLElement, target, 1500);
      });

      animate(".sparkline-path", {
        strokeDashoffset: [100, 0],
        duration: 1200,
        delay: stagger(80, { start: 800 }),
        easing: "easeOutExpo",
      });
    });
  }, [result]);

  if (!result) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "var(--black)",
        }}
      >
        <p style={{ color: "var(--light)" }}>Loading analysis...</p>
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

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(180deg, rgba(0,0,0,0.92) 0%, rgba(20,33,61,0.95) 100%)",
        position: "relative",
      }}
    >

      <div
        className="accent-line"
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          height: 3,
          background: "linear-gradient(90deg, transparent, var(--amber), transparent)",
          transformOrigin: "left center",
          zIndex: 50,
        }}
      />

      <header
        className="results-header"
        style={{
          position: "relative",
          zIndex: 10,
          padding: "24px 32px",
          borderBottom: "1px solid var(--border)",
          opacity: 0,
        }}
      >
        <div
          className="container"
          style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}
        >
          <Logo size="sm" />
          <div style={{ display: "flex", gap: 12 }}>
            <Link href="/use" className="btn btn-ghost btn-sm">
              Re-analyze
            </Link>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => window.print()}
            >
              Export
            </button>
          </div>
        </div>
      </header>

      <main className="container" style={{ position: "relative", zIndex: 10, padding: "40px 24px 80px" }}>
        <div style={{ marginBottom: 40 }}>
          <h1
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(28px, 4vw, 40px)",
              fontWeight: 700,
              marginBottom: 8,
            }}
          >
            {result.brand_context.brand_name}
          </h1>
          <p style={{ fontSize: 14, color: "var(--light)", opacity: 0.6 }}>
            {result.total_products} products · Snackle 1.0 ·{" "}
            {new Date(result.generated_at).toLocaleDateString("en-IN", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </p>
        </div>

        <div
          className="kpi-row"
        >
          {[
            { label: "Critical", value: counts.CRITICAL, color: "#ef4444" },
            { label: "Dead Stock", value: counts.DEAD_STOCK, color: "#eab308" },
            { label: "Opportunity", value: counts.OPPORTUNITY, color: "#22c55e" },
            { label: "Healthy", value: counts.HEALTHY, color: "#3b82f6" },
          ].map((kpi) => (
            <div
              key={kpi.label}
              className="kpi-card"
              style={{
                background: "rgba(20,33,61,0.5)",
                border: "1px solid var(--border)",
                borderRadius: "var(--r-lg)",
                padding: 20,
                opacity: 0,
              }}
            >
              <div style={{ fontSize: 12, color: "var(--light)", opacity: 0.6, marginBottom: 8 }}>
                {kpi.label}
              </div>
              <div
                className="kpi-value"
                data-target={kpi.value}
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: 36,
                  fontWeight: 700,
                  color: kpi.color,
                }}
              >
                0
              </div>
            </div>
          ))}
        </div>

        <div
          className="filter-tabs"
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 12,
            marginBottom: 24,
            alignItems: "center",
            justifyContent: "space-between",
            opacity: 0,
          }}
        >
          <div className="filter-tabs-scroll">
            {FILTERS.map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                style={{
                  padding: "8px 16px",
                  borderRadius: "var(--r-full)",
                  border: filter === f ? "1px solid var(--amber)" : "1px solid var(--border)",
                  background: filter === f ? "rgba(252,163,17,0.12)" : "transparent",
                  color: filter === f ? "var(--amber)" : "var(--light)",
                  fontSize: 13,
                  cursor: "pointer",
                }}
              >
                {f === "ALL" ? "All" : f.replace("_", " ")}
              </button>
            ))}
          </div>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortKey)}
            style={{
              background: "rgba(20,33,61,0.5)",
              border: "1px solid var(--border)",
              borderRadius: "var(--r-md)",
              color: "var(--white)",
              padding: "8px 12px",
              fontSize: 13,
            }}
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
          <p style={{ textAlign: "center", color: "var(--light)", opacity: 0.6, padding: 48 }}>
            No products match this filter.
          </p>
        )}
      </main>
    </div>
  );
}
