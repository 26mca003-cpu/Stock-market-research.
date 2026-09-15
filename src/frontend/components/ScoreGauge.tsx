"use client";

import React from "react";
import { getBandDetails } from "@/lib/constants";

interface ScoreGaugeProps {
  score: number;
  ratingBand: string;
}

export default function ScoreGauge({ score, ratingBand }: ScoreGaugeProps) {
  const band = getBandDetails(score);

  // SVG parameters for radial circular gauge
  const size = 224;
  const strokeWidth = 15;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  // Arc angle: 260 degrees
  const arcLength = circumference * 0.72;
  const progress = Math.max(0, Math.min(100, score)) / 100;
  const strokeDashoffset = arcLength * (1 - progress);

  return (
    <div className="flex flex-col items-center justify-center p-7 sm:p-8 h-full bg-white rounded-2xl border border-border shadow-card relative overflow-hidden">
      {/* Soft radial background glow */}
      <div
        className="absolute w-56 h-56 rounded-full blur-3xl opacity-[0.12] pointer-events-none -top-12 -right-12"
        style={{ backgroundColor: band.color }}
      />

      <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-primary-muted mb-2">
        Quality Score
      </span>

      <div className="relative flex items-center justify-center mt-1 w-full max-w-[224px] mx-auto aspect-square">
        <svg
          viewBox={`0 0 ${size} ${size}`}
          className="rotate-[140deg] w-full h-full"
          preserveAspectRatio="xMidYMid meet"
        >
          {/* Track background */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#EEF1F5"
            strokeWidth={strokeWidth}
            strokeDasharray={`${arcLength} ${circumference}`}
            strokeLinecap="round"
            fill="none"
          />
          {/* Active progress stroke */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={band.color}
            strokeWidth={strokeWidth}
            strokeDasharray={`${arcLength} ${circumference}`}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="none"
            style={{ transition: "stroke-dashoffset 1s ease-out" }}
          />
        </svg>

        {/* Center score display */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center -translate-y-1.5">
          <span className="font-mono text-[56px] sm:text-[68px] font-semibold leading-none tracking-tighter text-primary tabular-nums">
            {score}
          </span>
          <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-primary-muted mt-1.5">
            out of 100
          </span>
        </div>
      </div>

      {/* Rating Band Badge */}
      <div className="mt-6 flex flex-col items-center gap-2">
        <span
          className="px-4 py-1.5 rounded-full text-sm font-semibold tracking-wide shadow-sm"
          style={{ backgroundColor: band.bg, color: band.color }}
        >
          {band.label}
        </span>
        <span className="text-xs text-primary-muted font-medium">
          Institutional Quality Score
        </span>
      </div>
    </div>
  );
}
