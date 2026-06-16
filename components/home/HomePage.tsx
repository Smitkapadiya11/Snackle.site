"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Navigation } from "@/components/layout/Navigation";
import { Footer } from "@/components/layout/Footer";
import { IntelligenceCreature } from "@/components/art/IntelligenceCreature";
import { useSiteAnimations } from "@/lib/animation/useSiteAnimations";

const ALGORITHMS = [
  { name: "Monte Carlo", icon: "◎", desc: "10,000 demand paths per product", tag: "Stockout Risk" },
  { name: "Holt-Winters", icon: "⟿", desc: "Trend + seasonality ensemble forecast", tag: "Demand Forecast" },
  { name: "Statistical SS", icon: "σ", desc: "Lead time variability accounted", tag: "Safety Stock" },
  { name: "EOQ Model", icon: "∮", desc: "Mathematically optimal order qty", tag: "Reorder" },
  { name: "ABC-XYZ", icon: "⊞", desc: "9-cell classification, 9 strategies", tag: "Classification" },
  { name: "Isolation Forest", icon: "⊕", desc: "ML anomaly detection on sales", tag: "Anomaly" },
  { name: "CUSUM", icon: "Δ", desc: "Detects when demand sustainably shifts", tag: "Change Point" },
  { name: "Price Elasticity", icon: "ε", desc: "Optimal markdown price calculator", tag: "Dead Stock" },
  { name: "GMROI", icon: "$", desc: "Is your inventory working hard enough?", tag: "Profitability" },
];

