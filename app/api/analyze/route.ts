import { NextRequest, NextResponse } from "next/server";
import { computeProductMetrics, runFullAnalysis } from "@/lib/algorithms";
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

  // Add mock engine_v2 to cards to prevent UI crashes in TS fallback
  const cardsWithEngineV2 = cards.map(c => ({
    ...c,
    engine_v2: {
      name: c.product_name,
      sku: c.algorithm_output.product.sku,
      price: c.price,
      current_stock: c.algorithm_output.product.current_stock,
      status: c.status,
      risk_score: { overall_risk_score: c.priority_score },
      forecast: { daily_avg: c.algorithm_output.product.avg_daily_sales, trend_pct: c.algorithm_output.product.sales_trend_pct },
      monte_carlo: { expected_revenue_at_risk: c.algorithm_output.revenue_at_risk },
      dead_stock: { capital_locked: c.algorithm_output.capital_locked },
      opportunity: { opportunity_revenue_30d: c.algorithm_output.opportunity_revenue },
      profitability: { gmroi: 0, meets_gmroi_target: false },
      key_metrics: c.algorithm_output.raw_metrics,
    } as any
  }));

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
