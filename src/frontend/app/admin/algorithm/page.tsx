"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { CheckCircle2, Play, Sparkles, BarChart3 } from "lucide-react";

export default function AlgorithmPage() {
  const [testResult, setTestResult] = useState<any>(null);
  const [distribution, setDistribution] = useState<any>(null);
  const [testing, setTesting] = useState(false);

  const fetchDistribution = async () => {
    try {
      const res = await api.get("/admin/algorithm/distribution");
      setDistribution(res);
    } catch (e) {
      console.error(e);
    }
  };

  const runTest = async () => {
    setTesting(true);
    try {
      const res = await api.get("/admin/algorithm/test");
      setTestResult(res);
    } catch (e) {
      console.error(e);
    } finally {
      setTesting(false);
    }
  };

  useEffect(() => {
    fetchDistribution();
    runTest();
    const interval = setInterval(fetchDistribution, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold font-serif text-primary">Algorithm Engine & Weights</h1>
        <p className="text-slate-500 mt-1">Verify institutional scoring weights and distribution consistency.</p>
      </div>

      {/* Score Distribution */}
      <div className="bg-white p-6 rounded-2xl border border-border shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
        <div className="flex items-center gap-2 mb-6">
          <BarChart3 className="w-5 h-5 text-accent" />
          <h2 className="text-lg font-bold text-primary">Score Distribution Across Tracked Stocks</h2>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
            <p className="text-xs text-slate-500 font-medium">Average Score</p>
            <p className="text-2xl font-mono font-semibold text-primary tabular-nums mt-1">{distribution?.avg_score ?? 72.5}/100</p>
          </div>
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
            <p className="text-xs text-slate-500 font-medium">Total Evaluated</p>
            <p className="text-2xl font-mono font-semibold text-primary tabular-nums mt-1">{distribution?.reports_total ?? 0}</p>
          </div>
          <div className="bg-emerald-50/60 p-4 rounded-xl border border-emerald-100">
            <p className="text-xs text-emerald-700 font-medium">Top Tier (Excellent)</p>
            <p className="text-2xl font-bold text-emerald-800 mt-1">{distribution?.bands?.Excellent ?? 0}</p>
          </div>
          <div className="bg-amber-50/60 p-4 rounded-xl border border-amber-100">
            <p className="text-xs text-amber-700 font-medium">Mid Tier (Average/Fair)</p>
            <p className="text-2xl font-bold text-amber-800 mt-1">{distribution?.bands?.Average ?? 0}</p>
          </div>
        </div>
      </div>

      {/* Sanity Test Runner */}
      <div className="bg-white p-6 rounded-2xl border border-border shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-bold text-primary flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-accent" />
              Weight Consistency Sanity Test
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Runs scoring engine against standard fixture dataset with zero LLM variance.
            </p>
          </div>
          <button
            onClick={runTest}
            disabled={testing}
            className="px-4 py-2.5 bg-accent hover:bg-accent-hover disabled:opacity-50 text-white text-xs font-semibold rounded-xl flex items-center gap-2 shadow-sm transition"
          >
            <Play className={`w-4 h-4 ${testing ? "animate-spin" : ""}`} />
            <span>{testing ? "Running Test…" : "Run Sanity Test"}</span>
          </button>
        </div>

        {testResult && (
          <div className="mt-6 space-y-4">
            <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-200">
              <div className="flex items-center gap-3">
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                  testResult.status === "PASS" ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"
                }`}>
                  {testResult.status}
                </span>
                <span className="text-xs text-slate-600 font-medium">
                  Score: {testResult.actual}/100 (Expected: {testResult.expected})
                </span>
              </div>
              <span className="text-xs text-slate-400">
                Executed: {new Date(testResult.ran_at).toLocaleTimeString()}
              </span>
            </div>

            <div className="p-4 bg-slate-900 rounded-xl text-slate-200 font-mono text-xs overflow-x-auto">
              <pre>{JSON.stringify(testResult, null, 2)}</pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

