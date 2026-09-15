"use client";

import React from "react";
import { RedFlagItem } from "@/lib/api";
import { AlertOctagon, AlertTriangle } from "lucide-react";

interface RedFlagCardProps {
  flags: RedFlagItem[];
}

export default function RedFlagCard({ flags }: RedFlagCardProps) {
  if (!flags || flags.length === 0) return null;

  return (
    <div className="bg-red-50/70 border-2 border-red-200 rounded-2xl p-5 shadow-sm">
      <div className="flex items-center gap-2.5 text-negative mb-3">
        <AlertOctagon className="w-5 h-5" />
        <h4 className="font-serif font-bold text-base tracking-tight">
          Governance & Regulatory Red Flags ({flags.length})
        </h4>
      </div>

      <div className="space-y-2.5">
        {flags.map((flag, idx) => (
          <div
            key={idx}
            className="bg-white rounded-xl p-3.5 border border-red-100 shadow-xs flex items-start justify-between gap-3"
          >
            <div className="flex items-start gap-2.5 min-w-0">
              <AlertTriangle className="w-4 h-4 text-negative mt-0.5 flex-shrink-0" />
              <div className="min-w-0">
                <div className="text-xs font-bold text-negative uppercase tracking-wider">
                  {flag.type}
                </div>
                <p className="text-sm font-medium text-primary mt-0.5 break-words">{flag.title}</p>
              </div>
            </div>

            <span
              className={`text-[11px] font-bold px-2 py-0.5 rounded-full uppercase shrink-0 ${
                flag.severity === "major"
                  ? "bg-red-100 text-red-700"
                  : "bg-amber-100 text-amber-700"
              }`}
            >
              {flag.severity}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
