"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import SnackleProductCard from "@/components/results/SnackleProductCard";
import PortfolioOverview from "@/components/results/PortfolioOverview";
import ForecastOverview from "@/components/results/ForecastOverview";
import InsightsPanel from "@/components/results/InsightsPanel";
import { AnalysisResult } from "@/lib/types";
import { animateCounter, prefersReducedMotion } from "@/lib/animation/useAnime";
import { useSiteAnimations } from "@/lib/animation/useSiteAnimations";

type StatusFilter = "ALL" | "CRITICAL" | "DEAD_STOCK" | "OPPORTUNITY" | "HEALTHY" | "MONITOR";
type SortKey = "priority" | "revenue_at_risk" | "capital_locked" | "days_of_stock" | "gmroi";
type ActiveTab = "overview" | "products" | "forecast" | "insights";

const FILTERS: { key: StatusFilter; label: string; color: string }[] = [
  { key: "ALL", label: "All", color: "rgba(255,255,255,0.6)" },
  { key: "CRITICAL", label: "Critical", color: "#ef4444" },
  { key: "DEAD_STOCK", label: "Dead Stock", color: "#eab308" },
  { key: "OPPORTUNITY", label: "Opportunity", color: "#22c55e" },
  { key: "HEALTHY", label: "Healthy", color: "#3b82f6" },
  { key: "MONITOR", label: "Monitor", color: "#6b7280" },
];

