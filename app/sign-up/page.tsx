"use client";

import Link from "next/link";
import { Logo } from "@/components/brand/Logo";
import { useToast } from "@/components/ui/Toast";

// TODO: Implement bcrypt password hashing
// TODO: Implement JWT + refresh token pattern
// TODO: Add rate limiting on auth endpoints
// TODO: Add email verification flow
// TODO: Add CSRF protection
// TODO: Implement session management
// TODO: Add 2FA option
// TODO: Security audit before enabling

export default function SignUpPage() {
  const toast = useToast();

  const showComingSoon = () => {
    toast(
      "Sign Up is launching soon. We're setting up secure infrastructure. In the meantime, try Snackle free — no account needed.",
      "info",
    );
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <div
        style={{
          flex: "1 1 60%",
          position: "relative",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: 48,
          background: "radial-gradient(ellipse 80% 60% at 30% 50%, rgba(20,33,61,0.8) 0%, #000 70%)",
        }}
      >
        <div style={{ position: "relative", zIndex: 1, maxWidth: 480 }}>
          <Logo size="md" showTagline />
          <h1
            style={{
              fontFamily: "var(--font-display)",
              fontSize: 36,
              fontWeight: 700,
              marginTop: 48,
              marginBottom: 24,
            }}
          >
            Join the inventory revolution.
          </h1>
          <p style={{ fontSize: 18, color: "var(--light)", opacity: 0.75, lineHeight: 1.6 }}>
            Snackle 1.0 is free during early access. No credit card. No catch.
          </p>
        </div>
      </div>

      <div
        style={{
          flex: "1 1 40%",
          background: "var(--navy)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 48,
        }}
      >
        <div style={{ width: "100%", maxWidth: 360 }}>
          <h2
            style={{
              fontFamily: "var(--font-display)",
              fontSize: 28,
              fontWeight: 700,
              marginBottom: 32,
            }}
          >
            Create your account
          </h2>

          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {["Full Name", "Email", "Password", "Confirm Password"].map((label) => (
              <input
                key={label}
                type={label.includes("Password") ? "password" : label === "Email" ? "email" : "text"}
                placeholder={label}
                readOnly
                onFocus={showComingSoon}
                style={{
                  padding: "14px 16px",
                  borderRadius: "var(--r-md)",
                  border: "1px solid var(--border)",
                  background: "rgba(0,0,0,0.3)",
                  color: "var(--white)",
                  fontSize: 15,
                }}
              />
            ))}
            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                fontSize: 13,
                color: "var(--light)",
                opacity: 0.6,
                cursor: "not-allowed",
              }}
            >
              <input type="checkbox" disabled /> I agree to Terms
            </label>
            <button
              type="button"
              onClick={showComingSoon}
              className="btn btn-primary"
              style={{ width: "100%", padding: 14, opacity: 0.6, cursor: "not-allowed" }}
            >
              Create Account — Coming Soon
            </button>
          </div>

          <p style={{ textAlign: "center", marginTop: 24, fontSize: 14, color: "var(--light)", opacity: 0.6 }}>
            Already have an account?{" "}
            <Link href="/sign-in" style={{ color: "var(--amber)", textDecoration: "none" }}>
              Sign in →
            </Link>
          </p>
          <p style={{ textAlign: "center", marginTop: 16 }}>
            <Link href="/use" style={{ color: "var(--amber)", fontSize: 14, textDecoration: "none" }}>
              Try Snackle free now →
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
