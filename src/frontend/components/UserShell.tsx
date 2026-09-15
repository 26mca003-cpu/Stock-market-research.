"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import {
  TrendingUp,
  PieChart,
  GitCompare,
  Sparkles,
  ShieldCheck,
  Search,
  LogOut,
  LogIn,
  Menu,
} from "lucide-react";
import { api, SearchResult } from "@/lib/api";
import { useAuth } from "@/lib/useAuth";

const NAV = [
  { name: "Watchlist", href: "/dashboard", icon: TrendingUp },
  { name: "Portfolio", href: "/portfolio", icon: PieChart },
  { name: "Compare", href: "/compare", icon: GitCompare },
  { name: "IPO Radar", href: "/ipo", icon: Sparkles },
];

export default function UserShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAdmin, signOut } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  // search
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [open, setOpen] = useState(false);
  const [searching, setSearching] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (query.trim().length === 0) {
      setResults([]);
      setOpen(false);
      return;
    }
    const t = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await api.search(query);
        setResults(res);
        setOpen(true);
      } catch (e) {
        console.error(e);
      } finally {
        setSearching(false);
      }
    }, 250);
    return () => clearTimeout(t);
  }, [query]);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const selectStock = (ticker: string) => {
    setOpen(false);
    setQuery("");
    router.push(`/research/${ticker}`);
  };

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
  };

  const active = (href: string) => pathname === href || pathname.startsWith(href + "/");

  const SidebarInner = (
    <>
      <Link href="/" className="px-6 h-16 flex items-center gap-3 border-b border-white/[0.06] group">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <div className="w-12 h-12 shrink-0 flex items-center justify-center">
          <img
            src="/logo.svg"
            alt="VRIDDHI"
            className="w-full h-full object-contain"
          />
        </div>
        <div className="flex flex-col justify-center gap-0.5">
          <div className="font-serif font-bold text-lg leading-none tracking-tight bg-gradient-to-r from-white via-emerald-100 to-emerald-300/90 bg-clip-text text-transparent">
            VRIDDHI
          </div>
          <div className="text-[10px] leading-none text-white/40 font-semibold uppercase tracking-[0.18em]">
            Research Terminal
          </div>
        </div>
      </Link>

      <nav className="flex-1 px-4 py-6 overflow-y-auto">
        <div className="px-2 mb-3 text-[10px] font-semibold text-white/30 uppercase tracking-[0.14em]">
          Menu
        </div>
        <div className="space-y-1">
          {NAV.map((item) => {
            const Icon = item.icon;
            const a = active(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`group relative flex items-center gap-3 pl-4 pr-3 py-2.5 text-sm rounded-lg transition-all ${
                  a
                    ? "bg-white/[0.06] text-white font-semibold"
                    : "text-white/55 hover:text-white hover:bg-white/[0.04] font-medium"
                }`}
              >
                <span
                  className={`absolute left-0 top-1/2 -translate-y-1/2 h-5 w-[3px] rounded-r-full bg-emerald-400 transition-opacity ${
                    a ? "opacity-100" : "opacity-0"
                  }`}
                />
                <Icon className={`h-[18px] w-[18px] ${a ? "text-emerald-400" : "text-white/45 group-hover:text-white/70"}`} />
                {item.name}
              </Link>
            );
          })}
          {isAdmin && (
            <Link
              href="/admin"
              onClick={() => setMobileOpen(false)}
              className="group relative flex items-center gap-3 pl-4 pr-3 py-2.5 text-sm rounded-lg text-amber-200/80 hover:text-amber-100 hover:bg-white/[0.04] font-medium transition-all"
            >
              <ShieldCheck className="h-[18px] w-[18px] text-amber-300/80" />
              Admin Panel
            </Link>
          )}
        </div>
      </nav>

      {/* Account */}
      <div className="px-3 py-3 border-t border-white/[0.06]">
        {user ? (
          <div className="flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-white/[0.04] transition-colors">
            <div className="w-9 h-9 rounded-full bg-emerald-500/15 ring-1 ring-emerald-400/20 flex items-center justify-center shrink-0">
              <span className="text-sm font-semibold text-emerald-300 uppercase">{user?.email?.[0] ?? "U"}</span>
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[13px] font-semibold text-white truncate">{user?.email?.split("@")[0]}</div>
              <div className="text-[11px] text-white/40 truncate">{user?.email}</div>
            </div>
            <button
              onClick={handleSignOut}
              title="Sign out"
              className="p-2 rounded-lg text-white/45 hover:text-red-300 hover:bg-red-500/10 transition-colors shrink-0"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <Link
            href="/login"
            className="flex items-center gap-2 justify-center px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold transition-colors"
          >
            <LogIn className="w-4 h-4" /> Sign In
          </Link>
        )}
      </div>
    </>
  );

  return (
    <div className="fixed inset-0 z-40 flex bg-[#FAFAF8]">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-64 shrink-0 flex-col bg-[#0A1512] text-white">
        {SidebarInner}
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-[70] flex">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
          <aside className="relative w-64 flex flex-col bg-[#0A1512] text-white">{SidebarInner}</aside>
        </div>
      )}

      {/* Main column */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar with search */}
        <header className="h-16 shrink-0 bg-white/90 backdrop-blur-md border-b border-border flex items-center gap-3 px-4 sm:px-6">
          <button
            onClick={() => setMobileOpen(true)}
            className="lg:hidden p-2 rounded-lg text-primary hover:bg-slate-100"
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex-1 max-w-md relative" ref={dropdownRef}>
            <div className="relative">
              <Search className="w-4 h-4 text-primary-muted absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Search any NSE stock (e.g. Reliance, TCS, HDFC)..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => query.trim().length > 0 && setOpen(true)}
                className="w-full bg-[#F1F5F9]/70 hover:bg-[#F1F5F9] focus:bg-white border border-transparent focus:border-accent text-sm rounded-xl pl-9 pr-4 py-2 text-primary placeholder:text-primary-muted focus:outline-none transition-all"
              />
              {searching && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin" />
              )}
            </div>
            {open && results.length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-2 bg-white border border-border rounded-xl shadow-xl overflow-y-auto max-h-[min(60vh,22rem)] z-[80] divide-y divide-border">
                {results.map((item) => (
                  <button
                    key={item.ticker}
                    onClick={() => selectStock(item.ticker)}
                    className="w-full text-left px-4 py-3 hover:bg-slate-50 flex items-center justify-between gap-3 transition-colors"
                  >
                    <div className="min-w-0">
                      <div className="font-semibold text-sm text-primary truncate">{item.ticker}</div>
                      <div className="text-xs text-primary-muted truncate">{item.name}</div>
                    </div>
                    <span className="shrink-0 text-[11px] font-medium px-2 py-0.5 rounded bg-slate-100 text-primary-muted">
                      {item.exchange}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-6 sm:p-8 max-w-7xl mx-auto w-full">{children}</div>
        </main>
      </div>
    </div>
  );
}
