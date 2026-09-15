"use client";

import React, { useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Eye, EyeOff, UserPlus, CheckCircle, ShieldCheck, Sparkles, ArrowLeft } from "lucide-react";

const AuthScene = dynamic(() => import("@/components/three/AuthScene"), {
  ssr: false,
  loading: () => null,
});

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    setLoading(true);
    try {
      const { error: authErr } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: `${window.location.origin}/dashboard` },
      });
      if (authErr) throw authErr;
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || "Signup failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="fixed inset-0 z-50 bg-[#FAFAF8] flex items-center justify-center px-4">
        <div className="w-full max-w-md text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#D1FAE5] mb-6">
            <CheckCircle className="w-8 h-8 text-[#10B981]" />
          </div>
          <h2 className="font-serif font-bold text-2xl text-[#0F172A] mb-2">Check your email</h2>
          <p className="text-sm text-[#64748B] mb-6">
            We&apos;ve sent a confirmation link to <strong>{email}</strong>. Click it to activate your account, then sign in.
          </p>
          <Link
            href="/login"
            className="inline-block px-6 py-2.5 bg-[#10B981] hover:bg-[#059669] text-white text-sm font-semibold rounded-xl transition-colors"
          >
            Go to Sign In
          </Link>
        </div>
      </div>
    );
  }

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
            Free forever · No card required
          </div>
          <h2 className="font-serif font-bold text-4xl leading-tight tracking-tight">
            Start researching in seconds.
          </h2>
          <p className="text-white/60 mt-4 text-sm leading-relaxed">
            Join thousands of Indian retail investors using institutional-grade,
            6-layer analysis to research any NSE or BSE company with confidence.
          </p>
          <div className="flex flex-wrap gap-2 mt-8">
            {["6-layer AI analysis", "NSE/BSE stocks", "Free forever"].map((b) => (
              <span
                key={b}
                className="text-[11px] font-semibold px-3 py-1 rounded-full bg-white/10 text-emerald-200 border border-white/10"
              >
                {b}
              </span>
            ))}
          </div>
          <div className="flex items-center gap-2 mt-8 text-white/50 text-xs">
            <ShieldCheck className="w-4 h-4 text-emerald-300" />
            SEBI-compliant · Educational research only
          </div>
        </div>
      </div>

      {/* ============ Right: form panel ============ */}
      <div className="flex items-center justify-center px-6 py-12 sm:px-12">
        <div className="w-full max-w-sm">
          <div className="lg:hidden text-center mb-8">
            <Link href="/" className="font-serif font-bold text-2xl text-[#0F172A] tracking-tight">
              VRIDDHI
            </Link>
          </div>

          <div className="mb-8">
            <h1 className="font-serif font-bold text-3xl text-[#0F172A] tracking-tight">Create your account</h1>
            <p className="text-sm text-[#64748B] mt-2">Start researching like the top 1% — free</p>
          </div>

          <form onSubmit={handleSignup} className="space-y-5">
            <div>
              <label htmlFor="signup-email" className="block text-xs font-semibold text-[#0F172A] mb-1.5">
                Email address
              </label>
              <input
                id="signup-email"
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
              <label htmlFor="signup-password" className="block text-xs font-semibold text-[#0F172A] mb-1.5">
                Password <span className="font-normal text-[#94A3B8]">(min 8 characters)</span>
              </label>
              <div className="relative">
                <input
                  id="signup-password"
                  type={showPass ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create a strong password"
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
              {password.length > 0 && (
                <div className="mt-2 flex gap-1">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className={`h-1 flex-1 rounded-full transition-colors ${
                        password.length >= i * 3
                          ? password.length >= 12
                            ? "bg-[#10B981]"
                            : password.length >= 8
                            ? "bg-[#F59E0B]"
                            : "bg-[#EF4444]"
                          : "bg-[#E2E8F0]"
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-xs px-4 py-2.5 rounded-xl">
                {error}
              </div>
            )}

            <button
              id="signup-submit-btn"
              type="submit"
              disabled={loading}
              className="w-full bg-[#10B981] hover:bg-[#059669] disabled:opacity-60 text-white font-semibold text-sm rounded-xl py-3.5 flex items-center justify-center gap-2 transition-colors shadow-sm shadow-emerald-500/20"
            >
              {loading ? (
                <span className="inline-block w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              ) : (
                <UserPlus className="w-4 h-4" />
              )}
              {loading ? "Creating account…" : "Create free account"}
            </button>
          </form>

          <div className="mt-8 text-center text-xs text-[#64748B]">
            Already have an account?{" "}
            <Link href="/login" className="text-[#10B981] font-semibold hover:underline">
              Sign in
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
