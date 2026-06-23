'use client';
import { useEffect, useRef, useState } from 'react';

const CATEGORIES = [
  { name: 'Skincare', color: '#FCA311', baseIndex: 68 },
  { name: 'Haircare', color: '#3b82f6', baseIndex: 52 },
  { name: 'Supplements', color: '#22c55e', baseIndex: 81 },
  { name: 'Bodycare', color: '#a78bfa', baseIndex: 45 },
  { name: 'Grooming', color: '#f43f5e', baseIndex: 39 },
];

const WIDTH = 600;
const HEIGHT = 160;
const POINTS = 20;

function generatePoints(baseIndex: number, seed: number): number[] {
  const points: number[] = [];
  let val = baseIndex;
  for (let i = 0; i < POINTS; i++) {
    val = Math.max(10, Math.min(95, val + (Math.sin(i * seed) * 12) + (Math.random() - 0.5) * 8));
    points.push(val);
  }
  return points;
}

function pointsToPath(points: number[]): string {
  const stepX = WIDTH / (POINTS - 1);
  const coords = points.map((p, i) => {
    const x = i * stepX;
    const y = HEIGHT - (p / 100) * HEIGHT;
    return [x, y] as [number, number];
  });

  // Smooth bezier curve
  let d = `M ${coords[0][0]} ${coords[0][1]}`;
  for (let i = 0; i < coords.length - 1; i++) {
    const [x0, y0] = coords[i];
    const [x1, y1] = coords[i + 1];
    const cpx = (x0 + x1) / 2;
    d += ` C ${cpx} ${y0} ${cpx} ${y1} ${x1} ${y1}`;
  }
  return d;
}

