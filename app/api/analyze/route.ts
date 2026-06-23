import { NextRequest, NextResponse } from "next/server";
import { computeProductMetrics, runFullAnalysis } from "@/lib/algorithms";
import { forecastDemand } from "@/lib/algorithms/forecast";
import { generateProductSummary, generatePythonProductSummary } from "@/lib/groq";
import { BrandContext, ProductCard } from "@/lib/types";
import {
  toPythonRequest,
  fromPythonResponse,
} from "@/lib/python-bridge";
import { PythonProductAnalysis, PythonEngineResponse } from "@/lib/python-types";

const PYTHON_ENGINE_URL = process.env.PYTHON_ENGINE_URL || "http://localhost:8000";

async function runTypeScriptAnalysis(
  raw_products: Array<{
    name: string;
    sku: string;
    price: number;
    current_stock: number;
    sales_history: { date: string; units_sold: number }[];
  }>,
  brand_context: BrandContext,
) {
  const products = raw_products.map(computeProductMetrics);
  const algorithm_outputs = runFullAnalysis(products, brand_context);

  const cards: ProductCard[] = await Promise.all(
    algorithm_outputs
      .sort((a, b) => b.priority_score - a.priority_score)
      .map(async (output) => {
        const { summary, action_tags } = await generateProductSummary(output, brand_context);
        return {
          product_name: output.product.name,
          price: output.product.price,
          status: output.status,
          priority_score: output.priority_score,
          ai_summary: summary,
          action_tags,
          algorithm_output: output,
        };
      }),
  );

  // Add complete engine_v2 mock to cards so all UI components work in TS fallback
  const cardsWithEngineV2 = cards.map(c => {
    const p = c.algorithm_output.product;
    const o = c.algorithm_output;
    const fc = forecastDemand(p);
    const reorderQty = o.reorder_qty;
    const eoq = o.eoq;
    const gmroi = p.price > 0 && p.current_stock > 0
      ? (p.avg_daily_sales * 365 * p.price) / (p.current_stock * p.price)
      : 0;

    return {
      ...c,
      engine_v2: {
        name: c.product_name,
        sku: p.sku,
        price: c.price,
        current_stock: p.current_stock,
        status: c.status,
        risk_score: { overall_risk_score: c.priority_score },
        forecast: {
          daily_avg: p.avg_daily_sales,
          trend_pct: p.sales_trend_pct,
          next_30d: fc.next_30d,
          next_60d: fc.next_60d,
          next_90d: fc.next_90d,
          forecast_model_used: "exponential_smoothing",
          model_accuracy_mape: 0.2,
        },
        monte_carlo: {
          expected_revenue_at_risk: o.revenue_at_risk,
          stockout_probability_30d: p.days_of_stock < 30 ? 0.8 : 0.1,
          p10_revenue_at_risk: o.revenue_at_risk * 0.7,
          p90_revenue_at_risk: o.revenue_at_risk * 1.4,
        },
        reorder: {
          recommended_order_qty: reorderQty,
          eoq_units: eoq,
          reorder_cost: o.reorder_cost,
          days_until_reorder_needed: Math.max(0, p.days_of_stock - 7),
        },
        dead_stock: {
          capital_locked: o.capital_locked,
          optimal_discount_pct: o.recommended_discount_pct,
          capital_recovered_at_optimal: o.capital_freed,
          bundle_revenue_uplift_pct: 0,
          units_at_risk: o.units_stuck,
          days_since_last_sale: p.stock_age_days,
        },
        opportunity: {
          opportunity_revenue_30d: o.opportunity_revenue,
          urgency_level: p.sales_trend_pct > 20 ? "IMMEDIATE" : "THIS_WEEK",
          recommended_ad_spend: o.recommended_ad_spend,
          expected_roas: 3.0,
          demand_spike_multiplier: o.demand_spike_multiplier,
        },
        profitability: {
          gmroi: Math.round(gmroi * 10) / 10,
          meets_gmroi_target: gmroi >= 3,
        },
        abc_xyz: {
          abc_class: o.abc_class,
          xyz_class: "X",
          abc_xyz_cell: `${o.abc_class}X`,
          review_frequency: o.abc_class === "A" ? "Daily" : o.abc_class === "B" ? "Weekly" : "Monthly",
        },
        seasonal: {
          seasonal_patterns: {
            has_seasonality: false,
            seasonality_strength: 0,
            peak_months: [],
          },
          upcoming_events: [],
          yearly_forecast: null,
        },
        key_metrics: {
          ...o.raw_metrics,
          days_of_stock: o.days_of_stock,
          stockout_date: o.stockout_date,
          reorder_qty: reorderQty,
        },
      } as any,
    };
  });

  const critical_count = cards.filter((c) => c.status === "CRITICAL").length;
  const dead_stock_count = cards.filter((c) => c.status === "DEAD_STOCK").length;
  const opportunity_count = cards.filter((c) => c.status === "OPPORTUNITY").length;
  const healthy_count = cards.filter((c) => c.status === "HEALTHY").length;
  const monitor_count = cards.filter((c) => c.status === "MONITOR").length;
  const total_revenue_at_risk = algorithm_outputs.reduce((s, o) => s + o.revenue_at_risk, 0);
  const total_capital_locked = algorithm_outputs.reduce((s, o) => s + o.capital_locked, 0);
  const total_opportunity_value = algorithm_outputs.reduce((s, o) => s + o.opportunity_revenue, 0);

  return {
    brand_context,
    total_products: cards.length,
    critical_count,
    dead_stock_count,
    opportunity_count,
    total_revenue_at_risk,
    total_capital_locked,
    total_opportunity_value,
    portfolio_summary: {
      total_revenue_at_risk,
      total_capital_locked,
      total_opportunity_value_30d: total_opportunity_value,
      critical_count,
      dead_stock_count,
      opportunity_count,
      healthy_count,
      monitor_count,
      avg_forecast_mape: 0.15,
      portfolio_health_score: Math.max(0, 100 - (critical_count * 15) - (dead_stock_count * 10)),
      total_stock_value: cards.reduce((sum, c) => sum + (c.algorithm_output.product.total_stock_value || 0), 0),
    },
    product_cards: cardsWithEngineV2,
    generated_at: new Date().toISOString(),
    engine_version: "1.0.0-typescript-fallback",
  };
}

