"use client";

import { AnalysisResult, PortfolioSummary } from "@/lib/types";
import ABCXYZMatrix from "./ABCXYZMatrix";

interface PortfolioOverviewProps {
  result: AnalysisResult;
  currency: string;
}

function fmt(n: number, currency: string): string {
  if (n >= 10_000_000) return `${currency}${(n / 10_000_000).toFixed(1)}Cr`;
  if (n >= 100_000) return `${currency}${(n / 100_000).toFixed(1)}L`;
  if (n >= 1_000) return `${currency}${(n / 1_000).toFixed(1)}K`;
  return `${currency}${Math.round(n).toLocaleString("en-IN")}`;
}

function HealthArc({ score }: { score: number }) {
  const r = 42;
  const circumference = Math.PI * r; // half circle = PI * r
  const arc = (score / 100) * circumference;
  const color = score >= 70 ? "#22c55e" : score >= 40 ? "#FCA311" : "#ef4444";

  return (
    <svg width={110} height={65} viewBox="0 0 110 65">
      {/* Background arc */}
      <path
        d="M 10 55 A 45 45 0 0 1 100 55"
        fill="none"
        stroke="rgba(255,255,255,0.08)"
        strokeWidth="10"
        strokeLinecap="round"
      />
      {/* Value arc */}
      <path
        d="M 10 55 A 45 45 0 0 1 100 55"
        fill="none"
        stroke={color}
        strokeWidth="10"
        strokeLinecap="round"
        strokeDasharray={`${arc} ${circumference}`}
        style={{ transition: "stroke-dasharray 1.5s ease" }}
      />
      <text x="55" y="52" textAnchor="middle" fill={color} fontSize="20" fontWeight="700">
        {score}
      </text>
      <text x="55" y="63" textAnchor="middle" fill="rgba(255,255,255,0.4)" fontSize="9">
        /100
      </text>
    </svg>
  );
}

