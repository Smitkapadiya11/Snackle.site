"use client";

import { PythonProductAnalysis } from "@/lib/python-types";

interface SeasonalHeatmapProps {
  product: PythonProductAnalysis;
}

const MONTH_NAMES_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function intensityToColor(intensity: number): string {
  if (intensity <= 0.3) return "rgba(255,255,255,0.04)";
  if (intensity <= 0.6) return "rgba(252,163,17,0.12)";
  if (intensity <= 0.8) return "rgba(252,163,17,0.25)";
  if (intensity <= 1.0) return "rgba(252,163,17,0.45)";
  if (intensity <= 1.3) return "rgba(252,163,17,0.65)";
  if (intensity <= 1.6) return "rgba(252,163,17,0.80)";
  return "rgba(252,163,17,1.0)";
}

function intensityToTextColor(intensity: number): string {
  if (intensity <= 0.6) return "rgba(255,255,255,0.4)";
  if (intensity <= 1.0) return "rgba(255,255,255,0.7)";
  return "#000";
}

export default function SeasonalHeatmap({ product }: SeasonalHeatmapProps) {
  const seasonal = product.seasonal;
  const heatmapData = seasonal?.heatmap_data || [];
  const upcomingEvents = seasonal?.upcoming_events?.slice(0, 4) || [];
  const patterns = seasonal?.seasonal_patterns;
  const monthlyFactors = patterns?.monthly_factors || {};

  // Fill all 12 months, merging historical data where available
  const allMonths = Array.from({ length: 12 }, (_, i) => {
    const month = i + 1;
    const historical = heatmapData.find(d => d.month === month);
    const factor = monthlyFactors[String(month)] || 1.0;

    return {
      month,
      month_name: MONTH_NAMES_SHORT[i],
      avg_daily: historical?.avg_daily || 0,
      total: historical?.total || 0,
      intensity: historical?.intensity || factor,
      has_data: !!historical,
    };
  });

  const maxIntensity = Math.max(...allMonths.map(m => m.intensity), 1);
  const normalizedMonths = allMonths.map(m => ({
    ...m,
    normalized_intensity: m.intensity / maxIntensity,
  }));

  return (
    <div>
      {/* Monthly heatmap grid */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(12, 1fr)",
        gap: 4,
        marginBottom: 12,
      }}>
        {normalizedMonths.map((m) => (
          <div
            key={m.month}
            title={`${m.month_name}: ${m.has_data ? `avg ${m.avg_daily.toFixed(1)} units/day` : `factor ${m.intensity.toFixed(2)}×`}`}
            style={{
              background: intensityToColor(m.intensity),
              border: `1px solid rgba(252,163,17,${Math.min(0.5, m.intensity * 0.2)})`,
              borderRadius: 6,
              padding: "8px 4px",
              textAlign: "center",
              transition: "transform 0.2s ease",
              cursor: "default",
            }}
          >
            <div style={{
              fontSize: 10,
              fontWeight: 600,
              color: intensityToTextColor(m.intensity),
              marginBottom: 3,
            }}>
              {m.month_name}
            </div>
            <div style={{
              fontSize: 11,
              fontWeight: 700,
              color: m.intensity > 1 ? (m.intensity > 1.5 ? "#000" : "#FCA311") : "rgba(255,255,255,0.4)",
            }}>
              {m.intensity >= 1 ? "+" : ""}{Math.round((m.intensity - 1) * 100)}%
            </div>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
        <span style={{ fontSize: 10, color: "rgba(255,255,255,0.4)" }}>Low</span>
        {[0.2, 0.4, 0.7, 1.0, 1.3, 1.6, 2.0].map((v) => (
          <div
            key={v}
            style={{
              width: 16,
              height: 16,
              borderRadius: 3,
              background: intensityToColor(v),
              border: "1px solid rgba(255,255,255,0.1)",
            }}
          />
        ))}
        <span style={{ fontSize: 10, color: "rgba(255,255,255,0.4)" }}>Peak</span>
      </div>

      {/* Seasonality strength */}
      {patterns && (
        <div style={{
          display: "flex",
          gap: 12,
          marginBottom: 16,
          flexWrap: "wrap",
        }}>
          <div style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 8,
            padding: "8px 12px",
            flex: 1,
          }}>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>Seasonality</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: "#FCA311" }}>
              {patterns.has_seasonality ? "Seasonal" : "Flat"}
            </div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)" }}>
              Strength: {Math.round(patterns.seasonality_strength * 100)}%
            </div>
          </div>
          <div style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 8,
            padding: "8px 12px",
            flex: 1,
          }}>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>Peak Months</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#22c55e" }}>
              {patterns.peak_months.map(m => MONTH_NAMES_SHORT[m - 1]).join(", ")}
            </div>
          </div>
          <div style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 8,
            padding: "8px 12px",
            flex: 1,
          }}>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>Slow Months</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "rgba(255,255,255,0.5)" }}>
              {patterns.trough_months.map(m => MONTH_NAMES_SHORT[m - 1]).join(", ")}
            </div>
          </div>
        </div>
      )}

      {/* Upcoming events */}
      {upcomingEvents.length > 0 && (
        <div>
          <div style={{
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: "rgba(255,255,255,0.4)",
            marginBottom: 10,
          }}>
            Upcoming Events
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {upcomingEvents.map((event, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "8px 12px",
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: 8,
                }}
              >
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.85)" }}>
                    {event.name}
                  </div>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>
                    {MONTH_NAMES_SHORT[event.month - 1]} · {event.months_away === 0 ? "This month" : `${event.months_away} months away`}
                  </div>
                </div>
                <div style={{
                  fontSize: 14,
                  fontWeight: 700,
                  color: event.uplift_factor > 2 ? "#FCA311" : event.uplift_factor > 1.3 ? "#22c55e" : "rgba(255,255,255,0.6)",
                  textAlign: "right",
                }}>
                  +{Math.round((event.uplift_factor - 1) * 100)}%
                  <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", fontWeight: 400 }}>demand boost</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
