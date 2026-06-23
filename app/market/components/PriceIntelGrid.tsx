'use client';
import { useState } from 'react';

interface PriceRow {
  product: string;
  category: string;
  yourPrice: number;
  marketAvg: number;
  lowestCompetitor: number;
  highestCompetitor: number;
  position: 'underpriced' | 'competitive' | 'premium';
}

const DATA: PriceRow[] = [
  { product: 'Vitamin C Serum 30ml', category: 'Skincare', yourPrice: 599, marketAvg: 649, lowestCompetitor: 449, highestCompetitor: 899, position: 'competitive' },
  { product: 'Hyaluronic Acid 50ml', category: 'Skincare', yourPrice: 399, marketAvg: 529, lowestCompetitor: 349, highestCompetitor: 799, position: 'underpriced' },
  { product: 'SPF 50 Sunscreen 60g', category: 'Skincare', yourPrice: 849, marketAvg: 699, lowestCompetitor: 399, highestCompetitor: 1200, position: 'premium' },
  { product: 'Face Wash Salicylic 100ml', category: 'Skincare', yourPrice: 299, marketAvg: 319, lowestCompetitor: 199, highestCompetitor: 499, position: 'competitive' },
  { product: 'Hair Oil Bhringraj 200ml', category: 'Haircare', yourPrice: 249, marketAvg: 349, lowestCompetitor: 179, highestCompetitor: 599, position: 'underpriced' },
];

const POSITION_CONFIG = {
  underpriced: { label: 'UNDERPRICED', color: '#22c55e', bg: 'rgba(34,197,94,0.12)', tip: 'You can raise by ₹50–80' },
  competitive: { label: 'COMPETITIVE', color: '#FCA311', bg: 'rgba(252,163,17,0.12)', tip: 'Hold price, defend share' },
  premium: { label: 'PREMIUM', color: '#3b82f6', bg: 'rgba(59,130,246,0.12)', tip: 'Justify with quality' },
};

export function PriceIntelGrid() {
  const [hovered, setHovered] = useState<number | null>(null);

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
          textTransform: 'uppercase', color: '#3b82f6',
          marginBottom: 6,
        }}>Price Radar</p>
        <h3 style={{
          fontFamily: 'Space Grotesk, sans-serif',
          fontSize: 18, fontWeight: 700, color: '#FFFFFF',
        }}>Price Intelligence</h3>
      </div>

      {/* Table */}
      <div>
        {/* Header */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 70px 70px 90px',
          gap: 8,
          padding: '0 8px 8px',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          marginBottom: 8,
        }}>
          {['Product', 'You', 'Mkt Avg', 'Position'].map(h => (
            <span key={h} style={{
              fontSize: 9, letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: 'rgba(255,255,255,0.25)',
              fontFamily: 'Space Grotesk, monospace',
            }}>{h}</span>
          ))}
        </div>

        {DATA.map((row, i) => {
          const cfg = POSITION_CONFIG[row.position];
          const gap = row.marketAvg - row.yourPrice;

          return (
            <div key={i}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 70px 70px 90px',
                gap: 8,
                padding: '10px 8px',
                borderRadius: 8,
                cursor: 'default',
                background: hovered === i ? 'rgba(255,255,255,0.03)' : 'transparent',
                transition: 'background 0.15s',
                marginBottom: 2,
                position: 'relative',
              }}>
              <div>
                <p style={{
                  fontSize: 12, fontWeight: 500,
                  color: '#FFFFFF',
                  fontFamily: 'Space Grotesk, sans-serif',
                  marginBottom: 2,
                }}>{row.product}</p>
                <p style={{
                  fontSize: 10,
                  color: 'rgba(255,255,255,0.3)',
                  fontFamily: 'Space Grotesk, sans-serif',
                }}>{row.category}</p>
              </div>
              <div style={{ alignSelf: 'center' }}>
                <span style={{
                  fontFamily: 'Space Grotesk, monospace',
                  fontSize: 13, fontWeight: 700,
                  color: '#FFFFFF',
                }}>₹{row.yourPrice}</span>
              </div>
              <div style={{ alignSelf: 'center' }}>
                <span style={{
                  fontFamily: 'Space Grotesk, monospace',
                  fontSize: 12,
                  color: 'rgba(255,255,255,0.5)',
                }}>₹{row.marketAvg}</span>
                {hovered === i && (
                  <p style={{
                    fontSize: 9,
                    color: gap > 0 ? '#22c55e' : '#ef4444',
                    fontFamily: 'Space Grotesk, monospace',
                  }}>
                    {gap > 0 ? `+₹${gap}` : `−₹${Math.abs(gap)}`} gap
                  </p>
                )}
              </div>
              <div style={{ alignSelf: 'center' }}>
                <span style={{
                  fontFamily: 'Space Grotesk, monospace',
                  fontSize: 9, letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: cfg.color,
                  background: cfg.bg,
                  padding: '3px 8px', borderRadius: 100,
                  display: 'inline-block',
                }}>{cfg.label}</span>
                {hovered === i && (
                  <p style={{
                    fontSize: 9,
                    color: 'rgba(255,255,255,0.4)',
                    marginTop: 4,
                    fontFamily: 'Space Grotesk, sans-serif',
                  }}>{cfg.tip}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div style={{
        display: 'flex', gap: 12, marginTop: 16,
        borderTop: '1px solid rgba(255,255,255,0.06)',
        paddingTop: 12, flexWrap: 'wrap',
      }}>
        {Object.entries(POSITION_CONFIG).map(([key, cfg]) => (
          <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{
              width: 6, height: 6, borderRadius: '50%',
              background: cfg.color, display: 'inline-block',
            }} />
            <span style={{
              fontSize: 10,
              color: 'rgba(255,255,255,0.35)',
              fontFamily: 'Space Grotesk, monospace',
            }}>{cfg.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
