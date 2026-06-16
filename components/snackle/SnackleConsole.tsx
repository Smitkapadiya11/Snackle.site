"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/brand/Logo";
import { IntelligenceCreature } from "@/components/art/IntelligenceCreature";
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

export default function SnackleConsole() {
  const router = useRouter();
  const scrollRef = useRef<HTMLDivElement>(null);

  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
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
      <aside
        className="console-sidebar"
        style={{
          width: 320,
          background: "rgba(0,0,0,0.6)",
          backdropFilter: "blur(20px)",
          borderRight: "1px solid rgba(252,163,17,0.12)",
        }}
      >
        <Logo size="sm" showTagline />
        <div style={{ height: 1, background: "rgba(252,163,17,0.1)", margin: "8px 0" }} />

        <div
          style={{
            border: `1.5px dashed ${uploadedFile ? "rgba(252,163,17,0.5)" : "rgba(229,229,229,0.15)"}`,
            borderRadius: 14,
            padding: 20,
            background: uploadedFile ? "rgba(252,163,17,0.05)" : "transparent",
          }}
        >
          {!uploadedFile ? (
            <div style={{ textAlign: "center" }}>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  background: "rgba(252,163,17,0.1)",
                  border: "1px solid rgba(252,163,17,0.2)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 12px",
                  fontSize: 20,
                }}
              >
                📊
              </div>
              <p style={{ fontSize: 13, color: "var(--light)", opacity: 0.7 }}>Drop your CSV or Excel file</p>
              <p style={{ fontSize: 11, color: "var(--amber)", opacity: 0.6, marginTop: 6 }}>.csv · .xlsx · .xls</p>
              <label
                htmlFor="file-input"
                style={{
                  display: "inline-block",
                  marginTop: 14,
                  padding: "8px 18px",
                  background: "rgba(252,163,17,0.12)",
                  border: "1px solid rgba(252,163,17,0.3)",
                  borderRadius: 999,
                  fontSize: 12,
                  color: "var(--amber)",
                  cursor: "pointer",
                  fontWeight: 600,
                }}
              >
                Choose File
              </label>
              <input id="file-input" type="file" accept=".csv,.xlsx,.xls" hidden onChange={handleFileUpload} />
            </div>
          ) : (
            <div>
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    background: "rgba(34,197,94,0.15)",
                    border: "1px solid rgba(34,197,94,0.3)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  ✓
                </div>
                <div>
                  <p style={{ fontSize: 13, color: "var(--white)", fontWeight: 600, wordBreak: "break-all" }}>
                    {uploadedFile.name}
                  </p>
                  <p style={{ fontSize: 11, color: "var(--amber)", marginTop: 2 }}>{products.length} products detected</p>
                </div>
              </div>
              <label htmlFor="file-input-change" style={{ fontSize: 11, color: "var(--amber)", cursor: "pointer", marginTop: 10, display: "block" }}>
                Change File
              </label>
              <input id="file-input-change" type="file" accept=".csv,.xlsx,.xls" hidden onChange={handleFileUpload} />
            </div>
          )}
        </div>

        {currentQuestion > 0 && (
          <div className="console-question-progress" style={{ marginTop: 8 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <span style={{ fontSize: 11, color: "var(--light)", opacity: 0.5, letterSpacing: "0.08em", textTransform: "uppercase" }}>
                Setup Progress
              </span>
              <span style={{ fontSize: 12, color: "var(--amber)", fontWeight: 600 }}>
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
                      color: "var(--amber)",
                    }}
                  >
                    {i < currentQuestion ? "✓" : i + 1}
                  </div>
                  <span style={{ fontSize: 12, color: i < currentQuestion ? "var(--light)" : "rgba(229,229,229,0.3)" }}>{q}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="sidebar-mobile-hide" style={{ marginTop: "auto", paddingTop: 20, borderTop: "1px solid rgba(229,229,229,0.06)" }}>
          <p style={{ fontSize: 10, color: "var(--light)", opacity: 0.35, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 10 }}>
            Intelligence Tips
          </p>
          {[
            "More historical data → better predictions",
            "Include stockout periods in your CSV",
            "Answer naturally in any Indian language",
          ].map((tip) => (
            <p key={tip} style={{ fontSize: 12, color: "var(--light)", opacity: 0.5, lineHeight: 1.6, marginBottom: 6 }}>
              — {tip}
            </p>
          ))}
        </div>
      </aside>

      <main className="console-main">
        <div
          style={{
            padding: "20px 32px",
            borderBottom: "1px solid var(--border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: "rgba(0,0,0,0.4)",
          }}
        >
          <div>
            <h1 style={{ fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 700 }}>Snackle Console</h1>
            <p style={{ fontSize: 13, color: "var(--c-text-dim)" }}>Inventory Intelligence · Snackle 1.0</p>
          </div>
          <div style={{ position: "relative" }}>
            <button
              type="button"
              onClick={() => setShowModelPicker(!showModelPicker)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "8px 16px",
                border: `1px solid ${selectedModel ? "rgba(252,163,17,0.5)" : "rgba(229,229,229,0.15)"}`,
                borderRadius: 999,
                background: selectedModel ? "rgba(252,163,17,0.08)" : "transparent",
                color: selectedModel ? "var(--amber)" : "var(--light)",
                cursor: "pointer",
                fontSize: 13,
              }}
            >
              {selectedModel ? "● Snackle 1.0" : "Select Model ▾"}
            </button>
            {showModelPicker && (
              <div
                style={{
                  position: "absolute",
                  top: "100%",
                  right: 0,
                  marginTop: 8,
                  background: "rgba(20,33,61,0.98)",
                  border: "1px solid rgba(252,163,17,0.3)",
                  borderRadius: 12,
                  padding: 8,
                  minWidth: 220,
                  zIndex: 50,
                }}
              >
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
                    color: "var(--white)",
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
          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 40 }}>
            <div style={{ position: "relative", width: 200, height: 200, marginBottom: 48 }}>
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="proc-ring"
                  style={{
                    position: "absolute",
                    inset: 0,
                    borderRadius: "50%",
                    border: `${5 - i}px solid rgba(252,163,17,${0.3 / i})`,
                  }}
                />
              ))}
              <div
                className="proc-core"
                style={{
                  position: "absolute",
                  inset: "30%",
                  borderRadius: "50%",
                  background: "radial-gradient(circle, rgba(252,163,17,0.5), rgba(20,33,61,0.8))",
                  border: "2px solid rgba(252,163,17,0.6)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 32,
                }}
              >
                ⚡
              </div>
            </div>
            <h3 style={{ fontFamily: "var(--font-display)", fontSize: 28, fontWeight: 700, marginBottom: 12 }}>Snackle is thinking...</h3>
            <p style={{ fontSize: 14, color: "var(--amber)", marginBottom: 40 }}>{procMessage}</p>
            <div style={{ width: "100%", maxWidth: 400 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                <span style={{ fontSize: 12, color: "var(--light)", opacity: 0.5 }}>Snackle 1.0</span>
                <span style={{ fontSize: 12, color: "var(--amber)" }}>{processingProgress}%</span>
              </div>
              <div style={{ height: 4, background: "rgba(229,229,229,0.1)", borderRadius: 2 }}>
                <div style={{ height: "100%", width: `${processingProgress}%`, background: "linear-gradient(to right, var(--navy), var(--amber))", transition: "width 1s" }} />
              </div>
            </div>
          </div>
        ) : (
          <>
            <div ref={scrollRef} className="scroll-container" style={{ flex: 1, overflowY: "auto", padding: "32px 24px" }}>
              {!started && (
                <div style={{ textAlign: "center", padding: "40px 20px", maxWidth: 600, margin: "0 auto" }}>
                  <div style={{ width: 220, height: 220, margin: "0 auto 32px" }}>
                    <IntelligenceCreature size={220} />
                  </div>
                  <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(28px, 3vw, 40px)", fontWeight: 700, marginBottom: 16 }}>
                    Hello. I&apos;m Snackle 1.0.
                  </h2>
                  <p style={{ fontSize: 16, color: "var(--light)", opacity: 0.65, lineHeight: 1.7, marginBottom: 40 }}>
                    The first inventory intelligence model built for Indian D2C brands. Upload your data, pick me from the model selector, and I&apos;ll guide you to decisions your competition can&apos;t see coming.
                  </p>
                  <div style={{ display: "flex", gap: 20, justifyContent: "center", flexWrap: "wrap" }}>
                    {[
                      { n: "1", label: "Drop your CSV", done: !!uploadedFile },
                      { n: "2", label: "Select Snackle 1.0", done: !!selectedModel },
                      { n: "3", label: "Answer 12 questions", done: false },
                    ].map((step) => (
                      <div
                        key={step.n}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                          padding: "10px 18px",
                          border: "1px solid rgba(229,229,229,0.1)",
                          borderRadius: 12,
                          background: "rgba(255,255,255,0.02)",
                        }}
                      >
                        <span
                          style={{
                            width: 24,
                            height: 24,
                            borderRadius: "50%",
                            background: "rgba(252,163,17,0.1)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: 12,
                            fontWeight: 700,
                            color: step.done ? "#22c55e" : "var(--amber)",
                          }}
                        >
                          {step.n}
                        </span>
                        <span style={{ fontSize: 13, color: "var(--light)", opacity: 0.8 }}>{step.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {answeredQuestions.map((qa, i) => (
                <div
                  key={i}
                  style={{
                    background: "rgba(0,0,0,0.3)",
                    border: "1px solid rgba(229,229,229,0.06)",
                    borderRadius: 14,
                    padding: "16px 20px",
                    maxWidth: 680,
                    margin: "0 auto 12px",
                    display: "flex",
                    gap: 16,
                  }}
                >
                  <span style={{ fontSize: 11, color: "var(--amber)", opacity: 0.5, fontWeight: 600, minWidth: 20 }}>{i + 1}.</span>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 12, color: "var(--light)", opacity: 0.4, marginBottom: 4 }}>{qa.question.slice(0, 80)}…</p>
                    <p style={{ fontSize: 14, color: "var(--white)", fontWeight: 500 }}>{qa.answer}</p>
                  </div>
                  <span style={{ color: "var(--amber)", fontSize: 12, opacity: 0.5 }}>✓</span>
                </div>
              ))}

              {(questionIndex >= 0 || awaitingConfirmation) && (
                <div
                  className="question-card"
                  style={{
                    background: "rgba(20,33,61,0.5)",
                    border: "1px solid rgba(252,163,17,0.2)",
                    borderRadius: 20,
                    padding: "28px 32px",
                    maxWidth: 680,
                    margin: "24px auto 0",
                    backdropFilter: "blur(12px)",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                    <div
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: "50%",
                        background: "rgba(252,163,17,0.15)",
                        border: "1.5px solid rgba(252,163,17,0.4)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 13,
                        fontWeight: 700,
                        color: "var(--amber)",
                        fontFamily: "var(--font-display)",
                      }}
                    >
                      {awaitingConfirmation ? "✓" : questionIndex + 1}
                    </div>
                    <span style={{ fontSize: 11, color: "var(--amber)", opacity: 0.6, letterSpacing: "0.1em", textTransform: "uppercase" }}>
                      {awaitingConfirmation ? "Ready to analyze" : `Question ${questionIndex + 1} of 12`}
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowLangPicker(true)}
                      style={{
                        marginLeft: "auto",
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        padding: "5px 12px",
                        border: "1px solid rgba(229,229,229,0.15)",
                        borderRadius: 999,
                        background: "transparent",
                        color: "var(--light)",
                        fontSize: 12,
                        cursor: "pointer",
                      }}
                    >
                      🌐 {langLabel}
                    </button>
                  </div>
                  <p className="question-text" style={{ fontSize: 18, color: "var(--white)", lineHeight: 1.65, marginBottom: 24, minHeight: 60 }}>
                    {currentQuestionText}
                  </p>
                  <div
                    style={{
                      display: "flex",
                      gap: 12,
                      alignItems: "flex-end",
                      background: "rgba(0,0,0,0.3)",
                      border: `1px solid ${isFocused ? "rgba(252,163,17,0.4)" : "rgba(229,229,229,0.1)"}`,
                      borderRadius: 14,
                      padding: "14px 16px",
                    }}
                  >
                    <textarea
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      onFocus={() => setIsFocused(true)}
                      onBlur={() => setIsFocused(false)}
                      onKeyDown={handleKeyDown}
                      placeholder={selectedModel ? "Type your answer here..." : "Select Snackle 1.0 first..."}
                      rows={1}
                      style={{
                        flex: 1,
                        background: "transparent",
                        border: "none",
                        outline: "none",
                        color: "var(--white)",
                        fontSize: 16,
                        resize: "none",
                        fontFamily: "var(--font-body)",
                        caretColor: "var(--amber)",
                        minHeight: 40,
                      }}
                    />
                    <button
                      type="button"
                      onClick={handleSend}
                      disabled={!selectedModel || !inputValue.trim()}
                      style={{
                        width: 44,
                        height: 44,
                        minWidth: 44,
                        borderRadius: "50%",
                        background: !selectedModel || !inputValue.trim() ? "rgba(229,229,229,0.06)" : "var(--amber)",
                        border: "none",
                        cursor: !selectedModel || !inputValue.trim() ? "not-allowed" : "pointer",
                        fontSize: 18,
                        color: !selectedModel || !inputValue.trim() ? "rgba(229,229,229,0.2)" : "var(--black)",
                      }}
                    >
                      ↑
                    </button>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </main>

      {showLangPicker && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.8)",
            zIndex: 200,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 24,
          }}
          onClick={() => setShowLangPicker(false)}
        >
          <div
            style={{
              background: "rgba(20,33,61,0.98)",
              border: "1px solid rgba(252,163,17,0.3)",
              borderRadius: 20,
              padding: 32,
              maxWidth: 480,
              width: "90%",
              backdropFilter: "blur(20px)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ fontFamily: "var(--font-display)", fontSize: 20, marginBottom: 8 }}>Choose your language</h3>
            <p style={{ fontSize: 13, color: "var(--light)", opacity: 0.6, marginBottom: 24 }}>
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
                  style={{
                    padding: "12px 16px",
                    border: `1px solid ${selectedLanguage === lang.code ? "rgba(252,163,17,0.6)" : "rgba(229,229,229,0.12)"}`,
                    borderRadius: 10,
                    background: selectedLanguage === lang.code ? "rgba(252,163,17,0.1)" : "transparent",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    textAlign: "left",
                  }}
                >
                  <span style={{ fontSize: 20 }}>{lang.flag}</span>
                  <div>
                    <div style={{ fontSize: 14, color: "var(--white)", fontWeight: 600 }}>{lang.native}</div>
                    <div style={{ fontSize: 11, color: "var(--light)", opacity: 0.5 }}>{lang.name}</div>
                  </div>
                  {selectedLanguage === lang.code && <span style={{ marginLeft: "auto", color: "var(--amber)" }}>✓</span>}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
