"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { LogIn, LogOut, User, Menu, X } from "lucide-react";
import { useAuth } from "@/lib/useAuth";

const NAV_LINKS = [
  { label: "Home", href: "/#top" },
  { label: "Features", href: "/#features" },
  { label: "Pricing", href: "/#pricing" },
  { label: "About", href: "/#about" },
];

// Routes that have their OWN app chrome (sidebar / header) — hide the marketing navbar there.
const APP_ROUTES = ["/admin", "/dashboard", "/portfolio", "/compare", "/ipo", "/research"];

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAdmin, signOut } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
  };

  // Marketing navbar only on public pages.
  const isAppRoute = APP_ROUTES.some((r) => pathname === r || pathname.startsWith(r + "/"));
  if (isAppRoute) return null;

  return (
    <header
      className={`sticky top-0 z-40 transition-all duration-300 ${
        scrolled
          ? "bg-white/80 backdrop-blur-xl border-b border-border shadow-sm"
          : "bg-transparent border-b border-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-3 group shrink-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <div className="w-12 h-12 shrink-0 flex items-center justify-center">
            <img
              src="/logo.svg"
              alt="VRIDDHI"
              className="w-full h-full object-contain"
            />
          </div>
          <div className="flex flex-col justify-center gap-0.5">
            <span className="font-serif font-bold text-xl leading-none tracking-tight text-primary">
              VRIDDHI
            </span>
            <span className="text-[10px] leading-none text-primary-muted font-semibold uppercase tracking-[0.1em] hidden sm:block">
              Research like the top 1%
            </span>
          </div>
        </Link>

        {/* Center marketing nav (desktop) */}
        <nav className="hidden md:flex items-center gap-1 absolute left-1/2 -translate-x-1/2">
          {NAV_LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="px-4 py-2 rounded-lg text-sm font-medium text-primary-muted hover:text-primary hover:bg-slate-100/70 transition-colors"
            >
              {l.label}
            </Link>
          ))}
        </nav>

        {/* Auth (desktop) */}
        <div className="hidden md:flex items-center gap-2 shrink-0">
          {user ? (
            <>
              <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-50 border border-border text-xs text-primary font-medium">
                <User className="w-3.5 h-3.5 text-accent" />
                <span className="max-w-[120px] truncate">{user.email}</span>
              </div>
              {isAdmin && (
                <Link
                  href="/admin"
                  className="px-2.5 py-1.5 rounded-lg text-[11px] font-bold bg-amber-100 hover:bg-amber-200 text-amber-800 border border-amber-300 uppercase tracking-wider transition-colors"
                >
                  Admin
                </Link>
              )}
              <button
                onClick={handleSignOut}
                className="p-2 rounded-lg text-primary-muted hover:text-negative hover:bg-red-50 transition-colors"
                title="Sign out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </>
          ) : (
            <Link
              href="/login"
              className="px-4 py-2 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-all flex items-center gap-1.5 shadow-sm"
            >
              <LogIn className="w-4 h-4" />
              Sign In
            </Link>
          )}
        </div>

        {/* Mobile toggle */}
        <button
          onClick={() => setMobileOpen((v) => !v)}
          className="md:hidden p-2 rounded-lg text-primary hover:bg-slate-100 transition-colors"
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="md:hidden bg-white/95 backdrop-blur-xl border-t border-border px-4 py-4 space-y-1">
          {NAV_LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setMobileOpen(false)}
              className="block px-4 py-2.5 rounded-lg text-sm font-medium text-primary-muted hover:text-primary hover:bg-slate-100 transition-colors"
            >
              {l.label}
            </Link>
          ))}
          <div className="pt-2 border-t border-border mt-2">
            {user ? (
              <button
                onClick={handleSignOut}
                className="w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium text-negative hover:bg-red-50 flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" /> Sign out
              </button>
            ) : (
              <Link
                href="/login"
                onClick={() => setMobileOpen(false)}
                className="w-full px-4 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold flex items-center gap-2 justify-center"
              >
                <LogIn className="w-4 h-4" /> Sign In
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
