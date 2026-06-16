import { AnalysisResult } from "@/lib/types";

interface Props {
  result: AnalysisResult;
  currency: string;
}

const KPI = ({ label, value, sub }: { label: string; value: string; sub?: string }) => (
  <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
    <p className="mb-1 text-xs uppercase tracking-wide text-gray-500">{label}</p>
    <p className="text-2xl font-bold text-gray-900">{value}</p>
    {sub && <p className="mt-0.5 text-xs text-gray-400">{sub}</p>}
  </div>
);

export default function SummaryHeader({ result, currency }: Props) {
  const fmt = (n: number) => `${currency}${n.toLocaleString("en-IN")}`;
  return (
    <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
      <KPI label="Products Analyzed" value={String(result.total_products)} />
      <KPI
        label="Revenue at Risk"
        value={fmt(result.total_revenue_at_risk)}
        sub={`${result.critical_count} critical products`}
      />
      <KPI
        label="Capital Locked"
        value={fmt(result.total_capital_locked)}
        sub={`${result.dead_stock_count} dead stock items`}
      />
      <KPI
        label="Opportunity Value"
        value={fmt(result.total_opportunity_value)}
        sub={`${result.opportunity_count} opportunities`}
      />
    </div>
  );
}
