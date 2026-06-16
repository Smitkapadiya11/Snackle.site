"use client";

import { useEffect, useRef } from "react";

interface Node {
  x: number;
  y: number;
  vx: number;
  vy: number;
  connections: number[];
  size: number;
  pulseOffset: number;
  isBrain: boolean;
}

export function IntelligenceCreature({ width = 500, height = 500 }: { width?: number; height?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouse = useRef({ x: width / 2, y: height / 2 });
  const nodes = useRef<Node[]>([]);
  const frame = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const NODE_COUNT = 28;
    const cx = width / 2;
    const cy = height / 2;
    nodes.current = [];

    for (let i = 0; i < NODE_COUNT; i++) {
      const cluster = Math.floor(i / 7);
      const clusterAngle = (cluster / 4) * Math.PI * 2;
      const clusterR = 100;
      const jitter = 60;
      nodes.current.push({
        x: cx + Math.cos(clusterAngle) * clusterR + (Math.random() - 0.5) * jitter,
        y: cy + Math.sin(clusterAngle) * clusterR + (Math.random() - 0.5) * jitter,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        connections: [],
        size: 2 + Math.random() * 4,
        pulseOffset: Math.random() * Math.PI * 2,
        isBrain: i < 4,
      });
    }

    nodes.current.push({
      x: cx,
      y: cy,
      vx: 0,
      vy: 0,
      connections: [],
      size: 8,
      pulseOffset: 0,
      isBrain: true,
    });

    nodes.current.forEach((node, i) => {
      nodes.current.forEach((other, j) => {
        if (i === j) return;
        const d = Math.sqrt((node.x - other.x) ** 2 + (node.y - other.y) ** 2);
        if (d < 140) node.connections.push(j);
      });
    });

    const onMouse = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouse.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };
    canvas.addEventListener("mousemove", onMouse);

    const render = (now: number) => {
      frame.current = requestAnimationFrame(render);
      ctx.clearRect(0, 0, width, height);

      const t = now * 0.001;
      const N = nodes.current;

      N.forEach((node) => {
        if (node.x === cx && node.y === cy && node.isBrain && node.size === 8) return;

        const mdx = mouse.current.x - node.x;
        const mdy = mouse.current.y - node.y;
        const md = Math.sqrt(mdx * mdx + mdy * mdy);
        if (md < 200) {
          node.vx += mdx * 0.0003;
          node.vy += mdy * 0.0003;
        }
        node.vx += (cx - node.x) * 0.0005;
        node.vy += (cy - node.y) * 0.0005;
        node.vx *= 0.97;
        node.vy *= 0.97;
        node.x += node.vx;
        node.y += node.vy;
      });

      N.forEach((node, i) => {
        node.connections.forEach((j) => {
          if (j <= i) return;
          const other = N[j];
          const dist = Math.sqrt((node.x - other.x) ** 2 + (node.y - other.y) ** 2);
          if (dist > 180) return;

          const lineOp = Math.max(0, 1 - dist / 180) * 0.3;
          const gradient = ctx.createLinearGradient(node.x, node.y, other.x, other.y);
          gradient.addColorStop(0, `rgba(252,163,17,${lineOp})`);
          gradient.addColorStop(0.5, `rgba(252,163,17,${lineOp * 2})`);
          gradient.addColorStop(1, `rgba(252,163,17,${lineOp})`);

          ctx.strokeStyle = gradient;
          ctx.lineWidth = 0.6;
          ctx.beginPath();
          ctx.moveTo(node.x, node.y);
          ctx.lineTo(other.x, other.y);
          ctx.stroke();

          const pulsePos = (t * 0.3 + i * 0.07) % 1;
          const px = node.x + (other.x - node.x) * pulsePos;
          const py = node.y + (other.y - node.y) * pulsePos;
          ctx.globalAlpha = 0.6 * (1 - Math.abs(pulsePos - 0.5) * 2);
          ctx.fillStyle = "#FCA311";
          ctx.beginPath();
          ctx.arc(px, py, 1.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.globalAlpha = 1;
        });
      });

      N.forEach((node) => {
        const pulse = Math.sin(t * 1.2 + node.pulseOffset) * 0.3 + 0.7;
        const g = ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, node.size * 4);
        g.addColorStop(0, `rgba(252,163,17,${0.3 * pulse})`);
        g.addColorStop(1, "rgba(252,163,17,0)");
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.size * 4, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = node.isBrain
          ? `rgba(252,163,17,${0.8 + pulse * 0.2})`
          : `rgba(252,163,17,${0.5 + pulse * 0.3})`;
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.size * pulse, 0, Math.PI * 2);
        ctx.fill();
      });

      const ringR = 180 + Math.sin(t * 0.5) * 10;
      const ring = ctx.createRadialGradient(cx, cy, ringR - 20, cx, cy, ringR + 20);
      ring.addColorStop(0, "rgba(252,163,17,0)");
      ring.addColorStop(0.5, `rgba(252,163,17,${0.04 + Math.sin(t * 0.5) * 0.02})`);
      ring.addColorStop(1, "rgba(252,163,17,0)");
      ctx.fillStyle = ring;
      ctx.beginPath();
      ctx.arc(cx, cy, ringR + 20, 0, Math.PI * 2);
      ctx.fill();
    };

    frame.current = requestAnimationFrame(render);
    return () => {
      cancelAnimationFrame(frame.current);
      canvas.removeEventListener("mousemove", onMouse);
    };
  }, [width, height]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      aria-hidden
      style={{ display: "block", maxWidth: "100%" }}
    />
  );
}