export function CategoryPulse() {
  const svgRef = useRef<SVGSVGElement>(null);
  const [activeCategory, setActiveCategory] = useState(0);
  const [categoryData, setCategoryData] = useState(
    CATEGORIES.map((cat, i) => ({
      ...cat,
      points: generatePoints(cat.baseIndex, (i + 1) * 0.7),
    }))
  );

  useEffect(() => {
    // Animate lines on mount
    import('animejs').then(({ animate, stagger }) => {
      animate('.category-path', {
        strokeDashoffset: [800, 0],
        opacity: [0, 1],
        delay: stagger(100),
        duration: 1200,
        easing: 'easeInOutQuad',
      });
    });

    // Update data every 5 seconds
    const interval = setInterval(() => {
      setCategoryData(prev => prev.map((cat) => {
        const newPoints = [...cat.points.slice(1), Math.max(10, Math.min(95,
          cat.points[cat.points.length - 1] + (Math.random() - 0.45) * 10
        ))];
        return { ...cat, points: newPoints };
      }));
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const active = categoryData[activeCategory];

  return (
    <div style={{
      background: 'rgba(255,255,255,0.02)',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: 16,
      padding: 24,
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <p style={{
            fontFamily: 'Space Grotesk, monospace',
            fontSize: 10, letterSpacing: '0.12em',
            textTransform: 'uppercase', color: '#FCA311',
            marginBottom: 6,
          }}>Live Demand Index</p>
          <h3 style={{
            fontFamily: 'Space Grotesk, sans-serif',
            fontSize: 18, fontWeight: 700, color: '#FFFFFF',
          }}>Category Demand Pulse</h3>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {categoryData.map((cat, i) => (
            <button key={cat.name}
              onClick={() => setActiveCategory(i)}
              style={{
                background: activeCategory === i ? `${cat.color}20` : 'transparent',
                border: `1px solid ${activeCategory === i ? cat.color : 'rgba(255,255,255,0.1)'}`,
                color: activeCategory === i ? cat.color : 'rgba(255,255,255,0.4)',
                fontFamily: 'Space Grotesk, sans-serif',
                fontSize: 11, fontWeight: 600,
                padding: '4px 12px', borderRadius: 100,
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}>
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Current value + trend */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 16 }}>
        <span style={{
          fontFamily: 'Space Grotesk, monospace',
          fontSize: 48, fontWeight: 800,
          color: active.color,
          lineHeight: 1,
        }}>
          {Math.round(active.points[active.points.length - 1])}
        </span>
        <div>
          <p style={{
            fontFamily: 'Space Grotesk, sans-serif',
            fontSize: 14, color: 'rgba(255,255,255,0.5)',
          }}>Demand Index · {active.name}</p>
          <p style={{
            fontFamily: 'Space Grotesk, monospace',
            fontSize: 11, color: '#22c55e',
          }}>
            ↑ {(Math.random() * 15 + 5).toFixed(1)}% vs last week
          </p>
        </div>
      </div>

      {/* SVG Chart */}
      <div style={{ position: 'relative', marginBottom: 16 }}>
        <svg
          ref={svgRef}
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          style={{ width: '100%', height: 'auto', overflow: 'visible' }}
          preserveAspectRatio="none"
        >
          {/* Grid lines */}
          {[25, 50, 75].map(pct => (
            <line key={pct}
              x1={0} y1={HEIGHT - (pct / 100) * HEIGHT}
              x2={WIDTH} y2={HEIGHT - (pct / 100) * HEIGHT}
              stroke="rgba(255,255,255,0.06)" strokeWidth={1}
            />
          ))}

          {/* Inactive category lines (dim) */}
          {categoryData.map((cat, i) => i !== activeCategory && (
            <path key={cat.name}
              d={pointsToPath(cat.points)}
              fill="none"
              stroke={cat.color}
              strokeWidth={1}
              opacity={0.15}
              strokeLinecap="round"
            />
          ))}

          {/* Active category: gradient fill */}
          <defs>
            <linearGradient id="area-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={active.color} stopOpacity={0.15} />
              <stop offset="100%" stopColor={active.color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <path
            d={`${pointsToPath(active.points)} L ${WIDTH} ${HEIGHT} L 0 ${HEIGHT} Z`}
            fill="url(#area-grad)"
          />

          {/* Active category: main line */}
          <path
            className="category-path"
            d={pointsToPath(active.points)}
            fill="none"
            stroke={active.color}
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeDasharray="800"
            style={{ filter: `drop-shadow(0 0 6px ${active.color}60)` }}
          />

          {/* End dot (live) */}
          {(() => {
            const stepX = WIDTH / (POINTS - 1);
            const lastVal = active.points[POINTS - 1];
            const x = (POINTS - 1) * stepX;
            const y = HEIGHT - (lastVal / 100) * HEIGHT;
            return (
              <g>
                <circle cx={x} cy={y} r={5} fill={active.color} />
                <circle cx={x} cy={y} r={10} fill={active.color} opacity={0.2}>
                  <animate attributeName="r" values="5;14;5" dur="2s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0.4;0;0.4" dur="2s" repeatCount="indefinite" />
                </circle>
              </g>
            );
          })()}
        </svg>
      </div>

      {/* Mini stats row */}
      <div style={{
        display: 'flex', gap: 16,
        borderTop: '1px solid rgba(255,255,255,0.06)',
        paddingTop: 16,
        flexWrap: 'wrap',
      }}>
        {[
          { label: 'Peak 30d', value: `${Math.round(Math.max(...active.points))}` },
          { label: 'Avg 30d', value: `${Math.round(active.points.reduce((a, b) => a + b, 0) / active.points.length)}` },
          { label: 'Velocity', value: active.points[POINTS - 1] > active.points[POINTS - 6] ? '↑ Rising' : '↓ Cooling' },
          { label: 'Signal', value: active.baseIndex > 65 ? 'Strong' : active.baseIndex > 40 ? 'Moderate' : 'Weak' },
        ].map(s => (
          <div key={s.label}>
            <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'Space Grotesk, monospace' }}>{s.label}</p>
            <p style={{ fontSize: 14, fontWeight: 700, color: '#FFFFFF', fontFamily: 'Space Grotesk, sans-serif' }}>{s.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
