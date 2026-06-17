"use client";

import { useEffect } from "react";
import { Navigation } from "@/components/layout/Navigation";

export function SiteShell({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      document.documentElement.classList.add("js-ready");
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div
      style={{
        position: "relative",
        zIndex: 1,
        flex: 1,
        display: "flex",
        flexDirection: "column",
        minHeight: "100%",
      }}
    >
      <Navigation />
      {children}
    </div>
  );
}
