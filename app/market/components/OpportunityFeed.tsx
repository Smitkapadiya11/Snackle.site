'use client';
import { useEffect, useState, useRef } from 'react';

interface Opportunity {
  id: number;
  type: 'OOS_GAP' | 'PRICE_DROP' | 'DEMAND_SPIKE' | 'RESTOCK_SIGNAL';
  brand: string;
  product: string;
  message: string;
  action: string;
  timestamp: Date;
  value: string;
  urgency: 'HIGH' | 'MEDIUM' | 'LOW';
}

const TYPE_CONFIG = {
  OOS_GAP: { label: 'OOS GAP', color: '#FCA311', icon: '⚡' },
  PRICE_DROP: { label: 'PRICE DROP', color: '#3b82f6', icon: '₹' },
  DEMAND_SPIKE: { label: 'DEMAND SPIKE', color: '#22c55e', icon: '📈' },
  RESTOCK_SIGNAL: { label: 'RESTOCK', color: '#a78bfa', icon: '🔄' },
};

const URGENCY_COLOR = {
  HIGH: '#ef4444',
  MEDIUM: '#FCA311',
  LOW: 'rgba(255,255,255,0.3)',
};

// Seeded feed generator
const FEED_TEMPLATES = [
  { type: 'OOS_GAP' as const, brand: 'Mamaearth', product: 'Vitamin C Face Wash 200ml', message: 'OOS on Amazon since 47 mins', action: 'Increase ads budget now', value: '₹2.4L opp.', urgency: 'HIGH' as const },
  { type: 'DEMAND_SPIKE' as const, brand: 'Market', product: 'Niacinamide Serum 30ml', message: '+340% search volume today', action: 'Stock up before competitors', value: '↑ 340%', urgency: 'HIGH' as const },
  { type: 'PRICE_DROP' as const, brand: 'WOW Skin', product: 'Apple Cider Vinegar Shampoo', message: 'Dropped ₹50 — now ₹299', action: 'Match price or differentiate', value: '−₹50', urgency: 'MEDIUM' as const },
  { type: 'OOS_GAP' as const, brand: 'mCaffeine', product: 'Coffee Face Scrub 100g', message: 'OOS on Flipkart · 2h 20min', action: 'Run targeted campaign', value: '₹89K gap', urgency: 'HIGH' as const },
  { type: 'RESTOCK_SIGNAL' as const, brand: 'Minimalist', product: '2% Salicylic Acid Cleanser', message: 'Restocking after 18-day OOS', action: 'Prepare counter-promotion', value: 'Threat incoming', urgency: 'MEDIUM' as const },
  { type: 'DEMAND_SPIKE' as const, brand: 'Market', product: 'SPF 50 Sunscreen Gel', message: 'Summer spike detected early', action: 'Stock 3x normal qty', value: '↑ 180%', urgency: 'HIGH' as const },
  { type: 'PRICE_DROP' as const, brand: 'Plum', product: 'Green Tea Pore Cleansing Face Wash', message: '15% sale started on D2C site', action: 'Monitor conversion impact', value: '15% off', urgency: 'LOW' as const },
  { type: 'OOS_GAP' as const, brand: 'Beardo', product: 'Beard Oil Godfather 30ml', message: 'OOS across Amazon + Flipkart', action: 'Dominate grooming category', value: '₹1.1L gap', urgency: 'HIGH' as const },
];

export function OpportunityFeed() {
  const [feed, setFeed] = useState<Opportunity[]>(() =>
    FEED_TEMPLATES.slice(0, 5).map((t, i) => ({
      ...t,
      id: i,
      timestamp: new Date(Date.now() - i * 180000),
    }))
  );
  const feedRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Add new opportunities every 12 seconds
    let nextId = 100;
    const interval = setInterval(() => {
      const template = FEED_TEMPLATES[Math.floor(Math.random() * FEED_TEMPLATES.length)];
      const newOpp: Opportunity = { ...template, id: nextId++, timestamp: new Date() };
      setFeed(prev => [newOpp, ...prev.slice(0, 6)]);

      // Flash the top card
      setTimeout(() => {
        import('animejs').then(({ animate }) => {
          animate('.opp-card:first-child', {
            backgroundColor: ['rgba(252,163,17,0.15)', 'rgba(255,255,255,0.02)'],
            duration: 1200,
            easing: 'easeOutExpo',
          });
        });
      }, 50);
    }, 12000);
    return () => clearInterval(interval);
  }, []);

  function timeAgo(date: Date): string {
    const secs = Math.floor((Date.now() - date.getTime()) / 1000);
    if (secs < 60) return `${secs}s ago`;
    const mins = Math.floor(secs / 60);
    if (mins < 60) return `${mins}m ago`;
    return `${Math.floor(mins / 60)}h ago`;
  }

  return (
    <div style={{
      background: 'rgba(255,255,255,0.02)',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: 16,
      padding: 24,
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
        <div>
          <p style={{
            fontFamily: 'Space Grotesk, monospace',
            fontSize: 10, letterSpacing: '0.12em',
            textTransform: 'uppercase', color: '#22c55e',
            marginBottom: 6,
          }}>Real-time Alerts</p>
          <h3 style={{
            fontFamily: 'Space Grotesk, sans-serif',
            fontSize: 18, fontWeight: 700, color: '#FFFFFF',
          }}>Opportunity Feed</h3>
        </div>
        <span style={{
          background: 'rgba(34,197,94,0.1)',
          border: '1px solid rgba(34,197,94,0.3)',
          color: '#22c55e',
          fontFamily: 'Space Grotesk, monospace',
          fontSize: 10, letterSpacing: '0.1em',
          padding: '3px 10px', borderRadius: 100,
        }}>LIVE</span>
      </div>

      {/* Feed */}
      <div ref={feedRef} style={{ flex: 1, overflow: 'hidden' }}>
        {feed.map((opp) => {
          const cfg = TYPE_CONFIG[opp.type];
          return (
            <div key={opp.id} className="opp-card" style={{
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: 10,
              padding: '12px 14px',
              marginBottom: 8,
              transition: 'background 0.2s',
              cursor: 'pointer',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(252,163,17,0.25)';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255,255,255,0.06)';
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{
                  fontFamily: 'Space Grotesk, monospace',
                  fontSize: 9, letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  color: cfg.color,
                  background: `${cfg.color}15`,
                  padding: '2px 8px', borderRadius: 100,
                }}>
                  {cfg.icon} {cfg.label}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{
                    width: 5, height: 5, borderRadius: '50%',
                    background: URGENCY_COLOR[opp.urgency],
                    display: 'inline-block',
                  }} />
                  <span style={{
                    fontSize: 10, color: 'rgba(255,255,255,0.25)',
                    fontFamily: 'Space Grotesk, monospace',
                  }}>{timeAgo(opp.timestamp)}</span>
                </div>
              </div>
              <p style={{
                fontSize: 12, fontWeight: 600, color: '#FFFFFF',
                marginBottom: 2,
                fontFamily: 'Space Grotesk, sans-serif',
              }}>{opp.product}</p>
              <p style={{
                fontSize: 11, color: 'rgba(255,255,255,0.45)',
                marginBottom: 6,
                fontFamily: 'Space Grotesk, sans-serif',
              }}>{opp.message}</p>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{
                  fontSize: 11, color: '#FCA311',
                  fontFamily: 'Space Grotesk, sans-serif',
                }}>→ {opp.action}</span>
                <span style={{
                  fontFamily: 'Space Grotesk, monospace',
                  fontSize: 12, fontWeight: 700,
                  color: cfg.color,
                }}>{opp.value}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
