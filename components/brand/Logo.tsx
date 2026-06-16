"use client";

import Link from "next/link";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  showTagline?: boolean;
}

export function Logo({ size = "md", showTagline = false }: LogoProps) {
  const sizes = { sm: 18, md: 24, lg: 36 };
  const fs = sizes[size];

  return (
    <Link
      href="/"
      className="logo-link"
      style={{ display: "inline-flex", alignItems: "center", gap: "10px", textDecoration: "none" }}
    >
      <svg
        width={fs * 1.5}
        height={fs * 1.5}
        viewBox="0 0 36 36"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="logo-mark"
        aria-hidden
      >
        <path d="M18 2L32 10V26L18 34L4 26V10L18 2Z" stroke="#FCA311" strokeWidth="1.5" fill="none" />
        <path
          d="M24 13C24 11 22 9 18 9H13C11.5 9 10 10.5 10 12.5C10 14.5 11.5 16 13 16.5L22 18C24 18.5 26 20 26 23.5C26 25.5 24.5 27 22 27H12C9.5 27 8 25 8 23"
          stroke="#FCA311"
          strokeWidth="2.2"
          strokeLinecap="round"
          fill="none"
        />
        <circle cx="18" cy="18" r="1.5" fill="#FCA311" opacity="0.6" />
      </svg>
      <div style={{ display: "flex", flexDirection: "column", lineHeight: 1 }}>
        <span
          style={{
            fontFamily: "var(--font-display)",
            fontSize: fs,
            fontWeight: 700,
            letterSpacing: "-0.02em",
            color: "var(--white)",
          }}
        >
          SNACKLE
          <span style={{ color: "var(--amber)", marginLeft: "1px" }}>.</span>
        </span>
        {showTagline && (
          <span
            style={{
              fontFamily: "var(--font-body)",
              fontSize: fs * 0.42,
              color: "var(--light)",
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              opacity: 0.7,
              marginTop: "2px",
            }}
          >
            Inventory Intelligence
          </span>
        )}
      </div>
    </Link>
  );
}
