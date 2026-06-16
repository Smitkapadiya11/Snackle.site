"use client";

import { useEffect, useRef, ReactNode } from "react";

interface ScrollRevealProps {
  children: ReactNode;
  delay?: number;
  direction?: "up" | "down" | "left" | "right" | "scale" | "fade";
  className?: string;
  stagger?: boolean;
  staggerDelay?: number;
  once?: boolean;
}

export function ScrollReveal({
  children,
  delay = 0,
  direction = "up",
  className = "",
  stagger = false,
  staggerDelay = 80,
  once = true,
}: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const done = useRef(false);

  useEffect(() => {
    if (!ref.current) return;
    const el = ref.current;

    el.style.opacity = "0";
    if (direction === "up") el.style.transform = "translateY(40px)";
    if (direction === "down") el.style.transform = "translateY(-40px)";
    if (direction === "left") el.style.transform = "translateX(60px)";
    if (direction === "right") el.style.transform = "translateX(-60px)";
    if (direction === "scale") el.style.transform = "scale(0.92)";

    const observer = new IntersectionObserver(
      async ([entry]) => {
        if (!entry.isIntersecting) return;
        if (once && done.current) return;
        done.current = true;

        const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        if (prefersReduced) {
          el.style.opacity = "1";
          el.style.transform = "none";
          return;
        }

        const { animate, stagger: animeStagger } = await import("animejs");
        const targets = stagger ? (Array.from(el.children) as HTMLElement[]) : [el];

        animate(targets, {
          opacity: [0, 1],
          translateY: direction === "up" ? [40, 0] : direction === "down" ? [-40, 0] : 0,
          translateX: direction === "left" ? [60, 0] : direction === "right" ? [-60, 0] : 0,
          scale: direction === "scale" ? [0.92, 1] : 1,
          delay: stagger ? animeStagger(staggerDelay, { start: delay }) : delay,
          duration: 700,
          easing: "easeOutExpo",
        });

        if (once) observer.disconnect();
      },
      { threshold: 0.12 },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [direction, delay, stagger, staggerDelay, once]);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