async function runPythonAnalysis(
  raw_products: Array<{
    name: string;
    sku: string;
    price: number;
    current_stock: number;
    sales_history: { date: string; units_sold: number }[];
  }>,
  brand_context: BrandContext,
) {
  const pythonBody = toPythonRequest(raw_products, brand_context);

  const engineResponse = await fetch(`${PYTHON_ENGINE_URL}/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(pythonBody),
    signal: AbortSignal.timeout(120_000),
  });

  if (!engineResponse.ok) {
    const errorBody = await engineResponse.json().catch(() => ({}));
    throw new Error(
      (errorBody as { detail?: string }).detail || "Python engine error",
    );
  }

  const engineResult = (await engineResponse.json()) as PythonEngineResponse;

  const historyMap = new Map(
    raw_products.map((p) => [p.name, p.sales_history]),
  );

  const result = fromPythonResponse(engineResult, brand_context, historyMap);

  const cardsWithSummaries = await Promise.all(
    result.product_cards.map(async (card) => {
      const v2Product = card.engine_v2 as PythonProductAnalysis | undefined;
      if (v2Product) {
        const { summary, action_tags } = await generatePythonProductSummary(
          v2Product,
          brand_context,
        );
        return { ...card, ai_summary: summary, action_tags };
      }
      const { summary, action_tags } = await generateProductSummary(
        card.algorithm_output,
        brand_context,
      );
      return { ...card, ai_summary: summary, action_tags };
    }),
  );

  return { ...result, product_cards: cardsWithSummaries };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const raw_products: Array<{
      name: string;
      sku: string;
      price: number;
      current_stock: number;
      sales_history: { date: string; units_sold: number }[];
    }> = body.raw_products ?? body.products;
    const brand_context: BrandContext = body.brand_context;

    if (!raw_products?.length || !brand_context) {
      return NextResponse.json(
        { success: false, error: "Missing raw_products (or products) and brand_context." },
        { status: 400 },
      );
    }

    let result;

    try {
      result = await runPythonAnalysis(raw_products, brand_context);
    } catch (pythonError) {
      console.warn("Python engine unavailable, using TypeScript fallback:", pythonError);
      result = await runTypeScriptAnalysis(raw_products, brand_context);
    }

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error("Analysis error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Analysis failed. Check your data format.",
      },
      { status: 500 },
    );
  }
}
