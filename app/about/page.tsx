"use client";

import Link from "next/link";
import { Footer } from "@/components/layout/Footer";
import { Section } from "@/components/layout/Section";
import { useSiteAnimations } from "@/lib/animation/useSiteAnimations";

export default function AboutPage() {
  useSiteAnimations();

  return (
    <>
      <section
        className="reveal-section"
        style={{ position: "relative", zIndex: 1, paddingTop: 120, paddingBottom: 80 }}
      >
        <div className="section-wrap reveal-card">
          <p className="section-label anim-child">About Snackle</p>
          <h1 className="section-title anim-child" style={{ maxWidth: 800 }}>
            Built for the brand builder who can&apos;t afford to guess.
          </h1>
        </div>
      </section>

      <Section className="reveal-section">
        <div className="reveal-card">
          <p className="anim-child" style={{ fontSize: "clamp(20px, 3vw, 28px)", lineHeight: 1.6, maxWidth: 800, margin: "0 auto 48px", textAlign: "center", fontWeight: 300, color: "var(--c-text-dim)" }}>
            Indian D2C brands collectively lose ₹8,000 crore annually to poor inventory decisions. Not because they&apos;re bad at business. Because they never had access to the right tools.
          </p>
          <div className="grid-3">
            {[
              { stat: "₹8K Cr", label: "Lost annually", sub: "To stockouts, overstock, and dead inventory" },
              { stat: "43%", label: "Have dead stock", sub: "Inventory older than 90 days without a plan" },
              { stat: "12%", label: "Use forecasting", sub: "Most brands still guess on reorders" },
            ].map((item) => (
              <div key={item.label} className="glass anim-child" style={{ textAlign: "center", padding: 32 }}>
                <div className="big-number anim-child" style={{ fontSize: 48, marginBottom: 8 }}>{item.stat}</div>
                <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>{item.label}</div>
                <p style={{ fontSize: 13, color: "var(--c-text-dim)" }}>{item.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </Section>

      <Section className="reveal-section">
        <div className="reveal-card">
          <span className="section-label anim-child">The Indian Inventory Problem</span>
          <h2 className="section-title anim-child">Guesswork is expensive.</h2>
          <p className="anim-child" style={{ fontSize: 17, color: "var(--c-text-dim)", lineHeight: 1.8, maxWidth: 720, marginBottom: 32 }}>
            In FY2024, Indian D2C brands collectively lost an estimated ₹8,000 crore to stockouts, overstocking, and dead inventory. Founders make reorder decisions from gut feel, spreadsheet formulas, and WhatsApp messages from suppliers — not from Monte Carlo simulations or demand forecasts.
          </p>
          <blockquote className="glass anim-child" style={{ borderLeft: "3px solid var(--c-accent)", padding: "24px 32px", fontStyle: "italic", color: "var(--c-accent)", fontSize: 20, maxWidth: 640 }}>
            &ldquo;The math was always there. Indian founders just never had access to it.&rdquo;
          </blockquote>
        </div>
      </Section>

      <Section className="reveal-section">
        <div className="reveal-card">
          <h2 className="section-title anim-child" style={{ textAlign: "center", marginBottom: 48 }}>How Snackle is Different</h2>
          <div className="comparison-scroll">
          <div className="grid-3" style={{ minWidth: 600 }}>
            {[
              { col: "Spreadsheets", items: ["No algorithms", "Manual update", "Guesswork", "₹0 insight"] },
              { col: "Other Tools", items: ["Basic stats", "Auto import", "Reports only", "Limited insight"] },
              { col: "Snackle 1.0", items: ["9 enterprise algorithms", "AI-processed", "Decisions per SKU", "Exact action + cost"], highlight: true },
            ].map((col) => (
              <div
                key={col.col}
                className="glass anim-child"
                style={{
                  padding: 28,
                  borderColor: col.highlight ? "var(--c-accent-border)" : undefined,
                  background: col.highlight ? "var(--c-accent-dim)" : undefined,
                }}
              >
                <h3 style={{ fontFamily: "var(--font-display)", fontSize: 18, fontWeight: 700, marginBottom: 16, color: col.highlight ? "var(--c-accent)" : "var(--c-text)" }}>
                  {col.col}
                </h3>
                <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                  {col.items.map((item) => (
                    <li key={item} style={{ fontSize: 14, color: "var(--c-text-dim)", padding: "10px 0", borderBottom: "1px solid var(--c-card-border)" }}>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          </div>
        </div>
      </Section>

      <Section className="reveal-section">
        <div className="reveal-card" style={{ textAlign: "center", maxWidth: 640, margin: "0 auto" }}>
          <span className="section-label anim-child">Accuracy that matters</span>
          <div className="big-number anim-child" style={{ fontSize: "clamp(72px, 10vw, 120px)", marginBottom: 24 }}>94%</div>
          <p className="anim-child" style={{ fontSize: 17, color: "var(--c-text-dim)", lineHeight: 1.8 }}>
            For a brand carrying ₹10L in inventory, 94% forecast accuracy means knowing your reorder window within days — not weeks. That&apos;s the difference between capturing a demand spike and watching a competitor take your customers.
          </p>
        </div>
      </Section>

      <Section className="reveal-section">
        <div className="reveal-card" style={{ maxWidth: 720, margin: "0 auto", textAlign: "center" }}>
          <h2 className="section-title anim-child">Our mission</h2>
          <p className="anim-child" style={{ fontSize: 18, color: "var(--c-text-dim)", lineHeight: 1.8 }}>
            We built Snackle to give every Indian brand founder access to the same inventory intelligence that global brands like H&amp;M and Amazon use internally — powered by Snackle 1.0.
          </p>
        </div>
      </Section>

      <Section className="reveal-section">
        <div className="reveal-card">
          <h2 className="section-title anim-child" style={{ textAlign: "center", marginBottom: 48 }}>Our commitment</h2>
          <div className="grid-3">
            {[
              { title: "Real Algorithms", desc: "9 academic-grade inventory models. No black-box guesses." },
              { title: "Your Data, Private", desc: "Never sold, never shared. Your sales history stays yours." },
              { title: "Accuracy First", desc: "If we can't be confident, Snackle 1.0 says so clearly." },
            ].map((card) => (
              <div key={card.title} className="glass anim-child" style={{ padding: 28 }}>
                <h3 style={{ fontFamily: "var(--font-display)", fontSize: 20, fontWeight: 700, marginBottom: 12, color: "var(--c-accent)" }}>{card.title}</h3>
                <p style={{ fontSize: 14, color: "var(--c-text-dim)", lineHeight: 1.6 }}>{card.desc}</p>
              </div>
            ))}
          </div>
          <div style={{ textAlign: "center", marginTop: 48 }}>
            <Link href="/use" className="btn-primary anim-child">Try Snackle 1.0 free →</Link>
          </div>
        </div>
      </Section>

      <Footer />
    </>
  );
}
