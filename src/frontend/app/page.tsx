"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Search,
  TrendingUp,
  ShieldCheck,
  Award,
  DollarSign,
  Rocket,
  BarChart2,
  ArrowRight,
  Sparkles,
  Zap,
  LineChart,
} from "lucide-react";
import Disclaimer from "@/components/Disclaimer";

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  show: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] },
  }),
};

export default function LandingPage() {
  const router = useRouter();
  const [tickerInput, setTickerInput] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tickerInput.trim()) return;
    const clean = tickerInput.trim().toUpperCase();
    router.push(`/research/${clean.endsWith(".NS") ? clean : `${clean}.NS`}`);
  };

  const layers = [
    { num: "L1", name: "Business Quality", weight: "15 pts", icon: Award, desc: "Economic moat classification, gross-margin stability, and revenue-model simplicity." },
    { num: "L2", name: "Financial Strength", weight: "25 pts", icon: ShieldCheck, desc: "ROE, ROCE, leverage (D/E), free-cash-flow compounding, and interest coverage." },
    { num: "L3", name: "Valuation", weight: "15 pts", icon: DollarSign, desc: "P/E vs industry median, PEG ratio, price-to-book, and a 5-year valuation band." },
    { num: "L4", name: "Governance", weight: "20 pts", icon: TrendingUp, desc: "Promoter pledging, 4-quarter stake trend, institutional holding, and 90-day filings." },
    { num: "L5", name: "Growth Story", weight: "15 pts", icon: Rocket, desc: "5-year revenue & profit CAGR, quarterly YoY momentum, and management guidance." },
    { num: "L6", name: "Technicals", weight: "10 pts", icon: BarChart2, desc: "Price vs 200-day & 50-day moving averages, 14-period RSI, and 52-week position." },
  ];

  const steps = [
    { n: "1", title: "Pick Any Stock", desc: "Search any NSE/BSE stock or add it to your watchlist to monitor live prices." },
    { n: "2", title: "15-Second Deep Audit", desc: "Our engine reads 5-year financials, Screener ratios, BSE filings, and live news." },
    { n: "3", title: "Quality Score & Evidence", desc: "Get a 0–100 Quality Score, an evidence checklist, and a plain-language AI synthesis." },
  ];

  const plans = [
    {
      name: "Free",
      tagline: "Full analysis, small portfolio",
      price: "₹0",
      period: "",
      highlight: false,
      cta: "Create Free Account",
      limits: [
        "5 stocks in your watchlist",
        "3 portfolio holdings tracked",
        "2 side-by-side comparisons per day",
        "Full 6-layer Quality Score on every search",
      ],
    },
    {
      name: "Pro",
      tagline: "For active retail investors",
      price: "₹499",
      period: "/mo",
      highlight: true,
      cta: "Start with Pro",
      limits: [
        "50 stocks in your watchlist",
        "25 portfolio holdings tracked",
        "20 side-by-side comparisons per day",
        "Full 6-layer Quality Score on every search",
        "IPO Radar access",
      ],
    },
    {
      name: "Ultra",
      tagline: "For serious portfolio tracking",
      price: "₹1,499",
      period: "/mo",
      highlight: false,
      cta: "Start with Ultra",
      limits: [
        "Unlimited watchlist stocks",
        "Unlimited portfolio holdings",
        "Unlimited comparisons",
        "Full 6-layer Quality Score on every search",
        "IPO Radar access",
        "Priority AI synthesis on every report",
      ],
    },
  ];

  return (
    <div className="-mt-6">
      {/* ============================ HERO ============================ */}
      <section id="top" className="full-bleed relative min-h-[92vh] overflow-hidden bg-bg">
        {/* ambient depth — subtle emerald glows, no external assets */}
        <div className="absolute inset-0 z-0 pointer-events-none">
          <div className="absolute -top-40 -left-32 w-[36rem] h-[36rem] rounded-full bg-accent/10 blur-[120px]" />
          <div className="absolute bottom-0 right-0 w-[30rem] h-[30rem] rounded-full bg-accent/[0.07] blur-[100px]" />
          <div
            className="absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage:
                "linear-gradient(rgba(15,23,42,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(15,23,42,0.5) 1px, transparent 1px)",
              backgroundSize: "44px 44px",
            }}
          />
        </div>

        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-24 grid lg:grid-cols-2 gap-12 lg:gap-8 items-center min-h-[92vh]">
          {/* ---------------- LEFT: headline + copy + CTAs ---------------- */}
          <div className="space-y-6 sm:space-y-7">
            <motion.div
              variants={fadeUp}
              initial="hidden"
              animate="show"
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/70 backdrop-blur-md text-accent text-xs font-semibold border border-accent/20 shadow-sm"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>The Institutional Research Terminal for Indian Retail</span>
            </motion.div>

            <motion.h1
              variants={fadeUp}
              custom={1}
              initial="hidden"
              animate="show"
              className="font-serif text-4xl sm:text-6xl lg:text-[4.2rem] font-bold tracking-tight text-primary leading-[1.08]"
            >
              Research Made <span className="text-accent">Rigorous</span>
              <br />
              With A Six-Layer
              <br />
              <span className="bg-gradient-to-r from-accent via-emerald-500 to-emerald-600 bg-clip-text text-transparent">
                Quality Score.
              </span>
            </motion.h1>

            <motion.p
              variants={fadeUp}
              custom={2}
              initial="hidden"
              animate="show"
              className="text-base sm:text-lg text-primary-muted max-w-xl leading-relaxed"
            >
              Search any NSE or BSE company and get a complete, evidence-backed
              audit in 15 seconds — business quality, financial strength,
              valuation, governance, growth, and technicals. No price targets,
              no advice, just the evidence.
            </motion.p>

            <motion.div
              variants={fadeUp}
              custom={3}
              initial="hidden"
              animate="show"
              className="flex flex-wrap items-center gap-3 pt-1"
            >
              <Link
                href="/signup"
                className="px-6 py-3 min-h-[44px] bg-accent hover:bg-accent-hover text-white text-sm font-semibold rounded-xl flex items-center gap-1.5 shadow-lg shadow-accent/20 transition-colors"
              >
                <span>Open Free Account</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <a
                href="#features"
                className="px-6 py-3 min-h-[44px] bg-white hover:bg-white/80 text-primary text-sm font-semibold rounded-xl border border-border shadow-sm transition-colors"
              >
                See How It Works
              </a>
            </motion.div>

            {/* Search bar */}
            <motion.form
              variants={fadeUp}
              custom={4}
              initial="hidden"
              animate="show"
              onSubmit={handleSearch}
              className="max-w-md flex items-center gap-2 bg-white p-2 rounded-2xl border border-border shadow-lg focus-within:border-accent transition-all"
            >
              <div className="flex-1 flex items-center pl-3 gap-2">
                <Search className="w-5 h-5 text-primary-muted" />
                <input
                  type="text"
                  placeholder="Enter ticker (e.g. RELIANCE, TCS)..."
                  value={tickerInput}
                  onChange={(e) => setTickerInput(e.target.value)}
                  className="w-full text-sm text-primary placeholder:text-primary-muted focus:outline-none bg-transparent"
                />
              </div>
              <button
                type="submit"
                className="shrink-0 px-4 sm:px-5 py-2.5 min-h-[40px] bg-accent hover:bg-accent-hover text-white text-sm font-semibold rounded-xl flex items-center gap-1.5 shadow-sm transition-colors"
              >
                <span>Research</span>
              </button>
            </motion.form>
          </div>

          {/* ---------------- RIGHT: VRIDDHI's own feature visual ---------------- */}
          <motion.div
            variants={fadeUp}
            custom={2}
            initial="hidden"
            animate="show"
            className="relative flex items-center justify-center lg:justify-end"
          >
            <div className="relative w-full max-w-sm">
              {/* Floating layer-score mini cards — represent the 6-layer framework */}
              <div className="absolute -left-6 sm:-left-10 top-6 z-20 w-40 rounded-2xl bg-white border border-border shadow-xl p-3.5 rotate-[-6deg]">
                <div className="text-[10px] font-semibold tracking-wide text-primary-muted uppercase mb-1">L2 · Financial</div>
                <div className="font-mono text-2xl font-bold text-accent tabular-nums">22<span className="text-sm text-primary-muted">/25</span></div>
                <div className="mt-2 h-1.5 rounded-full bg-border overflow-hidden">
                  <div className="h-full w-[88%] rounded-full bg-accent" />
                </div>
              </div>

              <div className="absolute -right-4 sm:-right-8 bottom-24 z-20 w-36 rounded-2xl bg-white border border-border shadow-xl p-3.5 rotate-[5deg]">
                <div className="text-[10px] font-semibold tracking-wide text-primary-muted uppercase mb-1">L4 · Governance</div>
                <div className="font-mono text-2xl font-bold text-accent tabular-nums">17<span className="text-sm text-primary-muted">/20</span></div>
                <div className="mt-2 h-1.5 rounded-full bg-border overflow-hidden">
                  <div className="h-full w-[85%] rounded-full bg-accent" />
                </div>
              </div>

              {/* Main terminal card — the Quality Score gauge itself */}
              <div className="relative z-10 rounded-3xl bg-white border border-border shadow-2xl p-6 sm:p-7">
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <div className="text-[11px] font-semibold tracking-wide text-primary-muted uppercase">RELIANCE.NS</div>
                    <div className="text-sm text-primary font-medium">Quality Score</div>
                  </div>
                  <div className="px-2.5 py-1 rounded-full bg-accent/10 text-accent text-[10px] font-semibold border border-accent/20">
                    Exceptional
                  </div>
                </div>

                <div className="flex items-center justify-center py-3">
                  <div className="relative w-40 h-40">
                    <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
                      <circle cx="60" cy="60" r="52" fill="none" stroke="rgba(15,23,42,0.08)" strokeWidth="10" />
                      <circle
                        cx="60"
                        cy="60"
                        r="52"
                        fill="none"
                        stroke="#10B981"
                        strokeWidth="10"
                        strokeLinecap="round"
                        strokeDasharray={`${2 * Math.PI * 52 * 0.84} ${2 * Math.PI * 52}`}
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="font-mono text-4xl font-bold text-primary tabular-nums">84</span>
                      <span className="text-[10px] text-primary-muted uppercase tracking-wide">/ 100</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 mt-4">
                  {["L1", "L3", "L5"].map((l) => (
                    <div key={l} className="rounded-lg bg-bg border border-border py-2 text-center">
                      <div className="text-[9px] text-primary-muted uppercase font-semibold">{l}</div>
                      <div className="font-mono text-xs text-accent font-semibold">Pass</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ======================= STATS STRIP ======================= */}
      <section className="max-w-5xl mx-auto px-4 -mt-8 relative z-20">
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-80px" }}
          className="grid grid-cols-3 divide-x divide-border rounded-2xl bg-white border border-border shadow-card overflow-hidden"
        >
          {[
            { k: "6", v: "Analysis Layers", icon: LineChart },
            { k: "100", v: "Point Quality Score", icon: Award },
            { k: "15s", v: "Full Audit Time", icon: Zap },
          ].map((s) => {
            const Icon = s.icon;
            return (
              <div key={s.v} className="p-4 sm:p-6 text-center flex flex-col items-center gap-1">
                <Icon className="w-5 h-5 text-accent mb-1" />
                <div className="font-mono text-2xl sm:text-3xl font-semibold text-primary tabular-nums">{s.k}</div>
                <div className="text-[11px] sm:text-xs text-primary-muted">{s.v}</div>
              </div>
            );
          })}
        </motion.div>
      </section>

      {/* ======================= HOW IT WORKS ======================= */}
      <section className="max-w-6xl mx-auto px-4 py-16 sm:py-24">
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="text-center max-w-xl mx-auto mb-12 sm:mb-14"
        >
          <div className="text-xs font-bold text-accent uppercase tracking-wider mb-2">
            Process
          </div>
          <h2 className="font-serif font-bold text-3xl sm:text-4xl text-primary">
            How Vriddhi Works
          </h2>
          <p className="text-sm text-primary-muted mt-3">
            From raw exchange filings to institutional clarity in three automated steps.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {steps.map((s, i) => (
            <motion.div
              key={s.n}
              variants={fadeUp}
              custom={i}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true }}
              whileHover={{ y: -6 }}
              className="vriddhi-card p-6 sm:p-8 text-center"
            >
              <div className="w-12 h-12 mx-auto rounded-2xl bg-accent-light text-accent flex items-center justify-center font-serif font-bold text-xl mb-4">
                {s.n}
              </div>
              <h3 className="font-bold text-lg text-primary mb-2">{s.title}</h3>
              <p className="text-sm text-primary-muted leading-relaxed">{s.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ======================= 6-LAYER MODEL ======================= */}
      <section id="features" className="max-w-6xl mx-auto px-4 pb-16 sm:pb-24">
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10"
        >
          <div>
            <div className="text-xs font-bold text-accent uppercase tracking-wider mb-1">
              Framework
            </div>
            <h2 className="font-serif font-bold text-3xl sm:text-4xl text-primary">
              The 6-Layer Analysis Model
            </h2>
          </div>
          <Link
            href="/dashboard"
            className="text-sm font-semibold text-accent hover:text-accent-hover flex items-center gap-1 self-start sm:self-auto"
          >
            <span>Open Dashboard</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {layers.map((layer, i) => {
            const Icon = layer.icon;
            return (
              <motion.div
                key={layer.num}
                variants={fadeUp}
                custom={i}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true }}
                whileHover={{ y: -6, rotateX: 4, rotateY: -4 }}
                style={{ transformPerspective: 800 }}
                className="vriddhi-card p-6 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
                      <Icon className="w-5 h-5 text-accent" />
                    </div>
                    <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-accent-light text-accent">
                      {layer.weight}
                    </span>
                  </div>
                  <h3 className="font-bold text-base text-primary mb-1">
                    {layer.num}: {layer.name}
                  </h3>
                  <p className="text-sm text-primary-muted leading-relaxed">{layer.desc}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* ======================= PLANS ======================= */}
      <section id="pricing" className="full-bleed bg-white border-y border-border">
        <div className="max-w-6xl mx-auto px-4 py-16 sm:py-20">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            className="text-center max-w-xl mx-auto mb-12"
          >
            <div className="text-xs font-bold text-accent uppercase tracking-wider mb-2">
              Access
            </div>
            <h2 className="font-serif font-bold text-3xl sm:text-4xl text-primary">
              Plans that scale with your portfolio.
            </h2>
            <p className="text-sm sm:text-base text-primary-muted mt-3 leading-relaxed">
              The full six-layer analysis is on every plan — no locked layers, no locked score. Paid plans raise how much you can track.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
            {plans.map((plan, i) => (
              <motion.div
                key={plan.name}
                variants={fadeUp}
                custom={i}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true }}
                className={`relative rounded-2xl border p-6 sm:p-7 flex flex-col ${
                  plan.highlight
                    ? "border-accent shadow-lg shadow-accent/10 bg-white"
                    : "border-border bg-white shadow-card"
                }`}
              >
                {plan.highlight && (
                  <span className="absolute -top-3 left-6 px-2.5 py-0.5 rounded-full bg-accent text-white text-[11px] font-semibold tracking-wide">
                    Most Popular
                  </span>
                )}
                <div className="mb-5">
                  <h3 className="font-bold text-lg text-primary">{plan.name}</h3>
                  <p className="text-xs text-primary-muted mt-1">{plan.tagline}</p>
                </div>
                <div className="mb-6">
                  <span className="font-mono text-3xl sm:text-4xl font-semibold text-primary tabular-nums">
                    {plan.price}
                  </span>
                  {plan.period && <span className="text-sm text-primary-muted ml-1">{plan.period}</span>}
                </div>
                <ul className="space-y-2.5 mb-7 flex-1">
                  {plan.limits.map((l) => (
                    <li key={l} className="flex items-start gap-2 text-sm text-primary-muted">
                      <ShieldCheck className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                      <span>{l}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  href="/signup"
                  className={`w-full text-center px-5 py-2.5 min-h-[44px] rounded-xl text-sm font-semibold transition-all flex items-center justify-center ${
                    plan.highlight
                      ? "bg-accent hover:bg-accent-hover text-white shadow-sm"
                      : "border border-border text-primary hover:bg-slate-50"
                  }`}
                >
                  {plan.cta}
                </Link>
              </motion.div>
            ))}
          </div>

          <p className="text-center text-xs text-primary-muted mt-8 max-w-2xl mx-auto leading-relaxed">
            Every plan gets the same 100-point Quality Score, the same evidence checklist, and the same statutory disclosures — limits apply only to how many stocks you track and compare at once, never to the depth of the analysis itself.
          </p>
        </div>
      </section>

      {/* ======================= ABOUT ======================= */}
      <section id="about" className="max-w-4xl mx-auto px-4 py-16 sm:py-24 text-center">
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
        >
          <div className="text-xs font-bold text-accent uppercase tracking-wider mb-2">
            About
          </div>
          <h2 className="font-serif font-bold text-3xl sm:text-4xl text-primary mb-6">
            Built to level the research playing field.
          </h2>
          <p className="text-base text-primary-muted leading-relaxed max-w-2xl mx-auto">
            Most retail investors never see the filings, ratios, and governance checks
            a professional desk relies on. Vriddhi reads them for you and shows its work.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/signup"
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-all shadow-sm"
            >
              Create Free Account
            </Link>
            <Link
              href="/#pricing"
              className="w-full sm:w-auto px-6 py-3 rounded-xl border border-border text-sm font-semibold text-primary hover:bg-slate-50 transition-all"
            >
              View Plans
            </Link>
          </div>
        </motion.div>
      </section>

      <Disclaimer />
    </div>
  );
}