export default function ResultsPage() {
  const router = useRouter();
  useSiteAnimations();
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [filter, setFilter] = useState<StatusFilter>("ALL");
  const [sortBy, setSortBy] = useState<SortKey>("priority");
  const [activeTab, setActiveTab] = useState<ActiveTab>("overview");

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
      if (sortBy === "revenue_at_risk") return b.algorithm_output.revenue_at_risk - a.algorithm_output.revenue_at_risk;
      if (sortBy === "capital_locked") return b.algorithm_output.capital_locked - a.algorithm_output.capital_locked;
      if (sortBy === "days_of_stock") return a.algorithm_output.days_of_stock - b.algorithm_output.days_of_stock;
      if (sortBy === "gmroi") {
        const aGmroi = (a.engine_v2 as { profitability?: { gmroi?: number } } | undefined)?.profitability?.gmroi ?? 0;
        const bGmroi = (b.engine_v2 as { profitability?: { gmroi?: number } } | undefined)?.profitability?.gmroi ?? 0;
        return bGmroi - aGmroi;
      }
      return 0;
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
      tl.add(".results-tabs-bar", { opacity: [0, 1], duration: 350 }, 200);
      tl.add(".results-tab-content", { opacity: [0, 1], translateY: [12, 0], duration: 450 }, 300);
      tl.add(".result-card", { opacity: [0, 1], translateY: [20, 0], delay: stagger(50), duration: 500 }, 350);

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
        <div style={{ textAlign: "center", padding: "80px 20px" }}>
          <div style={{
            width: 48,
            height: 48,
            borderRadius: "50%",
            border: "3px solid rgba(252,163,17,0.3)",
            borderTopColor: "#FCA311",
            animation: "spin 1s linear infinite",
            margin: "0 auto 20px",
          }} />
          <p style={{ color: "rgba(255,255,255,0.5)" }}>Loading analysis...</p>
        </div>
      </div>
    );
  }

  const currency = result.brand_context.currency;
  const dateLabel = new Date(result.generated_at).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const engineVersion = result.engine_version || "1.0";
  const statusCounts = {
    CRITICAL: result.product_cards.filter(c => c.status === "CRITICAL").length,
    DEAD_STOCK: result.product_cards.filter(c => c.status === "DEAD_STOCK").length,
    OPPORTUNITY: result.product_cards.filter(c => c.status === "OPPORTUNITY").length,
    HEALTHY: result.product_cards.filter(c => c.status === "HEALTHY").length,
    MONITOR: result.product_cards.filter(c => c.status === "MONITOR").length,
  };

  const TAB_LABELS: { key: ActiveTab; label: string; emoji: string }[] = [
    { key: "overview", label: "Portfolio Overview", emoji: "📊" },
    { key: "products", label: `Products (${result.total_products})`, emoji: "📦" },
    { key: "forecast", label: "Demand Forecasts", emoji: "📈" },
    { key: "insights", label: "Strategic Insights", emoji: "💡" },
  ];

  return (
    <div className="results-page">
      <main className="results-main section-wrap" style={{ maxWidth: 1180, margin: "0 auto", padding: "0 20px 60px" }}>
        {/* Header */}
        <header className="results-hero glass" style={{
          marginBottom: 24,
          padding: "24px 28px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          flexWrap: "wrap",
          gap: 16,
        }}>
          <div>
            <p style={{
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: "#FCA311",
              marginBottom: 8,
            }}>
              Intelligence Report
            </p>
            <h1 style={{
              fontSize: 28,
              fontWeight: 800,
              color: "#fff",
              fontFamily: "var(--font-display)",
              letterSpacing: "-0.02em",
              marginBottom: 8,
            }}>
              {result.brand_context.brand_name}
            </h1>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
              <span style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>
                {result.total_products} products
              </span>
              <span style={{ color: "rgba(255,255,255,0.15)" }}>·</span>
              <span style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>
                Snackle {engineVersion}
              </span>
              <span style={{ color: "rgba(255,255,255,0.15)" }}>·</span>
              <span style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>{dateLabel}</span>
              <span style={{ color: "rgba(255,255,255,0.15)" }}>·</span>
              <span style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>
                {result.brand_context.category}
              </span>
            </div>
          </div>

          {/* Status pills */}
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
            {[
              { label: "Critical", count: statusCounts.CRITICAL, color: "#ef4444" },
              { label: "Dead Stock", count: statusCounts.DEAD_STOCK, color: "#eab308" },
              { label: "Opportunity", count: statusCounts.OPPORTUNITY, color: "#22c55e" },
              { label: "Healthy", count: statusCounts.HEALTHY, color: "#3b82f6" },
            ].filter(s => s.count > 0).map((s) => (
              <div key={s.label} style={{
                padding: "5px 12px",
                borderRadius: 999,
                background: `${s.color}15`,
                border: `1px solid ${s.color}40`,
                fontSize: 12,
                color: s.color,
                fontWeight: 600,
              }}>
                {s.count} {s.label}
              </div>
            ))}

            <div style={{ display: "flex", gap: 8, marginLeft: 8 }}>
              <Link href="/use" style={{
                padding: "8px 16px",
                borderRadius: 10,
                border: "1px solid rgba(255,255,255,0.15)",
                color: "rgba(255,255,255,0.7)",
                fontSize: 13,
                fontWeight: 500,
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                transition: "all 0.2s ease",
              }}>
                ↩ Re-analyze
              </Link>
              <button
                type="button"
                onClick={() => window.print()}
                style={{
                  padding: "8px 16px",
                  borderRadius: 10,
                  border: "none",
                  background: "rgba(252,163,17,0.9)",
                  color: "#000",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  transition: "all 0.2s ease",
                }}
              >
                ↓ Export
              </button>
            </div>
          </div>
        </header>

        {/* Navigation Tabs */}
        <div className="results-tabs-bar" style={{
          display: "flex",
          gap: 4,
          marginBottom: 24,
          padding: "6px",
          background: "rgba(255,255,255,0.04)",
          borderRadius: 14,
          border: "1px solid rgba(255,255,255,0.07)",
        }}>
          {TAB_LABELS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                flex: 1,
                padding: "10px 16px",
                borderRadius: 10,
                border: "none",
                cursor: "pointer",
                fontSize: 13,
                fontWeight: activeTab === tab.key ? 600 : 400,
                background: activeTab === tab.key ? "#FCA311" : "transparent",
                color: activeTab === tab.key ? "#000" : "rgba(255,255,255,0.55)",
                transition: "all 0.25s ease",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
              }}
            >
              <span>{tab.emoji}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="results-tab-content">
          {/* PORTFOLIO OVERVIEW */}
          {activeTab === "overview" && (
            <PortfolioOverview result={result} currency={currency} />
          )}

          {/* PRODUCTS */}
          {activeTab === "products" && (
            <div>
              {/* Toolbar */}
              <div className="results-toolbar glass" style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: 12,
                padding: "12px 16px",
                marginBottom: 20,
                borderRadius: 12,
              }}>
                {/* Filter chips */}
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {FILTERS.map((f) => {
                    const count = f.key === "ALL"
                      ? result.total_products
                      : statusCounts[f.key as keyof typeof statusCounts] || 0;
                    const isActive = filter === f.key;
                    return (
                      <button
                        key={f.key}
                        type="button"
                        onClick={() => setFilter(f.key)}
                        style={{
                          padding: "6px 12px",
                          borderRadius: 999,
                          border: `1px solid ${isActive ? f.color : "rgba(255,255,255,0.1)"}`,
                          background: isActive ? `${f.color}15` : "transparent",
                          color: isActive ? f.color : "rgba(255,255,255,0.5)",
                          fontSize: 12,
                          fontWeight: isActive ? 600 : 400,
                          cursor: "pointer",
                          transition: "all 0.2s ease",
                        }}
                      >
                        {f.label} {count > 0 && <span style={{ opacity: 0.7 }}>({count})</span>}
                      </button>
                    );
                  })}
                </div>

                {/* Sort */}
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortKey)}
                  aria-label="Sort products"
                  style={{
                    background: "rgba(255,255,255,0.06)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: 8,
                    color: "rgba(255,255,255,0.7)",
                    padding: "6px 12px",
                    fontSize: 12,
                    cursor: "pointer",
                  }}
                >
                  <option value="priority">Sort: Priority Score</option>
                  <option value="revenue_at_risk">Sort: Revenue at Risk</option>
                  <option value="capital_locked">Sort: Capital Locked</option>
                  <option value="days_of_stock">Sort: Days of Stock ↑</option>
                  <option value="gmroi">Sort: GMROI</option>
                </select>
              </div>

              {/* Products grid */}
              {filteredCards.length > 0 ? (
                <div className="results-grid" style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
                  gap: 16,
                }}>
                  {filteredCards.map((card, i) => (
                    <SnackleProductCard key={card.product_name} card={card} currency={currency} index={i} />
                  ))}
                </div>
              ) : (
                <div style={{
                  textAlign: "center",
                  padding: "60px 20px",
                  color: "rgba(255,255,255,0.4)",
                  fontSize: 14,
                }}>
                  No products match the selected filter.
                </div>
              )}
            </div>
          )}

          {/* FORECAST */}
          {activeTab === "forecast" && (
            <ForecastOverview result={result} currency={currency} />
          )}

          {/* INSIGHTS */}
          {activeTab === "insights" && (
            <InsightsPanel result={result} currency={currency} />
          )}
        </div>
      </main>
    </div>
  );
}
