"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/brand/Logo";

const LINKS = [
  { href: "/", label: "Home" },
  { href: "/use", label: "Console" },
  { href: "/about", label: "About" },
  { href: "/creator", label: "Creator" },
];

export function Navigation() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  const isHome = pathname === "/";

  return (
    <>
      <nav
        className="nav-wrap"
        style={{
          position: "fixed",
          top: 12,
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 200,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 8,
          padding: "10px 20px",
          background: scrolled || menuOpen ? "rgba(8, 8, 8, 0.92)" : "rgba(8, 8, 8, 0.6)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 100,
          width: "calc(100% - 24px)",
          maxWidth: 960,
          transition: "background 0.3s ease, box-shadow 0.3s ease",
          boxShadow: scrolled ? "0 8px 32px rgba(0,0,0,0.4)" : "none",
          opacity: isHome ? 0 : 1,
        }}
      >
        <Logo size="sm" />

        <div className="nav-desktop-links" style={{ alignItems: "center", gap: 4, flex: 1, justifyContent: "center" }}>
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              style={{
                padding: "6px 14px",
                fontSize: 14,
                fontWeight: 500,
                color: pathname === link.href ? "var(--c-accent)" : "rgba(255,255,255,0.65)",
                textDecoration: "none",
                borderRadius: 100,
                background: pathname === link.href ? "rgba(252,163,17,0.10)" : "transparent",
                transition: "all 0.2s ease",
                whiteSpace: "nowrap",
              }}
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="nav-desktop-cta" style={{ gap: 8, alignItems: "center" }}>
          <Link
            href="/sign-in"
            style={{
              padding: "7px 16px",
              fontSize: 13,
              fontWeight: 500,
              color: "rgba(255,255,255,0.65)",
              textDecoration: "none",
              borderRadius: 100,
              whiteSpace: "nowrap",
            }}
          >
            Sign In
          </Link>
          <Link
            href="/use"
            className="btn-primary"
            style={{ padding: "8px 18px", fontSize: 13, whiteSpace: "nowrap" }}
          >
            Launch →
          </Link>
        </div>

        <button
          type="button"
          onClick={() => setMenuOpen(!menuOpen)}
          className="nav-hamburger"
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          style={{
            background: "transparent",
            border: "none",
            cursor: "pointer",
            padding: 6,
            flexDirection: "column",
            gap: 5,
            alignItems: "flex-end",
            minWidth: 44,
            minHeight: 44,
            justifyContent: "center",
          }}
        >
          <span
            style={{
              display: "block",
              height: 1.5,
              borderRadius: 2,
              background: "var(--c-text)",
              width: menuOpen ? 20 : 22,
              transform: menuOpen ? "rotate(45deg) translate(4.5px, 4.5px)" : "none",
              transition: "all 0.25s ease",
            }}
          />
          <span
            style={{
              display: "block",
              height: 1.5,
              borderRadius: 2,
              background: "var(--c-text)",
              width: 16,
              opacity: menuOpen ? 0 : 1,
              transition: "opacity 0.2s ease",
            }}
          />
          <span
            style={{
              display: "block",
              height: 1.5,
              borderRadius: 2,
              background: "var(--c-text)",
              width: menuOpen ? 20 : 12,
              transform: menuOpen ? "rotate(-45deg) translate(4.5px, -4.5px)" : "none",
              transition: "all 0.25s ease",
            }}
          />
        </button>
      </nav>

      <div
        className="nav-mobile-menu"
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 190,
          background: "rgba(8,8,8,0.97)",
          backdropFilter: "blur(20px)",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          opacity: menuOpen ? 1 : 0,
          pointerEvents: menuOpen ? "all" : "none",
          transition: "opacity 0.25s ease",
        }}
      >
        {LINKS.map((link, i) => (
          <Link
            key={link.href}
            href={link.href}
            style={{
              fontSize: "clamp(28px, 8vw, 48px)",
              fontFamily: "var(--font-display)",
              fontWeight: 700,
              color: pathname === link.href ? "var(--c-accent)" : "var(--c-text)",
              textDecoration: "none",
              letterSpacing: "-0.02em",
              opacity: menuOpen ? 1 : 0,
              transform: menuOpen ? "translateY(0)" : "translateY(20px)",
              transition: `all 0.35s ease ${i * 60}ms`,
              padding: "8px 0",
            }}
          >
            {link.label}
          </Link>
        ))}
        <div style={{ height: 1, width: 60, background: "rgba(255,255,255,0.1)", margin: "16px 0" }} />
        <Link
          href="/use"
          className="btn-primary"
          style={{
            padding: "14px 36px",
            fontSize: 16,
            opacity: menuOpen ? 1 : 0,
            transform: menuOpen ? "translateY(0)" : "translateY(20px)",
            transition: "all 0.35s ease 240ms",
          }}
        >
          Launch Console →
        </Link>
      </div>
    </>
  );
}
