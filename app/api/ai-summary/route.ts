import { NextRequest, NextResponse } from "next/server";
import { generateProductSummary, generatePythonProductSummary } from "@/lib/groq";
import { AlgorithmOutput, BrandContext } from "@/lib/types";
import { PythonProductAnalysis } from "@/lib/python-types";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

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
    } = body;

    const { summary, action_tags } = await generateProductSummary(
      algorithm_output,
      brand_context,
    );

    return NextResponse.json({ success: true, summary, action_tags });
  } catch (error) {
    console.error("AI summary error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to generate AI summary." },
      { status: 500 },
    );
  }
}
