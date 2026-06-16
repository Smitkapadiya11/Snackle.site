"use client";

import { Navigation } from "@/components/layout/Navigation";

export function SiteShell({ children }: { children: React.ReactNode }) {
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
