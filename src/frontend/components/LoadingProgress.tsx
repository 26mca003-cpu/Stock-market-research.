"use client";

import React, { useState, useEffect } from "react";
import { Check, TrendingUp } from "lucide-react";

interface LoadingProgressProps {
  ticker: string;
}

const STEPS = [
  "Fetching 5-year financials & statements",
  "Extracting consolidated ratios & shareholding",
  "Computing the 6-layer scoring matrix",
  "Scanning regulatory filings for red flags",
  "Synthesizing the plain-English report",
];

export default function LoadingProgress({ ticker }: LoadingProgressProps) {
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStep((prev) => (prev < STEPS.length - 1 ? prev + 1 : prev));
    }, 1200);
    return () => clearInterval(interval);
  }, []);

  const pct = Math.round(((currentStep + 1) / STEPS.length) * 100);

  return (
    <div className="flex items-center justify-center px-4 py-4 min-h-[calc(100vh-4rem)] max-h-[calc(100vh-4rem)] overflow-y-auto">
      <div className="w-full max-w-sm my-auto">
        {/* Emblem: layered glass ring + rotating gradient sweep */}
        <div className="relative mx-auto mb-5 w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center">
          <span
            className="absolute inset-0 rounded-full bg-accent/[0.06] animate-ping"
            style={{ animationDuration: "2.6s" }}
          />
          <span className="absolute inset-[5px] rounded-full border border-border" />
          {/* rotating conic gradient sweep, softer than a hard arc */}
          <svg
            className="absolute inset-0 w-16 h-16 sm:w-20 sm:h-20 animate-spin"
            style={{ animationDuration: "3.2s" }}
            viewBox="0 0 100 100"
            fill="none"
          >
            <circle cx="50" cy="50" r="45" stroke="#E7ECE9" strokeWidth="1.5" />
            <defs>
              <linearGradient id="sweepGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#10B981" stopOpacity="0" />
                <stop offset="100%" stopColor="#10B981" stopOpacity="1" />
              </linearGradient>
            </defs>
            <path
              d="M50 5 a45 45 0 0 1 39 22.5"
              stroke="url(#sweepGrad)"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          </svg>
          {/* inner tile with subtle depth + hairline gold edge, echoes the brand mark */}
          <div className="relative w-10 h-10 sm:w-[46px] sm:h-[46px] rounded-2xl bg-gradient-to-br from-[#0F1E19] to-[#0A1512] flex items-center justify-center shadow-[0_8px_20px_-6px_rgba(10,21,18,0.45)] ring-1 ring-black/5">
            <span className="absolute inset-0 rounded-2xl border border-accent/25" />
            <TrendingUp className="w-4 h-4 sm:w-[19px] sm:h-[19px] text-emerald-300 relative z-10" strokeWidth={2.25} />
          </div>
        </div>

        {/* Title */}
        <div className="text-center mb-4">
          <p className="text-[10px] font-semibold tracking-[0.18em] text-primary-muted/70 uppercase mb-1">
            Institutional Research
          </p>
          <h3 className="font-serif font-bold text-lg sm:text-xl text-primary tracking-tight leading-tight">
            Analyzing <span className="font-mono text-accent">{ticker.replace(".NS", "")}</span>
          </h3>
          <p className="text-xs text-primary-muted mt-1.5">
            Six-layer scoring model, compiled from primary filings
          </p>
        </div>

        {/* Progress bar */}
        <div className="mb-4">
          <div className="flex items-center justify-between text-[11px] font-semibold text-primary-muted mb-1.5">
            <span className="uppercase tracking-wide">Progress</span>
            <span className="font-mono tabular-nums text-accent text-xs">{pct}%</span>
          </div>
          <div className="w-full h-[6px] bg-slate-100 rounded-full overflow-hidden ring-1 ring-black/[0.03]">
            <div
              className="h-full bg-gradient-to-r from-emerald-400 via-accent to-emerald-600 rounded-full transition-all duration-700 ease-out shadow-[0_0_10px_rgba(16,185,129,0.5)]"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>

        {/* Steps — connected timeline rail for a more considered, professional feel */}
        <div className="bg-white rounded-2xl border border-border shadow-[0_1px_2px_rgba(15,23,42,0.04),0_12px_28px_-14px_rgba(15,23,42,0.12)] px-4 sm:px-5 py-4">
          <div className="relative">
            {/* connecting rail behind the step dots */}
            <div
              className="absolute left-[9px] top-2 bottom-2 w-px bg-border"
              aria-hidden="true"
            />
            <div
              className="absolute left-[9px] top-2 w-px bg-accent transition-all duration-700 ease-out"
              style={{
                height: `calc(${(currentStep / (STEPS.length - 1)) * 100}% - ${currentStep === STEPS.length - 1 ? "0.5rem" : "0px"})`,
              }}
              aria-hidden="true"
            />
            <div className="space-y-3">
              {STEPS.map((step, idx) => {
                const done = idx < currentStep;
                const active = idx === currentStep;
                return (
                  <div
                    key={idx}
                    className={`relative flex items-center gap-3 text-xs sm:text-[13px] transition-all duration-300 ${
                      done ? "text-primary/70" : active ? "text-primary font-semibold" : "text-slate-400"
                    }`}
                  >
                    <span
                      className={`relative z-10 flex items-center justify-center w-[18px] h-[18px] rounded-full shrink-0 transition-colors duration-300 ${
                        done
                          ? "bg-accent text-white"
                          : active
                          ? "bg-white text-accent ring-2 ring-accent"
                          : "bg-white text-slate-300 ring-2 ring-slate-200"
                      }`}
                    >
                      {done ? (
                        <Check className="w-[10px] h-[10px]" strokeWidth={3} />
                      ) : active ? (
                        <span className="w-[7px] h-[7px] rounded-full border-2 border-accent border-t-transparent animate-spin" />
                      ) : (
                        <span className="w-[5px] h-[5px] rounded-full bg-current" />
                      )}
                    </span>
                    <span className="leading-snug">{step}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <p className="text-center text-[11px] text-primary-muted/80 mt-3 tracking-wide">
          This usually takes about 15 seconds
        </p>
      </div>
    </div>
  );
}
