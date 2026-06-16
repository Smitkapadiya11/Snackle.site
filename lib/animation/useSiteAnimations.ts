"use client";

import { useEffect } from "react";

export function useSiteAnimations(options?: { hero?: boolean }) {
  useEffect(() => {
    const cleanup: Array<() => void> = [];
    let cancelled = false;

    import("@/lib/animation").then(async ({ scrollReveal, cardTilt, magneticButton, heroEntrance }) => {
      if (cancelled) return;
      const c1 = await scrollReveal(".reveal-section", { staggerMs: 90 });
      const c2 = await scrollReveal(".reveal-card", { staggerMs: 70 });
      cleanup.push(c1, c2);
      cardTilt(".glass");
      magneticButton(".btn-primary");

      if (options?.hero || window.location.pathname === "/") {
        await heroEntrance();
      }
    });

    return () => {
      cancelled = true;
      cleanup.forEach((fn) => fn?.());
    };
  }, [options?.hero]);
}
