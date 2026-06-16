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

  return {
    brand_context,
    total_products: cards.length,
    critical_count: cards.filter((c) => c.status === "CRITICAL").length,
    dead_stock_count: cards.filter((c) => c.status === "DEAD_STOCK").length,
    opportunity_count: cards.filter((c) => c.status === "OPPORTUNITY").length,
    total_revenue_at_risk: algorithm_outputs.reduce((s, o) => s + o.revenue_at_risk, 0),
    total_capital_locked: algorithm_outputs.reduce((s, o) => s + o.capital_locked, 0),
    total_opportunity_value: algorithm_outputs.reduce((s, o) => s + o.opportunity_revenue, 0),
    product_cards: cards,
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
    const {
      raw_products,
      brand_context,
    }: {
      raw_products: Array<{
        name: string;
        sku: string;
        price: number;
        current_stock: number;
        sales_history: { date: string; units_sold: number }[];
      }>;
      brand_context: BrandContext;
    } = await req.json();

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
