"use client";

import Link from "next/link";
import { Logo } from "@/components/brand/Logo";
import { useToast } from "@/components/ui/Toast";

export default function SignUpPage() {
  const toast = useToast();

  const showComingSoon = () => {
    toast(
      "Sign Up is launching soon. We're setting up secure infrastructure. In the meantime, try Snackle free — no account needed.",
      "info",
    );
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
            Join the inventory revolution.
          </h1>
          <p style={{ fontSize: "clamp(15px, 2vw, 18px)", color: "var(--c-text-dim)", lineHeight: 1.6 }}>
            Snackle 1.0 is free during early access. No credit card. No catch.
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
            Create your account
          </h2>

          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {["Full Name", "Email", "Password", "Confirm Password"].map((label) => (
              <input
                key={label}
                type={label.includes("Password") ? "password" : label === "Email" ? "email" : "text"}
                placeholder={label}
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
            ))}
            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                fontSize: 13,
                color: "var(--c-text-dim)",
                cursor: "not-allowed",
              }}
            >
              <input type="checkbox" disabled style={{ accentColor: "var(--c-accent)" }} />
              I agree to Terms &amp; Privacy Policy
            </label>
            <button
              type="button"
              onClick={showComingSoon}
              className="btn-primary"
              style={{ width: "100%", justifyContent: "center", opacity: 0.7, cursor: "not-allowed" }}
            >
              Create Account — Coming Soon
            </button>
          </div>

          <p style={{ textAlign: "center", marginTop: 28, fontSize: 14, color: "var(--c-text-dim)" }}>
            Already have an account?{" "}
            <Link href="/sign-in" style={{ color: "var(--c-accent)", textDecoration: "none", fontWeight: 600 }}>
              Sign in →
            </Link>
          </p>
          <p style={{ textAlign: "center", marginTop: 16 }}>
            <Link href="/use" style={{ color: "var(--c-accent)", fontSize: 14, textDecoration: "none", fontWeight: 600 }}>
              Try Snackle free now →
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
