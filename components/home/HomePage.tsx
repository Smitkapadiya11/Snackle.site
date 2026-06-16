"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Navigation } from "@/components/layout/Navigation";
import { Footer } from "@/components/layout/Footer";
import { Section } from "@/components/layout/Section";
import { IntelligenceCreature } from "@/components/art/IntelligenceCreature";
import { ScrollReveal } from "@/lib/animation/ScrollReveal";
import { IconUpload, IconChat, IconBrain } from "@/components/icons/StepIcons";
import { prefersReducedMotion } from "@/lib/animation/useAnime";

const ALGORITHMS = [
  { name: "Monte Carlo Simulation", desc: "10,000 demand paths per product" },
  { name: "Holt-Winters Forecast", desc: "Trend + seasonality, ensemble weighted" },
  { name: "Statistical Safety Stock", desc: "Lead time variability accounted for" },
  { name: "EOQ Optimization", desc: "Mathematically optimal order quantity" },
  { name: "ABC-XYZ Matrix", desc: "9-cell classification, 9 strategies" },
  { name: "Isolation Forest", desc: "ML anomaly detection on your sales" },
  { name: "CUSUM Change Detection", desc: "Catches when demand sustainably shifts" },
  { name: "Markdown Optimization", desc: "Price elasticity-based clearance pricing" },
  { name: "GMROI Analysis", desc: "Is your inventory working hard enough?" },
];

const STEPS = [
  { Icon: IconUpload, title: "Upload Your Data", desc: "Drop your CSV or Excel — sales history, current stock, prices. We accept any format and help you map the columns." },
  { Icon: IconChat, title: "Answer 12 Questions", desc: "Snackle asks the smart questions: lead times, safety stock targets, channel mix, seasonality. One question at a time." },
  { Icon: IconBrain, title: "Receive Intelligence", desc: "Snackle 1.0 runs 9 professional algorithms and presents one perfect decision per product." },
];

const DEMO_CARDS = [
  { status: "CRITICAL", color: "#ef4444", name: "Face Serum Premium", price: "₹899", action: "Reorder 340 units · Stockout in 5 days" },
  { status: "DEAD STOCK", color: "#eab308", name: "Moisturiser 50ml", price: "₹349", action: "Clear at 35% off · ₹12K capital locked" },
  { status: "OPPORTUNITY", color: "#22c55e", name: "Vitamin C Toner", price: "₹599", action: "Scale ads · Competitor gap detected" },
];

