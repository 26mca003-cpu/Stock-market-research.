"use client";

import React, { useState, useEffect } from "react";
import { useParams, useSearchParams } from "next/navigation";
import {
  api,
  ResearchReport,
  NewsItem
} from "@/lib/api";
import ScoreGauge from "@/components/ScoreGauge";
import LayerBars from "@/components/LayerBars";
import ChecklistTable from "@/components/ChecklistTable";
import StockChart from "@/components/StockChart";
import NewsCard from "@/components/NewsCard";
import RedFlagCard from "@/components/RedFlagCard";
import LoadingProgress from "@/components/LoadingProgress";
import Disclaimer from "@/components/Disclaimer";
import { sanitizeText } from "@/lib/sanitize";
import {
  TrendingUp,
  TrendingDown,
  RefreshCw,
  FileText,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  CheckCircle,
  AlertCircle,
  Printer
} from "lucide-react";

export default function ResearchReportPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const ticker = (params?.ticker as string) || "RELIANCE.NS";
  const cacheKey = `vriddhi_report_cache_${ticker}`;
  // Set by the watchlist card when it already shows a score for this ticker
  // (item.score_total !== null) — proves analysis is already complete on
  // the backend, even if this browser tab has no local sessionStorage
  // cache for it yet. Lets us skip the progress screen correctly for a
  // stock that was analyzed in a previous session/device.
  const knownScore = searchParams?.get("known") === "1";

  const readCache = (): ResearchReport | null => {
    if (typeof window === "undefined") return null;
    try {
      const raw = sessionStorage.getItem(cacheKey);
      return raw ? (JSON.parse(raw) as ResearchReport) : null;
    } catch {
      return null;
    }
  };

  const [report, setReport] = useState<ResearchReport | null>(() => readCache());
  const [news, setNews] = useState<NewsItem[]>([]);
  // Score already available (this tab's cache, or the watchlist card told
  // us via ?known=1 that item.score_total was already set) -> skip the
  // progress screen and go straight to the report. Only a genuinely
  // first-time analysis (no score yet, anywhere) shows the progress screen,
  // since that's the only case where real work is actually happening.
  const [loading, setLoading] = useState(() => readCache() === null && !knownScore);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [activeTab, setActiveTab] = useState<"checklist" | "chart" | "news" | "documents" | "summary">("checklist");

  const loadData = async (force: boolean = false) => {
    try {
      if (force) setRefreshing(true);
      else if (!report && !knownScore) setLoading(true);

      const rep = force
        ? await api.refreshReport(ticker)
        : await api.getResearchReport(ticker);
      setReport(rep);
      setLoadError(false);
      try {
        sessionStorage.setItem(cacheKey, JSON.stringify(rep));
      } catch {
        // sessionStorage can throw in private-browsing/quota-exceeded cases — non-fatal
      }

      // Also fetch news
      api.getNews(ticker).then((n) => setNews(n)).catch(() => {});
    } catch (err) {
      console.error("Failed to load research report:", err);
      setLoadError(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData(false);
  }, [ticker]);

  if (loading) {
    return <LoadingProgress ticker={ticker} />;
  }

  if (!report) {
    // A ?known=1 visit (score already existed on the watchlist card) has no
    // local cache yet but the backend fetch is still in flight — this is a
    // normal brief gap, not a real failure, so render nothing rather than
    // flashing the "Unable to load report" error screen for it. A genuine
    // fetch failure still surfaces the error screen via loadError.
    if (knownScore && !loadError) {
      return null;
    }
    return (
      <div className="py-20 text-center space-y-4">
        <AlertCircle className="w-10 h-10 text-negative mx-auto" />
        <h3 className="font-serif font-bold text-xl text-primary">Unable to load report</h3>
        <p className="text-xs text-primary-muted">Could not retrieve stock fundamentals for {ticker}.</p>
        <button
          onClick={() => loadData(true)}
          className="px-4 py-2 bg-accent text-white text-xs font-semibold rounded-xl"
        >
          Try Again
        </button>
      </div>
    );
  }

  const isUp = (report.price?.day_change_pct || 0) >= 0;

  return (
    <div className="space-y-6 sm:space-y-8 py-2 sm:py-4">
      {/* 1. Header Bar */}
      <div className="bg-white rounded-2xl p-4 sm:p-6 border border-border shadow-card flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-serif font-bold text-xl sm:text-3xl text-primary tracking-tight">
              {report.company_name}
            </h1>
            <span className="text-xs font-bold px-2 py-0.5 rounded bg-slate-100 text-primary-muted">
              {report.ticker}
            </span>
            {report.cached && (
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-600 border border-blue-200">
                24h Cached
              </span>
            )}
          </div>
          <p className="text-xs text-primary-muted mt-1">
            Last analyzed: {new Date(report.last_analyzed).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true })} IST
          </p>
        </div>

        {/* Live Price & Actions */}
        <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4 w-full sm:w-auto">
          <div className="text-left sm:text-right">
            <div className="font-mono font-semibold text-xl sm:text-2xl text-primary tabular-nums">
              ₹{report.price?.last ? report.price.last.toLocaleString("en-IN") : "—"}
            </div>
            <div className={`text-xs font-semibold flex items-center sm:justify-end ${isUp ? "text-accent" : "text-negative"}`}>
              {isUp ? <TrendingUp className="w-3.5 h-3.5 mr-0.5" /> : <TrendingDown className="w-3.5 h-3.5 mr-0.5" />}
              {isUp ? "+" : ""}{report.price?.day_change_pct}%
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="p-2.5 rounded-xl border border-border hover:bg-slate-50 text-primary-muted hover:text-primary transition-all flex items-center gap-1.5 text-xs font-semibold"
              title="Export / Print PDF Report"
            >
              <Printer className="w-4 h-4 text-accent" />
              <span className="hidden sm:inline">Export PDF</span>
            </button>

            <button
              onClick={() => loadData(true)}
              disabled={refreshing}
              className="p-2.5 rounded-xl border border-border hover:bg-slate-50 text-primary-muted hover:text-primary transition-all disabled:opacity-50"
              title="Refresh Analysis"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin text-accent" : ""}`} />
            </button>
          </div>
        </div>
      </div>

      {/* 2. Top Analytics: Score Gauge & 6-Layer Bars */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1">
          <ScoreGauge score={report.score_total} ratingBand={report.rating_band} />
        </div>
        <div className="md:col-span-2">
          <LayerBars layers={report.layers} />
        </div>
      </div>

      {/* 3. Red Flags Alert (If present per PRD §6.2) */}
      <RedFlagCard flags={report.red_flags} />

      {/* 4. Tabbed Deep-Dive Section */}
      <div className="space-y-4">
        {/* Tab Buttons */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-border -mx-4 px-4 sm:mx-0 sm:px-0 no-scrollbar">
          {[
            { id: "checklist", label: "Evidence Checklist", short: "Checklist", icon: CheckCircle },
            { id: "chart", label: "Candlestick Chart", short: "Chart", icon: TrendingUp },
            { id: "news", label: "News & Sentiment", short: "News", icon: FileText },
            { id: "summary", label: "AI Summary", short: "AI", icon: Sparkles },
            { id: "documents", label: "Source Documents", short: "Sources", icon: ShieldCheck }
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-3 sm:px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all shrink-0 ${
                  isActive
                    ? "bg-primary text-white shadow-sm"
                    : "text-primary-muted hover:bg-white hover:text-primary"
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="hidden sm:inline">{tab.label}</span>
                <span className="sm:hidden">{tab.short}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Contents */}
        {activeTab === "checklist" && (
          <ChecklistTable checklist={report.checklist} />
        )}

        {activeTab === "chart" && (
          <StockChart ticker={report.ticker} />
        )}

        {activeTab === "news" && (
          <NewsCard news={news} />
        )}

        {activeTab === "summary" && (
          <div className="bg-white rounded-2xl p-6 sm:p-8 border border-border shadow-card space-y-4">
            <div className="flex items-center gap-2 text-accent">
              <Sparkles className="w-5 h-5" />
              <h3 className="font-serif font-bold text-lg text-primary">
                Plain-English AI Synthesis
              </h3>
            </div>
            <div className="text-sm text-primary leading-relaxed whitespace-pre-line bg-slate-50 p-5 rounded-xl border border-border">
              {sanitizeText(report.ai_summary)}
            </div>
            <p className="text-xs text-primary-muted">
              Note: AI summary references numerical layer scores and sources strictly in compliance with SEBI educational guidelines.
            </p>
          </div>
        )}

        {activeTab === "documents" && (
          <div className="bg-white rounded-2xl p-6 border border-border shadow-card space-y-4">
            <div>
              <h3 className="font-serif font-bold text-lg text-primary">Public Information Sources</h3>
              <p className="text-xs text-primary-muted mt-0.5">
                Every calculation and score is backed by public exchange filings and verified statements
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              {report.sources.map((src, idx) => (
                <a
                  key={idx}
                  href={src.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-4 rounded-xl border border-border hover:border-accent hover:bg-slate-50 transition-all flex flex-col justify-between group"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-primary group-hover:text-accent transition-colors">{src.name}</span>
                      <ExternalLink className="w-4 h-4 text-primary-muted group-hover:text-accent" />
                    </div>
                    <p className="text-xs text-primary-muted mt-1">Used for: {src.used_for}</p>
                  </div>
                  <span className="text-[11px] text-accent font-semibold mt-3">View Source Filings →</span>
                </a>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 5. Statutory Disclaimer */}
      <Disclaimer />
    </div>
  );
}
