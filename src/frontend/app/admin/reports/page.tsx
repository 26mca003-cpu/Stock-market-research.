"use client";
import { useEffect, useState } from "react";
import api from "@/lib/api";
import { RefreshCw, Trash2, FileJson, X } from "lucide-react";
import { SkeletonTable } from "@/components/Skeleton";

export default function ReportsPage() {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({});
  const [selectedJson, setSelectedJson] = useState<any>(null);

  useEffect(() => {
    fetchReports();
    const interval = setInterval(fetchReports, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchReports = async () => {
    try {
      const res = await api.get("/admin/reports?limit=100");
      setReports(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const invalidateCache = async (ticker: string) => {
    setActionLoading(prev => ({ ...prev, [ticker + "_inv"]: true }));
    try {
      await api.post("/admin/cache/invalidate", { ticker });
      alert(`Cache invalidated for ${ticker}`);
    } catch (e) {
      alert("Failed to invalidate cache");
    } finally {
      setActionLoading(prev => ({ ...prev, [ticker + "_inv"]: false }));
    }
  };

  const reanalyze = async (ticker: string) => {
    setActionLoading(prev => ({ ...prev, [ticker + "_re"]: true }));
    try {
      await api.post(`/admin/reports/${ticker}/reanalyze`, {});
      alert(`Reanalyzed ${ticker}`);
      fetchReports();
    } catch (e) {
      alert("Failed to reanalyze");
    } finally {
      setActionLoading(prev => ({ ...prev, [ticker + "_re"]: false }));
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold font-serif text-primary">Analysis Reports & Evidence</h1>
        <p className="text-slate-500 mt-1">Audit raw institutional scoring evidence, invalidate cache, and re-run pipelines.</p>
      </div>

      <div className="bg-white rounded-2xl border border-border shadow-[0_1px_3px_rgba(15,23,42,0.04)] overflow-hidden">
        {loading ? (
          <SkeletonTable rows={6} cols={6} />
        ) : (
        <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="bg-slate-50/70 border-b border-border text-[11px] uppercase tracking-wider text-primary-muted font-semibold">
            <tr>
              <th className="px-4 sm:px-6 py-4">Ticker</th>
              <th className="px-4 sm:px-6 py-4">Score</th>
              <th className="px-4 sm:px-6 py-4">Rating Band</th>
              <th className="px-4 sm:px-6 py-4">Confidence</th>
              <th className="px-4 sm:px-6 py-4">Generated At</th>
              <th className="px-4 sm:px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {reports.map((r: any) => (
              <tr key={r.id} className="hover:bg-slate-50/50">
                <td className="px-4 sm:px-6 py-4 font-bold text-primary">{r.ticker}</td>
                <td className="px-4 sm:px-6 py-4 font-semibold">{r.score_total}/100</td>
                <td className="px-4 sm:px-6 py-4">
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                    r.rating_band === 'Excellent' ? 'bg-emerald-100 text-emerald-800' :
                    r.rating_band === 'Good' ? 'bg-green-100 text-green-800' :
                    r.rating_band === 'Fair' ? 'bg-amber-100 text-amber-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {r.rating_band || "Evaluated"}
                  </span>
                </td>
                <td className="px-4 sm:px-6 py-4 text-slate-600 text-xs uppercase font-medium">
                  {r.confidence_level || "High"}
                </td>
                <td className="px-4 sm:px-6 py-4 text-slate-500 whitespace-nowrap">
                  {r.created_at ? new Date(r.created_at).toLocaleString() : "-"}
                </td>
                <td className="px-4 sm:px-6 py-4">
                  <div className="flex items-center justify-end gap-2">
                  <button
                    onClick={() => setSelectedJson(r.full_report_json || r)}
                    className="p-2 text-slate-600 hover:text-accent hover:bg-accent-light rounded-xl transition-colors"
                    title="View Raw JSON Evidence"
                  >
                    <FileJson className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => invalidateCache(r.ticker)}
                    disabled={actionLoading[r.ticker + "_inv"]}
                    className="p-2 text-slate-600 hover:text-amber-600 hover:bg-amber-50 rounded-xl transition-colors disabled:opacity-50"
                    title="Invalidate Cache"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => reanalyze(r.ticker)}
                    disabled={actionLoading[r.ticker + "_re"]}
                    className="p-2 text-slate-600 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-colors disabled:opacity-50"
                    title="Force Reanalyze"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                  </div>
                </td>
              </tr>
            ))}
            {reports.length === 0 && !loading && (
              <tr>
                <td colSpan={6} className="px-4 sm:px-6 py-12 text-center text-slate-500">
                  No reports generated yet. Run analysis from the main dashboard or triggers.
                </td>
              </tr>
            )}
          </tbody>
        </table>
        </div>
        )}
      </div>

      {/* Raw JSON Modal */}
      {selectedJson && (
        <div className="fixed inset-0 lg:left-64 z-[80] flex items-center justify-center p-4">
          <div className="absolute inset-0" onClick={() => setSelectedJson(null)} />
          <div className="relative bg-white rounded-2xl max-w-2xl w-full max-h-[80vh] flex flex-col shadow-2xl ring-1 ring-black/5 border border-slate-200">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileJson className="w-5 h-5 text-accent" />
                <h3 className="font-bold text-primary">Raw Scoring Evidence JSON</h3>
              </div>
              <button
                onClick={() => setSelectedJson(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto font-mono text-xs bg-slate-950 text-slate-200 rounded-b-2xl">
              <pre>{JSON.stringify(selectedJson, null, 2)}</pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

