"use client";

import { useState } from "react";
import { ONBOARDING_QUESTIONS } from "@/lib/questions";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";

interface Props {
  answers: Record<string, string>;
  onChange: (answers: Record<string, string>) => void;
  onComplete: () => void;
  onBack: () => void;
}

const DEFAULTS: Record<string, string> = {
  currency: "₹ (INR)",
  avg_lead_time_days: "7",
  safety_stock_days: "14",
  dead_stock_threshold_days: "90",
  ordering_cost: "500",
  holding_cost_pct: "15-25%",
  typical_discount_pct: "20",
  category: "Skincare",
  main_channel: "Own Website (D2C)",
};

export default function QuestionFlow({ answers, onChange, onComplete, onBack }: Props) {
  const [step, setStep] = useState(0);
  const questions = ONBOARDING_QUESTIONS;
  const current = questions[step];
  const progress = ((step + 1) / questions.length) * 100;

  const value = answers[current.id] ?? DEFAULTS[current.id] ?? "";

  const setValue = (v: string) => {
    onChange({ ...answers, [current.id]: v });
  };

  const canProceed = () => {
    if (current.type === "text" && current.id === "brand_name") {
      return value.trim().length > 0;
    }
    if (current.type === "number") {
      return value !== "" && !isNaN(Number(value));
    }
    return value !== "";
  };

  const handleNext = () => {
    if (step < questions.length - 1) {
      setStep(step + 1);
    } else {
      onComplete();
    }
  };

  const handleBack = () => {
    if (step > 0) {
      setStep(step - 1);
    } else {
      onBack();
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="mb-2 flex items-center justify-between text-sm text-gray-400">
          <span>
            Question {step + 1} of {questions.length}
          </span>
          <span>{Math.round(progress)}%</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      <div className="rounded-2xl border border-gray-700 bg-[#252525] p-8">
        <h2 className="mb-6 text-xl font-semibold text-white">{current.question}</h2>

        {current.type === "select" && "options" in current && (
          <div className="grid gap-2">
            {current.options.map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => setValue(opt)}
                className={`rounded-xl border px-4 py-3 text-left text-sm transition-colors ${
                  value === opt
                    ? "border-white bg-white text-black"
                    : "border-gray-600 text-gray-300 hover:border-gray-400"
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
        )}

        {current.type === "text" && (
          <input
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={"placeholder" in current ? current.placeholder : ""}
            className="w-full rounded-xl border border-gray-600 bg-[#1a1a1a] px-4 py-3 text-white placeholder:text-gray-500 focus:border-white focus:outline-none"
          />
        )}

        {current.type === "number" && (
          <input
            type="number"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={"placeholder" in current ? current.placeholder : ""}
            className="w-full rounded-xl border border-gray-600 bg-[#1a1a1a] px-4 py-3 text-white placeholder:text-gray-500 focus:border-white focus:outline-none"
          />
        )}

        {"hint" in current && current.hint && (
          <p className="mt-3 text-sm text-gray-500">{current.hint}</p>
        )}
      </div>

      <div className="flex justify-between">
        <Button variant="outline" onClick={handleBack} className="border-gray-600 text-white">
          Back
        </Button>
        <Button onClick={handleNext} disabled={!canProceed()} className="bg-white text-black hover:bg-gray-200">
          {step < questions.length - 1 ? "Next" : "Continue to Review"}
        </Button>
      </div>
    </div>
  );
}
