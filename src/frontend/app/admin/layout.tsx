"use client";

import { useAuth } from "@/lib/useAuth";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  LayoutDashboard,
  Settings,
  Activity,
  Cpu,
  Code2,
  Database,
  Users,
  FileText,
  LogOut,
  Menu,
  ShieldCheck,
} from "lucide-react";

const navItems = [
  { name: "Overview", href: "/admin", icon: LayoutDashboard },
  { name: "Pipelines", href: "/admin/pipelines", icon: Settings },
  { name: "Scrapers", href: "/admin/scrapers", icon: Activity },
  { name: "AI / LLM", href: "/admin/llm", icon: Cpu },
  { name: "Algorithm Check", href: "/admin/algorithm", icon: Code2 },
  { name: "Data Quality", href: "/admin/data-quality", icon: Database },
  { name: "Users", href: "/admin/users", icon: Users },
  { name: "Reports", href: "/admin/reports", icon: FileText },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, isAdmin, signOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      // Logged out (e.g. after sign-out) — send to homepage.
      router.replace("/");
    } else if (!isAdmin) {
      // Authenticated but not an admin — send to the user dashboard.
      router.replace("/dashboard");
    }
  }, [user, loading, isAdmin, router]);

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
  };

  if (loading || !isAdmin) {
    return (
      <div className="fixed inset-0 z-[60] flex items-center justify-center bg-[#FAFAF8] text-[#64748B] text-sm">
        Loading admin panel…
      </div>
    );
  }

  const SidebarInner = (
    <>
      {/* Brand */}
      <div className="px-6 h-16 flex items-center gap-3 border-b border-white/[0.06]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <div className="w-12 h-12 shrink-0 flex items-center justify-center">
          <img src="/logo.svg" alt="VRIDDHI" className="w-full h-full object-contain" />
        </div>
        <div className="flex flex-col justify-center gap-0.5">
          <div className="font-serif font-bold text-lg leading-none tracking-tight bg-gradient-to-r from-white via-emerald-100 to-emerald-300/90 bg-clip-text text-transparent">
            Vriddhi Ops
          </div>
          <div className="text-[10px] leading-none text-white/40 font-semibold uppercase tracking-[0.18em]">
            Control Center
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-4 py-6 overflow-y-auto">
        <div className="px-2 mb-3 text-[10px] font-semibold text-white/30 uppercase tracking-[0.14em]">
          Operations
        </div>
        <div className="space-y-1">
          {navItems.map((item) => {
            const active = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`group relative flex items-center gap-3 pl-4 pr-3 py-2.5 text-sm rounded-lg transition-all duration-150 ${
                  active
                    ? "bg-white/[0.06] text-white font-semibold"
                    : "text-white/55 hover:text-white hover:bg-white/[0.04] font-medium"
                }`}
              >
                {/* left accent bar */}
                <span
                  className={`absolute left-0 top-1/2 -translate-y-1/2 h-5 w-[3px] rounded-r-full bg-emerald-400 transition-opacity ${
                    active ? "opacity-100" : "opacity-0"
                  }`}
                />
                <Icon className={`h-[18px] w-[18px] ${active ? "text-emerald-400" : "text-white/45 group-hover:text-white/70"}`} />
                {item.name}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* User card + logout (bottom) */}
      <div className="px-3 py-3 border-t border-white/[0.06]">
        <div className="flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-white/[0.04] transition-colors">
          <div className="w-9 h-9 rounded-full bg-emerald-500/15 ring-1 ring-emerald-400/20 flex items-center justify-center shrink-0">
            <span className="text-sm font-semibold text-emerald-300 uppercase">
              {(user?.email?.[0] ?? "A")}
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[13px] font-semibold text-white truncate">
              {user?.email?.split("@")[0] ?? "Admin"}
            </div>
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
      </div>
    </>
  );

  return (
    <div className="fixed inset-0 z-50 flex bg-[#FAFAF8]">
      {/* ===== Desktop sidebar ===== */}
      <aside className="hidden lg:flex w-64 shrink-0 flex-col bg-[#0A1512] text-white">
        {SidebarInner}
      </aside>

      {/* ===== Mobile sidebar drawer ===== */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-[70] flex">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
          <aside className="relative w-64 flex flex-col bg-[#0A1512] text-white">
            {SidebarInner}
          </aside>
        </div>
      )}

      {/* ===== Main column ===== */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="h-16 shrink-0 bg-white border-b border-border flex items-center justify-between px-4 sm:px-6 gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden p-2 rounded-lg text-primary hover:bg-slate-100"
              aria-label="Open menu"
            >
              <Menu className="w-5 h-5" />
            </button>
          <div className="flex items-center gap-2">
            <span className="font-serif font-bold text-lg text-primary tracking-tight">VRIDDHI</span>
            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 border border-amber-200 uppercase tracking-wider">
              <ShieldCheck className="w-3 h-3" />
              Admin
            </span>
          </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">{children}</div>
        </main>
      </div>
    </div>
  );
}