export default function HomePage() {
  useEffect(() => {
    if (prefersReducedMotion()) return;

    import("animejs").then(({ animate, stagger, createTimeline }) => {
      const tl = createTimeline();
      tl.add(".nav-item", { opacity: [0, 1], translateY: [-20, 0], delay: stagger(60), duration: 600 }, 0);
      tl.add(".hero-badge", { opacity: [0, 1], scale: [0.8, 1], duration: 500 }, 200);
      tl.add(".hero-line-1", { opacity: [0, 1], translateY: [40, 0], duration: 700, easing: "easeOutExpo" }, 350);
      tl.add(".hero-line-2", { opacity: [0, 1], translateY: [40, 0], duration: 700, easing: "easeOutExpo" }, 500);
      tl.add(".hero-subtitle", { opacity: [0, 1], translateY: [20, 0], duration: 600 }, 650);
      tl.add(".hero-cta", { opacity: [0, 1], translateY: [20, 0], duration: 600 }, 800);
      animate(".pulse-dot", { scale: [1, 1.5, 1], opacity: [1, 0.6, 1], duration: 2000, loop: true, easing: "easeInOutSine" });
    });

    const counters = [
      { selector: ".counter-accuracy", target: 94, suffix: "%" },
      { selector: ".counter-sim", target: 10, suffix: "K+" },
      { selector: ".counter-abc", target: 9, suffix: "x" },
      { selector: ".counter-time", target: 5, suffix: "min" },
    ];

    const statsEl = document.querySelector(".hero-stats");
    if (!statsEl) return;

    const obs = new IntersectionObserver(
      async ([entry]) => {
        if (!entry.isIntersecting) return;
        obs.disconnect();
        const { animate } = await import("animejs");
        counters.forEach(({ selector, target, suffix }) => {
          const el = document.querySelector(selector);
          if (!el) return;
          const obj = { val: 0 };
          animate(obj, {
            val: target,
            duration: 2000,
            delay: 300,
            easing: "easeOutExpo",
            update: () => {
              el.textContent = `${Math.round(obj.val)}${suffix}`;
            },
          });
        });
      },
      { threshold: 0.3 },
    );
    obs.observe(statsEl);
    return () => obs.disconnect();
  }, []);

  return (
    <>
      <Navigation />

      {/* Hero — split layout */}
      <section
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          padding: "120px clamp(24px, 5vw, 80px) 80px",
          gap: 60,
          position: "relative",
          zIndex: 1,
          flexWrap: "wrap",
        }}
      >
        <div style={{ flex: "1 1 400px", maxWidth: 600 }}>
          <div
            className="hero-badge nav-item"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              background: "rgba(252,163,17,0.12)",
              border: "1px solid rgba(252,163,17,0.3)",
              borderRadius: "var(--r-full)",
              padding: "6px 16px",
              marginBottom: 24,
              opacity: 0,
            }}
          >
            <span className="pulse-dot" style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--amber)", display: "inline-block" }} />
            <span style={{ fontSize: 12, color: "var(--amber)", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase" }}>
              Snackle 1.0 — Now Live
            </span>
          </div>

          <h1
            className="hero-title"
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(52px, 5.5vw, 88px)",
              fontWeight: 800,
              lineHeight: 1.05,
              letterSpacing: "-0.035em",
              marginBottom: 28,
            }}
          >
            <span className="hero-line-1" style={{ color: "var(--white)", display: "block", opacity: 0 }}>
              Your Inventory.
            </span>
            <span className="hero-line-2" style={{ color: "var(--amber)", display: "block", opacity: 0 }}>
              Predicted.
            </span>
          </h1>

          <p
            className="hero-subtitle"
            style={{
              fontSize: 18,
              color: "var(--light)",
              lineHeight: 1.7,
              maxWidth: 480,
              opacity: 0,
              marginBottom: 0,
            }}
          >
            Upload your data. Answer 12 questions. Snackle&apos;s intelligence engine tells you exactly what to stock, what to clear, and where opportunity hides — before your competitors see it.
          </p>

          <div className="hero-cta" style={{ display: "flex", gap: 16, marginTop: 40, flexWrap: "wrap", opacity: 0 }}>
            <Link href="/use" className="btn-primary">
              Start Forecasting Free →
            </Link>
            <a href="#how-it-works" className="btn-outline">
              See How It Works
            </a>
          </div>

          <div className="hero-stats" style={{ display: "flex", gap: 40, marginTop: 60, flexWrap: "wrap" }}>
            {[
              { label: "Forecast Accuracy", cls: "counter-accuracy", start: "0%" },
              { label: "Simulations Per Product", cls: "counter-sim", start: "0K+" },
              { label: "ABC-XYZ Matrix Cells", cls: "counter-abc", start: "0x" },
              { label: "Full Analysis Time", cls: "counter-time", start: "0min" },
            ].map((s) => (
              <div key={s.cls} style={{ textAlign: "center" }}>
                <div style={{ fontFamily: "var(--font-display)", fontSize: 36, fontWeight: 700, color: "var(--amber)", letterSpacing: "-0.02em", lineHeight: 1 }}>
                  <span className={s.cls}>{s.start}</span>
                </div>
                <div style={{ fontSize: 12, color: "var(--light)", opacity: 0.5, letterSpacing: "0.08em", textTransform: "uppercase", marginTop: 4 }}>
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ flex: "1 1 360px", display: "flex", alignItems: "center", justifyContent: "center", minWidth: 320 }}>
          <IntelligenceCreature width={500} height={500} />
        </div>
      </section>

      {/* Problem */}
      <Section dark={false} style={{ background: "rgba(20,33,61,0.85)", position: "relative", zIndex: 1 }}>
        <ScrollReveal direction="up">
          <h2 className="section-title" style={{ textAlign: "center" }}>The inventory crisis nobody talks about</h2>
        </ScrollReveal>
        <ScrollReveal direction="up" stagger staggerDelay={100}>
          <div className="problem-grid">
            {[
              { stat: "₹2.3L", label: "Lost per stockout event", desc: "Average Indian D2C brand — every empty shelf is revenue walking out the door." },
              { stat: "43%", label: "Brands with dead stock", desc: "FMCG brands holding inventory exceeding 90 days without a clearance plan." },
              { stat: "12%", label: "Use real forecasting", desc: "Most brands guess. Snackle 1.0 runs the math Fortune 500 companies pay millions for." },
            ].map((item) => (
              <div key={item.label} className="card">
                <div className="big-number" style={{ fontSize: 48, marginBottom: 12 }}>{item.stat}</div>
                <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>{item.label}</div>
                <p style={{ fontSize: 14, color: "var(--light)", opacity: 0.7, lineHeight: 1.6 }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </ScrollReveal>
      </Section>

      {/* How it works */}
      <Section id="how-it-works" dark style={{ position: "relative", zIndex: 1 }}>
        <ScrollReveal direction="up">
          <h2 className="section-title" style={{ textAlign: "center" }}>Three steps. One decision.</h2>
          <p className="section-subtitle" style={{ margin: "0 auto", textAlign: "center" }}>No data science degree required.</p>
        </ScrollReveal>
        <ScrollReveal direction="up" stagger staggerDelay={120}>
          <div className="steps-row">
            {STEPS.map((step) => (
              <div key={step.title} className="card" style={{ textAlign: "center" }}>
                <div style={{ display: "flex", justifyContent: "center", marginBottom: 20 }}>
                  <step.Icon />
                </div>
                <h3 style={{ fontFamily: "var(--font-display)", fontSize: 20, fontWeight: 700, marginBottom: 12 }}>{step.title}</h3>
                <p style={{ fontSize: 14, color: "var(--light)", opacity: 0.75, lineHeight: 1.6 }}>{step.desc}</p>
              </div>
            ))}
          </div>
        </ScrollReveal>
      </Section>

      {/* Algorithms */}
      <Section dark style={{ position: "relative", zIndex: 1 }}>
        <ScrollReveal direction="up">
          <h2 className="section-title" style={{ textAlign: "center" }}>9 algorithms. One intelligence.</h2>
          <p className="section-subtitle" style={{ margin: "0 auto", textAlign: "center" }}>
            The same methods used by Amazon and SAP — now for Indian D2C brands.
          </p>
        </ScrollReveal>
        <ScrollReveal direction="up" stagger staggerDelay={80}>
          <div className="algo-grid">
            {ALGORITHMS.map((algo) => (
              <div key={algo.name} className="algo-card">
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--amber)", marginBottom: 16 }} />
                <h4 style={{ fontFamily: "var(--font-display)", fontSize: 16, fontWeight: 700, marginBottom: 8, color: "var(--amber)" }}>{algo.name}</h4>
                <p style={{ fontSize: 13, color: "var(--light)", opacity: 0.7 }}>{algo.desc}</p>
              </div>
            ))}
          </div>
        </ScrollReveal>
      </Section>

      {/* Intelligence Report preview */}
      <Section dark={false} style={{ background: "rgba(20,33,61,0.85)", position: "relative", zIndex: 1 }}>
        <ScrollReveal direction="up">
          <span className="section-label">The Intelligence Report</span>
          <h2 className="section-title">Exactly what you&apos;ll receive.</h2>
          <p className="section-subtitle">Every product in your portfolio gets a card like this.</p>
        </ScrollReveal>
        <ScrollReveal direction="up" stagger staggerDelay={100}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 20, marginBottom: 40 }}>
            {DEMO_CARDS.map((card) => (
              <div
                key={card.name}
                className="card"
                style={{ borderLeft: `4px solid ${card.color}`, background: `${card.color}08` }}
              >
                <div style={{ fontSize: 11, fontWeight: 700, color: card.color, letterSpacing: "0.08em", marginBottom: 12 }}>{card.status}</div>
                <h4 style={{ fontFamily: "var(--font-display)", fontSize: 18, fontWeight: 700, marginBottom: 4 }}>{card.name}</h4>
                <p style={{ fontSize: 14, color: "var(--light)", opacity: 0.6, marginBottom: 16 }}>{card.price}</p>
                <p style={{ fontSize: 13, color: "var(--light)", opacity: 0.85 }}>{card.action}</p>
              </div>
            ))}
          </div>
        </ScrollReveal>
        <ScrollReveal direction="up">
          <div style={{ textAlign: "center" }}>
            <Link href="/use" className="btn-primary">Get my intelligence report →</Link>
          </div>
        </ScrollReveal>
      </Section>

      {/* Console preview */}
      <Section dark style={{ position: "relative", zIndex: 1 }}>
        <ScrollReveal direction="up">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 48, alignItems: "center" }}>
            <div className="card" style={{ minHeight: 320 }}>
              <div style={{ fontFamily: "var(--font-display)", fontSize: 11, color: "var(--amber)", marginBottom: 16, letterSpacing: "0.1em" }}>SNACKLE CONSOLE</div>
              <div style={{ background: "rgba(0,0,0,0.4)", borderRadius: 12, padding: 16, marginBottom: 12, fontSize: 13, borderLeft: "3px solid var(--amber)" }}>
                Question 3 of 12 — Where do you primarily sell?
              </div>
              <div style={{ background: "rgba(252,163,17,0.1)", borderRadius: 12, padding: 16, fontSize: 13, textAlign: "right" }}>
                Amazon India + Own Website
              </div>
            </div>
            <div>
              <h2 className="section-title">The Snackle Console</h2>
              <p className="section-subtitle">Meet the most intelligent inventory interface ever built.</p>
              <p style={{ fontSize: 15, color: "var(--light)", opacity: 0.7, lineHeight: 1.7, marginBottom: 32 }}>
                Powered by Snackle 1.0 — our first model. Version 4 changes everything.
              </p>
              <Link href="/use" className="btn-primary">Enter the Console →</Link>
            </div>
          </div>
        </ScrollReveal>
      </Section>

      {/* Guide */}
      <Section dark style={{ position: "relative", zIndex: 1 }}>
        <ScrollReveal direction="up">
          <h2 className="section-title" style={{ textAlign: "center" }}>From data to decisions in under 5 minutes</h2>
        </ScrollReveal>
        {[
          { title: "Drop your data, any format", body: "Export from Amazon Seller Central, Flipkart, Meesho, Shopify, or your own spreadsheet. Snackle reads CSV and Excel with automatic column mapping.", reverse: false },
          { title: "Snackle interviews your brand", body: "12 questions. One at a time. Answer in English or your regional language — Hindi, Gujarati, Tamil, Telugu, and more.", reverse: true },
          { title: "Deep analysis runs in the background", body: "Snackle 1.0 simulates 10,000 demand scenarios, runs 9 inventory algorithms, and classifies every SKU.", reverse: false },
          { title: "One decision per product. Crystal clear.", body: "Critical alerts. Dead stock clearance prices. Opportunity windows. Reorder quantities with exact costs.", reverse: true },
        ].map((block) => (
          <ScrollReveal key={block.title} direction={block.reverse ? "right" : "left"}>
            <div className={`guide-block ${block.reverse ? "guide-block--reverse" : ""}`}>
              <div className="guide-visual">
                <div style={{ width: 64, height: 64, borderRadius: "50%", border: "2px solid rgba(252,163,17,0.3)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <div style={{ width: 24, height: 24, borderRadius: "50%", background: "var(--amber)", opacity: 0.6 }} />
                </div>
              </div>
              <div className="guide-text">
                <h3 style={{ fontFamily: "var(--font-display)", fontSize: 28, fontWeight: 700, marginBottom: 16 }}>{block.title}</h3>
                <p style={{ fontSize: 16, color: "var(--light)", opacity: 0.75, lineHeight: 1.7 }}>{block.body}</p>
              </div>
            </div>
          </ScrollReveal>
        ))}
      </Section>

      <Footer />
    </>
  );
}
