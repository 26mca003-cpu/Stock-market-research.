"use client";
import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Database, AlertCircle, CheckCircle2, ShieldCheck, Activity, Layers } from "lucide-react";
import { SkeletonHeader, SkeletonStatCard, SkeletonTable } from "@/components/Skeleton";

export default function DataQualityPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchDataQuality = async () => {
    try {
      setLoading(true);
      const res = await api.get("/admin/data-quality");
      setData(res);
    } catch (e) {
      console.error("Failed to load data quality", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDataQuality();
    const interval = setInterval(fetchDataQuality, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold font-serif text-primary">Data Quality & Integrity Audit</h1>
          <p className="text-slate-500 mt-1">Audit dataset completeness, missing financial metrics, and cache staleness.</p>
        </div>
      </div>

      {loading && !data && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <SkeletonStatCard key={i} />
            ))}
          </div>
          <SkeletonTable rows={6} cols={5} />
        </>
      )}

      {!(loading && !data) && (
      <>
      {/* Top Level Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-border shadow-[0_1px_3px_rgba(15,23,42,0.04)] hover:shadow-[0_6px_20px_rgba(15,23,42,0.06)] transition-shadow">
          <div className="flex items-center gap-2 text-slate-500 mb-2">
            <Database className="w-4 h-4 text-accent" />
            <span className="text-xs font-semibold uppercase tracking-wider">Audited Stocks</span>
          </div>
          <p className="text-2xl font-mono font-semibold text-primary tabular-nums">{data?.total_audited ?? 0}</p>
          <p className="text-xs text-slate-400 mt-0.5">Tracked universe</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-border shadow-[0_1px_3px_rgba(15,23,42,0.04)] hover:shadow-[0_6px_20px_rgba(15,23,42,0.06)] transition-shadow">
          <div className="flex items-center gap-2 text-slate-500 mb-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span className="text-xs font-semibold uppercase tracking-wider">Completeness</span>
          </div>
          <p className="text-2xl font-bold text-emerald-600">{data?.completeness_pct ?? 100}%</p>
          <p className="text-xs text-slate-400 mt-0.5">Zero null values</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-border shadow-[0_1px_3px_rgba(15,23,42,0.04)] hover:shadow-[0_6px_20px_rgba(15,23,42,0.06)] transition-shadow">
          <div className="flex items-center gap-2 text-slate-500 mb-2">
            <Layers className="w-4 h-4 text-amber-600" />
            <span className="text-xs font-semibold uppercase tracking-wider">Partial Reports</span>
          </div>
          <p className="text-2xl font-mono font-semibold text-primary tabular-nums">{data?.partial_reports ?? 0}</p>
          <p className="text-xs text-slate-400 mt-0.5">Missing layer scoring</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-border shadow-[0_1px_3px_rgba(15,23,42,0.04)] hover:shadow-[0_6px_20px_rgba(15,23,42,0.06)] transition-shadow">
          <div className="flex items-center gap-2 text-slate-500 mb-2">
            <Activity className="w-4 h-4 text-accent" />
            <span className="text-xs font-semibold uppercase tracking-wider">Stale Cache</span>
          </div>
          <p className="text-2xl font-mono font-semibold text-primary tabular-nums">{data?.stale_cache ?? 0}</p>
          <p className="text-xs text-slate-400 mt-0.5">Older than 7 days</p>
        </div>
      </div>

      {/* Metric Coverage Breakdown */}
      <div className="bg-white p-6 rounded-2xl border border-border shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
        <h2 className="text-base font-bold text-primary mb-4 flex items-center gap-2">
          <Activity className="w-4 h-4 text-accent" />
          Key Financial Metric Coverage Across Active Stocks
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
            <p className="text-xs text-slate-500 font-medium">Stock P/E Ratio</p>
            <p className="text-xl font-bold text-primary mt-1">{data?.metrics_coverage?.pe_ratio ?? "100%"}</p>
          </div>
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
            <p className="text-xs text-slate-500 font-medium">ROCE / ROE</p>
            <p className="text-xl font-bold text-primary mt-1">{data?.metrics_coverage?.roce ?? "100%"}</p>
          </div>
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
            <p className="text-xs text-slate-500 font-medium">Debt to Equity</p>
            <p className="text-xl font-bold text-primary mt-1">{data?.metrics_coverage?.debt_to_equity ?? "100%"}</p>
          </div>
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
            <p className="text-xs text-slate-500 font-medium">Shareholding Pattern</p>
            <p className="text-xl font-bold text-primary mt-1">{data?.metrics_coverage?.shareholding ?? "100%"}</p>
          </div>
        </div>
      </div>

      {/* Audited Stocks Health Table */}
      <div className="bg-white rounded-2xl border border-border shadow-[0_1px_3px_rgba(15,23,42,0.04)] overflow-hidden">
        <div className="px-4 sm:px-6 py-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-base font-bold text-primary flex items-center gap-2">
            <Database className="w-4 h-4 text-emerald-600" />
            Audited Stock Fundamentals Universe
          </h2>
          <span className="text-xs font-semibold px-2.5 py-0.5 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-200">
            {data?.audited_stocks?.length ?? 0} Records Verified
          </span>
        </div>

        <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="bg-slate-50/70 border-b border-border text-[11px] uppercase tracking-wider text-primary-muted font-semibold">
            <tr>
              <th className="px-4 sm:px-6 py-3.5">Ticker</th>
              <th className="px-4 sm:px-6 py-3.5">Audit Health</th>
              <th className="px-4 sm:px-6 py-3.5">P/E Ratio</th>
              <th className="px-4 sm:px-6 py-3.5">ROCE</th>
              <th className="px-4 sm:px-6 py-3.5">Debt / Equity</th>
              <th className="px-4 sm:px-6 py-3.5 text-right">Last Verified</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {data?.audited_stocks?.map((s: any) => (
              <tr key={s.ticker} className="hover:bg-slate-50/50">
                <td className="px-4 sm:px-6 py-4 font-bold text-primary">{s.ticker}</td>
                <td className="px-4 sm:px-6 py-4">
                  {s.status === "HEALTHY" ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <CheckCircle2 className="w-3 h-3" />
                      HEALTHY
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                      <AlertCircle className="w-3 h-3" />
                      MISSING DATA
                    </span>
                  )}
                </td>
                <td className="px-4 sm:px-6 py-4 font-medium text-slate-700">{s.pe ? Number(s.pe).toFixed(1) : "-"}</td>
                <td className="px-4 sm:px-6 py-4 font-medium text-slate-700">{s.roce ? `${Number(s.roce).toFixed(1)}%` : "-"}</td>
                <td className="px-4 sm:px-6 py-4 font-medium text-slate-700">{s.debt_to_equity !== undefined && s.debt_to_equity !== null ? Number(s.debt_to_equity).toFixed(2) : "-"}</td>
                <td className="px-4 sm:px-6 py-4 text-right text-xs text-slate-500">
                  {s.last_audited ? new Date(s.last_audited).toLocaleTimeString() : "Recent"}
                </td>
              </tr>
            ))}
            {(!data?.audited_stocks || data.audited_stocks.length === 0) && !loading && (
              <tr>
                <td colSpan={6} className="px-4 sm:px-6 py-8 text-center text-slate-500">
                  No fundamentals cached yet. Trigger fundamentals cron to audit universe.
                </td>
              </tr>
            )}
          </tbody>
        </table>
        </div>
      </div>

      {/* Missing Fields Issues Section */}
      <div className="bg-white rounded-2xl border border-border shadow-[0_1px_3px_rgba(15,23,42,0.04)] overflow-hidden">
        <div className="px-4 sm:px-6 py-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-base font-bold text-primary flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600" />
            Detected Data Field Discrepancies
          </h2>
          <span className="text-xs font-medium px-2.5 py-0.5 bg-slate-100 rounded-full text-slate-600">
            {data?.tickers_with_missing?.length ?? 0} Issues
          </span>
        </div>

        {(!data?.tickers_with_missing || data.tickers_with_missing.length === 0) ? (
          <div className="p-8 text-center">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
            <p className="text-primary font-bold text-sm">All Audited Fields Complete</p>
            <p className="text-slate-500 text-xs mt-0.5">No null fields or data discrepancies detected across audited stocks.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {data.tickers_with_missing.map((item: any) => (
              <div key={item.ticker} className="px-4 sm:px-6 py-4 flex items-center justify-between text-sm">
                <div>
                  <span className="font-bold text-primary">{item.ticker}</span>
                  <div className="text-xs text-red-600 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    Missing fields: {item.missing_fields?.join(", ") || "None"}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      </>
      )}
    </div>
  );
}


