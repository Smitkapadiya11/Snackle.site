'use client';
import { useEffect, useRef, useState } from 'react';
import { CompetitorTracker } from './components/CompetitorTracker';
import { CategoryPulse } from './components/CategoryPulse';
import { PriceIntelGrid } from './components/PriceIntelGrid';
import { OpportunityFeed } from './components/OpportunityFeed';
import { MarketHeatmap } from './components/MarketHeatmap';

export function MarketPage() {
  const heroRef = useRef<HTMLDivElement>(null);
  const [liveCount, setLiveCount] = useState(0);

  useEffect(() => {
    // Animate hero on mount
    import('animejs').then(({ animate, stagger, createTimeline }) => {
      const tl = createTimeline({ defaults: { easing: 'easeOutExpo' } as any });
      tl
        .add('.market-hero-badge', { opacity: [0, 1], translateY: [-10, 0], duration: 500 })
        .add('.market-hero-title span', {
          opacity: [0, 1], translateY: [60, 0], rotateX: [-90, 0],
          delay: stagger(35), duration: 700,
        }, '+=100')
        .add('.market-hero-sub', { opacity: [0, 1], translateY: [20, 0], duration: 600 }, '-=200')
        .add('.market-stat-card', {
          opacity: [0, 1], translateY: [30, 0], scale: [0.95, 1],
          delay: stagger(80), duration: 600,
        }, '-=300')
        .add('.market-section-panel', {
          opacity: [0, 1], translateY: [40, 0],
          delay: stagger(100), duration: 700,
        }, '-=200');
    });

    // Simulate live data counter
    let count = 1247;
    const interval = setInterval(() => {
      count += Math.floor(Math.random() * 3) + 1;
      setLiveCount(count);
    }, 2800);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ background: '#080808', minHeight: '100vh', color: '#FFFFFF' }}>

      {/* ── NAV ── */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: 'rgba(8,8,8,0.85)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        padding: '16px 24px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <a href="/" style={{
          fontFamily: 'Space Grotesk, sans-serif',
          fontWeight: 800, fontSize: 18,
          color: '#FCA311', textDecoration: 'none',
          letterSpacing: '-0.02em',
        }}>SNACKLE.</a>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{
            width: 8, height: 8, borderRadius: '50%',
            background: '#22c55e',
            boxShadow: '0 0 8px #22c55e',
            animation: 'live-pulse 2s ease-in-out infinite',
            display: 'inline-block',
          }} />
          <span style={{
            fontFamily: 'Space Grotesk, monospace',
            fontSize: 11, letterSpacing: '0.1em',
            textTransform: 'uppercase', color: '#22c55e',
          }}>LIVE · {liveCount.toLocaleString('en-IN')} signals today</span>
        </div>
        <a href="/use" style={{
          fontFamily: 'Space Grotesk, sans-serif',
          fontWeight: 600, fontSize: 13,
          color: '#080808', background: '#FCA311',
          padding: '8px 20px', borderRadius: 6,
          textDecoration: 'none',
        }}>Console →</a>
      </nav>

      {/* ── HERO ── */}
      <div ref={heroRef} style={{
        position: 'relative', overflow: 'hidden',
        padding: '100px 24px 80px',
        textAlign: 'center',
      }}>
        {/* Radial glow */}
        <div style={{
          position: 'absolute',
          top: '50%', left: '50%',
          transform: 'translate(-50%,-60%)',
          width: 600, height: 400,
          background: 'radial-gradient(ellipse, rgba(252,163,17,0.12) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        {/* Grid */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: `
            linear-gradient(rgba(252,163,17,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(252,163,17,0.03) 1px, transparent 1px)
          `,
          backgroundSize: '48px 48px', pointerEvents: 'none',
        }} />

        <div style={{ position: 'relative', maxWidth: 900, margin: '0 auto' }}>
          <div className="market-hero-badge" style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            fontFamily: 'Space Grotesk, monospace',
            fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase',
            color: '#FCA311',
            border: '1px solid rgba(252,163,17,0.3)',
            padding: '5px 16px', borderRadius: 100,
            marginBottom: 32,
            opacity: 0,
          }}>
            <span style={{
              width: 6, height: 6, borderRadius: '50%',
              background: '#FCA311',
              animation: 'live-pulse 1.5s ease-in-out infinite',
              display: 'inline-block',
            }} />
            Snackle 2.0 · Market Intelligence
          </div>

          <h1 className="market-hero-title" style={{
            fontFamily: 'Space Grotesk, sans-serif',
            fontSize: 'clamp(44px, 7vw, 88px)',
            fontWeight: 800, lineHeight: 1.0,
            letterSpacing: '-0.03em',
            marginBottom: 28,
          }}>
            {/* Split into spans for letter animation */}
            {'See the market.'.split('').map((c, i) => (
              <span key={`l1-${i}`} style={{ display: 'inline-block', opacity: 0 }}>
                {c === ' ' ? '\u00A0' : c}
              </span>
            ))}
            <br />
            <span style={{ color: '#FCA311' }}>
              {'Before it moves.'.split('').map((c, i) => (
                <span key={`l2-${i}`} style={{ display: 'inline-block', opacity: 0 }}>
                  {c === ' ' ? '\u00A0' : c}
                </span>
              ))}
            </span>
          </h1>

          <p className="market-hero-sub" style={{
            color: 'rgba(255,255,255,0.5)',
            fontSize: 18, lineHeight: 1.6,
            maxWidth: 560, margin: '0 auto 56px',
            opacity: 0,
          }}>
            Real-time competitor stock monitoring. Live demand signals.
            Price intelligence across every SKU in your category.
          </p>

          {/* Live Stats Row */}
          <div style={{
            display: 'flex', flexWrap: 'wrap',
            justifyContent: 'center', gap: 16,
          }}>
            {[
              { label: 'Competitors Tracked', value: '2,400+', sub: 'D2C brands' },
              { label: 'OOS Events Today', value: '183', sub: 'opportunities live' },
              { label: 'Price Changes', value: '4.7K', sub: 'last 24 hours' },
              { label: 'Avg Signal Lag', value: '<2 min', sub: 'near real-time' },
            ].map((stat, i) => (
              <div key={i} className="market-stat-card" style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 12, padding: '20px 28px',
                opacity: 0, minWidth: 160,
              }}>
                <div style={{
                  fontFamily: 'Space Grotesk, sans-serif',
                  fontSize: 28, fontWeight: 700,
                  color: '#FCA311', lineHeight: 1,
                }}>{stat.value}</div>
                <div style={{
                  fontSize: 12, fontWeight: 600,
                  color: '#FFFFFF', marginTop: 6,
                }}>{stat.label}</div>
                <div style={{
                  fontSize: 11, color: 'rgba(255,255,255,0.35)',
                  marginTop: 2,
                }}>{stat.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── DASHBOARD PANELS ── */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px 120px' }}>

        {/* Top row: Competitor Tracker + Opportunity Feed */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
          gap: 20, marginBottom: 20,
        }}>
          <div className="market-section-panel" style={{ opacity: 0 }}>
            <CompetitorTracker />
          </div>
          <div className="market-section-panel" style={{ opacity: 0 }}>
            <OpportunityFeed />
          </div>
        </div>

        {/* Full-width: Category Demand Pulse */}
        <div className="market-section-panel" style={{ opacity: 0, marginBottom: 20 }}>
          <CategoryPulse />
        </div>

        {/* Bottom row: Price Grid + Heatmap */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
          gap: 20,
        }}>
          <div className="market-section-panel" style={{ opacity: 0 }}>
            <PriceIntelGrid />
          </div>
          <div className="market-section-panel" style={{ opacity: 0 }}>
            <MarketHeatmap />
          </div>
        </div>
      </div>

      <style>{`
        @keyframes live-pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.3; transform: scale(0.6); }
        }
      `}</style>
    </div>
  );
}
