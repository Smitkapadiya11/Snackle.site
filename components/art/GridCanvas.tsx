"use client";

import { useEffect, useRef, useCallback } from "react";

interface Props {
  density?: number;
  dotColor?: string;
  lineColor?: string;
  mouseRadius?: number;
  maxOpacity?: number;
  showLines?: boolean;
}

export function GridCanvas({
  density = 34,
  dotColor = "#FCA311",
  lineColor = "#FCA311",
  mouseRadius = 160,
  maxOpacity = 0.22,
  showLines = true,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouse = useRef({ x: -9999, y: -9999, smoothX: -9999, smoothY: -9999 });
  const dots = useRef<
    Array<{
      x: number;
      y: number;
      baseOp: number;
      op: number;
      size: number;
      pulseOffset: number;
    }>
  >([]);
  const frame = useRef<number>(0);

  const buildGrid = useCallback(
    (canvas: HTMLCanvasElement) => {
      const cols = Math.ceil(canvas.width / density) + 2;
      const rows = Math.ceil(canvas.height / density) + 2;
      dots.current = [];
      for (let r = 0; r <= rows; r++) {
        for (let c = 0; c <= cols; c++) {
          const xOffset = r % 2 === 0 ? 0 : density / 2;
          dots.current.push({
            x: c * density + xOffset,
            y: r * density,
            baseOp: 0.06 + Math.random() * 0.08,
            op: 0,
            size: 0.8 + Math.random() * 1.2,
            pulseOffset: Math.random() * Math.PI * 2,
          });
        }
      }
    },
    [density],
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;
    let animRunning = true;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      buildGrid(canvas);
    };
    resize();
    window.addEventListener("resize", resize);

    const startTime = performance.now();
    const FADE_DURATION = 2000;

    const onMouseMove = (e: MouseEvent) => {
      mouse.current.x = e.clientX;
      mouse.current.y = e.clientY;
    };
    window.addEventListener("mousemove", onMouseMove, { passive: true });

    const ripples: Array<{ x: number; y: number; t: number }> = [];
    const onClick = (e: MouseEvent) => {
      ripples.push({ x: e.clientX, y: e.clientY, t: 0 });
    };
    window.addEventListener("click", onClick);

    const hexParse = (hex: string) => ({
      r: parseInt(hex.slice(1, 3), 16),
      g: parseInt(hex.slice(3, 5), 16),
      b: parseInt(hex.slice(5, 7), 16),
    });
    const dc = hexParse(dotColor);
    const lc = hexParse(lineColor);
    const LERP = 0.08;

    const render = (now: number) => {
      if (!animRunning) return;
      frame.current = requestAnimationFrame(render);

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      mouse.current.smoothX += (mouse.current.x - mouse.current.smoothX) * LERP;
      mouse.current.smoothY += (mouse.current.y - mouse.current.smoothY) * LERP;
      const smx = mouse.current.smoothX;
      const smy = mouse.current.smoothY;

      const elapsed = now - startTime;
      const fadeProgress = Math.min(elapsed / FADE_DURATION, 1);

      for (let i = ripples.length - 1; i >= 0; i--) {
        ripples[i].t += 0.03;
        if (ripples[i].t > 1) ripples.splice(i, 1);
      }

      if (showLines) {
        const lineThreshold = density * 1.6;
        ctx.lineWidth = 0.4;
        for (let i = 0; i < dots.current.length; i++) {
          const a = dots.current[i];
          const distA = Math.sqrt((a.x - smx) ** 2 + (a.y - smy) ** 2);
          if (distA > mouseRadius * 1.5) continue;

          for (let j = i + 1; j < dots.current.length; j++) {
            const b = dots.current[j];
            const dist = Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
            if (dist > lineThreshold) continue;

            const distB = Math.sqrt((b.x - smx) ** 2 + (b.y - smy) ** 2);
            const influence = Math.max(0, 1 - Math.min(distA, distB) / mouseRadius);
            const lineOp = influence * 0.18 * fadeProgress;
            if (lineOp < 0.005) continue;

            ctx.strokeStyle = `rgba(${lc.r},${lc.g},${lc.b},${lineOp})`;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }

      const t = now * 0.001;
      dots.current.forEach((d) => {
        const dx = d.x - smx;
        const dy = d.y - smy;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const mouseInfluence = Math.max(0, 1 - dist / mouseRadius);

        let rippleInfluence = 0;
        for (const rip of ripples) {
          const rd = Math.sqrt((d.x - rip.x) ** 2 + (d.y - rip.y) ** 2);
          const rippleR = rip.t * 300;
          const ripDist = Math.abs(rd - rippleR);
          if (ripDist < 30) {
            rippleInfluence = Math.max(
              rippleInfluence,
              (1 - ripDist / 30) * (1 - rip.t) * 0.8,
            );
          }
        }

        const pulse = Math.sin(t * 0.8 + d.pulseOffset) * 0.03;
        const baseWithFade = d.baseOp * fadeProgress;
        d.op = baseWithFade + mouseInfluence * maxOpacity + rippleInfluence * 0.5 + pulse;
        d.op = Math.min(d.op, 0.95);

        const s = d.size + mouseInfluence * 2.5 + rippleInfluence * 4;
        ctx.globalAlpha = d.op;
        ctx.fillStyle = `rgb(${dc.r},${dc.g},${dc.b})`;
        ctx.beginPath();
        ctx.arc(d.x, d.y, s, 0, Math.PI * 2);
        ctx.fill();
      });

      ctx.globalAlpha = 1;
    };

    frame.current = requestAnimationFrame(render);

    return () => {
      animRunning = false;
      cancelAnimationFrame(frame.current);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("click", onClick);
    };
  }, [buildGrid, dotColor, lineColor, mouseRadius, maxOpacity, showLines]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        pointerEvents: "none",
        zIndex: 0,
      }}
    />
  );
}
