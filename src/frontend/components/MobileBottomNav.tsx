"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, TrendingUp, PieChart, GitCompare, Sparkles, ShieldCheck } from "lucide-react";
import { useAuth } from "@/lib/useAuth";

export default function MobileBottomNav() {
  const pathname = usePathname();
  const { isAdmin } = useAuth();

  // Admin panel and user-app pages have their own chrome — no legacy bottom nav there.
  const OWN_CHROME = ["/admin", "/dashboard", "/portfolio", "/compare", "/ipo", "/research"];
  if (OWN_CHROME.some((r) => pathname === r || pathname.startsWith(r + "/"))) return null;

  const navItems = [
    { label: "Home", href: "/", icon: Home },
    { label: "Watchlist", href: "/dashboard", icon: TrendingUp },
    { label: "Portfolio", href: "/portfolio", icon: PieChart },
    { label: "Compare", href: "/compare", icon: GitCompare },
    { label: "IPO", href: "/ipo", icon: Sparkles, badge: true },
    ...(isAdmin ? [{ label: "Admin", href: "/admin", icon: ShieldCheck, badge: false }] : []),
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-border px-4 py-2 flex items-center justify-around shadow-lg">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center gap-1 py-1 px-3 rounded-lg text-xs font-medium transition-colors relative ${
              isActive ? "text-accent font-semibold" : "text-primary-muted hover:text-primary"
            }`}
          >
            <Icon className="w-5 h-5" />
            {(item as { badge?: boolean }).badge && (
              <span className="absolute top-0 right-1 w-2 h-2 bg-accent rounded-full animate-pulse" />
            )}
            <span>{item.label}</span>
          </Link>
        );
      })}
    </div>
  );
}
