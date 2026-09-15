"use client";

import React, { useState, useEffect } from "react";
import { api, SearchResult } from "@/lib/api";
import { Plus, Trash2, Search, X } from "lucide-react";
import Disclaimer from "@/components/Disclaimer";
import { SkeletonStatCard, SkeletonTable } from "@/components/Skeleton";

export default function PortfolioPage() {
  const [portfolio, setPortfolio] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Add-holding modal state
  const [showAdd, setShowAdd] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selected, setSelected] = useState<{ ticker: string; name: string } | null>(null);
  const [quantity, setQuantity] = useState("");
  const [avgPrice, setAvgPrice] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Stale-response guard (same pattern as the watchlist).
  const dataVersionRef = React.useRef(0);
  const mutatingRef = React.useRef(false);

  const refetchPortfolio = async () => {
    const v = dataVersionRef.current;
    try {
      const data = await api.getPortfolio();
      if (dataVersionRef.current === v && !mutatingRef.current) setPortfolio(data);
    } catch {
      /* ignore */
    }
  };

  const loadPortfolio = () => {
    setLoading(true);
    api.getPortfolio()
      .then((data) => setPortfolio(data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadPortfolio();
    const interval = setInterval(() => {
      if (!mutatingRef.current) refetchPortfolio();
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  // ticker search inside the modal
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    const t = setTimeout(async () => {
      try {
        setResults(await api.search(query));
      } catch (e) {
        console.error(e);
      }
    }, 200);
    return () => clearTimeout(t);
  }, [query]);

  const resetModal = () => {
    setShowAdd(false);
    setQuery("");
    setResults([]);
    setSelected(null);
    setQuantity("");
    setAvgPrice("");
    setError(null);
  };

  const handleAdd = async () => {
    setError(null);
    const q = parseFloat(quantity);
    const p = parseFloat(avgPrice);
    if (!selected) return setError("Select a stock first.");
    if (!q || q <= 0) return setError("Enter a valid quantity.");
    if (!p || p <= 0) return setError("Enter a valid average buy price.");
    setSaving(true);
    mutatingRef.current = true;
    dataVersionRef.current += 1;
    try {
      await api.addPortfolioHolding(selected.ticker, q, p);
      dataVersionRef.current += 1;
      const data = await api.getPortfolio();
      setPortfolio(data);
      resetModal();
    } catch (e: any) {
      setError(e?.message || "Failed to add holding.");
    } finally {
      setSaving(false);
      mutatingRef.current = false;
    }
  };

  const handleDelete = async (ticker: string) => {
    const prev = portfolio;
    mutatingRef.current = true;
    dataVersionRef.current += 1; // invalidate any GET started before this delete
    setPortfolio((cur: any) =>
      cur ? { ...cur, holdings: cur.holdings.filter((h: any) => h.ticker !== ticker) } : cur
    );
    try {
      await api.removePortfolioHolding(ticker);
      dataVersionRef.current += 1;
      const data = await api.getPortfolio();
      setPortfolio(data);
    } catch (e) {
      console.error("Failed to remove holding:", e);
      setPortfolio(prev);
    } finally {
      mutatingRef.current = false;
    }
  };

  return (
    <div className="space-y-8 py-4">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <h1 className="font-serif font-bold text-2xl sm:text-3xl text-primary">Portfolio Health & Risk Lens</h1>
          <p className="text-xs sm:text-sm text-primary-muted mt-1">
            Monitor your long-term equity allocation, overall P&L, and sector concentration risks
          </p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="w-full sm:w-auto justify-center min-h-[44px] self-start px-4 py-2.5 bg-accent hover:bg-accent-hover text-white text-xs sm:text-sm font-semibold rounded-xl flex items-center gap-1.5 shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Add Holding</span>
        </button>
      </div>

      {loading ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {[1, 2, 3].map((i) => (
              <SkeletonStatCard key={i} />
            ))}
          </div>
          <SkeletonTable rows={5} cols={7} />
        </>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div className="bg-white rounded-2xl p-5 border border-border shadow-card">
              <span className="text-xs font-semibold text-primary-muted uppercase tracking-wider">Total Invested</span>
              <div className="font-mono font-semibold text-2xl text-primary tabular-nums mt-1">
                ₹{portfolio?.summary?.total_invested?.toLocaleString("en-IN") || "0"}
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-border shadow-card">
              <span className="text-xs font-semibold text-primary-muted uppercase tracking-wider">Current Market Value</span>
              <div className="font-mono font-semibold text-2xl text-primary tabular-nums mt-1">
                ₹{portfolio?.summary?.current_value?.toLocaleString("en-IN") || "0"}
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-border shadow-card">
              <span className="text-xs font-semibold text-primary-muted uppercase tracking-wider">Total Return (P&L)</span>
              <div className={`font-mono font-semibold text-2xl tabular-nums mt-1 flex items-center gap-1 ${
                (portfolio?.summary?.net_pnl || 0) >= 0 ? "text-accent" : "text-negative"
              }`}>
                ₹{portfolio?.summary?.net_pnl?.toLocaleString("en-IN") || "0"}
                <span className="text-xs font-sans font-semibold">
                  ({portfolio?.summary?.net_pnl_pct || 0}%)
                </span>
              </div>
            </div>
          </div>

          {/* Holdings Table */}
          <div className="bg-white rounded-2xl border border-border shadow-card overflow-hidden">
            <div className="p-5 border-b border-border bg-slate-50/50 flex items-center justify-between">
              <h3 className="font-serif font-bold text-base text-primary">Holdings Breakdown</h3>
              <span className="text-xs text-primary-muted">{portfolio?.holdings?.length || 0} Stocks</span>
            </div>

            {/* Mobile: stacked cards */}
            <div className="md:hidden divide-y divide-border">
              {portfolio?.holdings?.map((h: any) => (
                <div key={h.ticker} className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-bold text-primary text-sm truncate">{h.ticker}</div>
                      <div className="text-[11px] text-primary-muted mt-0.5 font-mono tabular-nums">
                        Qty {h.quantity} · Avg ₹{h.avg_buy_price}
                      </div>
                    </div>
                    <button
                      onClick={() => handleDelete(h.ticker)}
                      className="shrink-0 p-2 min-h-[40px] min-w-[40px] flex items-center justify-center text-slate-300 hover:text-negative hover:bg-red-50 rounded-lg transition-colors"
                      title="Remove holding"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="grid grid-cols-3 gap-2 mt-3">
                    <div>
                      <div className="text-[10px] uppercase tracking-wide text-primary-muted">LTP</div>
                      <div className="font-mono tabular-nums text-xs text-primary">₹{h.current_price}</div>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase tracking-wide text-primary-muted">Value</div>
                      <div className="font-mono tabular-nums text-xs font-semibold text-primary">₹{h.current_value}</div>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase tracking-wide text-primary-muted">P&L</div>
                      <div className={`font-mono tabular-nums text-xs font-bold ${h.pnl >= 0 ? "text-accent" : "text-negative"}`}>
                        {h.pnl >= 0 ? "+" : ""}₹{h.pnl} ({h.pnl_pct}%)
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {(!portfolio?.holdings || portfolio.holdings.length === 0) && (
                <div className="p-8 text-center text-primary-muted text-xs">
                  No holdings yet. Tap <span className="font-semibold text-primary">Add Holding</span> to start tracking your portfolio.
                </div>
              )}
            </div>

            {/* Tablet & up: full table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs table-fixed min-w-[720px]">
                <colgroup>
                  <col className="w-[22%]" />
                  <col className="w-[11%]" />
                  <col className="w-[13%]" />
                  <col className="w-[11%]" />
                  <col className="w-[15%]" />
                  <col className="w-[19%]" />
                  <col className="w-[9%]" />
                </colgroup>
                <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-primary-muted font-semibold border-b border-border">
                  <tr>
                    <th className="p-4">Stock</th>
                    <th className="p-4">Quantity</th>
                    <th className="p-4">Avg Price</th>
                    <th className="p-4">LTP</th>
                    <th className="p-4">Current Value</th>
                    <th className="p-4">P&L</th>
                    <th className="p-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border font-medium">
                  {portfolio?.holdings?.map((h: any) => (
                    <tr key={h.ticker} className="hover:bg-slate-50/60">
                      <td className="p-4 font-bold text-primary truncate">{h.ticker}</td>
                      <td className="p-4 font-mono tabular-nums">{h.quantity}</td>
                      <td className="p-4 font-mono tabular-nums">₹{h.avg_buy_price}</td>
                      <td className="p-4 font-mono tabular-nums">₹{h.current_price}</td>
                      <td className="p-4 font-mono font-semibold tabular-nums">₹{h.current_value}</td>
                      <td className={`p-4 font-mono font-bold tabular-nums whitespace-nowrap ${h.pnl >= 0 ? "text-accent" : "text-negative"}`}>
                        {h.pnl >= 0 ? "+" : ""}₹{h.pnl} ({h.pnl_pct}%)
                      </td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => handleDelete(h.ticker)}
                          className="p-1.5 text-slate-300 hover:text-negative hover:bg-red-50 rounded-lg transition-colors"
                          title="Remove holding"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {(!portfolio?.holdings || portfolio.holdings.length === 0) && (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-primary-muted">
                        No holdings yet. Click <span className="font-semibold text-primary">Add Holding</span> to start tracking your portfolio.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Add Holding Modal */}
      {showAdd && (
        <div className="fixed inset-0 lg:left-64 z-[80] flex items-center justify-center p-4">
          <div className="absolute inset-0" onClick={resetModal} />
          <div className="relative bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl ring-1 ring-black/5 border border-border max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-serif font-bold text-lg text-primary">Add a Holding</h3>
              <button onClick={resetModal} className="text-primary-muted hover:text-primary p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Stock picker */}
            {!selected ? (
              <div>
                <label className="block text-xs font-semibold text-primary mb-1.5">Stock</label>
                <div className="relative">
                  <Search className="w-4 h-4 text-primary-muted absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    autoFocus
                    type="text"
                    placeholder="Search ticker or company..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="w-full bg-slate-50 border border-border focus:border-accent text-sm rounded-xl pl-9 pr-4 py-2.5 text-primary placeholder:text-primary-muted focus:outline-none"
                  />
                </div>
                <div className="mt-2 max-h-52 overflow-y-auto divide-y divide-border rounded-lg">
                  {results.map((s) => (
                    <button
                      key={s.ticker}
                      onClick={() => { setSelected({ ticker: s.ticker, name: s.name }); setResults([]); setQuery(""); }}
                      className="w-full text-left p-3 hover:bg-slate-50 flex items-center justify-between transition-colors"
                    >
                      <div className="min-w-0">
                        <div className="text-sm font-bold text-primary truncate">{s.ticker}</div>
                        <div className="text-xs text-primary-muted truncate">{s.name}</div>
                      </div>
                      <Plus className="w-4 h-4 text-accent shrink-0" />
                    </button>
                  ))}
                  {query && results.length === 0 && (
                    <div className="text-center py-4 text-xs text-primary-muted">No stocks found.</div>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between bg-slate-50 border border-border rounded-xl px-3 py-2.5">
                  <div className="min-w-0">
                    <div className="text-sm font-bold text-primary truncate">{selected.ticker}</div>
                    <div className="text-xs text-primary-muted truncate">{selected.name}</div>
                  </div>
                  <button onClick={() => setSelected(null)} className="text-xs font-semibold text-accent hover:underline shrink-0">
                    Change
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-primary mb-1.5">Quantity</label>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                      placeholder="e.g. 10"
                      className="w-full bg-slate-50 border border-border focus:border-accent text-sm rounded-xl px-3 py-2.5 text-primary focus:outline-none font-mono tabular-nums"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-primary mb-1.5">Avg Buy Price (₹)</label>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      value={avgPrice}
                      onChange={(e) => setAvgPrice(e.target.value)}
                      placeholder="e.g. 2450"
                      className="w-full bg-slate-50 border border-border focus:border-accent text-sm rounded-xl px-3 py-2.5 text-primary focus:outline-none font-mono tabular-nums"
                    />
                  </div>
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 text-xs px-3 py-2 rounded-lg">{error}</div>
                )}

                <button
                  onClick={handleAdd}
                  disabled={saving}
                  className="w-full py-3 bg-accent hover:bg-accent-hover text-white text-sm font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-60"
                >
                  {saving ? (
                    <span className="inline-block w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Plus className="w-4 h-4" />
                  )}
                  {saving ? "Adding…" : "Add to Portfolio"}
                </button>
              </div>
            )}
            {error && !selected && (
              <div className="mt-3 bg-red-50 border border-red-200 text-red-700 text-xs px-3 py-2 rounded-lg">{error}</div>
            )}
          </div>
        </div>
      )}

      <Disclaimer />
    </div>
  );
}
