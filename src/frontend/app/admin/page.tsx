"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Activity, CheckCircle2, AlertTriangle, XCircle, Clock } from "lucide-react";
import { SkeletonHeader, SkeletonStatCard, SkeletonCard, Skeleton } from "@/components/Skeleton";

export default function AdminOverview() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchOverview = async () => {
    try {
      const res = await api.get("/admin/overview");
      setData(res);
    } catch (e) {
      console.error("Failed to load overview", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
    const interval = setInterval(fetchOverview, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="space-y-8">
        <SkeletonHeader />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonStatCard key={i} />
          ))}
        </div>
        <div>
          <Skeleton className="h-5 w-40 mb-4" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        </div>
      </div>
    );
  }
  if (!data) return <div className="text-sm text-primary-muted">Failed to load data.</div>;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold font-serif text-primary">Platform Overview</h1>
        <p className="text-slate-500 mt-1">Live health and metrics for the Vriddhi system.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-border shadow-[0_1px_3px_rgba(15,23,42,0.04)] hover:shadow-[0_6px_20px_rgba(15,23,42,0.06)] transition-shadow">
          <p className="text-sm font-medium text-slate-500">Total Users</p>
          <h3 className="text-2xl sm:text-3xl font-mono font-semibold tabular-nums mt-2 text-primary">{data.totals?.users || 0}</h3>
        </div>
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-border shadow-[0_1px_3px_rgba(15,23,42,0.04)] hover:shadow-[0_6px_20px_rgba(15,23,42,0.06)] transition-shadow">
          <p className="text-sm font-medium text-slate-500">Tickers Tracked</p>
          <h3 className="text-2xl sm:text-3xl font-mono font-semibold tabular-nums mt-2 text-primary">{data.totals?.tickers_tracked || 0}</h3>
        </div>
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-border shadow-[0_1px_3px_rgba(15,23,42,0.04)] hover:shadow-[0_6px_20px_rgba(15,23,42,0.06)] transition-shadow">
          <p className="text-sm font-medium text-slate-500">Reports (24h)</p>
          <h3 className="text-2xl sm:text-3xl font-mono font-semibold tabular-nums mt-2 text-primary">{data.totals?.reports_24h || 0}</h3>
        </div>
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-border shadow-[0_1px_3px_rgba(15,23,42,0.04)] hover:shadow-[0_6px_20px_rgba(15,23,42,0.06)] transition-shadow">
          <p className="text-sm font-medium text-slate-500">News Items (24h)</p>
          <h3 className="text-2xl sm:text-3xl font-mono font-semibold tabular-nums mt-2 text-primary">{data.totals?.news_24h || 0}</h3>
        </div>
      </div>

      <div>
        <h2 className="text-xl font-bold text-primary mb-4">Deep Health Probes</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.components?.map((c: any) => (
            <div key={c.component} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-primary capitalize">{c.component.replace("_", " ")}</h3>
                  {c.status === "ok" ? (
                    <span className="flex items-center text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
                      <CheckCircle2 className="w-3 h-3 mr-1" /> OK
                    </span>
                  ) : c.status === "degraded" ? (
                    <span className="flex items-center text-xs font-medium text-amber-600 bg-amber-50 px-2 py-1 rounded-full">
                      <AlertTriangle className="w-3 h-3 mr-1" /> Degraded
                    </span>
                  ) : (
                    <span className="flex items-center text-xs font-medium text-red-600 bg-red-50 px-2 py-1 rounded-full">
                      <XCircle className="w-3 h-3 mr-1" /> Down
                    </span>
                  )}
                </div>
                <p className="text-sm text-slate-600">{c.detail}</p>
              </div>
              <div className="mt-4 flex items-center justify-between text-xs text-slate-400">
                <span className="flex items-center"><Clock className="w-3 h-3 mr-1" /> {c.latency_ms}ms</span>
                <span>{new Date(c.checked_at).toLocaleTimeString()}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
