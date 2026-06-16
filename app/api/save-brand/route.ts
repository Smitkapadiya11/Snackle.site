import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { BrandContext } from "@/lib/types";

export async function POST(req: NextRequest) {
  try {
    const {
      brand_context,
      products,
      analysis,
    }: {
      brand_context: BrandContext;
      products: Array<{
        name: string;
        sku: string;
        price: number;
        current_stock: number;
        sales_history: { date: string; units_sold: number }[];
      }>;
      analysis: { product_cards: Array<{ product_name: string; status: string; ai_summary: string; action_tags: string[]; algorithm_output: unknown }> };
    } = await req.json();

    const supabaseAdmin = getSupabaseAdmin();
    if (!supabaseAdmin) {
      return NextResponse.json({
        success: true,
        saved: false,
        message: "Supabase not configured — analysis stored in browser only.",
      });
    }

    const { data: brand, error: brandError } = await supabaseAdmin
      .from("brands")
      .insert({
        name: brand_context.brand_name,
        currency: brand_context.currency,
        category: brand_context.category,
        avg_lead_time_days: brand_context.avg_lead_time_days,
        safety_stock_days: brand_context.safety_stock_days,
        ordering_cost: brand_context.ordering_cost,
        holding_cost_pct: brand_context.holding_cost_pct,
        answers: brand_context.answers_raw,
      })
      .select("id")
      .single();

    if (brandError || !brand) {
      throw brandError || new Error("Failed to save brand");
    }

    for (const product of products) {
      const card = analysis.product_cards.find((c) => c.product_name === product.name);

      const { data: savedProduct, error: productError } = await supabaseAdmin
        .from("products")
        .insert({
          brand_id: brand.id,
          name: product.name,
          sku: product.sku,
          price: product.price,
          current_stock: product.current_stock,
          sales_data: product.sales_history,
        })
        .select("id")
        .single();

      if (productError || !savedProduct) continue;

      if (card) {
        await supabaseAdmin.from("analyses").insert({
          brand_id: brand.id,
          product_id: savedProduct.id,
          status: card.status,
          ai_summary: card.ai_summary,
          action_tags: card.action_tags,
          algorithm_output: card.algorithm_output,
        });
      }
    }

    return NextResponse.json({ success: true, saved: true, brand_id: brand.id });
  } catch (error) {
    console.error("Save brand error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to save to database." },
      { status: 500 },
    );
  }
}
