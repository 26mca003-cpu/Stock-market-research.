"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Cpu, Zap } from "lucide-react";
import { SkeletonCard } from "@/components/Skeleton";

export default function LLMPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/admin/llm").then(setData).catch(console.error).finally(() => setLoading(false));
    const interval = setInterval(() => {
      api.get("/admin/llm").then(setData).catch(() => {});
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold font-serif text-primary">LLM Usage</h1>
        <p className="text-slate-500 mt-1">AI provider health and token limits.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {loading &&
          Array.from({ length: 2 }).map((_, i) => <SkeletonCard key={i} />)}
        {!loading && data?.providers?.map((p: any) => (
          <div key={p.provider} className="bg-white p-6 rounded-2xl border border-border shadow-[0_1px_3px_rgba(15,23,42,0.04)] hover:shadow-[0_6px_20px_rgba(15,23,42,0.06)] transition-shadow">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
              <h3 className="text-xl font-bold text-primary capitalize flex items-center">
                <Cpu className="w-5 h-5 mr-2 text-accent" />
                {p.provider}
              </h3>
              <span className="text-sm font-medium text-slate-500">Avg: {p.avg_latency_ms}ms</span>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-slate-500 uppercase font-semibold tracking-wider">Requests (24h)</p>
                <p className="text-2xl font-mono font-semibold text-primary tabular-nums mt-1">{p.requests_today}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase font-semibold tracking-wider">Tokens Out</p>
                <p className="text-2xl font-mono font-semibold text-primary tabular-nums mt-1">{p.tokens_out_today}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase font-semibold tracking-wider">Tokens In</p>
                <p className="text-2xl font-mono font-semibold text-primary tabular-nums mt-1">{p.tokens_in_today}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase font-semibold tracking-wider">Fallback Events</p>
                <p className="text-2xl font-mono font-semibold text-primary tabular-nums mt-1">{p.fallback_events}</p>
              </div>
            </div>
            
            <div className="mt-6">
              <div className="flex justify-between text-xs mb-1">
                <span className="font-semibold text-slate-600">Est. Quota Usage</span>
                <span className="text-slate-600">{p.quota_pct}%</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2">
                <div className={`h-2 rounded-full ${p.quota_pct > 80 ? 'bg-red-500' : 'bg-accent'}`} style={{ width: `${p.quota_pct}%` }}></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
