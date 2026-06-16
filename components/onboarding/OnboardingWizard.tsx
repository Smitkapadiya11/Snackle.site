"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import FileDropzone from "@/components/upload/FileDropzone";
import ColumnMapper, { autoDetectColumns } from "@/components/upload/ColumnMapper";
import QuestionFlow from "@/components/onboarding/QuestionFlow";
import { parseCSV, groupByProduct, ParsedRow } from "@/lib/parsers/csv-parser";
import { parseExcel } from "@/lib/parsers/excel-parser";
import { buildBrandContext } from "@/lib/brand-helpers";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Loader2 } from "lucide-react";

type WizardStep = 1 | 2 | 3;

const ANALYSIS_STEPS = [
  "Running stockout detection...",
  "Scanning for dead stock...",
  "Calculating reorder quantities...",
  "Forecasting demand...",
  "AI generating summaries...",
];

export default function OnboardingWizard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [wizardStep, setWizardStep] = useState<WizardStep>(1);
  const [rawRows, setRawRows] = useState<ParsedRow[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [columnMap, setColumnMap] = useState<Record<string, string>>({});
  const [products, setProducts] = useState<
    Array<{
      name: string;
      sku: string;
      price: number;
      current_stock: number;
      sales_history: { date: string; units_sold: number }[];
    }>
  >([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [analysisStep, setAnalysisStep] = useState("");
  const [error, setError] = useState("");

  const handleFileSelect = useCallback(async (file: File) => {
    setError("");
    try {
      const ext = file.name.split(".").pop()?.toLowerCase();
      const rows = ext === "csv" ? await parseCSV(file) : await parseExcel(file);

      if (rows.length === 0) {
        setError("File is empty or could not be parsed.");
        return;
      }

      const hdrs = Object.keys(rows[0]);
      const detected = autoDetectColumns(hdrs);
      setRawRows(rows);
      setHeaders(hdrs);
      setColumnMap(detected);
    } catch {
      setError("Failed to parse file. Check the format and try again.");
    }
  }, []);

  const loadSampleData = useCallback(async () => {
    try {
      const res = await fetch("/sample-data.csv");
      const text = await res.text();
      const blob = new Blob([text], { type: "text/csv" });
      const file = new File([blob], "sample-data.csv", { type: "text/csv" });
      await handleFileSelect(file);
      setAnswers({
        brand_name: "Glow Naturals",
        category: "Skincare",
        main_channel: "Own Website (D2C)",
        currency: "₹ (INR)",
        avg_lead_time_days: "7",
        safety_stock_days: "14",
        dead_stock_threshold_days: "90",
        ordering_cost: "500",
        holding_cost_pct: "15-25%",
        is_seasonal: "Not really",
        typical_discount_pct: "20",
        competitor_brands: "Mamaearth, WOW Skin Science",
      });
    } catch {
      setError("Failed to load sample data.");
    }
  }, [handleFileSelect]);

  useEffect(() => {
    if (searchParams.get("sample") === "true") {
      loadSampleData();
    }
  }, [searchParams, loadSampleData]);

  const handleUploadNext = () => {
    if (!columnMap.date || !columnMap.product_name || !columnMap.units_sold) {
      setError("Please map Date, Product Name, and Units Sold columns.");
      return;
    }
    const grouped = groupByProduct(rawRows, columnMap);
    if (grouped.length === 0) {
      setError("No valid products found. Check your column mapping.");
      return;
    }
    setProducts(grouped);
    setError("");
    setWizardStep(2);
  };

  const handleAnalyze = async () => {
    setAnalyzing(true);
    setAnalysisProgress(0);
    setError("");

    for (let i = 0; i < ANALYSIS_STEPS.length; i++) {
      setAnalysisStep(ANALYSIS_STEPS[i]);
      setAnalysisProgress(((i + 1) / ANALYSIS_STEPS.length) * 80);
      await new Promise((r) => setTimeout(r, 600));
    }

    try {
      const brand_context = buildBrandContext(answers);

      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ raw_products: products, brand_context }),
      });

      const json = await res.json();
      if (!json.success) {
        throw new Error(json.error || "Analysis failed");
      }

      setAnalysisProgress(95);

      fetch("/api/save-brand", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brand_context,
          products,
          analysis: json.data,
        }),
      }).catch(() => {});

      sessionStorage.setItem("inventory_analysis", JSON.stringify(json.data));
      setAnalysisProgress(100);
      setAnalysisStep("Done! Redirecting to dashboard...");
      await new Promise((r) => setTimeout(r, 500));
      router.push("/results");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Analysis failed. Please try again.");
      setAnalyzing(false);
    }
  };

  const totalSalesRows = rawRows.length;

  return (
    <div className="min-h-screen bg-[#1a1a1a] text-white">
      <header className="border-b border-gray-800 px-6 py-4">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <Link href="/" className="text-lg font-bold">
            Inventory AI
          </Link>
          <span className="text-sm text-gray-400">Step {wizardStep} of 3</span>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-10">
        {wizardStep === 1 && (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold">Upload your sales data</h1>
              <p className="mt-2 text-gray-400">
                CSV or Excel with daily sales per product. We&apos;ll map your columns automatically.
              </p>
            </div>

            <FileDropzone onFileSelect={handleFileSelect} />

            {rawRows.length > 0 && (
              <ColumnMapper
                headers={headers}
                columnMap={columnMap}
                onChange={setColumnMap}
                previewRows={rawRows}
              />
            )}

            {error && <p className="text-sm text-red-400">{error}</p>}

            <div className="flex justify-between">
              <Link
                href="/"
                className="inline-flex h-8 items-center justify-center rounded-lg border border-gray-600 px-2.5 text-sm font-medium text-white hover:bg-white/10"
              >
                Back
              </Link>
              <Button
                onClick={handleUploadNext}
                disabled={rawRows.length === 0}
                className="bg-white text-black hover:bg-gray-200"
              >
                Looks good → Next
              </Button>
            </div>
          </div>
        )}

        {wizardStep === 2 && (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold">Tell us about your brand</h1>
              <p className="mt-2 text-gray-400">
                These answers power our inventory algorithms and AI summaries.
              </p>
            </div>
            <QuestionFlow
              answers={answers}
              onChange={setAnswers}
              onComplete={() => setWizardStep(3)}
              onBack={() => setWizardStep(1)}
            />
          </div>
        )}

        {wizardStep === 3 && (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold">Confirm &amp; analyze</h1>
              <p className="mt-2 text-gray-400">Review your setup before we run the full analysis.</p>
            </div>

            <div className="space-y-4 rounded-2xl border border-gray-700 bg-[#252525] p-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-xs uppercase tracking-wide text-gray-500">Products found</p>
                  <p className="text-2xl font-bold">{products.length}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-gray-500">Sales rows</p>
                  <p className="text-2xl font-bold">{totalSalesRows}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-gray-500">Brand</p>
                  <p className="text-lg font-semibold">{answers.brand_name || "—"}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-gray-500">Category</p>
                  <p className="text-lg font-semibold">{answers.category || "—"}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-gray-500">Lead time</p>
                  <p className="text-lg font-semibold">{answers.avg_lead_time_days || 7} days</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-gray-500">Safety stock</p>
                  <p className="text-lg font-semibold">{answers.safety_stock_days || 14} days</p>
                </div>
              </div>
            </div>

            {analyzing && (
              <div className="space-y-4 rounded-2xl border border-gray-700 bg-[#252525] p-6">
                <div className="flex items-center gap-3">
                  <Loader2 className="h-5 w-5 animate-spin text-white" />
                  <p className="text-sm text-gray-300">{analysisStep}</p>
                </div>
                <Progress value={analysisProgress} className="h-2" />
              </div>
            )}

            {error && <p className="text-sm text-red-400">{error}</p>}

            <div className="flex justify-between">
              <Button
                variant="outline"
                onClick={() => setWizardStep(2)}
                disabled={analyzing}
                className="border-gray-600 text-white"
              >
                Back
              </Button>
              <Button
                onClick={handleAnalyze}
                disabled={analyzing}
                className="bg-white px-8 text-black hover:bg-gray-200"
              >
                {analyzing ? "Analyzing..." : "Run Full Analysis"}
              </Button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