function StatusDistribution({ result, ps }: { result: AnalysisResult; ps: PortfolioSummary }) {
  const total = result.total_products;
  const bars = [
    { label: "Critical", count: ps.critical_count, color: "#ef4444" },
    { label: "Dead Stock", count: ps.dead_stock_count, color: "#eab308" },
    { label: "Opportunity", count: ps.opportunity_count, color: "#22c55e" },
    { label: "Monitor", count: ps.monitor_count || 0, color: "#6b7280" },
    { label: "Healthy", count: ps.healthy_count || 0, color: "#3b82f6" },
  ].filter(b => b.count > 0);

  return (
    <div>
      {/* Stacked bar */}
      <div style={{ display: "flex", height: 8, borderRadius: 4, overflow: "hidden", marginBottom: 12, gap: 2 }}>
        {bars.map((bar) => (
          <div
            key={bar.label}
            style={{
              flex: bar.count / total,
              background: bar.color,
              opacity: 0.85,
            }}
          />
        ))}
      </div>
      {/* Legend */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "8px 16px" }}>
        {bars.map((bar) => (
          <div key={bar.label} style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: bar.color }} />
            <span style={{ fontSize: 12, color: "rgba(255,255,255,0.6)" }}>
              {bar.label}: <span style={{ color: bar.color, fontWeight: 600 }}>{bar.count}</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ABCBar({ ps }: { ps: PortfolioSummary }) {
  const a = ps.a_class_revenue_pct || 0;
  const b = ps.b_class_revenue_pct || 0;
  const c = ps.c_class_revenue_pct || 0;

  return (
    <div>
      <div style={{ display: "flex", gap: 4, height: 8, borderRadius: 4, overflow: "hidden", marginBottom: 10 }}>
        <div style={{ flex: a, background: "#FCA311" }} />
        <div style={{ flex: b, background: "rgba(252,163,17,0.5)" }} />
        <div style={{ flex: c, background: "rgba(252,163,17,0.2)" }} />
      </div>
      <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
        {[
          { label: "A Class", count: ps.a_class_count || 0, pct: a, desc: "Stars" },
          { label: "B Class", count: ps.b_class_count || 0, pct: b, desc: "Mid tier" },
          { label: "C Class", count: ps.c_class_count || 0, pct: c, desc: "Long tail" },
        ].map((cls) => (
          <div key={cls.label} style={{ flex: 1, minWidth: 60 }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: "#FCA311" }}>{cls.count}</div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.6)" }}>{cls.label}</div>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)" }}>{Math.round(cls.pct)}% revenue</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function PortfolioOverview({ result, currency }: PortfolioOverviewProps) {
  const ps = result.portfolio_summary as PortfolioSummary;
  if (!ps) return null;

  const healthScore = ps.portfolio_health_score ?? 100;
  const totalProducts = result.total_products;
  const avgMape = ps.avg_forecast_mape || 0;
  const forecastAccuracy = Math.round((1 - avgMape) * 100);

  const kpis = [
    {
      label: "Revenue at Risk",
      value: fmt(ps.total_revenue_at_risk || result.total_revenue_at_risk, currency),
      sub: "from stockouts (Monte Carlo)",
      color: "#ef4444",
      urgent: (ps.total_revenue_at_risk || 0) > 100_000,
    },
    {
      label: "Capital Locked",
      value: fmt(ps.total_capital_locked || result.total_capital_locked, currency),
      sub: "in dead/slow stock",
      color: "#eab308",
      urgent: false,
    },
    {
      label: "Opportunity Value",
      value: fmt(ps.total_opportunity_value_30d || result.total_opportunity_value, currency),
      sub: "next 30 days",
      color: "#22c55e",
      urgent: false,
    },
    {
      label: "Capital Recoverable",
      value: fmt(ps.total_capital_recoverable || 0, currency),
      sub: "via optimal markdown",
      color: "#3b82f6",
      urgent: false,
    },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Top KPI row */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
        gap: 12,
      }}>
        {kpis.map((kpi) => (
          <div
            key={kpi.label}
            className="glass"
            style={{
              padding: "20px 20px",
              borderLeft: `4px solid ${kpi.color}50`,
            }}
          >
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.08em" }}>
              {kpi.label}
            </div>
            <div style={{ fontSize: 26, fontWeight: 800, color: kpi.color, fontFamily: "var(--font-display)", letterSpacing: "-0.02em", lineHeight: 1 }}>
              {kpi.value}
            </div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginTop: 6 }}>
              {kpi.sub}
            </div>
          </div>
        ))}
      </div>

      {/* Secondary row */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr 1fr",
        gap: 12,
      }}>
        {/* Portfolio Health */}
        <div className="glass" style={{ padding: "20px" }}>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.08em" }}>
            Portfolio Health
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <HealthArc score={healthScore} />
            <div>
              <div style={{ fontSize: 13, color: healthScore >= 70 ? "#22c55e" : healthScore >= 40 ? "#FCA311" : "#ef4444", fontWeight: 600 }}>
                {healthScore >= 70 ? "Good" : healthScore >= 40 ? "Needs attention" : "Critical"}
              </div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginTop: 4 }}>
                {totalProducts} products analyzed
              </div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>
                Forecast accuracy: {forecastAccuracy}%
              </div>
            </div>
          </div>
        </div>

        {/* Status Distribution */}
        <div className="glass" style={{ padding: "20px" }}>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.08em" }}>
            Status Distribution
          </div>
          <StatusDistribution result={result} ps={ps} />
        </div>

        {/* ABC Breakdown */}
        <div className="glass" style={{ padding: "20px" }}>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.08em" }}>
            ABC Class Breakdown
          </div>
          <ABCBar ps={ps} />
        </div>
      </div>

      {/* ABC-XYZ Inventory Matrix */}
      <ABCXYZMatrix result={result} currency={currency} />

      {/* Financial metrics row */}
      {(ps.total_stock_value || ps.avg_gmroi || ps.avg_days_of_stock) && (
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
          gap: 10,
        }}>
          {[
            { label: "Total Stock Value", value: fmt(ps.total_stock_value || 0, currency), icon: "📦" },
            { label: "Avg GMROI", value: `${(ps.avg_gmroi || 0).toFixed(1)}×`, icon: "📊" },
            { label: "Avg Days of Stock", value: `${Math.round(ps.avg_days_of_stock || 0)}d`, icon: "📅" },
            { label: "Reorder Investment", value: fmt(ps.total_reorder_investment_needed || 0, currency), icon: "🔄" },
            { label: "Below Reorder Point", value: `${ps.products_below_reorder_point || 0}`, icon: "⚠️" },
            { label: "With Anomalies", value: `${ps.products_with_anomalies || 0}`, icon: "🔍" },
          ].map((item) => (
            <div
              key={item.label}
              style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.06)",
                borderRadius: 10,
                padding: "12px 14px",
                display: "flex",
                alignItems: "center",
                gap: 10,
              }}
            >
              <span style={{ fontSize: 18 }}>{item.icon}</span>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "rgba(255,255,255,0.85)" }}>{item.value}</div>
                <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)" }}>{item.label}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
