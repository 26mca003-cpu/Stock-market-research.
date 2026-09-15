"use client";
import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Users, UserPlus, Eye, Bookmark, ShieldCheck, User } from "lucide-react";
import { SkeletonStatCard, SkeletonTable } from "@/components/Skeleton";

export default function UsersPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/admin/users").then(setData).catch(console.error).finally(() => setLoading(false));
    const interval = setInterval(() => {
      api.get("/admin/users").then(setData).catch(() => {});
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold font-serif text-primary">User Intelligence</h1>
        <p className="text-slate-500 mt-1">Platform user registrations, activity, and watchlist metrics.</p>
      </div>

      {loading && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <SkeletonStatCard key={i} />
            ))}
          </div>
          <SkeletonTable rows={6} cols={4} />
        </>
      )}

      {!loading && (
      <>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-border shadow-[0_1px_3px_rgba(15,23,42,0.04)] hover:shadow-[0_6px_20px_rgba(15,23,42,0.06)] transition-shadow">
          <div className="flex items-center gap-2 text-slate-500 mb-2">
            <Users className="w-4 h-4 text-accent" />
            <span className="text-xs font-semibold uppercase tracking-wider">Total Users</span>
          </div>
          <p className="text-2xl font-mono font-semibold text-primary tabular-nums">{data?.total ?? 0}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-border shadow-[0_1px_3px_rgba(15,23,42,0.04)] hover:shadow-[0_6px_20px_rgba(15,23,42,0.06)] transition-shadow">
          <div className="flex items-center gap-2 text-slate-500 mb-2">
            <UserPlus className="w-4 h-4 text-emerald-600" />
            <span className="text-xs font-semibold uppercase tracking-wider">Signups (7d)</span>
          </div>
          <p className="text-2xl font-mono font-semibold text-primary tabular-nums">{data?.signups_7d ?? 0}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-border shadow-[0_1px_3px_rgba(15,23,42,0.04)] hover:shadow-[0_6px_20px_rgba(15,23,42,0.06)] transition-shadow">
          <div className="flex items-center gap-2 text-slate-500 mb-2">
            <Eye className="w-4 h-4 text-amber-600" />
            <span className="text-xs font-semibold uppercase tracking-wider">Active (7d)</span>
          </div>
          <p className="text-2xl font-mono font-semibold text-primary tabular-nums">{data?.active_7d ?? 0}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-border shadow-[0_1px_3px_rgba(15,23,42,0.04)] hover:shadow-[0_6px_20px_rgba(15,23,42,0.06)] transition-shadow">
          <div className="flex items-center gap-2 text-slate-500 mb-2">
            <Bookmark className="w-4 h-4 text-accent" />
            <span className="text-xs font-semibold uppercase tracking-wider">Watchlist Items</span>
          </div>
          <p className="text-2xl font-mono font-semibold text-primary tabular-nums">{data?.watchlist_adds_7d ?? 0}</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-border shadow-[0_1px_3px_rgba(15,23,42,0.04)] overflow-hidden">
        <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="bg-slate-50/70 border-b border-border text-[11px] uppercase tracking-wider text-primary-muted font-semibold">
            <tr>
              <th className="px-4 sm:px-6 py-4">User Email</th>
              <th className="px-4 sm:px-6 py-4">Assigned Role</th>
              <th className="px-4 sm:px-6 py-4">Tracked Stocks</th>
              <th className="px-4 sm:px-6 py-4">Registration Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {data?.list?.map((u: any, i: number) => (
              <tr key={i} className="hover:bg-slate-50/50">
                <td className="px-4 sm:px-6 py-4 font-semibold text-primary">
                  <span className="flex items-center gap-2">
                    <User className="w-4 h-4 text-slate-400 shrink-0" />
                    <span className="truncate max-w-[200px] sm:max-w-none">{u.email}</span>
                  </span>
                </td>
                <td className="px-4 sm:px-6 py-4">
                  {u.role === "admin" ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
                      <ShieldCheck className="w-3 h-3" />
                      ADMIN
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
                      USER
                    </span>
                  )}
                </td>
                <td className="px-4 sm:px-6 py-4 text-slate-600 font-medium whitespace-nowrap">
                  {u.stocks_count || 0} stocks
                </td>
                <td className="px-4 sm:px-6 py-4 text-slate-500 whitespace-nowrap">
                  {u.joined ? new Date(u.joined).toLocaleString() : "-"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>
      </>
      )}
    </div>
  );
}

