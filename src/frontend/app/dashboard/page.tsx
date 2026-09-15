"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, TrendingUp, TrendingDown, Search, ArrowUpRight, Trash2, Microscope, ShieldCheck, X } from "lucide-react";
import { api, WatchlistItem, SearchResult } from "@/lib/api";
import { getBandDetails } from "@/lib/constants";
import Disclaimer from "@/components/Disclaimer";
import { SkeletonCard } from "@/components/Skeleton";
import { useAuth } from "@/lib/useAuth";

export default function DashboardPage() {
  const { isAdmin } = useAuth();
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);

  // --- Stale-response guard ---------------------------------------------
  // Every membership mutation (add/delete) bumps dataVersion. A watchlist GET
  // captures the version when it STARTS; when it resolves it only applies its
  // result if the version is unchanged. This guarantees a slow poll/refetch that
  // began before a delete can never land after it and resurrect the deleted row.
  const dataVersionRef = React.useRef(0);
  const mutatingRef = React.useRef(false);

  // Safe fetch that respects the version guard.
  const refetchWatchlist = async () => {
    const v = dataVersionRef.current;
    try {
      const fresh = await api.getWatchlist();
      if (dataVersionRef.current === v && !mutatingRef.current) {
        setWatchlist(fresh);
      }
    } catch {
      /* ignore transient */
    }
  };

  // Load watchlist
  const loadWatchlist = async () => {
    try {
      setLoading(true);
      const items = await api.getWatchlist();
      // Seed standard bluechips ONLY on the very first visit (never re-seed after the
      // user has curated — or intentionally emptied — their list).
      const seeded = typeof window !== "undefined" && localStorage.getItem("vriddhi_wl_seeded") === "1";
      if (items.length === 0 && !seeded) {
        await api.addToWatchlist("RELIANCE.NS", "Reliance Industries");
        await api.addToWatchlist("TCS.NS", "Tata Consultancy Services");
        await api.addToWatchlist("INFY.NS", "Infosys Limited");
        if (typeof window !== "undefined") localStorage.setItem("vriddhi_wl_seeded", "1");
        const fresh = await api.getWatchlist();
        setWatchlist(fresh);
      } else {
        if (typeof window !== "undefined") localStorage.setItem("vriddhi_wl_seeded", "1");
        setWatchlist(items);
      }
    } catch (err) {
      console.error("Failed to load watchlist:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWatchlist();
    // Auto-refresh live prices/scores every 30s, version-guarded so it never
    // resurrects an in-flight add/delete.
    const interval = setInterval(() => {
      if (!mutatingRef.current) refetchWatchlist();
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  // Search handler
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const res = await api.search(searchQuery);
        setSearchResults(res);
      } catch (e) {
        console.error(e);
      }
    }, 200);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const [addError, setAddError] = useState<string | null>(null);
  const [addingTicker, setAddingTicker] = useState<string | null>(null);

  const handleAddStock = async (ticker: string, name: string) => {
    setAddError(null);
    setAddingTicker(ticker);
    mutatingRef.current = true;
    dataVersionRef.current += 1;
    try {
      await api.addToWatchlist(ticker, name);
      dataVersionRef.current += 1;
      const fresh = await api.getWatchlist();
      setWatchlist(fresh);
      setShowAddModal(false);
      setSearchQuery("");
    } catch (err: any) {
      console.error("Error adding to watchlist:", err);
      setAddError(err?.message || "Could not add this stock. Please try again.");
    } finally {
      setAddingTicker(null);
      mutatingRef.current = false;
    }
  };

  const handleRemoveStock = async (e: React.MouseEvent, ticker: string) => {
    e.preventDefault();
    e.stopPropagation();
    const prev = watchlist;
    mutatingRef.current = true;
    dataVersionRef.current += 1; // invalidate any GET that started before this delete
    setWatchlist((cur) => cur.filter((item) => item.ticker !== ticker));
    try {
      await api.removeFromWatchlist(ticker);
      dataVersionRef.current += 1;
      const fresh = await api.getWatchlist();
      setWatchlist(fresh);
    } catch (err) {
      console.error("Error removing stock:", err);
      setWatchlist(prev);
    } finally {
      mutatingRef.current = false;
    }
  };

  return (
    <div className="space-y-8 py-4">
      {/* Administrator Quick Switch Banner */}
      {isAdmin && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/80 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500 text-white rounded-xl shadow-xs">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-200 text-amber-900 uppercase tracking-wide">
                  Admin Session
                </span>
                <span className="text-xs text-amber-700 font-medium">Logged in with administrative access</span>
              </div>
              <p className="text-xs text-amber-800 mt-0.5">
                Switch to the Operations Panel to monitor the 8 system health dashboards, pipelines, crons, and scrapers.
              </p>
            </div>
          </div>
          <Link
            href="/admin"
            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-xl transition-all shadow-xs flex items-center gap-1.5 whitespace-nowrap self-end sm:self-center"
          >
            <span>Go to Admin Panel (8 Pages)</span>
            <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>
      )}

      {/* Dashboard Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif font-bold text-2xl sm:text-3xl text-primary">Investor Watchlist</h1>
          <p className="text-xs sm:text-sm text-primary-muted mt-1">
            Track daily market price and institutional Quality Scores in one glance
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto self-start sm:self-auto">
          <button
            onClick={() => setShowAddModal(true)}
            className="w-full sm:w-auto justify-center min-h-[44px] px-4 py-2.5 bg-accent hover:bg-accent-hover text-white text-xs sm:text-sm font-semibold rounded-xl flex items-center gap-1.5 shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add Stock</span>
          </button>
        </div>
      </div>

      {/* Add Stock Modal */}
      {showAddModal && (
        <div className="fixed inset-0 lg:left-64 z-[80] flex items-center justify-center p-4">
          {/* transparent click-catcher (no page dimming) */}
          <div className="absolute inset-0" onClick={() => { setShowAddModal(false); setSearchQuery(""); }} />
          <div className="relative bg-white rounded-2xl max-w-md w-full shadow-2xl ring-1 ring-black/5 border border-border overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-accent-light flex items-center justify-center">
                  <Plus className="w-4 h-4 text-accent" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-lg text-primary leading-none">Add to Watchlist</h3>
                  <p className="text-xs text-primary-muted mt-1">Search any NSE stock to start tracking</p>
                </div>
              </div>
              <button
                onClick={() => { setShowAddModal(false); setSearchQuery(""); }}
                className="p-1.5 rounded-lg text-primary-muted hover:text-primary hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6">
              <div className="relative">
                <Search className="w-4 h-4 text-primary-muted absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search ticker or company name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  autoFocus
                  className="w-full bg-slate-50 border border-border focus:border-accent focus:ring-4 focus:ring-accent/10 focus:bg-white text-sm rounded-xl pl-10 pr-4 py-3 text-primary placeholder:text-primary-muted focus:outline-none transition-all"
                />
              </div>

              <div className="mt-4 max-h-72 overflow-y-auto -mx-2 px-2">
                {addError && (
                  <div className="mb-3 bg-red-50 border border-red-200 text-red-700 text-xs px-3 py-2 rounded-lg">
                    {addError}
                  </div>
                )}
                {searchResults.length > 0 && (
                  <div className="space-y-1">
                    {searchResults.map((s) => (
                      <button
                        key={s.ticker}
                        onClick={() => handleAddStock(s.ticker, s.name)}
                        disabled={addingTicker === s.ticker}
                        className="w-full text-left p-3 rounded-xl hover:bg-accent-light/60 border border-transparent hover:border-accent/20 flex items-center justify-between gap-3 transition-all group disabled:opacity-60"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-8 h-8 rounded-lg bg-slate-100 group-hover:bg-white flex items-center justify-center shrink-0">
                            <span className="text-[11px] font-bold text-primary-muted">{s.ticker.replace(".NS", "").slice(0, 2)}</span>
                          </div>
                          <div className="min-w-0">
                            <div className="text-sm font-bold text-primary truncate">{s.ticker}</div>
                            <div className="text-xs text-primary-muted truncate">{s.name}</div>
                          </div>
                        </div>
                        {addingTicker === s.ticker ? (
                          <span className="shrink-0 w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <span className="shrink-0 inline-flex items-center gap-1 text-xs font-semibold text-accent opacity-0 group-hover:opacity-100 transition-opacity">
                            <Plus className="w-3.5 h-3.5" /> Add
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                )}

                {/* Empty / hint states */}
                {!searchQuery && (
                  <div className="text-center py-10 px-4">
                    <div className="w-12 h-12 mx-auto rounded-2xl bg-slate-100 flex items-center justify-center mb-3">
                      <Search className="w-5 h-5 text-primary-muted" />
                    </div>
                    <p className="text-sm font-semibold text-primary">Search for a stock</p>
                    <p className="text-xs text-primary-muted mt-1">Try “Reliance”, “TCS”, “INFY”, or a ticker symbol.</p>
                  </div>
                )}
                {searchQuery && searchResults.length === 0 && (
                  <div className="text-center py-10 px-4">
                    <p className="text-sm font-semibold text-primary">No stocks found</p>
                    <p className="text-xs text-primary-muted mt-1">No match for “{searchQuery}”. Try a different name or symbol.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Watchlist Cards Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : watchlist.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-border shadow-card p-8">
          <p className="text-sm text-primary-muted mb-4">Your watchlist is currently empty.</p>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-accent text-white text-xs font-semibold rounded-xl"
          >
            + Add Your First Stock
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
          {watchlist.map((item) => {
            const isUp = (item.day_change_pct || 0) >= 0;
            const band = item.score_total !== null && item.score_total !== undefined
              ? getBandDetails(item.score_total)
              : null;

            return (
              <div
                key={item.ticker}
                className="vriddhi-card p-6 flex flex-col justify-between group relative"
              >
                <div>
                  {/* Top Bar */}
                  <div className="flex items-start justify-between gap-3 mb-3 min-w-0">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-base text-primary group-hover:text-accent transition-colors">
                          {item.ticker}
                        </span>
                        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-slate-100 text-primary-muted shrink-0">
                          NSE
                        </span>
                      </div>
                      <h4 className="text-xs text-primary-muted truncate mt-0.5">
                        {item.name}
                      </h4>
                    </div>

                    <button
                      onClick={(e) => handleRemoveStock(e, item.ticker)}
                      className="p-1.5 text-slate-300 hover:text-negative hover:bg-red-50 rounded-lg transition-colors"
                      title="Remove from watchlist"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Price & Change */}
                  <div className="flex items-baseline gap-2 mb-4">
                    <span className="font-mono font-semibold text-2xl text-primary tabular-nums">
                      ₹{item.last_price ? item.last_price.toLocaleString("en-IN") : "—"}
                    </span>
                    {item.day_change_pct !== null && (
                      <span
                        className={`text-xs font-semibold flex items-center ${
                          isUp ? "text-accent" : "text-negative"
                        }`}
                      >
                        {isUp ? <TrendingUp className="w-3.5 h-3.5 mr-0.5" /> : <TrendingDown className="w-3.5 h-3.5 mr-0.5" />}
                        {isUp ? "+" : ""}{item.day_change_pct}%
                      </span>
                    )}
                  </div>
                </div>

                {/* Score & Action Bottom Bar */}
                <div className="pt-4 border-t border-border flex items-center justify-between">
                  <div>
                    {item.score_total !== null && band ? (
                      <div className="flex items-center gap-2">
                        <span
                          className="font-mono font-bold text-lg tabular-nums"
                          style={{ color: band.color }}
                        >
                          {item.score_total}
                        </span>
                        <span
                          className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
                          style={{ backgroundColor: band.bg, color: band.color }}
                        >
                          {band.label.replace(" Quality", "")}
                        </span>
                      </div>
                    ) : (
                      <span className="text-xs text-primary-muted italic">Not analyzed</span>
                    )}
                  </div>

                  <Link
                    href={
                      item.score_total !== null
                        ? `/research/${item.ticker}?known=1`
                        : `/research/${item.ticker}`
                    }
                    className="min-h-[40px] px-3 py-1.5 bg-slate-100 hover:bg-accent hover:text-white text-primary text-xs font-semibold rounded-xl flex items-center gap-1 transition-colors"
                  >
                    <Microscope className="w-3.5 h-3.5" />
                    <span>Research</span>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Disclaimer />
    </div>
  );
}
