'use client';
import { useEffect, useState, useRef } from 'react';

const PANEL_STYLE = {
  background: 'rgba(255,255,255,0.02)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 16,
  padding: 24,
  height: '100%',
};

// Simulated Indian D2C competitor data
const BRANDS = [
  { name: 'Mamaearth', category: 'Skincare', skus: 47, oos: 8, trend: 'up' },
  { name: 'Pilgrim', category: 'Skincare', skus: 31, oos: 3, trend: 'stable' },
  { name: 'WOW Skin Science', category: 'Haircare', skus: 62, oos: 14, trend: 'down' },
  { name: 'Plum Goodness', category: 'Skincare', skus: 38, oos: 2, trend: 'up' },
  { name: 'mCaffeine', category: 'Bodycare', skus: 29, oos: 11, trend: 'down' },
  { name: 'Minimalist', category: 'Skincare', skus: 24, oos: 6, trend: 'stable' },
  { name: 'Beardo', category: 'Grooming', skus: 43, oos: 1, trend: 'up' },
];

function getTrendArrow(trend: string) {
  if (trend === 'up') return { icon: '↑', color: '#22c55e' };
  if (trend === 'down') return { icon: '↓', color: '#ef4444' };
  return { icon: '→', color: 'rgba(255,255,255,0.4)' };
}

export function CompetitorTracker() {
  const [competitors, setCompetitors] = useState(BRANDS);
  const [selected, setSelected] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState('just now');
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Simulate live OOS changes every 8 seconds
    const interval = setInterval(() => {
      setCompetitors(prev => prev.map(b => ({
        ...b,
        oos: Math.max(0, b.oos + (Math.random() > 0.6 ? 1 : Math.random() > 0.7 ? -1 : 0)),
      })));
      setLastUpdate('just now');
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={PANEL_STYLE}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
        <div>
          <p style={{
            fontFamily: 'Space Grotesk, monospace',
            fontSize: 10, letterSpacing: '0.12em',
            textTransform: 'uppercase', color: '#FCA311',
            marginBottom: 6,
          }}>Live Competitor Radar</p>
          <h3 style={{
            fontFamily: 'Space Grotesk, sans-serif',
            fontSize: 18, fontWeight: 700, color: '#FFFFFF',
          }}>Competitor Tracker</h3>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{
            width: 7, height: 7, borderRadius: '50%',
            background: '#22c55e',
            boxShadow: '0 0 6px #22c55e',
            display: 'inline-block',
            animation: 'live-pulse 2s ease-in-out infinite',
          }} />
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>
            Updated {lastUpdate}
          </span>
        </div>
      </div>

      {/* Column headers */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 80px 60px 50px',
        gap: 8, marginBottom: 10,
        padding: '0 8px',
      }}>
        {['Brand', 'Category', 'SKUs', 'OOS'].map(h => (
          <span key={h} style={{
            fontSize: 10, letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: 'rgba(255,255,255,0.25)',
            fontFamily: 'Space Grotesk, monospace',
          }}>{h}</span>
        ))}
      </div>

      {/* Rows */}
      <div ref={containerRef}>
        {competitors.map((brand, i) => {
          const trend = getTrendArrow(brand.trend);
          const oosRate = Math.round((brand.oos / brand.skus) * 100);
          const isHigh = oosRate >= 20;
          const isMed = oosRate >= 10;

          return (
            <div
              key={brand.name}
              onClick={() => setSelected(selected === brand.name ? null : brand.name)}
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 80px 60px 50px',
                gap: 8,
                padding: '12px 8px',
                borderRadius: 8,
                cursor: 'pointer',
                transition: 'background 0.15s',
                marginBottom: 2,
                background: selected === brand.name
                  ? 'rgba(252,163,17,0.06)'
                  : 'transparent',
                borderLeft: selected === brand.name
                  ? '2px solid rgba(252,163,17,0.4)'
                  : '2px solid transparent',
              }}
              onMouseEnter={e => {
                if (selected !== brand.name)
                  (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.03)';
              }}
              onMouseLeave={e => {
                if (selected !== brand.name)
                  (e.currentTarget as HTMLDivElement).style.background = 'transparent';
              }}
            >
              {/* Brand name */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{
                  width: 28, height: 28, borderRadius: 6,
                  background: `hsl(${(i * 47) % 360}, 60%, 20%)`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 11, fontWeight: 700,
                  color: `hsl(${(i * 47) % 360}, 80%, 70%)`,
                  flexShrink: 0,
                  fontFamily: 'Space Grotesk, sans-serif',
                }}>
                  {brand.name[0]}
                </span>
                <span style={{
                  fontSize: 13, fontWeight: 500,
                  color: '#FFFFFF',
                  fontFamily: 'Space Grotesk, sans-serif',
                }}>{brand.name}</span>
              </div>

              {/* Category */}
              <span style={{
                fontSize: 11, color: 'rgba(255,255,255,0.4)',
                fontFamily: 'Space Grotesk, sans-serif',
                alignSelf: 'center',
              }}>{brand.category}</span>

              {/* SKUs */}
              <span style={{
                fontSize: 13, fontWeight: 500,
                color: 'rgba(255,255,255,0.7)',
                fontFamily: 'Space Grotesk, monospace',
                alignSelf: 'center',
              }}>{brand.skus}</span>

              {/* OOS count + indicator */}
              <div style={{ alignSelf: 'center' }}>
                <span style={{
                  display: 'inline-block',
                  background: isHigh
                    ? 'rgba(239,68,68,0.15)'
                    : isMed
                    ? 'rgba(252,163,17,0.12)'
                    : 'rgba(34,197,94,0.12)',
                  color: isHigh ? '#ef4444' : isMed ? '#FCA311' : '#22c55e',
                  fontFamily: 'Space Grotesk, monospace',
                  fontSize: 12, fontWeight: 700,
                  padding: '2px 8px', borderRadius: 100,
                }}>
                  {brand.oos}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer note */}
      <p style={{
        marginTop: 16,
        fontSize: 11, color: 'rgba(255,255,255,0.2)',
        textAlign: 'center',
        fontFamily: 'Space Grotesk, sans-serif',
      }}>
        OOS = Out of Stock SKUs · Simulated market data · Updates every 8s
      </p>
    </div>
  );
}
