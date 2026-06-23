'use client';
import { useEffect, useRef } from 'react';

interface Cell {
  row: string;   // X, Y, Z (variability)
  col: string;   // A, B, C (value)
  brands: string[];
  opportunity: string;
  count: number;
  highlight?: boolean; // is user's product here?
}

const CELLS: Cell[] = [
  { row: 'X', col: 'A', brands: ['Mamaearth Vit C', 'Plum SPF50'], count: 12, opportunity: 'Defend aggressively. High value, predictable.', highlight: false },
  { row: 'X', col: 'B', brands: ['WOW Shampoo', 'Beardo Oil'], count: 23, opportunity: 'Volume play. Consistent movers.', highlight: true },
  { row: 'X', col: 'C', brands: ['Generic Face Wash'], count: 8, opportunity: 'Automate reorder. Low effort.', highlight: false },
  { row: 'Y', col: 'A', brands: ['Niacinamide 10%'], count: 7, opportunity: 'Seasonal stock — plan 60d ahead.', highlight: false },
  { row: 'Y', col: 'B', brands: ['Caffeine Eye Cream', 'AHA Toner'], count: 18, opportunity: 'Watch closely. Good but variable.', highlight: true },
  { row: 'Y', col: 'C', brands: ['Night Cream 50ml'], count: 31, opportunity: 'Review assortment. Many low-value.', highlight: false },
  { row: 'Z', col: 'A', brands: ['New Viral SKU'], count: 3, opportunity: 'Opportunity unlock. Spike incoming?', highlight: false },
  { row: 'Z', col: 'B', brands: ['Beard Balm Premium'], count: 9, opportunity: 'Test and learn. High risk/reward.', highlight: false },
  { row: 'Z', col: 'C', brands: ['Old formula clearance'], count: 44, opportunity: 'Dead stock candidates. Clear now.', highlight: false },
];

const VALUE_COLORS: Record<string, string> = {
  A: 'rgba(252,163,17,0.6)',   // gold
  B: 'rgba(59,130,246,0.5)',   // blue
  C: 'rgba(255,255,255,0.15)', // dim
};

const VARIABILITY_LABELS: Record<string, string> = {
  X: 'X — Predictable',
  Y: 'Y — Variable',
  Z: 'Z — Erratic',
};

export function MarketHeatmap() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    import('animejs').then(({ animate, stagger }) => {
      animate('.heatmap-cell', {
        opacity: [0, 1],
        scale: [0.85, 1],
        delay: stagger(40, { grid: [3, 3], from: 'center' }),
        duration: 600,
        easing: 'easeOutExpo',
      });
    });
  }, []);

  return (
    <div style={{
      background: 'rgba(255,255,255,0.02)',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: 16,
      padding: 24,
    }}>
      <div style={{ marginBottom: 20 }}>
        <p style={{
          fontFamily: 'Space Grotesk, monospace',
          fontSize: 10, letterSpacing: '0.12em',
          textTransform: 'uppercase', color: '#a78bfa',
          marginBottom: 6,
        }}>Market Classification</p>
        <h3 style={{
          fontFamily: 'Space Grotesk, sans-serif',
          fontSize: 18, fontWeight: 700, color: '#FFFFFF',
          marginBottom: 4,
        }}>Market ABC-XYZ Heatmap</h3>
        <p style={{
          fontSize: 12, color: 'rgba(255,255,255,0.35)',
          fontFamily: 'Space Grotesk, sans-serif',
        }}>Where your category&apos;s products sit. Your SKUs marked ◆</p>
      </div>

      {/* Column headers A B C */}
      <div style={{ display: 'grid', gridTemplateColumns: '80px repeat(3, 1fr)', gap: 6, marginBottom: 6 }}>
        <div />
        {['A — High Value', 'B — Mid', 'C — Low'].map(label => (
          <div key={label} style={{
            textAlign: 'center',
            fontFamily: 'Space Grotesk, monospace',
            fontSize: 9, letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: 'rgba(255,255,255,0.3)',
          }}>{label}</div>
        ))}
      </div>

      {/* Grid */}
      <div ref={containerRef}>
        {['X', 'Y', 'Z'].map((row) => (
          <div key={row} style={{
            display: 'grid',
            gridTemplateColumns: '80px repeat(3, 1fr)',
            gap: 6, marginBottom: 6,
          }}>
            {/* Row label */}
            <div style={{
              display: 'flex', alignItems: 'center',
              fontFamily: 'Space Grotesk, monospace',
              fontSize: 9, letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: 'rgba(255,255,255,0.3)',
              paddingRight: 8,
            }}>
              {VARIABILITY_LABELS[row].split(' — ')[0]}<br/>
              <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: 8 }}>
                {VARIABILITY_LABELS[row].split(' — ')[1]}
              </span>
            </div>

            {['A', 'B', 'C'].map((col) => {
              const cell = CELLS.find(c => c.row === row && c.col === col)!;
              return (
                <div key={col} className="heatmap-cell" style={{
                  background: VALUE_COLORS[col],
                  border: cell.highlight
                    ? '1.5px solid rgba(252,163,17,0.8)'
                    : '1px solid rgba(255,255,255,0.06)',
                  borderRadius: 8,
                  padding: 10,
                  opacity: 0,
                  cursor: 'default',
                  transition: 'transform 0.15s, filter 0.15s',
                  position: 'relative',
                }}
                title={cell.opportunity}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLDivElement).style.transform = 'scale(1.04)';
                  (e.currentTarget as HTMLDivElement).style.filter = 'brightness(1.3)';
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLDivElement).style.transform = 'scale(1)';
                  (e.currentTarget as HTMLDivElement).style.filter = 'brightness(1)';
                }}>
                  {cell.highlight && (
                    <span style={{
                      position: 'absolute', top: 4, right: 6,
                      fontSize: 9, color: '#FCA311',
                    }}>◆</span>
                  )}
                  <p style={{
                    fontFamily: 'Space Grotesk, monospace',
                    fontSize: 16, fontWeight: 800,
                    color: '#FFFFFF', lineHeight: 1,
                    marginBottom: 2,
                  }}>{cell.count}</p>
                  <p style={{
                    fontFamily: 'Space Grotesk, sans-serif',
                    fontSize: 8, color: 'rgba(255,255,255,0.5)',
                    lineHeight: 1.3,
                  }}>SKUs in {row}{col}</p>
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div style={{
        marginTop: 16,
        borderTop: '1px solid rgba(255,255,255,0.06)',
        paddingTop: 12,
        display: 'flex', alignItems: 'center', gap: 12,
        flexWrap: 'wrap',
      }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10, color: 'rgba(255,255,255,0.3)', fontFamily: 'Space Grotesk, sans-serif' }}>
          <span style={{ color: '#FCA311' }}>◆</span> Your SKUs
        </span>
        <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)', fontFamily: 'Space Grotesk, sans-serif' }}>Hover cell for market insight</span>
      </div>
    </div>
  );
}
