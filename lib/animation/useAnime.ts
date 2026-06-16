"use client";

import { useEffect, useRef } from "react";

export function prefersReducedMotion() {
  if (typeof window === "undefined") return true;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export async function loadAnime() {
  return import("animejs");
}

export function useScrollReveal(
  selector: string,
  params: Record<string, unknown> = {},
  deps: unknown[] = [],
) {
  useEffect(() => {
    if (prefersReducedMotion()) {
      document.querySelectorAll(selector).forEach((el) => {
        (el as HTMLElement).style.opacity = "1";
        (el as HTMLElement).style.transform = "none";
      });
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            loadAnime().then(({ animate }) => {
              animate(entry.target, {
                opacity: [0, 1],
                translateY: [32, 0],
                duration: 700,
                easing: "easeOutExpo",
                ...params,
              });
            });
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 },
    );

    document.querySelectorAll(selector).forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, deps);
}

export function animateCounter(el: HTMLElement, target: number, duration = 1500) {
  if (prefersReducedMotion()) {
    el.textContent = String(target);
    return;
  }
  loadAnime().then(({ animate }) => {
    const obj = { val: 0 };
    animate(obj, {
      val: target,
      duration,
      easing: "easeOutExpo",
      update: () => {
        el.textContent = String(Math.round(obj.val));
      },
    });
  });
}

export async function typewriter(element: HTMLElement, text: string, speed = 28) {
  element.textContent = "";
  if (prefersReducedMotion()) {
    element.textContent = text;
    return;
  }
  for (let i = 0; i <= text.length; i++) {
    element.textContent = text.slice(0, i);
    await new Promise((r) => setTimeout(r, speed));
  }
}

export function useProcessingAnimation(isActive: boolean) {
  const cleanup = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!isActive || prefersReducedMotion()) return;

    loadAnime().then(({ animate }) => {
      const ringAnims = [1, 2, 3].map((i) =>
        animate(`.proc-ring:nth-child(${i})`, {
          scale: [1, 1 + i * 0.15, 1],
          opacity: [0.3, 0.8, 0.3],
          duration: 2000 + i * 400,
          loop: true,
          easing: "easeInOutSine",
        }),
      );
      const dotAnims = [0, 1, 2].map((i) =>
        animate(`.proc-dot:nth-child(${i + 1})`, {
          rotate: [i * 120, i * 120 + 360],
          duration: 3000,
          loop: true,
          easing: "linear",
        }),
      );
      const coreAnim = animate(".proc-core", {
        scale: [1, 1.08, 1],
        duration: 1800,
        loop: true,
        easing: "easeInOutSine",
      });

      cleanup.current = () => {
        ringAnims.forEach((a) => a.pause());
        dotAnims.forEach((a) => a.pause());
        coreAnim.pause();
      };
    });

    return () => cleanup.current?.();
  }, [isActive]);
}
