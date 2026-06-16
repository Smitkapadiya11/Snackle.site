import Link from "next/link";
import { Logo } from "@/components/brand/Logo";

export function Footer() {
  return (
    <footer
      style={{
        borderTop: "1px solid rgba(252,163,17,0.15)",
        background: "var(--black)",
        padding: "48px 24px 32px",
      }}
    >
      <div className="container" style={{ display: "flex", flexWrap: "wrap", gap: 48, justifyContent: "space-between" }}>
        <div>
          <Logo size="sm" showTagline />
          <p style={{ marginTop: 16, fontSize: 14, color: "var(--light)", opacity: 0.7, maxWidth: 280 }}>
            Inventory intelligence powered by Snackle 1.0. Know what to reorder, what to clear, and what to watch.
          </p>
        </div>
        <div style={{ display: "flex", gap: 64 }}>
          <div>
            <p style={{ fontSize: 12, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--amber)", marginBottom: 12 }}>
              Product
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <Link href="/use" style={{ color: "var(--light)", fontSize: 14, textDecoration: "none" }}>Console</Link>
              <Link href="/about" style={{ color: "var(--light)", fontSize: 14, textDecoration: "none" }}>About</Link>
            </div>
          </div>
          <div>
            <p style={{ fontSize: 12, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--amber)", marginBottom: 12 }}>
              Company
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <Link href="/creator" style={{ color: "var(--light)", fontSize: 14, textDecoration: "none" }}>Creator</Link>
              <span style={{ color: "var(--light)", fontSize: 14, opacity: 0.5 }}>Sign In (Soon)</span>
            </div>
          </div>
        </div>
      </div>
      <div className="container" style={{ marginTop: 40, paddingTop: 24, borderTop: "1px solid rgba(229,229,229,0.1)" }}>
        <p style={{ fontSize: 13, color: "var(--light)", opacity: 0.5 }}>
          © {new Date().getFullYear()} Snackle. All rights reserved. Model: Snackle 1.0
        </p>
      </div>
    </footer>
  );
}
