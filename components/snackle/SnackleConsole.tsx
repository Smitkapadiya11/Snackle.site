"use client";

import { Fragment, useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { IntelligenceCreature } from "@/components/art/IntelligenceCreature";
import { SectionLabel } from "@/components/layout/SectionLabel";
import { UploadIcon } from "@/components/ui/UploadIcon";
import { parseCSV, groupByProduct, ParsedRow } from "@/lib/parsers/csv-parser";
import { parseExcel } from "@/lib/parsers/excel-parser";
import { autoDetectColumns } from "@/components/upload/ColumnMapper";
import { buildBrandContext } from "@/lib/brand-helpers";
import {
  LANGUAGES,
  QUESTION_KEYS,
  QUESTION_LABELS,
  getQuestionText,
  getConfirmationText,
} from "@/lib/translations/questions";
import { normalizeCurrencyInput, normalizeHoldingCost } from "@/lib/snackle-questions";
import { PROCESSING_MESSAGES } from "@/lib/snackle-questions";
import { useProcessingAnimation } from "@/lib/animation/useAnime";
import { useSiteAnimations } from "@/lib/animation/useSiteAnimations";
import { generateSampleFile } from "@/lib/parsers/sample-data";


type Product = {
  name: string;
  sku: string;
  price: number;
  current_stock: number;
  sales_history: { date: string; units_sold: number }[];
};

interface AnsweredQ {
  question: string;
  answer: string;
}

function StepIndicators({
  uploadedFile,
  selectedModel,
}: {
  uploadedFile: File | null;
  selectedModel: string;
}) {
  const steps = [
    { n: 1, label: "Upload data", done: !!uploadedFile },
    { n: 2, label: "Select model", done: !!selectedModel },
    { n: 3, label: "12 questions", done: false },
  ];

  return (
    <div className="console-steps">
      {steps.map((step, i) => (
        <Fragment key={step.n}>
          <div
            className="console-step"
            style={{
              background: step.done ? "rgba(34,197,94,0.10)" : "rgba(255,255,255,0.04)",
              border: `1px solid ${step.done ? "rgba(34,197,94,0.3)" : "rgba(255,255,255,0.08)"}`,
            }}
          >
            <div
              className="console-step-num"
              style={{
                background: step.done ? "#22c55e" : "rgba(252,163,17,0.15)",
                border: `1.5px solid ${step.done ? "#22c55e" : "rgba(252,163,17,0.4)"}`,
                color: step.done ? "#000" : "#FCA311",
              }}
            >
              {step.done ? "✓" : step.n}
            </div>
            <span
              style={{
                fontSize: 13,
                fontWeight: 500,
                whiteSpace: "nowrap",
                color: step.done ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.6)",
              }}
            >
              {step.label}
            </span>
          </div>
          {i < 2 && <div className="console-step-connector" />}
        </Fragment>
      ))}
    </div>
  );
}

function IntelligenceTips() {
  return (
    <div style={{ paddingTop: 16, borderTop: "1px solid rgba(255,255,255,0.06)" }}>
      <SectionLabel>Intelligence Tips</SectionLabel>
      {[
        "More historical data → better predictions",
        "Include stockout periods in your CSV",
        "Answer naturally in any Indian language",
      ].map((tip, i) => (
        <div key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start", marginBottom: 10 }}>
          <div
            style={{
              width: 4,
              height: 4,
              borderRadius: "50%",
              background: "var(--c-accent)",
              opacity: 0.5,
              flexShrink: 0,
              marginTop: 7,
            }}
          />
          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", lineHeight: 1.6 }}>{tip}</p>
        </div>
      ))}
    </div>
  );
}

