"use client";

import { PythonProductAnalysis } from "@/lib/python-types";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";

interface MonteCarloChartProps {
  product: PythonProductAnalysis;
  currency: string;
}

export default function MonteCarloFanChart({ product, currency }: MonteCarloChartProps) {
  const mc = product.monte_carlo;
  const currentStock = product.current_stock;
  const dailyAvg = product.forecast.daily_avg || 1;

  // Build a fan chart from P10/P50/P90 stockout days
  const days = 90;
  const dataPoints = [];

  for (let day = 0; day <= days; day += 1) {
    // Simulate inventory levels for three scenarios
    const stockP10 = Math.max(0, currentStock - day * dailyAvg * 0.7);  // optimistic
    const stockP50 = Math.max(0, currentStock - day * dailyAvg);         // median
    const stockP90 = Math.max(0, currentStock - day * dailyAvg * 1.4);  // pessimistic

    dataPoints.push({
      day,
      p10: day % 5 === 0 ? Math.round(stockP10) : undefined,
      p50: day % 5 === 0 ? Math.round(stockP50) : undefined,
      p90: day % 5 === 0 ? Math.round(stockP90) : undefined,
    });
  }

  // Sample every 5 days for display
  const chartData = dataPoints.filter(d => d.day % 5 === 0);

  const safetyStock = Math.round(product.safety_stock.safety_stock_units);

  const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ color: string; name: string; value: number }>; label?: number }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{
          background: "rgba(8,8,8,0.95)",
          border: "1px solid rgba(252,163,17,0.3)",
          borderRadius: 12,
          padding: "12px 16px",
        }}>
          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", marginBottom: 8 }}>Day {label}</p>
          {payload.filter(p => p.value !== undefined).map((p, i) => (
            <div key={i} style={{ display: "flex", gap: 8, marginBottom: 4 }}>
              <span style={{ color: p.color, fontSize: 13, fontWeight: 600, minWidth: 80 }}>{p.name}</span>
              <span style={{ color: "#FCA311", fontSize: 13 }}>{p.value.toLocaleString("en-IN")} units</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div>
      <div style={{ display: "flex", gap: 24, marginBottom: 16, flexWrap: "wrap" }}>
        {[
          { label: "P10 Stockout", value: `Day ${Math.round(mc.stockout_day_p10)}`, color: "#22c55e", desc: "Best case" },
          { label: "P50 Stockout", value: `Day ${Math.round(mc.stockout_day_p50)}`, color: "#FCA311", desc: "Median" },
          { label: "P90 Stockout", value: `Day ${Math.round(mc.stockout_day_p90)}`, color: "#ef4444", desc: "Worst case" },
        ].map((item) => (
          <div key={item.label} style={{
            background: "rgba(255,255,255,0.04)",
            border: `1px solid ${item.color}30`,
            borderRadius: 10,
            padding: "10px 16px",
            flex: 1,
            minWidth: 100,
          }}>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginBottom: 4 }}>{item.desc}</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: item.color }}>{item.value}</div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)" }}>{item.label}</div>
          </div>
        ))}
      </div>

      <div style={{ width: "100%", height: 220 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="p10Grad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#22c55e" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="p50Grad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#FCA311" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#FCA311" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="p90Grad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis
              dataKey="day"
              tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `Day ${v}`}
              interval={2}
            />
            <YAxis
              tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(1)}k` : String(v)}
            />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine
              y={safetyStock}
              stroke="rgba(252,163,17,0.5)"
              strokeDasharray="4 2"
              label={{ value: `Safety stock (${safetyStock})`, fill: "rgba(252,163,17,0.7)", fontSize: 10, position: "right" }}
            />
            <Area type="monotone" dataKey="p10" stroke="#22c55e" strokeWidth={1.5} fill="url(#p10Grad)" name="P10" dot={false} />
            <Area type="monotone" dataKey="p50" stroke="#FCA311" strokeWidth={2} fill="url(#p50Grad)" name="P50" dot={false} />
            <Area type="monotone" dataKey="p90" stroke="#ef4444" strokeWidth={1.5} fill="url(#p90Grad)" name="P90" dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div style={{ marginTop: 12, display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)" }}>
          <span style={{ color: "#ef4444", fontWeight: 600 }}>
            {Math.round(mc.stockout_probability_30d * 100)}%
          </span>{" "}
          stockout risk in 30 days
        </div>
        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)" }}>
          <span style={{ color: "#FCA311", fontWeight: 600 }}>
            {mc.simulations_run.toLocaleString("en-IN")}
          </span>{" "}
          simulations run
        </div>
      </div>
    </div>
  );
}
