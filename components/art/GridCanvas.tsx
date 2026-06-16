'use client';
import { useEffect, useRef } from 'react';

function getMobileConfig() {
  const isMobile = window.innerWidth < 768;
  return {
    isMobile,
    SPACING: isMobile ? 44 : 30,
    MOUSE_R: isMobile ? 80 : 180,
    BASE_OPACITY: isMobile ? 0.12 : 0.10,
    HOVER_OPACITY: isMobile ? 0.50 : 0.80,
    BASE_SIZE: isMobile ? 1.2 : 1.0,
    HOVER_SIZE: isMobile ? 2.5 : 3.5,
    SHOW_LINES: !isMobile,
    LERP: isMobile ? 0.15 : 0.09,
  };
}

export function GridCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;
    let W = window.innerWidth, H = window.innerHeight;
    let mouse = { x: -999, y: -999, sx: -999, sy: -999 };
    let raf: number;
    let config = getMobileConfig();

    type Dot = { x: number; y: number; op: number; phase: number };
    let dots: Dot[] = [];

    const build = () => {
      config = getMobileConfig();
      W = canvas.width = window.innerWidth;
      H = canvas.height = window.innerHeight;
      dots = [];
      const cols = Math.ceil(W / config.SPACING) + 1;
      const rows = Math.ceil(H / config.SPACING) + 1;
      for (let r = 0; r <= rows; r++) {
        for (let c = 0; c <= cols; c++) {
          const xOff = (r % 2) * (config.SPACING / 2);
          dots.push({
            x: c * config.SPACING + xOff,
            y: r * config.SPACING,
            op: 0,
            phase: Math.random() * Math.PI * 2,
          });
        }
      }
    };

    build();
    window.addEventListener('resize', build);

    const onMove = (e: MouseEvent) => { mouse.x = e.clientX; mouse.y = e.clientY; };
    const onTouch = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        mouse.x = e.touches[0].clientX;
        mouse.y = e.touches[0].clientY;
      }
    };
    window.addEventListener('mousemove', onMove, { passive: true });
    window.addEventListener('touchmove', onTouch, { passive: true });
    window.addEventListener('touchstart', onTouch, { passive: true });

    const ripples: { x: number; y: number; r: number; op: number }[] = [];
    const onClick = (e: MouseEvent) => ripples.push({ x: e.clientX, y: e.clientY, r: 0, op: 0.8 });
    window.addEventListener('click', onClick);

    const t0 = performance.now();

    const render = (now: number) => {
      raf = requestAnimationFrame(render);
      ctx.clearRect(0, 0, W, H);

      mouse.sx += (mouse.x - mouse.sx) * config.LERP;
      mouse.sy += (mouse.y - mouse.sy) * config.LERP;

      for (let i = ripples.length - 1; i >= 0; i--) {
        ripples[i].r += 6;
        ripples[i].op -= 0.015;
        if (ripples[i].op <= 0) ripples.splice(i, 1);
      }

      const t = now * 0.001;
      const fadeIn = Math.min((now - t0) / 2000, 1);

      if (config.SHOW_LINES) {
        ctx.lineWidth = 0.5;
        for (let i = 0; i < dots.length; i++) {
          const a = dots[i];
          const dax = a.x - mouse.sx, day = a.y - mouse.sy;
          const daMouse = Math.sqrt(dax * dax + day * day);
          if (daMouse > config.MOUSE_R * 1.4) continue;

          for (let j = i + 1; j < dots.length; j++) {
            const b = dots[j];
            const dx = a.x - b.x, dy = a.y - b.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist > config.SPACING * 1.7) continue;

            const dbx = b.x - mouse.sx, dby = b.y - mouse.sy;
            const dbMouse = Math.sqrt(dbx * dbx + dby * dby);
            const inf = Math.max(0, 1 - Math.min(daMouse, dbMouse) / config.MOUSE_R);
            const lineOp = inf * 0.20 * fadeIn;
            if (lineOp < 0.01) continue;

            ctx.strokeStyle = `rgba(252,163,17,${lineOp})`;
            ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
          }
        }
      }

      for (const d of dots) {
        const dx = d.x - mouse.sx, dy = d.y - mouse.sy;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const mouseInf = Math.max(0, 1 - dist / config.MOUSE_R);

        let ripInf = 0;
        for (const rip of ripples) {
          const rd = Math.sqrt((d.x - rip.x) ** 2 + (d.y - rip.y) ** 2);
          const ring = Math.abs(rd - rip.r);
          if (ring < 25) ripInf = Math.max(ripInf, (1 - ring / 25) * rip.op);
        }

        const breath = Math.sin(t * 0.6 + d.phase) * 0.025;
        const op = (config.BASE_OPACITY + breath + mouseInf * (config.HOVER_OPACITY - config.BASE_OPACITY) + ripInf * 0.6) * fadeIn;
        const size = config.BASE_SIZE + mouseInf * (config.HOVER_SIZE - config.BASE_SIZE) + ripInf * 5;

        ctx.globalAlpha = Math.min(op, 0.92);
        ctx.fillStyle = '#FCA311';
        ctx.beginPath();
        ctx.arc(d.x, d.y, size, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.globalAlpha = 1;
    };

    raf = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', build);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('touchmove', onTouch);
      window.removeEventListener('touchstart', onTouch);
      window.removeEventListener('click', onClick);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      style={{
        position: 'fixed', top: 0, left: 0,
        width: '100vw', height: '100vh',
        pointerEvents: 'none', zIndex: 0,
      }}
    />
  );
}
