"use client";

import Link from "next/link";
import { Navigation } from "@/components/layout/Navigation";
import { Footer } from "@/components/layout/Footer";
import { Section } from "@/components/layout/Section";
import { ScrollReveal } from "@/lib/animation/ScrollReveal";

export default function AboutPage() {
  return (
    <>
      <Navigation />

      <section
        style={{
          position: "relative",
          zIndex: 1,
          paddingTop: 120,
          paddingBottom: 80,
          textAlign: "center",
        }}
      >
        <div className="container">
          <ScrollReveal direction="up">
            <p className="section-label">About Snackle</p>
            <h1 className="section-title" style={{ maxWidth: 800, margin: "0 auto" }}>
              Built for the brand builder who can&apos;t afford to guess.
            </h1>
          </ScrollReveal>
        </div>
      </section>

      <Section dark={false} style={{ background: "rgba(20,33,61,0.85)", position: "relative", zIndex: 1 }}>
        <ScrollReveal direction="up">
          <p style={{ fontSize: "clamp(20px, 3vw, 28px)", lineHeight: 1.6, maxWidth: 800, margin: "0 auto 48px", textAlign: "center", fontWeight: 300 }}>
            Indian D2C brands collectively lose ₹8,000 crore annually to poor inventory decisions. Not because they&apos;re bad at business. Because they never had access to the right tools.
          </p>
        </ScrollReveal>
        <ScrollReveal direction="up" stagger staggerDelay={100}>
          <div className="problem-grid">
            {[
              { stat: "₹8K Cr", label: "Lost annually" },
              { stat: "43%", label: "Have dead stock" },
              { stat: "12%", label: "Use forecasting" },
            ].map((item) => (
              <div key={item.label} className="card" style={{ textAlign: "center" }}>
                <div className="big-number" style={{ fontSize: 48, marginBottom: 8 }}>{item.stat}</div>
                <div style={{ fontSize: 14, color: "var(--light)", opacity: 0.7 }}>{item.label}</div>
              </div>
            ))}
          </div>
        </ScrollReveal>
      </Section>

      <Section dark style={{ position: "relative", zIndex: 1 }}>
        <ScrollReveal direction="up">
          <span className="section-label">The Indian Inventory Problem</span>
          <h2 className="section-title">Guesswork is expensive.</h2>
          <p style={{ fontSize: 17, color: "var(--light)", opacity: 0.8, lineHeight: 1.8, maxWidth: 720, marginBottom: 32 }}>
            In FY2024, Indian D2C brands collectively lost an estimated ₹8,000 crore to stockouts, overstocking, and dead inventory. Founders make reorder decisions from gut feel, spreadsheet formulas, and WhatsApp messages from suppliers — not from Monte Carlo simulations or demand forecasts.
          </p>
          <blockquote style={{ borderLeft: "3px solid var(--amber)", paddingLeft: 24, fontStyle: "italic", color: "var(--amber)", fontSize: 20, maxWidth: 600 }}>
            &ldquo;The math was always there. Indian founders just never had access to it.&rdquo;
          </blockquote>
        </ScrollReveal>
      </Section>

      <Section dark={false} style={{ background: "rgba(20,33,61,0.85)", position: "relative", zIndex: 1 }}>
        <ScrollReveal direction="up">
          <h2 className="section-title" style={{ textAlign: "center" }}>How Snackle is Different</h2>
        </ScrollReveal>
        <ScrollReveal direction="up" stagger staggerDelay={80}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16, marginTop: 32 }}>
            {[
              { col: "Spreadsheets", items: ["No algorithms", "Manual update", "Guesswork", "₹0 insight"] },
              { col: "Other Tools", items: ["Basic stats", "Auto import", "Reports only", "Limited insight"] },
              { col: "Snackle 1.0", items: ["9 enterprise algorithms", "AI-processed", "Decisions per SKU", "Exact action + cost"], highlight: true },
            ].map((col) => (
              <div
                key={col.col}
                className="card"
                style={{
                  borderColor: col.highlight ? "rgba(252,163,17,0.35)" : undefined,
                  background: col.highlight ? "rgba(252,163,17,0.06)" : undefined,
                }}
              >
                <h3 style={{ fontFamily: "var(--font-display)", fontSize: 18, fontWeight: 700, marginBottom: 16, color: col.highlight ? "var(--amber)" : "var(--white)" }}>
                  {col.col}
                </h3>
                <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                  {col.items.map((item) => (
                    <li key={item} style={{ fontSize: 14, color: "var(--light)", opacity: 0.75, padding: "8px 0", borderBottom: "1px solid rgba(229,229,229,0.06)" }}>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </ScrollReveal>
      </Section>

      <Section dark style={{ position: "relative", zIndex: 1 }}>
        <ScrollReveal direction="up">
          <div style={{ textAlign: "center", maxWidth: 640, margin: "0 auto" }}>
            <span className="section-label">Accuracy that matters</span>
            <div className="big-number" style={{ fontSize: "clamp(72px, 10vw, 120px)", marginBottom: 24 }}>94%</div>
            <p style={{ fontSize: 17, color: "var(--light)", opacity: 0.8, lineHeight: 1.8 }}>
              For a brand carrying ₹10L in inventory, 94% forecast accuracy means knowing your reorder window within days — not weeks. That&apos;s the difference between capturing a demand spike and watching a competitor take your customers.
            </p>
          </div>
        </ScrollReveal>
      </Section>

      <Section dark style={{ position: "relative", zIndex: 1 }}>
        <ScrollReveal direction="up">
          <div style={{ maxWidth: 720, margin: "0 auto", textAlign: "center" }}>
            <h2 className="section-title">Our mission</h2>
            <p style={{ fontSize: 18, color: "var(--light)", lineHeight: 1.8, opacity: 0.85 }}>
              We built Snackle to give every Indian brand founder access to the same inventory intelligence that global brands like H&amp;M and Amazon use internally — powered by Snackle 1.0.
            </p>
          </div>
        </ScrollReveal>
      </Section>

      <Section dark={false} style={{ background: "rgba(20,33,61,0.85)", position: "relative", zIndex: 1 }}>
        <ScrollReveal direction="up">
          <h2 className="section-title" style={{ textAlign: "center", marginBottom: 48 }}>Our commitment</h2>
        </ScrollReveal>
        <ScrollReveal direction="up" stagger staggerDelay={100}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 24 }}>
            {[
              { title: "Real Algorithms", desc: "9 academic-grade inventory models. No black-box guesses." },
              { title: "Your Data, Private", desc: "Never sold, never shared. Your sales history stays yours." },
              { title: "Accuracy First", desc: "If we can't be confident, Snackle 1.0 says so clearly." },
            ].map((card) => (
              <div key={card.title} className="card">
                <h3 style={{ fontFamily: "var(--font-display)", fontSize: 20, fontWeight: 700, marginBottom: 12, color: "var(--amber)" }}>{card.title}</h3>
                <p style={{ fontSize: 14, color: "var(--light)", opacity: 0.75, lineHeight: 1.6 }}>{card.desc}</p>
              </div>
            ))}
          </div>
        </ScrollReveal>
        <ScrollReveal direction="up">
          <div style={{ textAlign: "center", marginTop: 48 }}>
            <Link href="/use" className="btn-primary">Try Snackle 1.0 free →</Link>
          </div>
        </ScrollReveal>
      </Section>

      <Footer />
    </>
  );
}
