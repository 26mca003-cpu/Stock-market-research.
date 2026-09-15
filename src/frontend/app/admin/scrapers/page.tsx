"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Activity, Clock } from "lucide-react";
import { SkeletonCard } from "@/components/Skeleton";

export default function ScrapersPage() {
  const [scrapers, setScrapers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/admin/scrapers")
      .then(setScrapers)
      .catch(console.error)
      .finally(() => setLoading(false));
    const interval = setInterval(() => {
      api.get("/admin/scrapers").then(setScrapers).catch(() => {});
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold font-serif text-primary">Scraper Health</h1>
        <p className="text-slate-500 mt-1">Monitor data extraction pipelines.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading &&
          Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)}
        {!loading && scrapers.map((s) => (
          <div key={s.source} className="bg-white p-6 rounded-2xl border border-border shadow-[0_1px_3px_rgba(15,23,42,0.04)] hover:shadow-[0_6px_20px_rgba(15,23,42,0.06)] transition-shadow flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-primary capitalize">{s.source}</h3>
                <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${s.success_rate_24h > 90 ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                  {s.success_rate_24h || 0}% Success
                </span>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Items Scraped Today</span>
                  <span className="font-medium text-primary">{s.items_today}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Avg Latency</span>
                  <span className="font-medium flex items-center text-primary">
                    <Clock className="w-3 h-3 mr-1 text-slate-400" />
                    {s.avg_latency_ms} ms
                  </span>
                </div>
              </div>
            </div>
            {s.last_error && (
              <div className="mt-4 pt-4 border-t border-slate-100">
                <p className="text-xs font-medium text-red-500 mb-1">Latest Error:</p>
                <p className="text-xs text-slate-600 truncate">{s.last_error}</p>
              </div>
            )}
          </div>
        ))}
        {scrapers.length === 0 && !loading && (
          <div className="col-span-full py-12 text-center text-slate-500 bg-white rounded-xl border border-slate-200 border-dashed">
            No scrape events logged yet.
          </div>
        )}
      </div>
    </div>
  );
}
