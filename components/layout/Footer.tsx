"use client";

import Link from "next/link";
import { Logo } from "@/components/brand/Logo";

export function Footer() {
  const linkStyle: React.CSSProperties = {
    display: "block",
    color: "rgba(255,255,255,0.55)",
    fontSize: 14,
    textDecoration: "none",
    marginBottom: 10,
    transition: "color 0.2s",
  };

  return (
    <footer
      style={{
        borderTop: "1px solid rgba(255,255,255,0.06)",
        padding: "48px 0 32px",
        position: "relative",
        zIndex: 1,
      }}
    >
      <div className="section-wrap">
        <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 40 }}>
          <div style={{ maxWidth: 280 }}>
            <Logo size="sm" />
            <p style={{ marginTop: 16, fontSize: 14, color: "rgba(255,255,255,0.4)", lineHeight: 1.7 }}>
              Inventory Intelligence powered by Snackle 1.0. 9 enterprise algorithms for Indian D2C brands.
            </p>
            <p style={{ marginTop: 12, fontSize: 12, color: "rgba(255,255,255,0.25)" }}>Built in Surat, Gujarat 🇮🇳</p>
          </div>

          <div style={{ display: "flex", gap: 60, flexWrap: "wrap" }}>
            <div>
              <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(255,255,255,0.3)", marginBottom: 16 }}>
                Product
              </p>
              {[
                ["/", "Home"],
                ["/use", "Console"],
                ["/about", "About"],
              ].map(([href, label]) => (
                <Link
                  key={href}
                  href={href}
                  style={linkStyle}
                  onMouseEnter={(e) => { e.currentTarget.style.color = "#FCA311"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = "rgba(255,255,255,0.55)"; }}
                >
                  {label}
                </Link>
              ))}
            </div>
            <div>
              <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(255,255,255,0.3)", marginBottom: 16 }}>
                Company
              </p>
              {[
                ["/creator", "Creator"],
                ["/sign-in", "Sign In"],
                ["/sign-up", "Sign Up"],
              ].map(([href, label]) => (
                <Link
                  key={href}
                  href={href}
                  style={linkStyle}
                  onMouseEnter={(e) => { e.currentTarget.style.color = "#FCA311"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = "rgba(255,255,255,0.55)"; }}
                >
                  {label}
                </Link>
              ))}
            </div>
          </div>
        </div>

        <div
          style={{
            marginTop: 40,
            paddingTop: 20,
            borderTop: "1px solid rgba(255,255,255,0.06)",
            display: "flex",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.25)" }}>© 2025 Snackle. All rights reserved.</p>
          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.25)" }}>Snackle 1.0 · Not financial advice · 9 real algorithms</p>
        </div>
      </div>
    </footer>
  );
}
