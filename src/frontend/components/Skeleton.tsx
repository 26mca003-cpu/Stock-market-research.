"use client";

import React from "react";

/**
 * Premium skeleton primitives with a shimmer sweep.
 * Usage: <Skeleton className="h-4 w-32" /> or the preset blocks below.
 */
export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`skeleton-shimmer rounded-md ${className}`} />;
}

/** A stat/metric card placeholder */
export function SkeletonStatCard() {
  return (
    <div className="bg-white p-6 rounded-xl border border-border shadow-sm">
      <Skeleton className="h-3.5 w-24" />
      <Skeleton className="h-8 w-16 mt-3" />
    </div>
  );
}

/** A generic content card placeholder */
export function SkeletonCard() {
  return (
    <div className="bg-white p-6 rounded-xl border border-border shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>
      <Skeleton className="h-3 w-full mt-2" />
      <Skeleton className="h-3 w-2/3 mt-2" />
      <div className="mt-5 flex items-center justify-between">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-3 w-20" />
      </div>
    </div>
  );
}

/** A table placeholder with N rows */
export function SkeletonTable({ rows = 5, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className="bg-white rounded-xl border border-border shadow-sm overflow-x-auto">
      <div className="min-w-[640px]">
        <div className="bg-slate-50 border-b border-border px-4 sm:px-6 py-4 flex gap-4 sm:gap-6">
          {Array.from({ length: cols }).map((_, i) => (
            <Skeleton key={i} className="h-3.5 flex-1" />
          ))}
        </div>
        <div className="divide-y divide-slate-100">
          {Array.from({ length: rows }).map((_, r) => (
            <div key={r} className="px-4 sm:px-6 py-4 flex gap-4 sm:gap-6 items-center">
              {Array.from({ length: cols }).map((_, c) => (
                <Skeleton key={c} className="h-4 flex-1" />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/** A page header placeholder (title + subtitle) */
export function SkeletonHeader() {
  return (
    <div>
      <Skeleton className="h-7 sm:h-8 w-48 sm:w-56" />
      <Skeleton className="h-4 w-56 sm:w-72 mt-3" />
    </div>
  );
}
