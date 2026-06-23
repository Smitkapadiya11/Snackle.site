'use client';
import { useEffect, useRef } from 'react';

export function MarketIntelSection() {
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(async ([entry]) => {
      if (entry.isIntersecting) {
        const { animate, stagger } = await import('animejs');
        animate('.market-card-preview', {
          opacity: [0, 1],
          translateY: [50, 0],
          scale: [0.95, 1],
          delay: stagger(120),
          duration: 700,
          easing: 'easeOutExpo',
        });
        animate('.market-intel-heading', {
          opacity: [0, 1],
          translateY: [30, 0],
          duration: 800,
          easing: 'easeOutExpo',
        });
        observer.disconnect();
      }
    }, { threshold: 0.15 });

    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section ref={sectionRef} style={{
      background: '#080808',
      padding: '120px 24px',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Amber grid lines background */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: `
          linear-gradient(rgba(252,163,17,0.04) 1px, transparent 1px),
          linear-gradient(90deg, rgba(252,163,17,0.04) 1px, transparent 1px)
        `,
        backgroundSize: '60px 60px',
        pointerEvents: 'none',
      }} />

      <div style={{ maxWidth: 1100, margin: '0 auto', position: 'relative' }}>
        {/* Eyebrow */}
        <p style={{
          fontFamily: 'Space Grotesk, monospace',
          fontSize: 11,
          letterSpacing: '0.15em',
          textTransform: 'uppercase',
          color: '#FCA311',
          marginBottom: 24,
          textAlign: 'center',
        }}>Snackle 2.0 — Coming Next</p>

        {/* Heading */}
        <h2 className="market-intel-heading" style={{
          fontFamily: 'Space Grotesk, sans-serif',
          fontSize: 'clamp(36px, 5vw, 64px)',
          fontWeight: 700,
          color: '#FFFFFF',
          textAlign: 'center',
          lineHeight: 1.05,
          marginBottom: 20,
          opacity: 0,
        }}>
          Your market.<br />
          <span style={{ color: '#FCA311' }}>Live. Now.</span>
        </h2>

        <p style={{
          color: 'rgba(255,255,255,0.5)',
          fontSize: 18,
          textAlign: 'center',
          maxWidth: 560,
          margin: '0 auto 64px',
          lineHeight: 1.6,
        }}>
          Track every competitor&apos;s stock. Detect demand before it moves.
          Strike when the market opens — not after.
        </p>

        {/* Preview Cards Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: 20,
          marginBottom: 48,
        }}>
          {[
            {
              icon: '⚡',
              title: 'Competitor Out-of-Stock Alerts',
              description: 'Real-time detection when competitors go OOS on Amazon, Flipkart, and Meesho. Your opportunity window opens — Snackle tells you exactly how to exploit it.',
              badge: 'LIVE TRACKING',
              color: '#FCA311',
            },
            {
              icon: '📈',
              title: 'Category Demand Pulse',
              description: 'Live demand signals by category. See trending SKUs, rising search intent, and seasonal spikes before your competitors can react.',
              badge: 'REAL-TIME',
              color: '#22c55e',
            },
            {
              icon: '₹',
              title: 'Price Intelligence Grid',
              description: 'Cross-brand price comparison across every SKU in your category. Know when you\'re overpriced, undercut competitors, or leaving margin on the table.',
              badge: 'PRICE RADAR',
              color: '#3b82f6',
            },
          ].map((card, i) => (
            <div key={i} className="market-card-preview" style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 16,
              padding: 28,
              opacity: 0,
              transition: 'border-color 0.2s, background 0.2s',
              cursor: 'default',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(252,163,17,0.3)';
              (e.currentTarget as HTMLDivElement).style.background = 'rgba(252,163,17,0.04)';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255,255,255,0.08)';
              (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.03)';
            }}>
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                fontFamily: 'Space Grotesk, monospace',
                fontSize: 10,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: card.color,
                border: `1px solid ${card.color}30`,
                padding: '3px 10px',
                borderRadius: 100,
                marginBottom: 16,
              }}>
                <span style={{
                  width: 6, height: 6,
                  borderRadius: '50%',
                  background: card.color,
                  animation: 'pulse-dot 2s ease-in-out infinite',
                  display: 'inline-block',
                }} />
                {card.badge}
              </span>
              <div style={{ fontSize: 28, marginBottom: 12 }}>{card.icon}</div>
              <h3 style={{
                fontFamily: 'Space Grotesk, sans-serif',
                fontSize: 18,
                fontWeight: 600,
                color: '#FFFFFF',
                marginBottom: 12,
              }}>{card.title}</h3>
              <p style={{
                color: 'rgba(255,255,255,0.5)',
                fontSize: 14,
                lineHeight: 1.6,
              }}>{card.description}</p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div style={{ textAlign: 'center' }}>
          <a href="/market" style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 10,
            background: 'rgba(252,163,17,0.1)',
            border: '1px solid rgba(252,163,17,0.4)',
            color: '#FCA311',
            fontFamily: 'Space Grotesk, sans-serif',
            fontWeight: 600,
            fontSize: 15,
            padding: '14px 32px',
            borderRadius: 8,
            textDecoration: 'none',
            transition: 'all 0.2s',
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLAnchorElement).style.background = '#FCA311';
            (e.currentTarget as HTMLAnchorElement).style.color = '#080808';
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLAnchorElement).style.background = 'rgba(252,163,17,0.1)';
            (e.currentTarget as HTMLAnchorElement).style.color = '#FCA311';
          }}>
            Explore Market Intelligence →
          </a>
        </div>
      </div>

      <style>{`
        @keyframes pulse-dot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(0.7); }
        }
      `}</style>
    </section>
  );
}
