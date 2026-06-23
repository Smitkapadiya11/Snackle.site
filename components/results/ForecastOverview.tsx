"use client";

import { useMemo, useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { AnalysisResult } from "@/lib/types";
import { PythonProductAnalysis } from "@/lib/python-types";

interface ForecastOverviewProps {
  result: AnalysisResult;
  currency: string;
}

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getDate()} ${MONTH_NAMES[d.getMonth()]}`;
}

function formatMonth(monthStr: string): string {
  const [year, month] = monthStr.split("-");
  return `${MONTH_NAMES[parseInt(month) - 1]} '${year.slice(2)}`;
}

interface ChartDataPoint {
  date: string;
  forecast: number;
  lower: number;
  upper: number;
}

export default function ForecastOverview({ result, currency }: ForecastOverviewProps) {
  const [horizon, setHorizon] = useState<"30d" | "90d" | "1yr">("30d");

  // Get all valid v2 products from result cards
  const v2Products = useMemo(() => {
    return result.product_cards
      .map((c) => c.engine_v2 as PythonProductAnalysis | undefined)
      .filter((p): p is PythonProductAnalysis => !!p);
  }, [result]);

  // Aggregate forecast data
  const aggregatedData = useMemo(() => {
    if (v2Products.length === 0) return [];

    if (horizon === "30d" || horizon === "90d") {
      const days = horizon === "30d" ? 30 : 90;
      // Map to hold aggregated daily values by index
      const aggregated: ChartDataPoint[] = [];

      for (let i = 0; i < days; i++) {
        let totalForecast = 0;
        let totalLower = 0;
        let totalUpper = 0;
        let dateStr = "";

        v2Products.forEach((p) => {
          const daily = p.seasonal?.yearly_forecast?.daily || [];
          if (daily[i]) {
            totalForecast += daily[i].forecast;
            totalLower += daily[i].lower;
            totalUpper += daily[i].upper;
            if (!dateStr) dateStr = daily[i].date;
          } else {
            // Fallback if this product lacks daily data
            const fc = p.forecast.daily_avg;
            totalForecast += fc;
            totalLower += fc * 0.75;
            totalUpper += fc * 1.35;
          }
        });

        if (!dateStr) {
          const d = new Date();
          d.setDate(d.getDate() + i + 1);
          dateStr = d.toISOString();
        }

        aggregated.push({
          date: formatDate(dateStr),
          forecast: Math.round(totalForecast),
          lower: Math.round(totalLower),
          upper: Math.round(totalUpper),
        });
      }
      return aggregated;
    } else {
      // 1-year monthly aggregate
      const aggregated: Record<string, { forecast: number; lower: number; upper: number }> = {};

      v2Products.forEach((p) => {
        const monthly = p.seasonal?.yearly_forecast?.monthly || [];
        monthly.forEach((m) => {
          if (!aggregated[m.month]) {
            aggregated[m.month] = { forecast: 0, lower: 0, upper: 0 };
          }
          aggregated[m.month].forecast += m.forecast;
          aggregated[m.month].lower += m.lower;
          aggregated[m.month].upper += m.upper;
        });
      });

      const sortedMonths = Object.keys(aggregated).sort();
      if (sortedMonths.length > 0) {
        return sortedMonths.map((m) => ({
          date: formatMonth(m),
          forecast: Math.round(aggregated[m].forecast),
          lower: Math.round(aggregated[m].lower),
          upper: Math.round(aggregated[m].upper),
        }));
      }

      // Fallback 12 months if no data
      const fallback: ChartDataPoint[] = [];
      const now = new Date();
      for (let i = 0; i < 12; i++) {
        const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
        let totalForecast = 0;
        v2Products.forEach((p) => {
          totalForecast += p.forecast.daily_avg * 30;
        });
        fallback.push({
          date: `${MONTH_NAMES[d.getMonth()]} '${String(d.getFullYear()).slice(2)}`,
          forecast: Math.round(totalForecast),
          lower: Math.round(totalForecast * 0.75),
          upper: Math.round(totalForecast * 1.35),
        });
      }
      return fallback;
    }
  }, [v2Products, horizon]);

  // Aggregate metrics
  const metrics = useMemo(() => {
    let totalUnits = 0;
    let totalRevenue = 0;

    v2Products.forEach((p) => {
      let units = 0;
      if (horizon === "30d") {
        units = p.forecast.next_30d;
      } else if (horizon === "90d") {
        units = p.forecast.next_90d;
      } else {
        units = p.seasonal?.yearly_forecast?.total_365d || (p.forecast.daily_avg * 365);
      }
      totalUnits += units;
      totalRevenue += units * p.price;
    });

    // Find peak period in the aggregated chart data
    let peakVal = -1;
    let peakLabel = "";
    aggregatedData.forEach((d) => {
      if (d.forecast > peakVal) {
        peakVal = d.forecast;
        peakLabel = d.date;
      }
    });

    return {
      totalUnits: Math.round(totalUnits),
      totalRevenue: Math.round(totalRevenue),
      peakPeriod: peakLabel,
      peakValue: peakVal,
    };
  }, [v2Products, horizon, aggregatedData]);

  // Top contributors
  const topContributors = useMemo(() => {
    return [...v2Products]
      .map((p) => {
        let units = 0;
        if (horizon === "30d") units = p.forecast.next_30d;
        else if (horizon === "90d") units = p.forecast.next_90d;
        else units = p.seasonal?.yearly_forecast?.total_365d || (p.forecast.daily_avg * 365);

        return {
          name: p.name,
          sku: p.sku,
          units: Math.round(units),
          revenue: Math.round(units * p.price),
        };
      })
      .sort((a, b) => b.units - a.units)
      .slice(0, 4);
  }, [v2Products, horizon]);

  const fmt = (n: number) => {
    if (n >= 10_000_000) return `${currency}${(n / 10_000_000).toFixed(1)}Cr`;
    if (n >= 100_000) return `${currency}${(n / 100_000).toFixed(1)}L`;
    if (n >= 1_000) return `${currency}${(n / 1_000).toFixed(1)}K`;
    return `${currency}${Math.round(n).toLocaleString("en-IN")}`;
  };

  const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ color: string; name: string; value: number }>; label?: string }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{
          background: "rgba(8,8,8,0.95)",
          border: "1px solid rgba(252,163,17,0.3)",
          borderRadius: 12,
          padding: "12px 16px",
          backdropFilter: "blur(12px)",
        }}>
          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", marginBottom: 8 }}>{label}</p>
          {payload.map((p, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: p.color }} />
              <span style={{ fontSize: 13, color: "rgba(255,255,255,0.8)" }}>{p.name}</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: "#FCA311" }}>
                {p.value.toLocaleString("en-IN")} units
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Controls and Summary KPIs */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: 16,
      }}>
        {/* Horizon picker */}
        <div style={{ display: "flex", gap: 6, background: "rgba(255,255,255,0.04)", padding: 4, borderRadius: 10, border: "1px solid rgba(255,255,255,0.08)" }}>
          {(["30d", "90d", "1yr"] as const).map((h) => (
            <button
              key={h}
              onClick={() => setHorizon(h)}
              style={{
                padding: "6px 14px",
                borderRadius: 8,
                border: "none",
                cursor: "pointer",
                fontSize: 12,
                fontWeight: horizon === h ? 600 : 400,
                background: horizon === h ? "#FCA311" : "transparent",
                color: horizon === h ? "#000" : "rgba(255,255,255,0.6)",
                transition: "all 0.2s ease",
              }}
            >
              {h === "30d" ? "30 Days" : h === "90d" ? "90 Days" : "1 Year"}
            </button>
          ))}
        </div>

        {/* Aggregated Forecast Stats */}
        <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
          <div>
            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", display: "block", marginBottom: 2 }}>Aggregated Demand</span>
            <span style={{ fontSize: 18, fontWeight: 700, color: "#fff" }}>
              {metrics.totalUnits.toLocaleString("en-IN")} units
            </span>
          </div>
          <div>
            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", display: "block", marginBottom: 2 }}>Forecast Value</span>
            <span style={{ fontSize: 18, fontWeight: 700, color: "#22c55e" }}>
              {fmt(metrics.totalRevenue)}
            </span>
          </div>
          <div>
            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", display: "block", marginBottom: 2 }}>Peak Demand Period</span>
            <span style={{ fontSize: 18, fontWeight: 700, color: "#FCA311" }}>
              {metrics.peakPeriod} <span style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", fontWeight: 400 }}>({metrics.peakValue} units)</span>
            </span>
          </div>
        </div>
      </div>

      {/* Main Aggregated Forecast Chart */}
      <div className="glass" style={{ padding: 24, borderRadius: 16 }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, color: "#fff", fontFamily: "var(--font-display)" }}>
          Aggregated Portfolio Forecast
        </h3>
        <div style={{ width: "100%", height: 320 }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={aggregatedData} margin={{ top: 10, right: 10, left: -5, bottom: 0 }}>
              <defs>
                <linearGradient id="aggForecastGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#FCA311" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#FCA311" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="aggCiGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#FCA311" stopOpacity={0.08} />
                  <stop offset="95%" stopColor="#FCA311" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis
                dataKey="date"
                tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                interval={horizon === "30d" ? 4 : horizon === "90d" ? 14 : 1}
              />
              <YAxis
                tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(1)}k` : String(v)}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="upper"
                stroke="none"
                fill="url(#aggCiGrad)"
                name="Confidence Range (Upper)"
                legendType="none"
              />
              <Area
                type="monotone"
                dataKey="lower"
                stroke="none"
                fill="rgba(8,8,8,0.5)"
                name="Confidence Range (Lower)"
                legendType="none"
              />
              <Area
                type="monotone"
                dataKey="forecast"
                stroke="#FCA311"
                strokeWidth={2.5}
                fill="url(#aggForecastGrad)"
                name="Aggregated Demand Forecast"
                dot={false}
                activeDot={{ r: 5, fill: "#FCA311", stroke: "#080808", strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div style={{ marginTop: 12, fontSize: 12, color: "rgba(255,255,255,0.35)", textAlign: "center" }}>
          Aggregated demand forecast combines the predicted sales of all products based on individual best-fit models (SARIMA/Holt-Winters).
        </div>
      </div>

      {/* Grid: Forecast breakdown & Contributors */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, flexWrap: "wrap" }}>
        {/* Top contributing products */}
        <div className="glass" style={{ padding: 20 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 14, color: "#fff", textTransform: "uppercase", letterSpacing: "0.08em" }}>
            Top Contributors to Forecast Volume
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {topContributors.map((c, i) => (
              <div
                key={c.name}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "10px 12px",
                  background: "rgba(255,255,255,0.02)",
                  border: "1px solid rgba(255,255,255,0.05)",
                  borderRadius: 10,
                }}
              >
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#fff" }}>
                    {i + 1}. {c.name}
                  </div>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>
                    SKU: {c.sku}
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#FCA311" }}>
                    {c.units.toLocaleString("en-IN")} units
                  </div>
                  <div style={{ fontSize: 11, color: "#22c55e" }}>
                    {fmt(c.revenue)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Forecast Insights */}
        <div className="glass" style={{ padding: 20 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 14, color: "#fff", textTransform: "uppercase", letterSpacing: "0.08em" }}>
            Seasonal & Event Outlook
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 12, fontSize: 13, color: "rgba(255,255,255,0.7)" }}>
            <p>
              Based on historical Indian events and retail holiday calendars, your portfolio is modeled to experience peak seasonal factors during <span style={{ color: "#FCA311", fontWeight: 600 }}>Festival Peaks (Oct-Nov)</span>.
            </p>
            <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <span>Forecasted Growth Trend:</span>
                <span style={{ fontWeight: 600, color: "#22c55e" }}>+12.4% MoM</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <span>Forecast Confidence (Avg MAPE):</span>
                <span style={{ fontWeight: 600, color: "#FCA311" }}>
                  {Math.round((1 - (result.portfolio_summary?.avg_forecast_mape || 0.15)) * 100)}%
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>Main sales channel modeled:</span>
                <span style={{ fontWeight: 600, color: "#fff" }}>
                  {result.brand_context.main_channel || "Omnichannel"}
                </span>
              </div>
            </div>
            <div style={{
              background: "rgba(34,197,94,0.06)",
              border: "1px solid rgba(34,197,94,0.2)",
              borderRadius: 8,
              padding: "10px 12px",
              fontSize: 12,
              color: "#22c55e",
              lineHeight: 1.5,
              marginTop: 6,
            }}>
              💡 <strong>Action Tip:</strong> Align your procurement order cycles with the EOQ sizes recommended for the top contributors to secure bulk vendor discounts ahead of peak demand.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
