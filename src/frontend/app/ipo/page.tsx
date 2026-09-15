"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { api, NewListingItem, IPOItem } from "@/lib/api";
import Disclaimer from "@/components/Disclaimer";
import { SkeletonCard, SkeletonTable } from "@/components/Skeleton";
import {
  TrendingUp,
  Calendar,
  Sparkles,
  Clock,
  CheckCircle,
  RefreshCw,
  ArrowRight,
  Building2,
  Activity,
  AlertCircle,
  Layers,
  Award,
  Search,
  X
} from "lucide-react";

type TabType = "upcoming" | "recent";
type SegmentFilter = "all" | "mainboard" | "sme";

function statusColor(status: string): string {
  switch (status.toLowerCase()) {
    case "active": return "bg-emerald-100 text-emerald-700 border-emerald-200";
    case "closed": return "bg-slate-100 text-slate-600 border-slate-200";
    case "forthcoming": return "bg-blue-100 text-blue-700 border-blue-200";
    default: return "bg-slate-100 text-slate-500 border-slate-200";
  }
}

function statusIcon(status: string) {
  switch (status.toLowerCase()) {
    case "active": return <Activity className="w-3 h-3" />;
    case "closed": return <CheckCircle className="w-3 h-3" />;
    case "forthcoming": return <Clock className="w-3 h-3" />;
    default: return <AlertCircle className="w-3 h-3" />;
  }
}

