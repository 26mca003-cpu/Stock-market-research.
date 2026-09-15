"use client";

import React, { useState, useEffect } from "react";
import { api, ResearchReport } from "@/lib/api";
import ScoreGauge from "@/components/ScoreGauge";
import LayerBars from "@/components/LayerBars";
import Disclaimer from "@/components/Disclaimer";
import { Skeleton } from "@/components/Skeleton";
import { GitCompare, ArrowRight, CheckCircle2, AlertTriangle, XCircle } from "lucide-react";

export default function ComparePage() {
  const [stockA, setStockA] = useState("RELIANCE.NS");
  const [stockB, setStockB] = useState("TCS.NS");
  const [reportA, setReportA] = useState<ResearchReport | null>(null);
  const [reportB, setReportB] = useState<ResearchReport | null>(null);
  const [loading, setLoading] = useState(false);

  const runComparison = async () => {
    setLoading(true);
    try {
      const [resA, resB] = await Promise.all([
        api.getResearchReport(stockA),
        api.getResearchReport(stockB)
      ]);
      setReportA(resA);
      setReportB(resB);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runComparison();
  }, []);

  return (
    <div className="space-y-8 py-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif font-bold text-2xl sm:text-3xl text-primary">Head-to-Head Comparison</h1>
          <p className="text-xs sm:text-sm text-primary-muted mt-1">
            Compare two companies side-by-side across all 6 research layers
          </p>
        </div>

        {/* Input Selectors */}
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <input
            type="text"
            value={stockA}
            onChange={(e) => setStockA(e.target.value.toUpperCase())}
            className="flex-1 min-w-0 sm:flex-none sm:w-32 uppercase text-xs font-bold px-3 py-2.5 min-h-[44px] rounded-xl border border-border bg-white"
            placeholder="RELIANCE.NS"
          />
          <span className="text-xs font-bold text-primary-muted shrink-0">vs</span>
          <input
            type="text"
            value={stockB}
            onChange={(e) => setStockB(e.target.value.toUpperCase())}
            className="flex-1 min-w-0 sm:flex-none sm:w-32 uppercase text-xs font-bold px-3 py-2.5 min-h-[44px] rounded-xl border border-border bg-white"
            placeholder="TCS.NS"
          />
          <button
            onClick={runComparison}
            disabled={loading}
            className="w-full sm:w-auto justify-center min-h-[44px] px-4 py-2 bg-accent hover:bg-accent-hover text-white text-xs font-semibold rounded-xl transition-colors disabled:opacity-50 flex items-center"
          >
            {loading ? "Comparing..." : "Compare"}
          </button>
        </div>
      </div>

      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[0, 1].map((i) => (
            <div key={i} className="space-y-6">
              <div className="bg-white rounded-2xl p-6 border border-border shadow-card space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <Skeleton className="h-5 w-40" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                  <div className="space-y-2 text-right">
                    <Skeleton className="h-5 w-24 ml-auto" />
                    <Skeleton className="h-3 w-14 ml-auto" />
                  </div>
                </div>
                <Skeleton className="h-48 w-full rounded-xl" />
              </div>
              <Skeleton className="h-40 w-full rounded-2xl" />
            </div>
          ))}
        </div>
      )}

      {!loading && reportA && reportB && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Stock A Card */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl p-6 border border-border shadow-card">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-serif font-bold text-xl text-primary">{reportA.company_name}</h3>
                  <span className="text-xs font-bold text-primary-muted">{reportA.ticker}</span>
                </div>
                <div className="text-right">
                  <div className="font-mono font-semibold text-xl text-primary tabular-nums">₹{reportA.price?.last}</div>
                  <span className="text-xs font-semibold text-accent">+{reportA.price?.day_change_pct}%</span>
                </div>
              </div>
              <ScoreGauge score={reportA.score_total} ratingBand={reportA.rating_band} />
            </div>
            <LayerBars layers={reportA.layers} />
          </div>

          {/* Stock B Card */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl p-6 border border-border shadow-card">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-serif font-bold text-xl text-primary">{reportB.company_name}</h3>
                  <span className="text-xs font-bold text-primary-muted">{reportB.ticker}</span>
                </div>
                <div className="text-right">
                  <div className="font-mono font-semibold text-xl text-primary tabular-nums">₹{reportB.price?.last}</div>
                  <span className="text-xs font-semibold text-accent">+{reportB.price?.day_change_pct}%</span>
                </div>
              </div>
              <ScoreGauge score={reportB.score_total} ratingBand={reportB.rating_band} />
            </div>
            <LayerBars layers={reportB.layers} />
          </div>
        </div>
      )}

      <Disclaimer />
    </div>
  );
}
