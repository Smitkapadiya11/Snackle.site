import { NextRequest, NextResponse } from "next/server";
import { generateProductSummary, generatePythonProductSummary } from "@/lib/groq";
import { AlgorithmOutput, BrandContext } from "@/lib/types";
import { PythonProductAnalysis } from "@/lib/python-types";

export async function POST(req: NextRequest) {
  let body: Record<string, unknown> = {};
  try {
    body = await req.json();

    // V2 Python product format
    if (body.product && body.brand_context) {
      const { product, brand_context } = body as {
        product: PythonProductAnalysis;
        brand_context: BrandContext;
      };
      const { summary, action_tags } = await generatePythonProductSummary(
        product,
        brand_context,
      );
      return NextResponse.json({ success: true, summary, action_tags });
    }

    // Legacy TypeScript algorithm format
    const { algorithm_output, brand_context }: {
      algorithm_output: AlgorithmOutput;
      brand_context: BrandContext;
    } = body as {
      algorithm_output: AlgorithmOutput;
      brand_context: BrandContext;
    };

    const { summary, action_tags } = await generateProductSummary(
      algorithm_output,
      brand_context,
    );

    return NextResponse.json({ success: true, summary, action_tags });
  } catch (error) {
    console.error("AI summary error:", error);
    const product = body.product as PythonProductAnalysis | undefined;
    const brand = (body.brand_context || {}) as BrandContext;
    const m = product?.key_metrics || {};
    const name = product?.name || "Product";
    const status = product?.status || "HEALTHY";
    const summary =
      status === "CRITICAL"
        ? `${name} has only ${m.days_of_stock ?? "?"} days of stock remaining. Order ${m.reorder_qty ?? "?"} units today.`
        : `${name} is performing with ${m.days_of_stock ?? "?"} days of stock. Monitor and reorder at ${m.reorder_qty ?? "?"} units.`;
    const action_tags =
      status === "CRITICAL"
        ? [`Order ${m.reorder_qty ?? "?"} units NOW`, `${m.days_of_stock ?? "?"} days left`]
        : [`${m.days_of_stock ?? "?"} days stock`, `Reorder at ${m.reorder_qty ?? "?"}`];
    return NextResponse.json({ success: true, summary, action_tags, fallback: true });
  }
}
