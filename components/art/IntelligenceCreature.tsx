'use client';
import { useEffect, useRef, useState } from 'react';

export function IntelligenceCreature({
  size: propSize,
  width,
  height,
  className = '',
}: {
  size?: number;
  width?: number;
  height?: number;
  className?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const explicitSize = propSize ?? (width && height ? Math.max(width, height) : undefined);
  const [size, setSize] = useState(explicitSize ?? 460);

  useEffect(() => {
    if (explicitSize) {
      setSize(explicitSize);
      return;
    }
    const updateSize = () => {
      if (containerRef.current) {
        const w = containerRef.current.offsetWidth;
        setSize(Math.min(Math.max(w, 160), 460));
      }
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, [explicitSize]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = size;
    canvas.height = size;

    const CX = size / 2, CY = size / 2;
    let raf: number;
    let mouse = { x: CX, y: CY };

    const nodes: Array<{
      x: number; y: number; baseX: number; baseY: number;
      vx: number; vy: number; r: number; pulse: number;
    }> = [];

    nodes.push({ x: CX, y: CY, baseX: CX, baseY: CY, vx: 0, vy: 0, r: 7, pulse: 0 });

    const ringScale = size / 460;
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      const bx = CX + Math.cos(a) * 70 * ringScale, by = CY + Math.sin(a) * 70 * ringScale;
      nodes.push({ x: bx, y: by, baseX: bx, baseY: by, vx: 0, vy: 0, r: 4.5 * ringScale, pulse: Math.random() * Math.PI * 2 });
    }
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2 + 0.3;
      const bx = CX + Math.cos(a) * 140 * ringScale, by = CY + Math.sin(a) * 140 * ringScale;
      nodes.push({ x: bx, y: by, baseX: bx, baseY: by, vx: 0, vy: 0, r: 3 * ringScale, pulse: Math.random() * Math.PI * 2 });
    }
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2;
      const bx = CX + Math.cos(a) * 200 * ringScale, by = CY + Math.sin(a) * 200 * ringScale;
      nodes.push({ x: bx, y: by, baseX: bx, baseY: by, vx: 0, vy: 0, r: 2 * ringScale, pulse: Math.random() * Math.PI * 2 });
    }

    const edges: [number, number][] = [];
    for (let i = 0; i < nodes.length; i++) {
      const dists = nodes.map((n, j) => ({
        j, d: Math.sqrt((n.x - nodes[i].x) ** 2 + (n.y - nodes[i].y) ** 2),
      })).filter(e => e.j !== i).sort((a, b) => a.d - b.d);

      dists.slice(0, 3).forEach(({ j, d }) => {
        if (d < 200 * ringScale && !edges.find(([a, b]) => (a === i && b === j) || (a === j && b === i))) {
          edges.push([i, j]);
        }
      });
    }

    const onMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouse = { x: (e.clientX - rect.left) * (size / rect.width), y: (e.clientY - rect.top) * (size / rect.height) };
    };
    canvas.addEventListener('mousemove', onMove);

    let t = 0;
    const render = () => {
      raf = requestAnimationFrame(render);
      ctx.clearRect(0, 0, size, size);
      t += 0.012;

      nodes.forEach((n, i) => {
        if (i === 0) return;
        const floatX = Math.sin(t + n.pulse) * 3;
        const floatY = Math.cos(t * 0.7 + n.pulse) * 3;
        const dx = mouse.x - n.baseX, dy = mouse.y - n.baseY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const pull = dist < 200 * ringScale ? (200 * ringScale - dist) / (200 * ringScale) * 12 : 0;
        const mx = (dx / (dist || 1)) * pull;
        const my = (dy / (dist || 1)) * pull;
        n.x = n.baseX + floatX + mx;
        n.y = n.baseY + floatY + my;
      });

      edges.forEach(([a, b]) => {
        const na = nodes[a], nb = nodes[b];
        const dist = Math.sqrt((na.x - nb.x) ** 2 + (na.y - nb.y) ** 2);
        const maxDist = 230 * ringScale;
        if (dist > maxDist) return;
        const baseOp = (1 - dist / maxDist) * 0.22;
        const pulsePos = (t * 0.4 + a * 0.13) % 1;
        const px = na.x + (nb.x - na.x) * pulsePos;
        const py = na.y + (nb.y - na.y) * pulsePos;

        ctx.strokeStyle = `rgba(252,163,17,${baseOp})`;
        ctx.lineWidth = 0.7;
        ctx.beginPath(); ctx.moveTo(na.x, na.y); ctx.lineTo(nb.x, nb.y); ctx.stroke();

        ctx.globalAlpha = 0.6 * Math.sin(pulsePos * Math.PI);
        ctx.fillStyle = '#FCA311';
        ctx.beginPath(); ctx.arc(px, py, 2 * ringScale, 0, Math.PI * 2); ctx.fill();
        ctx.globalAlpha = 1;
      });

      nodes.forEach((n, i) => {
        const pulse = Math.sin(t * 1.4 + n.pulse) * 0.35 + 0.65;
        const isCenter = i === 0;
        const glowR = n.r * (isCenter ? 8 : 5);
        const grd = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, glowR);
        grd.addColorStop(0, `rgba(252,163,17,${isCenter ? 0.35 : 0.18})`);
        grd.addColorStop(1, 'rgba(252,163,17,0)');
        ctx.fillStyle = grd;
        ctx.beginPath(); ctx.arc(n.x, n.y, glowR, 0, Math.PI * 2); ctx.fill();

        const coreOp = isCenter ? 0.95 : (0.55 + pulse * 0.35);
        ctx.fillStyle = `rgba(252,163,17,${coreOp})`;
        ctx.beginPath(); ctx.arc(n.x, n.y, n.r * (isCenter ? 1 : pulse), 0, Math.PI * 2); ctx.fill();
      });

      const ringR = 210 * ringScale + Math.sin(t * 0.4) * 8;
      const rg = ctx.createRadialGradient(CX, CY, ringR - 12, CX, CY, ringR + 12);
      rg.addColorStop(0, 'rgba(252,163,17,0)');
      rg.addColorStop(0.5, `rgba(252,163,17,${0.05 + Math.sin(t * 0.5) * 0.025})`);
      rg.addColorStop(1, 'rgba(252,163,17,0)');
      ctx.fillStyle = rg;
      ctx.beginPath(); ctx.arc(CX, CY, ringR + 12, 0, Math.PI * 2); ctx.fill();
    };

    raf = requestAnimationFrame(render);
    return () => {
      cancelAnimationFrame(raf);
      canvas.removeEventListener('mousemove', onMove);
    };
  }, [size]);

  return (
    <div
      ref={containerRef}
      className={`creature-wrap ${className}`.trim()}
      style={{ width: '100%', maxWidth: explicitSize ?? 460 }}
    >
      <canvas
        ref={canvasRef}
        className="hero-creature hero-anim"
        width={size}
        height={size}
        style={{ display: 'block', width: '100%', height: 'auto', opacity: 0 }}
        aria-hidden
      />
    </div>
  );
}
