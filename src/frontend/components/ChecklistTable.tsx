"use client";

import React, { useState } from "react";
import { ChecklistItem } from "@/lib/api";
import { CheckCircle2, AlertTriangle, XCircle, Filter } from "lucide-react";

interface ChecklistTableProps {
  checklist: ChecklistItem[];
}

export default function ChecklistTable({ checklist }: ChecklistTableProps) {
  const [selectedLayer, setSelectedLayer] = useState<string>("ALL");
  const [selectedVerdict, setSelectedVerdict] = useState<string>("ALL");

  const filtered = checklist.filter((item) => {
    const matchLayer = selectedLayer === "ALL" || item.layer === selectedLayer;
    const matchVerdict = selectedVerdict === "ALL" || item.verdict === selectedVerdict;
    return matchLayer && matchVerdict;
  });

  const passCount = checklist.filter((c) => c.verdict === "pass").length;
  const warnCount = checklist.filter((c) => c.verdict === "warn").length;
  const failCount = checklist.filter((c) => c.verdict === "fail").length;

  return (
    <div className="bg-white rounded-2xl border border-border shadow-card overflow-hidden">
      {/* Header & Filter Bar */}
      <div className="p-5 sm:p-6 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/60">
        <div>
          <h3 className="font-serif font-bold text-lg sm:text-xl text-primary">Evidence Checklist</h3>
          <p className="text-xs sm:text-[13px] text-primary-muted mt-1">
            Pass / warn / fail verification across every institutional quality metric
          </p>
        </div>

        {/* Status Count Pills */}
        <div className="flex flex-wrap items-center gap-2 sm:shrink-0">
          <button
            onClick={() => setSelectedVerdict(selectedVerdict === "pass" ? "ALL" : "pass")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
              selectedVerdict === "pass" ? "bg-accent-light border-accent text-accent" : "bg-white border-border text-primary-muted hover:border-accent/40"
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-accent" />
            <span className="font-mono tabular-nums">{passCount}</span> Pass
          </button>
          <button
            onClick={() => setSelectedVerdict(selectedVerdict === "warn" ? "ALL" : "warn")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
              selectedVerdict === "warn" ? "bg-warning-light border-warning text-warning" : "bg-white border-border text-primary-muted hover:border-warning/40"
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-warning" />
            <span className="font-mono tabular-nums">{warnCount}</span> Warn
          </button>
          <button
            onClick={() => setSelectedVerdict(selectedVerdict === "fail" ? "ALL" : "fail")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
              selectedVerdict === "fail" ? "bg-negative-light border-negative text-negative" : "bg-white border-border text-primary-muted hover:border-negative/40"
            }`}
          >
            <XCircle className="w-3.5 h-3.5 text-negative" />
            <span className="font-mono tabular-nums">{failCount}</span> Fail
          </button>
        </div>
      </div>

      {/* Layer Filter Buttons */}
      <div className="px-5 sm:px-6 py-3.5 border-b border-border bg-white flex items-center gap-1.5 overflow-x-auto no-scrollbar text-xs">
        <span className="text-primary-muted font-semibold mr-1 flex items-center gap-1.5 shrink-0">
          <Filter className="w-3.5 h-3.5" /> Layer
        </span>
        {["ALL", "L1", "L2", "L3", "L4", "L5", "L6"].map((lyr) => (
          <button
            key={lyr}
            onClick={() => setSelectedLayer(lyr)}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-colors shrink-0 ${
              selectedLayer === lyr
                ? "bg-primary text-white"
                : "text-primary-muted hover:bg-slate-100 hover:text-primary"
            }`}
          >
            {lyr}
          </button>
        ))}
      </div>

      {/* Metric Rows */}
      <div className="divide-y divide-border">
        {filtered.map((item, idx) => (
          <div key={idx} className="p-5 sm:px-6 sm:py-5 hover:bg-slate-50/70 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start sm:items-center gap-3.5 flex-1 min-w-0">
              {/* Verdict Icon */}
              <div className="mt-0.5 sm:mt-0 flex-shrink-0">
                {item.verdict === "pass" && (
                  <div className="w-7 h-7 rounded-full bg-emerald-50 text-accent flex items-center justify-center">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                )}
                {item.verdict === "warn" && (
                  <div className="w-7 h-7 rounded-full bg-amber-50 text-warning flex items-center justify-center">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                )}
                {item.verdict === "fail" && (
                  <div className="w-7 h-7 rounded-full bg-red-50 text-negative flex items-center justify-center">
                    <XCircle className="w-4 h-4" />
                  </div>
                )}
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold font-mono px-1.5 py-0.5 rounded bg-slate-100 text-primary-muted">
                    {item.layer}
                  </span>
                  <span className="text-sm sm:text-[15px] font-semibold text-primary break-words">{item.metric}</span>
                </div>
                <p className="text-xs sm:text-[13px] text-primary-muted mt-1 leading-relaxed">
                  {item.explanation}
                </p>
              </div>
            </div>

            {/* Metric Value */}
            <div className="self-end sm:self-center text-right flex-shrink-0">
              <span className="inline-block px-3 py-1.5 rounded-lg font-mono font-bold text-sm bg-slate-100 text-primary tabular-nums">
                {item.value}
              </span>
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="p-10 text-center text-sm text-primary-muted">
            No metrics found matching the selected filter.
          </div>
        )}
      </div>
    </div>
  );
}
