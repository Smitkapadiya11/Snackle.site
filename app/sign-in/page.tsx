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
            Welcome back to Snackle.
          </h1>
          <p
            style={{
              fontSize: 22,
              fontStyle: "italic",
              color: "var(--amber)",
              lineHeight: 1.5,
            }}
          >
            &ldquo;Your inventory won&apos;t predict itself.&rdquo;
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
                borderRadius: "var(--r-md)",
                border: "1px solid var(--border)",
                background: "rgba(0,0,0,0.3)",
                color: "var(--white)",
                fontSize: 15,
              }}
            />
            <input
              type="password"
              placeholder="Password"
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
            <button
              type="button"
              onClick={showComingSoon}
              className="btn btn-primary"
              style={{ width: "100%", padding: 14, opacity: 0.6, cursor: "not-allowed" }}
            >
              Sign In — Coming Soon
            </button>
            <button
              type="button"
              onClick={showComingSoon}
              style={{
                width: "100%",
                padding: 14,
                borderRadius: "var(--r-full)",
                border: "1px solid var(--border)",
                background: "transparent",
                color: "var(--light)",
                fontSize: 14,
                cursor: "not-allowed",
                opacity: 0.6,
              }}
            >
              Continue with Google
            </button>
          </div>

          <p style={{ textAlign: "center", marginTop: 24, fontSize: 14, color: "var(--light)", opacity: 0.6 }}>
            New to Snackle?{" "}
            <Link href="/sign-up" style={{ color: "var(--amber)", textDecoration: "none" }}>
              Sign up →
            </Link>
          </p>
          <p style={{ textAlign: "center", marginTop: 16 }}>
            <Link href="/use" style={{ color: "var(--amber)", fontSize: 14, textDecoration: "none" }}>
              Try Snackle free — no account needed →
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
