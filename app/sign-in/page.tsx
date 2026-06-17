"use client";

import Link from "next/link";
import { Logo } from "@/components/brand/Logo";
import { useToast } from "@/components/ui/Toast";

export default function SignInPage() {
  const toast = useToast();

  const showComingSoon = () => {
    toast("Sign In is coming soon. We're finalizing security. Use the console now →", "info");
  };

  return (
    <div className="auth-layout">
      <div className="auth-hero">
        <div style={{ position: "relative", zIndex: 1, maxWidth: 480 }}>
          <Logo size="md" showTagline />
          <h1
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(28px, 4vw, 36px)",
              fontWeight: 700,
              marginTop: 48,
              marginBottom: 24,
            }}
          >
            Welcome back to Snackle.
          </h1>
          <p
            style={{
              fontSize: "clamp(16px, 2.5vw, 22px)",
              fontStyle: "italic",
              color: "var(--c-accent)",
              lineHeight: 1.5,
            }}
          >
            &ldquo;Your inventory won&apos;t predict itself.&rdquo;
          </p>
        </div>
      </div>

      <div className="auth-form-wrap">
        <div style={{ width: "100%", maxWidth: 360 }}>
          <Logo size="sm" />
          <h2
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(22px, 4vw, 28px)",
              fontWeight: 700,
              marginBottom: 32,
              marginTop: 24,
            }}
          >
            Sign In
          </h2>

          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <input
              type="email"
              placeholder="Email"
              readOnly
              onFocus={showComingSoon}
              style={{
                padding: "14px 16px",
                borderRadius: 12,
                border: "1px solid var(--c-card-border)",
                background: "rgba(255,255,255,0.04)",
                color: "var(--c-text)",
                fontSize: 16,
                outline: "none",
                width: "100%",
              }}
            />
            <input
              type="password"
              placeholder="Password"
              readOnly
              onFocus={showComingSoon}
              style={{
                padding: "14px 16px",
                borderRadius: 12,
                border: "1px solid var(--c-card-border)",
                background: "rgba(255,255,255,0.04)",
                color: "var(--c-text)",
                fontSize: 16,
                outline: "none",
                width: "100%",
              }}
            />
            <button
              type="button"
              onClick={showComingSoon}
              className="btn-primary"
              style={{ width: "100%", justifyContent: "center", opacity: 0.7, cursor: "not-allowed" }}
            >
              Sign In — Coming Soon
            </button>
            <button
              type="button"
              onClick={showComingSoon}
              className="btn-ghost"
              style={{ width: "100%", justifyContent: "center", cursor: "not-allowed", opacity: 0.6 }}
            >
              Continue with Google
            </button>
          </div>

          <p style={{ textAlign: "center", marginTop: 28, fontSize: 14, color: "var(--c-text-dim)" }}>
            New to Snackle?{" "}
            <Link href="/sign-up" style={{ color: "var(--c-accent)", textDecoration: "none", fontWeight: 600 }}>
              Sign up →
            </Link>
          </p>
          <p style={{ textAlign: "center", marginTop: 16 }}>
            <Link href="/use" style={{ color: "var(--c-accent)", fontSize: 14, textDecoration: "none", fontWeight: 600 }}>
              Try Snackle free — no account needed →
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
