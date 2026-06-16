"use client";

import { Navigation } from "@/components/layout/Navigation";
import { Footer } from "@/components/layout/Footer";
import { ScrollReveal } from "@/lib/animation/ScrollReveal";

export default function CreatorPage() {
  return (
    <>
      <Navigation />

      <section style={{ padding: "140px clamp(24px, 5vw, 80px) 80px", maxWidth: 900, margin: "0 auto", position: "relative", zIndex: 1 }}>
        <ScrollReveal direction="up">
          <p style={{ fontSize: 12, color: "var(--amber)", letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: 20 }}>
            The Mind Behind Snackle
          </p>
        </ScrollReveal>

        <ScrollReveal direction="up" delay={100}>
          <h1
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(52px, 6vw, 88px)",
              fontWeight: 800,
              lineHeight: 1,
              letterSpacing: "-0.03em",
              marginBottom: 32,
            }}
          >
            Smit
            <br />
            <span style={{ color: "var(--amber)" }}>Kapadiya.</span>
          </h1>
        </ScrollReveal>

        <ScrollReveal direction="up" delay={200}>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 48 }}>
            {[
              { icon: "🎓", label: "CHARUSAT University", sub: "Charotar University of Science & Technology" },
              { icon: "📍", label: "Surat, Gujarat", sub: "India" },
              { icon: "🎂", label: "21 years old", sub: "Building the future" },
              { icon: "🇮🇳", label: "Made in India", sub: "By Indian, for India" },
            ].map((pill) => (
              <div
                key={pill.label}
                className="card"
                style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 18px" }}
              >
                <span style={{ fontSize: 18 }}>{pill.icon}</span>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{pill.label}</div>
                  <div style={{ fontSize: 11, color: "var(--light)", opacity: 0.5 }}>{pill.sub}</div>
                </div>
              </div>
            ))}
          </div>
        </ScrollReveal>
      </section>

      <section
        style={{
          background: "rgba(20,33,61,0.3)",
          padding: "80px clamp(24px, 5vw, 80px)",
          borderTop: "1px solid rgba(252,163,17,0.1)",
          borderBottom: "1px solid rgba(252,163,17,0.1)",
          position: "relative",
          zIndex: 1,
        }}
      >
        <ScrollReveal direction="up">
          <blockquote
            style={{
              maxWidth: 780,
              margin: "0 auto",
              fontFamily: "var(--font-display)",
              fontSize: "clamp(22px, 3vw, 36px)",
              fontWeight: 500,
              lineHeight: 1.5,
              letterSpacing: "-0.01em",
              borderLeft: "3px solid var(--amber)",
              paddingLeft: 32,
            }}
          >
            &ldquo;I&apos;m 21. I study at CHARUSAT in Gujarat. I built the tool I desperately needed when I saw Indian founders losing lakhs to guesswork. The math was always there — someone just had to make it beautiful.&rdquo;
            <footer style={{ marginTop: 16, fontSize: 14, color: "var(--amber)", fontWeight: 600 }}>
              — Smit Kapadiya, Founder, Snackle
            </footer>
          </blockquote>
        </ScrollReveal>
      </section>

      <section style={{ padding: "80px clamp(24px, 5vw, 80px)", maxWidth: 800, margin: "0 auto", position: "relative", zIndex: 1 }}>
        <ScrollReveal direction="up">
          <h2 className="section-title">Why I built this.</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            {[
              "Indian D2C brands are run by the most driven people I know. They work 18-hour days, build incredible products, and still lose ₹lakhs to bad inventory decisions — not because they're bad at business, but because they never had access to the right intelligence.",
              "I spent months studying algorithms that Fortune 500 companies pay crores for: Monte Carlo simulation, Holt-Winters forecasting, ABC-XYZ analysis, price elasticity modeling. Then I asked: why can't a brand in Surat run the same analysis?",
              "So I built Snackle. Version 1.0 has 9 real algorithms. It's the most advanced inventory intelligence available to any D2C brand at any price. And this is just the beginning — Snackle 4.0 will change everything about how Indian brands manage inventory.",
              "This startup is 100% made in India, by an Indian, for Indian founders. Every algorithm was written in Gujarat. Every design choice was made thinking about a founder in Surat who doesn't have time to waste.",
            ].map((para) => (
              <p key={para.slice(0, 40)} style={{ fontSize: 17, color: "var(--light)", opacity: 0.8, lineHeight: 1.8 }}>
                {para}
              </p>
            ))}
          </div>
        </ScrollReveal>
      </section>

      <section style={{ background: "rgba(20,33,61,0.2)", padding: "80px clamp(24px, 5vw, 80px)", borderTop: "1px solid rgba(229,229,229,0.06)", position: "relative", zIndex: 1 }}>
        <div style={{ maxWidth: 800, margin: "0 auto" }}>
          <ScrollReveal direction="up">
            <h2 className="section-title">Snackle 1.0 is the start.</h2>
            <p style={{ fontSize: 16, color: "var(--amber)", marginBottom: 32 }}>Version 4.0 changes everything.</p>
          </ScrollReveal>
          <ScrollReveal direction="up" stagger staggerDelay={100}>
            {[
              { v: "Snackle 1.0", status: "🟢 Live", desc: "9 algorithms. Monte Carlo. Holt-Winters. ABC-XYZ. The foundation.", active: true },
              { v: "Snackle 2.0", status: "🔵 Building", desc: "Real-time market data integration. Live competitor tracking.", active: false },
              { v: "Snackle 3.0", status: "⚪ Planned", desc: "Multi-brand portfolio management. Team collaboration.", active: false },
              { v: "Snackle 4.0", status: "⚡ The shift", desc: "New model architecture. Predicts demand before it exists.", active: false },
            ].map((item) => (
              <div
                key={item.v}
                style={{
                  display: "flex",
                  gap: 20,
                  padding: "20px 0",
                  borderBottom: "1px solid rgba(229,229,229,0.06)",
                }}
              >
                <div
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: 16,
                    fontWeight: 700,
                    color: item.active ? "var(--amber)" : "var(--light)",
                    opacity: item.active ? 1 : 0.5,
                    minWidth: 120,
                  }}
                >
                  {item.v}
                </div>
                <div style={{ flex: 1 }}>
                  <span style={{ fontSize: 12, color: "var(--light)", opacity: 0.5 }}>{item.status} · </span>
                  <span style={{ fontSize: 15, color: "var(--light)", opacity: item.active ? 0.9 : 0.5 }}>{item.desc}</span>
                </div>
              </div>
            ))}
          </ScrollReveal>
        </div>
      </section>

      <section style={{ padding: "80px 24px", textAlign: "center", position: "relative", zIndex: 1 }}>
        <ScrollReveal direction="up">
          <h2 className="section-title">Connect</h2>
          <p style={{ fontSize: 16, color: "var(--light)", opacity: 0.7, marginBottom: 24 }}>Building something? I want to hear about it.</p>
          <span className="btn-outline" style={{ opacity: 0.5, cursor: "default" }}>hello@snackle.ai</span>
        </ScrollReveal>
      </section>

      <Footer />
    </>
  );
}
