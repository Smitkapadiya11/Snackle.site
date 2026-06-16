"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/brand/Logo";
import { useToast } from "@/components/ui/Toast";

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/use", label: "Console" },
  { href: "/about", label: "About" },
  { href: "/creator", label: "Creator" },
];

export function Navigation() {
  const pathname = usePathname();
  const toast = useToast();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  return (
    <nav
      className={`snackle-nav ${scrolled ? "snackle-nav--scrolled" : ""}`}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        padding: "16px 24px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        transition: "background 0.3s, backdrop-filter 0.3s",
      }}
    >
      <div className="nav-item">
        <Logo size="sm" />
      </div>

      <div className="nav-desktop" style={{ display: "flex", alignItems: "center", gap: 32 }}>
        {NAV_LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            style={{
              fontFamily: "var(--font-body)",
              fontSize: 14,
              fontWeight: 500,
              color: pathname === link.href ? "var(--amber)" : "var(--light)",
              textDecoration: "none",
              transition: "color 0.2s",
            }}
          >
            {link.label}
          </Link>
        ))}
        <button
          type="button"
          onClick={() => toast("Sign in coming soon — Snackle is in early access.", "info")}
          className="btn btn-ghost btn-sm"
        >
          Sign In
        </button>
        <Link href="/use" className="btn btn-primary btn-sm">
          Launch Console
        </Link>
      </div>

      <button
        type="button"
        className="nav-hamburger"
        aria-label="Toggle menu"
        onClick={() => setMenuOpen(!menuOpen)}
        style={{
          display: "none",
          background: "none",
          border: "none",
          color: "var(--white)",
          fontSize: 24,
          cursor: "pointer",
        }}
      >
        {menuOpen ? "✕" : "☰"}
      </button>

      {menuOpen && (
        <div
          className="nav-mobile-menu"
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            right: 0,
            background: "rgba(0,0,0,0.95)",
            borderBottom: "1px solid rgba(252,163,17,0.2)",
            padding: "16px 24px",
            display: "flex",
            flexDirection: "column",
            gap: 16,
          }}
        >
          {NAV_LINKS.map((link) => (
            <Link key={link.href} href={link.href} style={{ color: "var(--light)", textDecoration: "none" }}>
              {link.label}
            </Link>
          ))}
          <Link href="/use" className="btn btn-primary">
            Launch Console
          </Link>
        </div>
      )}
    </nav>
  );
}
