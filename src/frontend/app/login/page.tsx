"use client";

import React, { useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Eye, EyeOff, LogIn, ShieldCheck, Sparkles, ArrowLeft } from "lucide-react";

const AuthScene = dynamic(() => import("@/components/three/AuthScene"), {
  ssr: false,
  loading: () => null,
});

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { data: authData, error: authErr } = await supabase.auth.signInWithPassword({ email, password });
      if (authErr) throw authErr;

      const user = authData.user;
      let isAdmin =
        user?.app_metadata?.role === "admin" ||
        user?.user_metadata?.role === "admin" ||
        user?.user_metadata?.is_admin === true;

      if (!isAdmin && user?.id) {
        try {
          const { data: profile } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", user.id)
            .single();
          if (profile?.role === "admin") {
            isAdmin = true;
          }
        } catch {
          // ignore profile lookup failure
        }
      }

      if (isAdmin) {
        router.replace("/admin");
      } else {
        router.replace("/dashboard");
      }
    } catch (err: any) {
      setError(err.message || "Login failed. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 grid grid-cols-1 lg:grid-cols-2 bg-[#FAFAF8] overflow-y-auto">
      {/* ============ Left: brand / 3D panel ============ */}
      <div className="relative hidden lg:flex flex-col justify-between overflow-hidden bg-[#0A1512] text-white p-12">
        <div className="absolute inset-0 z-0 opacity-90">
          <AuthScene />
        </div>
        <div className="absolute inset-0 z-[1] bg-gradient-to-t from-[#0A1512] via-[#0A1512]/40 to-transparent pointer-events-none" />

        <Link href="/" className="relative z-10 flex items-center gap-2 text-sm text-white/70 hover:text-white transition-colors w-fit">
          <ArrowLeft className="w-4 h-4" />
          Back to home
        </Link>

        <div className="relative z-10 max-w-md">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md text-emerald-300 text-xs font-semibold border border-white/10 mb-6">
            <Sparkles className="w-3.5 h-3.5" />
            The Institutional Research Terminal
          </div>
          <h2 className="font-serif font-bold text-4xl leading-tight tracking-tight">
            Research like the top 1%.
          </h2>
          <p className="text-white/60 mt-4 text-sm leading-relaxed">
            Institutional-grade, 6-layer fundamental analysis for every NSE and BSE
            company — free, instant, and backed by complete evidence.
          </p>
          <div className="flex items-center gap-2 mt-8 text-white/50 text-xs">
            <ShieldCheck className="w-4 h-4 text-emerald-300" />
            SEBI-compliant · Educational research only
          </div>
        </div>
      </div>

      {/* ============ Right: form panel ============ */}
      <div className="flex items-center justify-center px-6 py-12 sm:px-12">
        <div className="w-full max-w-sm">
          {/* Brand (mobile) */}
          <div className="lg:hidden text-center mb-8">
            <Link href="/" className="font-serif font-bold text-2xl text-[#0F172A] tracking-tight">
              VRIDDHI
            </Link>
          </div>

          <div className="mb-8">
            <h1 className="font-serif font-bold text-3xl text-[#0F172A] tracking-tight">Welcome back</h1>
            <p className="text-sm text-[#64748B] mt-2">Sign in to your investor account</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-xs font-semibold text-[#0F172A] mb-1.5">
                Email address
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full border border-[#E2E8F0] bg-white rounded-xl px-4 py-3.5 text-sm text-[#0F172A] placeholder:text-[#94A3B8] focus:border-[#10B981] focus:ring-4 focus:ring-[#10B981]/10 focus:outline-none transition-all"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-semibold text-[#0F172A] mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPass ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full border border-[#E2E8F0] bg-white rounded-xl px-4 py-3.5 pr-10 text-sm text-[#0F172A] placeholder:text-[#94A3B8] focus:border-[#10B981] focus:ring-4 focus:ring-[#10B981]/10 focus:outline-none transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  aria-label={showPass ? "Hide password" : "Show password"}
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-9 w-9 flex items-center justify-center text-[#94A3B8] hover:text-[#0F172A] transition-colors"
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-xs px-4 py-2.5 rounded-xl">
                {error}
              </div>
            )}

            <button
              id="login-submit-btn"
              type="submit"
              disabled={loading}
              className="w-full bg-[#10B981] hover:bg-[#059669] disabled:opacity-60 text-white font-semibold text-sm rounded-xl py-3.5 flex items-center justify-center gap-2 transition-colors shadow-sm shadow-emerald-500/20"
            >
              {loading ? (
                <span className="inline-block w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              ) : (
                <LogIn className="w-4 h-4" />
              )}
              {loading ? "Signing in…" : "Sign in"}
            </button>
          </form>

          <div className="mt-8 text-center text-xs text-[#64748B]">
            Don&apos;t have an account?{" "}
            <Link href="/signup" className="text-[#10B981] font-semibold hover:underline">
              Create one free
            </Link>
          </div>

          <p className="text-center text-[10px] text-[#94A3B8] mt-10 leading-relaxed">
            Vriddhi is an educational research tool, not investment advice. Consult a
            SEBI-registered advisor before investing.
          </p>
        </div>
      </div>
    </div>
  );
}