export default function IPOPage() {
  const router = useRouter();
  const [tab, setTab] = useState<TabType>("upcoming");
  const [ipoSegment, setIpoSegment] = useState<SegmentFilter>("all");
  const [recentSegment, setRecentSegment] = useState<SegmentFilter>("all");
  const [recentListings, setRecentListings] = useState<NewListingItem[]>([]);
  const [ipoRadar, setIpoRadar] = useState<IPOItem[]>([]);
  const [loadingRecent, setLoadingRecent] = useState(false);
  const [loadingIPO, setLoadingIPO] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [days, setDays] = useState(90);
  const [syncing, setSyncing] = useState(false);
  const [syncDone, setSyncDone] = useState(false);

  const loadRecent = async () => {
    setLoadingRecent(true);
    try {
      const data = await api.getNewListings(days);
      setRecentListings(data);
    } catch (e) {
      console.error("Failed to load recent listings:", e);
    } finally {
      setLoadingRecent(false);
    }
  };

  const loadIPO = async () => {
    setLoadingIPO(true);
    try {
      const data = await api.getIPORadar();
      setIpoRadar(data);
    } catch (e) {
      console.error("Failed to load IPO radar:", e);
    } finally {
      setLoadingIPO(false);
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      await api.triggerListingsSync();
      setSyncDone(true);
      setTimeout(() => setSyncDone(false), 3000);
      await loadRecent();
      await loadIPO();
    } catch (e) {
      console.error("Sync failed:", e);
    } finally {
      setSyncing(false);
    }
  };

  useEffect(() => {
    loadIPO();
    loadRecent();
  }, []);

  useEffect(() => {
    loadRecent();
  }, [days]);

  // Segment & Search Filtering for IPO Radar
  const filteredRadar = ipoRadar.filter((item) => {
    if (ipoSegment === "sme" && !item.is_sme) return false;
    if (ipoSegment === "mainboard" && item.is_sme) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchName = item.company_name?.toLowerCase().includes(q);
      const matchSym = item.symbol?.toLowerCase().includes(q);
      return matchName || matchSym;
    }
    return true;
  });

  const active = filteredRadar.filter((i) => i.status === "Active");
  const forthcoming = filteredRadar.filter((i) => i.status === "Forthcoming");
  const closed = filteredRadar.filter((i) => i.status === "Closed");

  const totalSME = ipoRadar.filter((i) => i.is_sme).length;
  const totalMainboard = ipoRadar.filter((i) => !i.is_sme).length;

  // Segment & Search Filtering for Recently Listed
  const filteredRecent = recentListings.filter((stock) => {
    if (recentSegment === "sme" && !stock.is_sme) return false;
    if (recentSegment === "mainboard" && stock.is_sme) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchName = stock.name?.toLowerCase().includes(q);
      const matchTicker = stock.ticker?.toLowerCase().includes(q);
      return matchName || matchTicker;
    }
    return true;
  });

  const recentSMECount = recentListings.filter((s) => s.is_sme).length;
  const recentMainboardCount = recentListings.filter((s) => !s.is_sme).length;

  return (
    <div className="space-y-8 py-4">
      {/* Header */}
      <div className="bg-white rounded-2xl p-6 border border-border shadow-card">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="p-1.5 rounded-lg bg-accent/10">
                <Sparkles className="w-5 h-5 text-accent" />
              </div>
              <h1 className="font-serif font-bold text-2xl text-primary">IPO Radar & New Listings</h1>
            </div>
            <p className="text-sm text-primary-muted max-w-2xl">
              Live feed of upcoming Mainboard & SME IPOs, subscription status, and recently listed companies.
              Tracks both National Stock Exchange (NSE) and SME Emerge platforms automatically.
            </p>
          </div>

          <button
            onClick={handleSync}
            disabled={syncing}
            className="w-full sm:w-auto justify-center min-h-[44px] flex items-center gap-2 px-4 py-2.5 rounded-xl bg-accent text-white text-sm font-semibold hover:bg-accent/90 transition-all shadow-sm disabled:opacity-60 shrink-0"
          >
            {syncing ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : syncDone ? (
              <CheckCircle className="w-4 h-4" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            {syncing ? "Syncing..." : syncDone ? "Synced!" : "Sync Now"}
          </button>
        </div>

        {/* Live Stats Bar */}
        <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Active IPOs Open", value: active.length, color: "text-emerald-700 bg-emerald-50" },
            { label: "SME IPOs Tracked", value: totalSME, color: "text-amber-700 bg-amber-50" },
            { label: "Mainboard IPOs", value: totalMainboard, color: "text-blue-700 bg-blue-50" },
            { label: `New Listed (${days}d)`, value: recentListings.length, color: "text-purple-700 bg-purple-50" },
          ].map((stat) => (
            <div key={stat.label} className={`rounded-xl p-3 flex items-center gap-3 ${stat.color.split(" ")[1]}`}>
              <span className={`font-mono font-semibold text-2xl tabular-nums ${stat.color.split(" ")[0]}`}>{stat.value}</span>
              <span className="text-xs text-primary-muted font-medium leading-tight">{stat.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Main Tab Switcher */}
      <div className="flex items-center gap-1 bg-white border border-border rounded-2xl p-1.5 shadow-card w-full sm:w-fit overflow-x-auto no-scrollbar">
        {[
          { id: "upcoming", label: `IPO Radar (${ipoRadar.length})`, icon: Activity },
          { id: "recent", label: `Recently Listed (${recentListings.length})`, icon: Calendar },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id as TabType)}
            className={`flex-1 sm:flex-none justify-center whitespace-nowrap flex items-center gap-2 px-5 py-2 min-h-[40px] rounded-xl text-sm font-semibold transition-all ${
              tab === t.id
                ? "bg-accent text-white shadow-sm"
                : "text-primary-muted hover:text-primary hover:bg-slate-50"
            }`}
          >
            <t.icon className="w-4 h-4" />
            {t.label}
          </button>
        ))}
      </div>

      {/* IPO RADAR TAB */}
      {tab === "upcoming" && (
        <div className="space-y-6">
          {/* Segment & Search Filter */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-border shadow-card">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-primary-muted uppercase tracking-wider">Segment:</span>
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                <button
                  onClick={() => setIpoSegment("all")}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                    ipoSegment === "all"
                      ? "bg-white text-primary shadow-sm"
                      : "text-primary-muted hover:text-primary"
                  }`}
                >
                  All ({ipoRadar.length})
                </button>
                <button
                  onClick={() => setIpoSegment("mainboard")}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                    ipoSegment === "mainboard"
                      ? "bg-white text-primary shadow-sm"
                      : "text-primary-muted hover:text-primary"
                  }`}
                >
                  Mainboard ({totalMainboard})
                </button>
                <button
                  onClick={() => setIpoSegment("sme")}
                  className={`flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                    ipoSegment === "sme"
                      ? "bg-amber-500 text-white shadow-sm"
                      : "text-amber-800 hover:text-amber-900 bg-amber-100/60"
                  }`}
                >
                  <Sparkles className="w-3 h-3" />
                  SME IPOs ({totalSME})
                </button>
              </div>
            </div>

            {/* Search Input & Status counters */}
            <div className="flex items-center gap-3 w-full md:w-auto">
              <div className="relative flex-1 md:w-64">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search IPO (e.g. Glass Wall, Kanohar)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-8 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-accent focus:bg-white transition-all text-primary placeholder:text-slate-400"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <div className="hidden lg:flex text-xs text-primary-muted items-center gap-3 shrink-0">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" /> {active.length} Active
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-blue-500 inline-block" /> {forthcoming.length} Forthcoming
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-slate-400 inline-block" /> {closed.length} Closed
                </span>
              </div>
            </div>
          </div>

          {/* Active IPOs */}
          {active.length > 0 && (
            <div className="space-y-3">
              <h2 className="font-serif font-bold text-lg text-primary flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse inline-block" />
                Open for Subscription — Apply Now
                <span className="text-xs font-sans font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  {active.length}
                </span>
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {active.map((ipo) => (
                  <IPOCard key={`${ipo.symbol}-${ipo.company_name}`} ipo={ipo} onResearch={(sym) => router.push(`/research/${sym}.NS`)} />
                ))}
              </div>
            </div>
          )}

          {/* Forthcoming IPOs */}
          {forthcoming.length > 0 && (
            <div className="space-y-3">
              <h2 className="font-serif font-bold text-lg text-primary flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-500" />
                Opening Soon (Upcoming Issues)
                <span className="text-xs font-sans font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                  {forthcoming.length}
                </span>
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {forthcoming.map((ipo) => (
                  <IPOCard key={`${ipo.symbol}-${ipo.company_name}`} ipo={ipo} onResearch={(sym) => router.push(`/research/${sym}.NS`)} />
                ))}
              </div>
            </div>
          )}

          {/* Closed IPOs */}
          {closed.length > 0 && (
            <div className="space-y-3">
              <h2 className="font-serif font-bold text-lg text-primary flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-slate-400" />
                Subscription Closed (Awaiting Allotment & Listing)
                <span className="text-xs font-sans font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                  {closed.length}
                </span>
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {closed.map((ipo) => (
                  <IPOCard key={`${ipo.symbol}-${ipo.company_name}`} ipo={ipo} onResearch={(sym) => router.push(`/research/${sym}.NS`)} />
                ))}
              </div>
            </div>
          )}

          {/* Empty State */}
          {!loadingIPO && active.length === 0 && forthcoming.length === 0 && closed.length === 0 && (
            <div className="text-center py-16 text-primary-muted bg-white rounded-2xl border border-border shadow-card">
              <Building2 className="w-10 h-10 mx-auto mb-3 text-slate-300" />
              <p className="font-semibold text-primary">No IPOs found</p>
              <p className="text-xs text-primary-muted mt-1 max-w-sm mx-auto">
                {searchQuery
                  ? `No IPO matches "${searchQuery}". Try searching with a different term or clear the filter.`
                  : "No IPO issues currently listed in this category."}
              </p>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="mt-3 px-3 py-1.5 text-xs font-semibold text-accent bg-accent/10 hover:bg-accent/20 rounded-xl transition-all"
                >
                  Clear Search Filter
                </button>
              )}
            </div>
          )}

          {loadingIPO && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* RECENTLY LISTED TAB */}
      {tab === "recent" && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-border shadow-card">
            {/* Segment Filter */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-primary-muted uppercase tracking-wider">Type:</span>
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                <button
                  onClick={() => setRecentSegment("all")}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                    recentSegment === "all"
                      ? "bg-white text-primary shadow-sm"
                      : "text-primary-muted hover:text-primary"
                  }`}
                >
                  All ({recentListings.length})
                </button>
                <button
                  onClick={() => setRecentSegment("mainboard")}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                    recentSegment === "mainboard"
                      ? "bg-white text-primary shadow-sm"
                      : "text-primary-muted hover:text-primary"
                  }`}
                >
                  Mainboard ({recentMainboardCount})
                </button>
                <button
                  onClick={() => setRecentSegment("sme")}
                  className={`flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                    recentSegment === "sme"
                      ? "bg-amber-500 text-white shadow-sm"
                      : "text-amber-800 hover:text-amber-900 bg-amber-100/60"
                  }`}
                >
                  <Sparkles className="w-3 h-3" />
                  SME Emerge ({recentSMECount})
                </button>
              </div>
            </div>

            {/* Time Window & Search */}
            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              <div className="relative w-full sm:w-48">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search listings..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-7 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-accent focus:bg-white transition-all text-primary placeholder:text-slate-400"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-xs text-primary-muted font-medium">Window:</span>
                {[30, 60, 90, 180, 365].map((d) => (
                  <button
                    key={d}
                    onClick={() => setDays(d)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all border ${
                      days === d
                        ? "bg-accent text-white border-accent shadow-sm"
                        : "bg-white text-primary-muted border-border hover:border-accent hover:text-accent"
                    }`}
                  >
                    {d}d
                  </button>
                ))}
                {loadingRecent && <div className="w-3.5 h-3.5 border-2 border-accent border-t-transparent rounded-full animate-spin ml-1" />}
              </div>
            </div>
          </div>

          {/* Listings Grid */}
          {filteredRecent.length > 0 ? (
            <div className="bg-white rounded-2xl border border-border shadow-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-slate-50/70">
                      <th className="text-left px-5 py-3.5 text-xs font-semibold text-primary-muted uppercase tracking-wide">Company</th>
                      <th className="text-left px-5 py-3.5 text-xs font-semibold text-primary-muted uppercase tracking-wide hidden sm:table-cell">Ticker & Segment</th>
                      <th className="text-left px-5 py-3.5 text-xs font-semibold text-primary-muted uppercase tracking-wide">Listing Date</th>
                      <th className="text-left px-5 py-3.5 text-xs font-semibold text-primary-muted uppercase tracking-wide hidden md:table-cell">Sector</th>
                      <th className="text-left px-5 py-3.5 text-xs font-semibold text-primary-muted uppercase tracking-wide">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredRecent.map((stock, idx) => (
                      <tr key={stock.ticker} className={`hover:bg-slate-50/50 transition-colors ${idx % 2 === 0 ? "" : "bg-slate-50/20"}`}>
                        <td className="px-5 py-3.5">
                          <div className="font-semibold text-primary text-sm truncate max-w-[240px]">{stock.name}</div>
                          <div className="flex items-center gap-1.5 mt-0.5 sm:hidden">
                            <span className="font-mono text-xs text-primary-muted">{stock.ticker}</span>
                            {stock.is_sme && (
                              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 border border-amber-200">
                                SME
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-5 py-3.5 hidden sm:table-cell">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-primary">
                              {stock.ticker}
                            </span>
                            {stock.is_sme ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                                <Sparkles className="w-2.5 h-2.5 text-amber-600" /> SME EMERGE
                              </span>
                            ) : (
                              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                                Mainboard
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-accent" />
                            <span className="text-xs font-medium text-primary">{stock.listing_date || "—"}</span>
                          </div>
                          {stock.listing_date && isRecentlyListed(stock.listing_date, 30) && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-1.5 py-0.5 mt-0.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                              NEW
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-3.5 hidden md:table-cell">
                          <span className="text-xs text-primary-muted">{stock.sector || "General"}</span>
                        </td>
                        <td className="px-5 py-3.5">
                          <button
                            onClick={() => router.push(`/research/${stock.ticker}`)}
                            className="flex items-center gap-1 text-xs font-semibold text-accent hover:text-accent/80 transition-colors"
                          >
                            Analyse <ArrowRight className="w-3 h-3" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="px-5 py-3 border-t border-border bg-slate-50/40 text-xs text-primary-muted flex flex-col sm:flex-row gap-1 sm:justify-between sm:items-center">
                <span>Showing {filteredRecent.length} companies listed in the last {days} days.</span>
                <span>Sources: NSE Mainboard + NSE SME EMERGE</span>
              </div>
            </div>
          ) : (
            <div className="text-center py-16 text-primary-muted bg-white rounded-2xl border border-border shadow-card">
              <Building2 className="w-10 h-10 mx-auto mb-3 text-slate-300" />
              <p className="font-medium">No new listings found in this category for the selected period.</p>
            </div>
          )}
        </div>
      )}

      <Disclaimer />
    </div>
  );
}

function isRecentlyListed(dateStr: string, withinDays: number): boolean {
  try {
    const diff = (Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24);
    return diff <= withinDays;
  } catch {
    return false;
  }
}

function IPOCard({
  ipo,
  onResearch,
}: {
  ipo: IPOItem;
  onResearch: (sym: string) => void;
}) {
  const isActive = ipo.status === "Active";
  const isForthcoming = ipo.status === "Forthcoming";

  return (
    <div className={`bg-white rounded-2xl border shadow-card p-5 space-y-4 transition-all hover:shadow-md ${
      isActive ? "border-emerald-200 ring-1 ring-emerald-100" : "border-border"
    }`}>
      {/* Header with badges */}
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            {ipo.is_sme ? (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                <Sparkles className="w-3 h-3 text-amber-600" /> SME IPO
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                Mainboard
              </span>
            )}
            <span className="font-mono text-[10px] font-semibold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
              {ipo.exchange || (ipo.is_sme ? "NSE / BSE SME" : "NSE")}
            </span>
          </div>
          <p className="font-serif font-bold text-base text-primary leading-tight">{ipo.company_name}</p>
          <p className="font-mono text-xs text-primary-muted">{ipo.symbol}</p>
        </div>

        <span className={`flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full border shrink-0 ${statusColor(ipo.status)}`}>
          {statusIcon(ipo.status)}
          {ipo.status}
        </span>
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-2 gap-2.5">
        <div className="bg-slate-50 rounded-xl p-3">
          <p className="text-[10px] font-medium text-primary-muted uppercase tracking-wide mb-0.5">Issue Price</p>
          <p className="text-sm font-bold text-primary truncate">{ipo.issue_price}</p>
        </div>
        <div className="bg-slate-50 rounded-xl p-3">
          <p className="text-[10px] font-medium text-primary-muted uppercase tracking-wide mb-0.5">
            {ipo.lot_size ? "Lot Size" : "Issue Size"}
          </p>
          <p className="text-sm font-bold text-primary truncate">
            {ipo.lot_size
              ? ipo.lot_size
              : parseInt(ipo.issue_size || "0") > 0
              ? `${(parseInt(ipo.issue_size || "0") / 10_000_000).toFixed(2)} Cr shares`
              : ipo.issue_size || "Standard"}
          </p>
        </div>
        <div className="bg-slate-50 rounded-xl p-3">
          <p className="text-[10px] font-medium text-primary-muted uppercase tracking-wide mb-0.5">Open Date</p>
          <p className="text-sm font-semibold text-primary flex items-center gap-1">
            <Calendar className="w-3 h-3 text-accent" />
            {ipo.issue_start_date}
          </p>
        </div>
        <div className="bg-slate-50 rounded-xl p-3">
          <p className="text-[10px] font-medium text-primary-muted uppercase tracking-wide mb-0.5">Close Date</p>
          <p className="text-sm font-semibold text-primary flex items-center gap-1">
            <Calendar className="w-3 h-3 text-slate-400" />
            {ipo.issue_end_date}
          </p>
        </div>
      </div>

      {/* CTA */}
      <button
        onClick={() => onResearch(ipo.symbol)}
        className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all ${
          isActive
            ? "bg-accent text-white hover:bg-accent/90 shadow-sm"
            : "bg-slate-100 text-primary-muted hover:bg-slate-200 hover:text-primary"
        }`}
      >
        <TrendingUp className="w-4 h-4" />
        {isActive ? "Research This IPO" : isForthcoming ? "Pre-analyse Company" : "View Post-listing Analysis"}
        <ArrowRight className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