const STEPS = [
  {
    step: "01",
    title: "Upload Your Data",
    desc: "Drop your CSV or Excel export from Amazon, Flipkart, Shopify, or any platform. Snackle reads any column structure — no reformatting needed.",
    icon: (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden>
        <path d="M16 4L16 20M16 4L10 10M16 4L22 10" stroke="#FCA311" strokeWidth="2" strokeLinecap="round" />
        <path d="M4 24H28V28H4V24Z" fill="rgba(252,163,17,0.15)" stroke="#FCA311" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    step: "02",
    title: "Answer 12 Questions",
    desc: "Snackle interviews you in your language. Hindi, Gujarati, Tamil, Telugu and 7 more. One question at a time, answered naturally.",
    icon: (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden>
        <circle cx="16" cy="16" r="13" stroke="#FCA311" strokeWidth="1.5" />
        <path d="M12 13C12 10.8 13.8 9 16 9C18.2 9 20 10.8 20 13C20 15.5 17.5 16.5 16 18M16 22V22.5" stroke="#FCA311" strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    step: "03",
    title: "Receive Intelligence",
    desc: "Snackle 1.0 runs 9 enterprise-grade algorithms and returns one clear decision per product. Exactly what to do, and why.",
    icon: (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden>
        <path d="M8 16L13 21L24 10" stroke="#FCA311" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="16" cy="16" r="13" stroke="#FCA311" strokeWidth="1.5" />
      </svg>
    ),
  },
];

const DEMO_CARDS = [
  {
    status: "CRITICAL",
    statusColor: "#ef4444",
    name: "Face Serum Premium",
    price: "₹899",
    summary:
      "You have only 5 days of stock on your best-selling serum. At current pace you will run out by next Tuesday and lose ₹38,000 in sales that week alone.",
    actions: ["Order 112 units NOW", "Stockout in 5 days", "No discount needed"],
    metric: "5 days stock",
    metricColor: "#ef4444",
  },
  {
    status: "DEAD STOCK",
    statusColor: "#eab308",
    name: "Moisturiser 50ml",
    price: "₹349",
    summary:
      "This product has been sitting for 3 months and sales are dropping. You have ₹52,500 locked in 350 units that are not moving.",
    actions: ["20% off — sell at ₹279", "Bundle with serum", "Free up ₹42k"],
    metric: "₹52,500 locked",
    metricColor: "#eab308",
  },
  {
    status: "OPPORTUNITY",
    statusColor: "#22c55e",
    name: "Vitamin C Toner",
    price: "₹599",
    summary:
      "Demand will spike in the next 30 days — your competitor just went out of stock. You only have 18 days of inventory and will miss this window.",
    actions: ["Order 200 units", "₹12k ads — act now", "₹85k opportunity"],
    metric: "18 days stock",
    metricColor: "#22c55e",
  },
];

export default function HomePage() {
  useSiteAnimations({ hero: true });

  useEffect(() => {
    const counters = [
      { id: "stat-accuracy", target: 94, suffix: "%" },
      { id: "stat-sim", target: 10, suffix: "K+" },
      { id: "stat-abc", target: 9, suffix: "x" },
      { id: "stat-time", target: 5, suffix: "min" },
    ];

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries[0].isIntersecting) return;
        observer.disconnect();

        counters.forEach(({ id, target, suffix }) => {
          const el = document.getElementById(id);
          if (!el) return;
          let start = 0;
          const step = () => {
            start += (target - start) * 0.08;
            el.textContent = (start >= target - 0.5 ? target : Math.round(start)) + suffix;
            if (start < target - 0.5) requestAnimationFrame(step);
            else el.textContent = target + suffix;
          };
          requestAnimationFrame(step);
        });
      },
      { threshold: 0.3 },
    );

    const statsEl = document.querySelector(".hero-stats");
    if (statsEl) observer.observe(statsEl);
    return () => observer.disconnect();
  }, []);

  return (
    <>
      <Navigation />

      {/* Hero */}
      <section className="reveal-section hero-section">
        <div className="section-wrap">
          <div className="hero-layout">
            <div className="hero-content">
          <div
            className="hero-badge hero-anim"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              background: "var(--c-accent-dim)",
              border: "1px solid var(--c-accent-border)",
              borderRadius: 999,
              padding: "6px 16px",
              marginBottom: 24,
              opacity: 0,
            }}
          >
            <span className="pulse-dot" style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--c-accent)", display: "inline-block" }} />
            <span style={{ fontSize: 12, color: "var(--c-accent)", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase" }}>
              Snackle 1.0 — Now Live
            </span>
          </div>

          <h1 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(52px, 5.5vw, 88px)", fontWeight: 800, lineHeight: 1.05, letterSpacing: "-0.035em", marginBottom: 28 }}>
            <span className="hero-title-line-1 hero-anim" style={{ color: "var(--c-text)", display: "block", opacity: 0 }}>
              Your Inventory.
            </span>
            <span className="hero-title-line-2 hero-anim" style={{ color: "var(--c-accent)", display: "block", opacity: 0 }}>
              Predicted.
            </span>
          </h1>

          <p className="hero-subtitle hero-anim" style={{ fontSize: 18, color: "var(--c-text-dim)", lineHeight: 1.7, maxWidth: 480, opacity: 0, marginBottom: 0 }}>
            Upload your data. Answer 12 questions. Snackle&apos;s intelligence engine tells you exactly what to stock, what to clear, and where opportunity hides — before your competitors see it.
          </p>

          <div className="hero-cta-wrap hero-anim btn-row" style={{ display: "flex", gap: 16, marginTop: 40, flexWrap: "wrap", opacity: 0 }}>
            <Link href="/use" className="btn-primary">
              Start Forecasting Free →
            </Link>
            <a href="#how-it-works" className="btn-ghost">
              See How It Works
            </a>
          </div>

          <div className="hero-stats" style={{ display: "flex", gap: 48, marginTop: 60, flexWrap: "wrap" }}>
            {[
              { id: "stat-accuracy", init: "0%", label: "Forecast Accuracy" },
              { id: "stat-sim", init: "0K+", label: "Simulations Per Product" },
              { id: "stat-abc", init: "0x", label: "ABC-XYZ Matrix Cells" },
              { id: "stat-time", init: "0min", label: "Full Analysis Time" },
            ].map((s) => (
              <div key={s.id} className="hero-stat hero-anim" style={{ textAlign: "center", opacity: 0 }}>
                <div
                  id={s.id}
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: "clamp(36px, 5vw, 56px)",
                    fontWeight: 800,
                    color: "var(--c-accent)",
                    letterSpacing: "-0.03em",
                    lineHeight: 1,
                  }}
                >
                  {s.init}
                </div>
                <div style={{ fontSize: 11, color: "var(--c-text-dim)", letterSpacing: "0.1em", textTransform: "uppercase", marginTop: 8 }}>
                  {s.label}
                </div>
              </div>
            ))}
          </div>
            </div>

            <div className="hero-creature-wrap">
              <IntelligenceCreature />
            </div>
          </div>
        </div>
      </section>

      {/* Problem */}
      <section className="reveal-section" style={{ padding: "80px 0", position: "relative", zIndex: 1 }}>
        <div className="section-wrap reveal-card">
          <p className="section-label anim-child">The Indian Inventory Problem</p>
          <h2 className="section-title anim-child" style={{ maxWidth: 600, marginBottom: 60 }}>
            The crisis nobody
            <br />
            talks about.
          </h2>
          <div className="grid-3">
            {[
              {
                number: "₹8,000 Cr",
                label: "Lost annually by Indian D2C brands to poor inventory decisions",
                sub: "That's your competitor's advantage. And yours, if you act first.",
                urgent: true,
              },
              {
                number: "43%",
                label: "of FMCG brands have dead stock older than 90 days",
                sub: "Capital locked in products that stopped moving. Freed by Snackle.",
                urgent: false,
              },
              {
                number: "12%",
                label: "of brands forecast demand with any real algorithm",
                sub: "Everyone else is guessing. Snackle 1.0 changes that equation.",
                urgent: false,
              },
            ].map((card) => (
              <div
                key={card.number}
                className="glass anim-child"
                style={{
                  padding: "36px 32px",
                  borderColor: card.urgent ? "var(--c-accent-border)" : undefined,
                  background: card.urgent ? "var(--c-accent-dim)" : undefined,
                }}
              >
                <div style={{ fontFamily: "var(--font-display)", fontSize: "clamp(36px, 4vw, 52px)", fontWeight: 800, color: "var(--c-accent)", letterSpacing: "-0.03em", lineHeight: 1, marginBottom: 16 }}>
                  {card.number}
                </div>
                <p style={{ fontSize: 15, color: "var(--c-text)", lineHeight: 1.55, fontWeight: 500, marginBottom: 12 }}>{card.label}</p>
                <p style={{ fontSize: 13, color: "var(--c-text-dim)", lineHeight: 1.6 }}>{card.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="reveal-section" style={{ padding: "80px 0", position: "relative", zIndex: 1 }}>
        <div className="section-wrap reveal-card">
          <p className="section-label anim-child">How It Works</p>
          <h2 className="section-title anim-child" style={{ marginBottom: 16 }}>Three steps. One decision.</h2>
          <p className="section-subtitle anim-child">No data science degree required.</p>
          <div className="steps-grid">
            {STEPS.map((s) => (
              <div key={s.step} className="glass anim-child" style={{ padding: "40px 32px" }}>
                <div style={{ fontFamily: "var(--font-display)", fontSize: 64, fontWeight: 800, color: "rgba(252,163,17,0.08)", lineHeight: 1, marginBottom: 24 }}>
                  {s.step}
                </div>
                <div style={{ marginBottom: 20 }}>{s.icon}</div>
                <h3 style={{ fontFamily: "var(--font-display)", fontSize: 20, fontWeight: 700, color: "var(--c-text)", marginBottom: 12 }}>{s.title}</h3>
                <p style={{ fontSize: 15, color: "var(--c-text-dim)", lineHeight: 1.65 }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Algorithms */}
      <section className="reveal-section" style={{ padding: "80px 0", position: "relative", zIndex: 1 }}>
        <div className="section-wrap reveal-card">
          <p className="section-label anim-child">The Engine</p>
          <h2 className="section-title anim-child">9 algorithms. One intelligence.</h2>
          <p className="section-subtitle anim-child">The same methods used by Amazon and SAP — now for Indian D2C brands.</p>
          <div className="algo-grid">
            {ALGORITHMS.map((algo) => (
              <div key={algo.name} className="glass anim-child" style={{ padding: "28px 24px" }}>
                <div style={{ fontSize: 28, color: "var(--c-accent)", marginBottom: 12 }}>{algo.icon}</div>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--c-text-muted)", marginBottom: 8 }}>
                  {algo.tag}
                </div>
                <h4 style={{ fontFamily: "var(--font-display)", fontSize: 16, fontWeight: 700, marginBottom: 8, color: "var(--c-accent)" }}>{algo.name}</h4>
                <p style={{ fontSize: 13, color: "var(--c-text-dim)", lineHeight: 1.5 }}>{algo.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Demo cards */}
      <section className="reveal-section" style={{ padding: "80px 0", position: "relative", zIndex: 1 }}>
        <div className="section-wrap reveal-card">
          <p className="section-label anim-child">The Intelligence Report</p>
          <h2 className="section-title anim-child">Exactly what you&apos;ll receive.</h2>
          <p className="section-subtitle anim-child">Every product in your portfolio gets a card like this.</p>
          <div className="demo-cards-grid">
            {DEMO_CARDS.map((card) => (
              <div key={card.name} className="glass anim-child" style={{ padding: 28, borderLeft: `4px solid ${card.statusColor}` }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: card.statusColor, letterSpacing: "0.08em", marginBottom: 12 }}>{card.status}</div>
                <h4 style={{ fontFamily: "var(--font-display)", fontSize: 18, fontWeight: 700, marginBottom: 4 }}>{card.name}</h4>
                <p style={{ fontSize: 14, color: "var(--c-text-dim)", marginBottom: 16 }}>{card.price}</p>
                <p style={{ fontSize: 14, color: "var(--c-text-dim)", lineHeight: 1.65, marginBottom: 20 }}>{card.summary}</p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
                  {card.actions.map((a) => (
                    <span key={a} style={{ fontSize: 11, padding: "4px 10px", borderRadius: 999, background: "var(--c-accent-dim)", border: "1px solid var(--c-accent-border)", color: "var(--c-accent)" }}>
                      {a}
                    </span>
                  ))}
                </div>
                <div style={{ fontSize: 13, fontWeight: 700, color: card.metricColor }}>{card.metric}</div>
              </div>
            ))}
          </div>
          <div style={{ textAlign: "center" }}>
            <Link href="/use" className="btn-primary anim-child">
              Get my intelligence report →
            </Link>
          </div>
        </div>
      </section>

      {/* Console preview */}
      <section className="reveal-section" style={{ padding: "80px 0", position: "relative", zIndex: 1 }}>
        <div className="section-wrap reveal-card">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 48, alignItems: "center" }}>
            <div className="glass anim-child" style={{ padding: 32, minHeight: 320 }}>
              <div style={{ fontFamily: "var(--font-display)", fontSize: 11, color: "var(--c-accent)", marginBottom: 16, letterSpacing: "0.1em" }}>SNACKLE CONSOLE</div>
              <div style={{ background: "rgba(0,0,0,0.4)", borderRadius: 12, padding: 16, marginBottom: 12, fontSize: 13, borderLeft: "3px solid var(--c-accent)" }}>
                Question 3 of 12 — Where do you primarily sell?
              </div>
              <div style={{ background: "var(--c-accent-dim)", borderRadius: 12, padding: 16, fontSize: 13, textAlign: "right" }}>
                Amazon India + Own Website
              </div>
            </div>
            <div className="anim-child">
              <h2 className="section-title">The Snackle Console</h2>
              <p className="section-subtitle">Meet the most intelligent inventory interface ever built.</p>
              <p style={{ fontSize: 15, color: "var(--c-text-dim)", lineHeight: 1.7, marginBottom: 32 }}>
                Powered by Snackle 1.0 — our first model. Version 4 changes everything.
              </p>
              <Link href="/use" className="btn-primary">Enter the Console →</Link>
            </div>
          </div>
        </div>
      </section>

      {/* Guide */}
      <section className="reveal-section" style={{ padding: "80px 0", position: "relative", zIndex: 1 }}>
        <div className="section-wrap">
          <h2 className="section-title anim-child reveal-card" style={{ textAlign: "center", marginBottom: 64 }}>
            From data to decisions in under 5 minutes
          </h2>
          {[
            { title: "Drop your data, any format", body: "Export from Amazon Seller Central, Flipkart, Meesho, Shopify, or your own spreadsheet. Snackle reads CSV and Excel with automatic column mapping.", reverse: false },
            { title: "Snackle interviews your brand", body: "12 questions. One at a time. Answer in English or your regional language — Hindi, Gujarati, Tamil, Telugu, and more.", reverse: true },
            { title: "Deep analysis runs in the background", body: "Snackle 1.0 simulates 10,000 demand scenarios, runs 9 inventory algorithms, and classifies every SKU.", reverse: false },
            { title: "One decision per product. Crystal clear.", body: "Critical alerts. Dead stock clearance prices. Opportunity windows. Reorder quantities with exact costs.", reverse: true },
          ].map((block) => (
            <div key={block.title} className={`guide-block reveal-card ${block.reverse ? "guide-block--reverse" : ""}`}>
              <div className="guide-visual glass anim-child">
                <IntelligenceCreature size={180} />
              </div>
              <div className="guide-text anim-child">
                <h3 style={{ fontFamily: "var(--font-display)", fontSize: 28, fontWeight: 700, marginBottom: 16 }}>{block.title}</h3>
                <p style={{ fontSize: 16, color: "var(--c-text-dim)", lineHeight: 1.7 }}>{block.body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <Footer />
    </>
  );
}