function FileUploadZone({
  uploadedFile,
  productCount,
  onFileUpload,
  onSampleLoad,
  inputId,
  detectedCols,
}: {
  uploadedFile: File | null;
  productCount: number;
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSampleLoad: () => void;
  inputId: string;
  detectedCols: Record<string, string> | null;
}) {
  return (
    <div
      className="console-upload-zone"
      style={{
        border: `1.5px dashed ${uploadedFile ? "rgba(252,163,17,0.5)" : "rgba(229,229,229,0.15)"}`,
        borderRadius: 14,
        padding: 20,
        background: uploadedFile ? "rgba(252,163,17,0.05)" : "transparent",
      }}
    >
      {!uploadedFile ? (
        <div style={{ textAlign: "center" }}>
          <div style={{ marginBottom: 16, display: "flex", justifyContent: "center" }}>
            <UploadIcon uploaded={false} />
          </div>
          <p style={{ fontSize: 13, color: "var(--c-text-dim)" }}>Drop your CSV or Excel file</p>
          <p style={{ fontSize: 11, color: "var(--c-accent)", opacity: 0.6, marginTop: 6 }}>.csv · .xlsx · .xls</p>
          <label htmlFor={inputId} className="console-upload-btn">
            Choose File
          </label>
          <input id={inputId} type="file" accept=".csv,.xlsx,.xls" hidden onChange={onFileUpload} />
          <div style={{ marginTop: 14, borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: 14 }}>
            <p style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", marginBottom: 8 }}>No data? Try a demo:</p>
            <button
              type="button"
              onClick={onSampleLoad}
              style={{
                background: "rgba(252,163,17,0.08)",
                border: "1px solid rgba(252,163,17,0.3)",
                borderRadius: 8,
                color: "#FCA311",
                fontSize: 12,
                fontWeight: 600,
                padding: "6px 14px",
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
            >
              ✨ Load Sample Data (10 products)
            </button>
          </div>
        </div>
      ) : (
        <div>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <UploadIcon uploaded />
            <div>
              <p style={{ fontSize: 13, color: "var(--c-text)", fontWeight: 600, wordBreak: "break-all" }}>
                {uploadedFile.name}
              </p>
              <p style={{ fontSize: 11, color: "var(--c-accent)", marginTop: 2 }}>
                ✓ {productCount} products detected
              </p>
            </div>
          </div>
          {detectedCols && (
            <div style={{ marginTop: 10, padding: "8px 10px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 8 }}>
              <div style={{ fontSize: 9, fontWeight: 600, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>
                Column Mapping
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 3, fontSize: 11, color: "rgba(255,255,255,0.65)" }}>
                <div>📅 Date ➔ <span style={{ color: "#FCA311" }}>{detectedCols.date || "Not found"}</span></div>
                <div>📦 Product ➔ <span style={{ color: "#FCA311" }}>{detectedCols.product_name || "Not found"}</span></div>
                <div>📈 Sales ➔ <span style={{ color: "#FCA311" }}>{detectedCols.units_sold || "Not found"}</span></div>
                {detectedCols.price && <div>💰 Price ➔ <span style={{ color: "#FCA311" }}>{detectedCols.price}</span></div>}
                {detectedCols.stock_on_hand && <div>🎒 Stock ➔ <span style={{ color: "#FCA311" }}>{detectedCols.stock_on_hand}</span></div>}
              </div>
            </div>
          )}
          <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
            <label htmlFor={`${inputId}-change`} style={{ fontSize: 11, color: "var(--c-accent)", cursor: "pointer", display: "block" }}>
              Change File
            </label>
            <input id={`${inputId}-change`} type="file" accept=".csv,.xlsx,.xls" hidden onChange={onFileUpload} />
            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.2)" }}>·</span>
            <button
              type="button"
              onClick={onSampleLoad}
              style={{
                background: "none",
                border: "none",
                fontSize: 11,
                color: "rgba(255,255,255,0.4)",
                cursor: "pointer",
                padding: 0,
              }}
            >
              Use sample data
            </button>
          </div>
        </div>
      )}
    </div>
  );
}


export default function SnackleConsole() {
  const router = useRouter();
  const scrollRef = useRef<HTMLDivElement>(null);

  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [detectedCols, setDetectedCols] = useState<Record<string, string> | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [answeredQuestions, setAnsweredQuestions] = useState<AnsweredQ[]>([]);
  const [questionIndex, setQuestionIndex] = useState(-1);
  const [awaitingConfirmation, setAwaitingConfirmation] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [selectedModel, setSelectedModel] = useState<string>("snackle-1.0");
  const [showModelPicker, setShowModelPicker] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState("en");
  const [showLangPicker, setShowLangPicker] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [procMessage, setProcMessage] = useState(PROCESSING_MESSAGES[0]);
  const [started, setStarted] = useState(false);

  useProcessingAnimation(isProcessing);
  useSiteAnimations();

  const currentQuestionText = awaitingConfirmation
    ? getConfirmationText(selectedLanguage, products.length)
    : questionIndex >= 0
      ? getQuestionText(selectedLanguage, questionIndex)
      : "";

  const currentQuestion = answeredQuestions.length;

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [answeredQuestions, questionIndex, awaitingConfirmation]);

  useEffect(() => {
    if (questionIndex >= 0 || awaitingConfirmation) {
      import("animejs").then(({ animate }) => {
        animate(".question-card", {
          opacity: [0, 1],
          translateY: [24, 0],
          duration: 600,
          easing: "easeOutExpo",
        });
      }).catch(() => {
        document.querySelectorAll(".question-card").forEach((el) => {
          (el as HTMLElement).style.opacity = "1";
        });
      });
    }
  }, [questionIndex, selectedLanguage, awaitingConfirmation]);

  const processFile = useCallback(async (file: File) => {
    const ext = file.name.split(".").pop()?.toLowerCase();
    const rows = ext === "csv" ? await parseCSV(file) : await parseExcel(file);
    if (rows.length === 0) return;
    const hdrs = Object.keys(rows[0]);
    const detected = autoDetectColumns(hdrs);
    setUploadedFile(file);
    setDetectedCols(detected);
    if (detected.date && detected.product_name && detected.units_sold) {
      setProducts(groupByProduct(rows as ParsedRow[], detected));
    }
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await processFile(file);
    e.target.value = "";
  };

  const handleSampleLoad = useCallback(async () => {
    const sampleFile = generateSampleFile();
    await processFile(sampleFile);
  }, [processFile]);

  const startFlow = useCallback(() => {
    if (started || !uploadedFile || products.length === 0 || !selectedModel) return;
    setStarted(true);
    setQuestionIndex(0);
  }, [started, uploadedFile, products.length, selectedModel]);

  useEffect(() => {
    startFlow();
  }, [startFlow]);

  const runAnalysis = async (finalAnswers: Record<string, string>) => {
    setIsProcessing(true);
    setProcessingProgress(0);
    const startTime = Date.now();
    const minDuration = 20000;

    const progressInterval = setInterval(() => {
      setProcessingProgress((p) => Math.min(p + 2, 92));
    }, 400);

    let msgIdx = 0;
    const msgInterval = setInterval(() => {
      msgIdx = (msgIdx + 1) % PROCESSING_MESSAGES.length;
      setProcMessage(PROCESSING_MESSAGES[msgIdx]);
    }, 1800);

    try {
      const brand_context = buildBrandContext(finalAnswers);
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ raw_products: products, brand_context }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || "Analysis failed");

      const elapsed = Date.now() - startTime;
      if (elapsed < minDuration) await new Promise((r) => setTimeout(r, minDuration - elapsed));

      setProcessingProgress(100);
      sessionStorage.setItem("inventory_analysis", JSON.stringify(json.data));
      clearInterval(progressInterval);
      clearInterval(msgInterval);
      router.push("/results");
    } catch (err) {
      clearInterval(progressInterval);
      clearInterval(msgInterval);
      setIsProcessing(false);
      alert(err instanceof Error ? err.message : "Analysis failed");
    }
  };

  const handleSend = async () => {
    if (!selectedModel || !inputValue.trim()) return;
    const text = inputValue.trim();
    setInputValue("");

    if (awaitingConfirmation) {
      await runAnalysis(answers);
      return;
    }

    if (questionIndex < 0 || questionIndex >= QUESTION_KEYS.length) return;

    const key = QUESTION_KEYS[questionIndex];
    let normalized = text;
    if (key === "currency") normalized = normalizeCurrencyInput(normalized);
    if (key === "holding_cost_pct") normalized = normalizeHoldingCost(normalized);

    const newAnswers = { ...answers, [key]: normalized };
    setAnswers(newAnswers);
    setAnsweredQuestions((prev) => [
      ...prev,
      { question: getQuestionText(selectedLanguage, questionIndex), answer: text },
    ]);

    const next = questionIndex + 1;
    if (next >= QUESTION_KEYS.length) {
      setQuestionIndex(-1);
      setAwaitingConfirmation(true);
    } else {
      setQuestionIndex(next);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const langLabel = LANGUAGES.find((l) => l.code === selectedLanguage)?.native || "English";

  return (
    <div className="console-layout">
      <div className="console-mobile-bar">
        <label
          htmlFor="mobile-file-input"
          className="console-mobile-upload"
          style={{
            background: uploadedFile ? "rgba(34,197,94,0.08)" : "transparent",
            borderColor: uploadedFile ? "rgba(34,197,94,0.3)" : "rgba(255,255,255,0.12)",
          }}
        >
          <UploadIcon uploaded={!!uploadedFile} />
          <span>{uploadedFile ? `${products.length} products` : "Upload CSV"}</span>
          <input id="mobile-file-input" type="file" accept=".csv,.xlsx,.xls" hidden onChange={handleFileUpload} />
        </label>

        {currentQuestion > 0 && (
          <>
            <div style={{ flex: 1, height: 3, background: "rgba(255,255,255,0.06)", borderRadius: 2 }}>
              <div
                style={{
                  width: `${(Math.min(currentQuestion, 12) / 12) * 100}%`,
                  height: "100%",
                  background: "linear-gradient(to right, #14213D, #FCA311)",
                  borderRadius: 2,
                  transition: "width 0.5s ease",
                }}
              />
            </div>
            <span style={{ fontSize: 12, color: "#FCA311", fontWeight: 600, whiteSpace: "nowrap" }}>
              {Math.min(currentQuestion, 12)}/12
            </span>
          </>
        )}
      </div>

      <aside className="console-sidebar">
        <FileUploadZone
          uploadedFile={uploadedFile}
          productCount={products.length}
          onFileUpload={handleFileUpload}
          onSampleLoad={handleSampleLoad}
          inputId="file-input"
          detectedCols={detectedCols}
        />

        {currentQuestion > 0 && (
          <div className="console-question-progress">
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <span style={{ fontSize: 11, color: "var(--c-text-muted)", letterSpacing: "0.08em", textTransform: "uppercase" }}>
                Setup Progress
              </span>
              <span style={{ fontSize: 12, color: "var(--c-accent)", fontWeight: 600 }}>
                {Math.min(currentQuestion, 12)}/12
              </span>
            </div>
            <div style={{ height: 3, background: "rgba(229,229,229,0.08)", borderRadius: 2, overflow: "hidden" }}>
              <div
                style={{
                  height: "100%",
                  width: `${(Math.min(currentQuestion, 12) / 12) * 100}%`,
                  background: "linear-gradient(to right, #14213D, #FCA311)",
                  boxShadow: "0 0 8px rgba(252,163,17,0.5)",
                  transition: "width 0.6s cubic-bezier(0.16, 1, 0.3, 1)",
                }}
              />
            </div>
            <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 4 }}>
              {QUESTION_LABELS.map((q, i) => (
                <div key={q} style={{ display: "flex", alignItems: "center", gap: 8, opacity: i < currentQuestion ? 1 : 0.3 }}>
                  <div
                    style={{
                      width: 16,
                      height: 16,
                      borderRadius: "50%",
                      border: `1px solid ${i < currentQuestion ? "rgba(252,163,17,0.5)" : "rgba(229,229,229,0.1)"}`,
                      background: i < currentQuestion ? "rgba(252,163,17,0.2)" : "transparent",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 9,
                      color: "var(--c-accent)",
                    }}
                  >
                    {i < currentQuestion ? "✓" : i + 1}
                  </div>
                  <span style={{ fontSize: 12, color: i < currentQuestion ? "var(--c-text-dim)" : "rgba(229,229,229,0.3)" }}>{q}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="sidebar-mobile-hide" style={{ marginTop: "auto" }}>
          <IntelligenceTips />
        </div>
      </aside>

      <main className="console-main">
        <div className="console-main-header">
          <div>
            <h1 style={{ fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 700 }}>Snackle Console</h1>
            <p style={{ fontSize: 13, color: "var(--c-text-dim)" }}>Inventory Intelligence · Snackle 1.0</p>
          </div>
          <div style={{ position: "relative" }}>
            <button
              type="button"
              onClick={() => setShowModelPicker(!showModelPicker)}
              className="console-model-btn"
              style={{
                border: `1px solid ${selectedModel ? "rgba(252,163,17,0.5)" : "rgba(229,229,229,0.15)"}`,
                background: selectedModel ? "rgba(252,163,17,0.08)" : "transparent",
                color: selectedModel ? "var(--c-accent)" : "var(--c-text-dim)",
              }}
            >
              {selectedModel ? "● Snackle 1.0" : "Select Model ▾"}
            </button>
            {showModelPicker && (
              <div className="console-model-picker">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedModel("snackle-1.0");
                    setShowModelPicker(false);
                  }}
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    background: "rgba(252,163,17,0.1)",
                    border: "none",
                    borderRadius: 8,
                    color: "var(--c-text)",
                    textAlign: "left",
                    cursor: "pointer",
                  }}
                >
                  <div style={{ fontWeight: 600 }}>Snackle 1.0</div>
                  <div style={{ fontSize: 11, opacity: 0.6 }}>9 algorithms · Live</div>
                </button>
              </div>
            )}
          </div>
        </div>

        {isProcessing ? (
          <div className="console-processing" style={{
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: 40,
            maxWidth: 840,
            width: "100%",
            margin: "0 auto",
            padding: "40px 20px",
            flexWrap: "wrap",
          }}>
            <style>{`
              @keyframes pulse {
                0% { transform: scale(0.85); box-shadow: 0 0 0 0 rgba(252, 163, 17, 0.4); }
                70% { transform: scale(1); box-shadow: 0 0 0 6px rgba(252, 163, 17, 0); }
                100% { transform: scale(0.85); box-shadow: 0 0 0 0 rgba(252, 163, 17, 0); }
              }
              .pulse-dot {
                animation: pulse 1.5s infinite;
              }
            `}</style>

            {/* Left Column: Spinner & Progress */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1, minWidth: 260 }}>
              <div style={{ position: "relative", width: 140, height: 140, marginBottom: 28 }}>
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="proc-ring"
                    style={{
                      position: "absolute",
                      inset: 0,
                      borderRadius: "50%",
                      border: `${4 - i}px solid rgba(252,163,17,${0.35 / i})`,
                    }}
                  />
                ))}
                <div className="proc-core">⚡</div>
              </div>
              <h3 style={{ fontFamily: "var(--font-display)", fontSize: 24, fontWeight: 700, marginBottom: 8, color: "#fff" }}>Snackle is thinking...</h3>
              <p style={{ fontSize: 13, color: "var(--c-accent)", marginBottom: 24, textAlign: "center" }}>{procMessage}</p>
              
              <div style={{ width: "100%", maxWidth: 300 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                  <span style={{ fontSize: 11, color: "var(--c-text-muted)" }}>Snackle 1.0 Engine</span>
                  <span style={{ fontSize: 12, color: "var(--c-accent)", fontWeight: 600 }}>{processingProgress}%</span>
                </div>
                <div style={{ height: 4, background: "rgba(229,229,229,0.08)", borderRadius: 2, overflow: "hidden" }}>
                  <div
                    style={{
                      height: "100%",
                      width: `${processingProgress}%`,
                      background: "linear-gradient(to right, #14213D, #FCA311)",
                      transition: "width 0.4s ease",
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Right Column: Steps Checklist */}
            <div className="glass" style={{
              flex: 1.2,
              minWidth: 320,
              padding: "20px 24px",
              borderRadius: 16,
              background: "rgba(255,255,255,0.02)",
              border: "1px solid rgba(255,255,255,0.06)",
              display: "flex",
              flexDirection: "column",
              gap: 10,
            }}>
              <span style={{ fontSize: 10, fontWeight: 600, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>
                Execution Pipeline
              </span>
              {[
                { label: "Initializing analysis engine...", min: 0, max: 10 },
                { label: "Forecasting demand with Holt-Winters & SARIMA...", min: 11, max: 20 },
                { label: "Running Monte Carlo simulations (10k paths)...", min: 21, max: 30 },
                { label: "Calculating safety stock & EOQ metrics...", min: 31, max: 40 },
                { label: "Mapping ABC-XYZ classification matrix...", min: 41, max: 50 },
                { label: "Scanning Isolation Forest anomalies...", min: 51, max: 60 },
                { label: "Detecting CUSUM trend change-points...", min: 61, max: 70 },
                { label: "Optimizing markdown pricing models...", min: 71, max: 80 },
                { label: "Computing GMROI & turnover metrics...", min: 81, max: 90 },
                { label: "Generating AI summaries with Groq...", min: 91, max: 100 },
              ].map((step, i) => {
                const isCompleted = processingProgress > step.max;
                const isActive = processingProgress >= step.min && processingProgress <= step.max;
                const isPending = processingProgress < step.min;

                return (
                  <div key={i} style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    opacity: isPending ? 0.35 : 1,
                    transition: "opacity 0.3s ease",
                  }}>
                    {isCompleted ? (
                      <span style={{ color: "#22c55e", fontSize: 13, fontWeight: 700, width: 16 }}>✓</span>
                    ) : isActive ? (
                      <div className="pulse-dot" style={{
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        background: "#FCA311",
                        margin: "0 4px",
                      }} />
                    ) : (
                      <div style={{
                        width: 6,
                        height: 6,
                        borderRadius: "50%",
                        border: "1px solid rgba(255,255,255,0.3)",
                        margin: "0 5px",
                      }} />
                    )}
                    <span style={{
                      fontSize: 12,
                      fontWeight: isActive ? 600 : 400,
                      color: isActive ? "#FCA311" : isCompleted ? "rgba(255,255,255,0.8)" : "rgba(255,255,255,0.4)",
                    }}>
                      {step.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div ref={scrollRef} className="scroll-container console-scroll">
            {!started && (
              <div className="console-welcome">
                <div className="console-welcome-creature">
                  <IntelligenceCreature size={280} />
                </div>

                <h2 className="console-welcome-title">Hello. I&apos;m Snackle 1.0.</h2>

                <p className="console-welcome-desc">
                  The first inventory intelligence model for Indian D2C brands. Upload your data and I&apos;ll guide you to decisions your competition can&apos;t see coming.
                </p>

                <StepIndicators uploadedFile={uploadedFile} selectedModel={selectedModel} />

                <p className="console-welcome-hint">Model pre-selected · Answer naturally in any Indian language</p>
              </div>
            )}

            {answeredQuestions.map((qa, i) => (
              <div key={i} className="console-qa-card">
                <span style={{ fontSize: 11, color: "var(--c-accent)", opacity: 0.5, fontWeight: 600, minWidth: 20 }}>{i + 1}.</span>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 12, color: "var(--c-text-muted)", marginBottom: 4 }}>{qa.question.slice(0, 80)}…</p>
                  <p style={{ fontSize: 14, color: "var(--c-text)", fontWeight: 500 }}>{qa.answer}</p>
                </div>
                <span style={{ color: "var(--c-accent)", fontSize: 12, opacity: 0.5 }}>✓</span>
              </div>
            ))}

            {(questionIndex >= 0 || awaitingConfirmation) && (
              <div className="question-card">
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                  <div className="console-q-num">{awaitingConfirmation ? "✓" : questionIndex + 1}</div>
                  <span style={{ fontSize: 11, color: "var(--c-accent)", opacity: 0.6, letterSpacing: "0.1em", textTransform: "uppercase" }}>
                    {awaitingConfirmation ? "Ready to analyze" : `Question ${questionIndex + 1} of 12`}
                  </span>
                  <button type="button" onClick={() => setShowLangPicker(true)} className="console-lang-btn">
                    🌐 {langLabel}
                  </button>
                </div>
                <p className="question-text" style={{ fontSize: 18, color: "var(--c-text)", lineHeight: 1.65, marginBottom: 24, minHeight: 60 }}>
                  {currentQuestionText}
                </p>
                <div className="console-input-wrap" style={{ border: `1px solid ${isFocused ? "rgba(252,163,17,0.4)" : "rgba(229,229,229,0.1)"}` }}>
                  <textarea
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    onKeyDown={handleKeyDown}
                    placeholder={selectedModel ? "Type your answer here..." : "Select Snackle 1.0 first..."}
                    rows={1}
                    className="console-textarea"
                  />
                  <button
                    type="button"
                    onClick={handleSend}
                    disabled={!selectedModel || !inputValue.trim()}
                    className="console-send-btn"
                    style={{
                      background: !selectedModel || !inputValue.trim() ? "rgba(229,229,229,0.06)" : "var(--c-accent)",
                      cursor: !selectedModel || !inputValue.trim() ? "not-allowed" : "pointer",
                      color: !selectedModel || !inputValue.trim() ? "rgba(229,229,229,0.2)" : "#080808",
                    }}
                  >
                    ↑
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {showLangPicker && (
        <div className="console-lang-overlay" onClick={() => setShowLangPicker(false)}>
          <div className="console-lang-modal" onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontFamily: "var(--font-display)", fontSize: 20, marginBottom: 8 }}>Choose your language</h3>
            <p style={{ fontSize: 13, color: "var(--c-text-dim)", marginBottom: 24 }}>
              All questions will switch. Answer in your language — Snackle understands.
            </p>
            <div className="lang-picker-grid">
              {LANGUAGES.map((lang) => (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => {
                    setSelectedLanguage(lang.code);
                    setShowLangPicker(false);
                  }}
                  className="console-lang-option"
                  style={{
                    border: `1px solid ${selectedLanguage === lang.code ? "rgba(252,163,17,0.6)" : "rgba(229,229,229,0.12)"}`,
                    background: selectedLanguage === lang.code ? "rgba(252,163,17,0.1)" : "transparent",
                  }}
                >
                  <span style={{ fontSize: 20 }}>{lang.flag}</span>
                  <div>
                    <div style={{ fontSize: 14, color: "var(--c-text)", fontWeight: 600 }}>{lang.native}</div>
                    <div style={{ fontSize: 11, color: "var(--c-text-muted)" }}>{lang.name}</div>
                  </div>
                  {selectedLanguage === lang.code && <span style={{ marginLeft: "auto", color: "var(--c-accent)" }}>✓</span>}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
