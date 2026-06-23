"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Legend,
} from "recharts";
import { PythonProductAnalysis, SeasonalContext } from "@/lib/python-types";

interface ForecastChartProps {
  product: PythonProductAnalysis;
  currency: string;
  horizon: "30d" | "90d" | "1yr";
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
  actual?: number;
  forecast: number;
  lower: number;
  upper: number;
}

export default function ForecastChart({ product, currency, horizon }: ForecastChartProps) {
  const seasonal = product.seasonal;
  const forecast = product.forecast;

  // Build chart data based on horizon
  let chartData: ChartDataPoint[] = [];
  let xKey = "date";

  if (horizon === "30d" || horizon === "90d") {
    // Use daily data from seasonal yearly_forecast if available, else generate from forecast averages
    const dailyData = seasonal?.yearly_forecast?.daily || [];
    const days = horizon === "30d" ? 30 : 90;

    if (dailyData.length > 0) {
      chartData = dailyData.slice(0, days).map((d) => ({
        date: formatDate(d.date),
        forecast: Math.round(d.forecast),
        lower: Math.round(d.lower),
        upper: Math.round(d.upper),
      }));
    } else {
      // Fallback: generate from forecast values
      const daily_avg = forecast.daily_avg;
      const trend_daily = forecast.trend_pct / 100 / 30;
      for (let i = 0; i < days; i++) {
        const date = new Date();
        date.setDate(date.getDate() + i + 1);
        const fc = Math.max(0, daily_avg * (1 + trend_daily * i));
        chartData.push({
          date: formatDate(date.toISOString()),
          forecast: Math.round(fc),
          lower: Math.round(fc * 0.75),
          upper: Math.round(fc * 1.35),
        });
      }
    }
  } else {
    // 1-year view: use monthly data
    const monthlyData = seasonal?.yearly_forecast?.monthly || [];
    if (monthlyData.length > 0) {
      chartData = monthlyData.map((m) => ({
        date: formatMonth(m.month),
        forecast: Math.round(m.forecast),
        lower: Math.round(m.lower),
        upper: Math.round(m.upper),
      }));
    } else {
      // Generate 12-month fallback
      const daily_avg = forecast.daily_avg;
      const now = new Date();
      for (let i = 0; i < 12; i++) {
        const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
        const fc = daily_avg * 30;
        chartData.push({
          date: `${MONTH_NAMES[d.getMonth()]} '${String(d.getFullYear()).slice(2)}`,
          forecast: Math.round(fc),
          lower: Math.round(fc * 0.75),
          upper: Math.round(fc * 1.35),
        });
      }
    }
  }

  const stockoutDay = product.monte_carlo.stockout_day_p50;
  const daysOfStock = Number(product.key_metrics.days_of_stock || 0);

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
    <div style={{ width: "100%", height: 260 }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
          <defs>
            <linearGradient id="forecastGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#FCA311" stopOpacity={0.25} />
              <stop offset="95%" stopColor="#FCA311" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="ciGrad" x1="0" y1="0" x2="0" y2="1">
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
          {/* Confidence band */}
          <Area
            type="monotone"
            dataKey="upper"
            stroke="none"
            fill="url(#ciGrad)"
            name="Upper bound"
            legendType="none"
          />
          <Area
            type="monotone"
            dataKey="lower"
            stroke="none"
            fill="rgba(8,8,8,0.5)"
            name="Lower bound"
            legendType="none"
          />
          {/* Forecast line */}
          <Area
            type="monotone"
            dataKey="forecast"
            stroke="#FCA311"
            strokeWidth={2}
            fill="url(#forecastGrad)"
            name="Forecast"
            dot={false}
            activeDot={{ r: 4, fill: "#FCA311", stroke: "#080808", strokeWidth: 2 }}
          />
          {/* Stockout reference line */}
          {horizon === "30d" && daysOfStock > 0 && daysOfStock <= 30 && (
            <ReferenceLine
              x={formatDate((() => { const d = new Date(); d.setDate(d.getDate() + daysOfStock); return d.toISOString(); })())}
              stroke="#ef4444"
              strokeDasharray="4 2"
              label={{ value: "Stockout", fill: "#ef4444", fontSize: 10, position: "top" }}
            />
          )}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
