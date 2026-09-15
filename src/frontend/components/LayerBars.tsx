"use client";

import React from "react";
import { LayerInfo } from "@/lib/api";
import { ShieldCheck, TrendingUp, DollarSign, Award, Rocket, BarChart2 } from "lucide-react";

interface LayerBarsProps {
  layers: {
    L1: LayerInfo;
    L2: LayerInfo;
    L3: LayerInfo;
    L4: LayerInfo;
    L5: LayerInfo;
    L6: LayerInfo;
  };
}

const LAYER_CONFIG: Record<string, { label: string; icon: any; desc: string }> = {
  L1: { label: "Business Quality", icon: Award, desc: "Economic moat, gross margin stability, business model clarity" },
  L2: { label: "Financial Strength", icon: ShieldCheck, desc: "ROE, ROCE, leverage (D/E), free cash flow compounding" },
  L3: { label: "Valuation", icon: DollarSign, desc: "P/E vs industry median, PEG, P/B ratio, historical band" },
  L4: { label: "Governance", icon: TrendingUp, desc: "Promoter holding & pledging, institutional holding, clean filings" },
  L5: { label: "Growth Story", icon: Rocket, desc: "5-yr Revenue/Profit CAGR, quarterly YoY momentum, concall outlook" },
  L6: { label: "Technicals", icon: BarChart2, desc: "200-day & 50-day moving averages, RSI-14 momentum, 52-wk range" }
};

const CONFIDENCE_STYLE: Record<string, string> = {
  high: "bg-accent-light text-accent",
  medium: "bg-amber-50 text-warning",
  low: "bg-slate-100 text-primary-muted",
};

export default function LayerBars({ layers }: LayerBarsProps) {
  const layerKeys = ["L1", "L2", "L3", "L4", "L5", "L6"];

  return (
    <div className="bg-white rounded-2xl p-6 sm:p-7 h-full border border-border shadow-card flex flex-col">
      <div className="flex items-start justify-between gap-3 mb-6">
        <div>
          <h3 className="font-serif font-bold text-lg sm:text-xl text-primary">6-Layer Analysis Model</h3>
          <p className="text-xs sm:text-[13px] text-primary-muted mt-1">Automated institutional breakdown &middot; 100 points total</p>
        </div>
        <span className="shrink-0 text-[11px] font-semibold uppercase tracking-wide px-2.5 py-1 rounded-full bg-slate-100 text-primary-muted">
          Evidence-Backed
        </span>
      </div>

      <div className="space-y-5 flex-1">
        {layerKeys.map((key) => {
          const l = layers[key as keyof typeof layers];
          const cfg = LAYER_CONFIG[key] || { label: l.name, icon: Award, desc: "" };
          const Icon = cfg.icon;
          const pct = Math.min(100, Math.round((l.score / l.max) * 100));

          // Color based on layer score ratio
          let barColor = "#10B981"; // green
          if (pct < 50) barColor = "#EF4444"; // red
          else if (pct < 70) barColor = "#F59E0B"; // amber

          return (
            <div key={key} className="group">
              <div className="flex items-center justify-between gap-3 mb-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-7 h-7 rounded-lg bg-slate-100 text-primary-muted group-hover:text-accent group-hover:bg-accent-light transition-colors flex items-center justify-center shrink-0">
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[13px] sm:text-sm font-semibold text-primary leading-tight">
                      <span className="text-primary-muted font-mono mr-1">{key}</span>{cfg.label}
                    </div>
                    <p className="text-[11px] text-primary-muted leading-tight mt-0.5 hidden md:block truncate">
                      {cfg.desc}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${CONFIDENCE_STYLE[l.confidence] || CONFIDENCE_STYLE.low}`}>
                    {l.confidence}
                  </span>
                  <span className="font-mono font-semibold text-sm text-primary tabular-nums">
                    {l.score}<span className="text-primary-muted font-normal">/{l.max}</span>
                  </span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700 ease-out"
                  style={{ width: `${pct}%`, backgroundColor: barColor }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
