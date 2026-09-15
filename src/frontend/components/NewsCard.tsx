"use client";

import React from "react";
import { NewsItem } from "@/lib/api";
import { ExternalLink, Newspaper, TrendingUp, TrendingDown, Minus } from "lucide-react";

interface NewsCardProps {
  news: NewsItem[];
}

export default function NewsCard({ news }: NewsCardProps) {
  return (
    <div className="bg-white rounded-2xl border border-border shadow-card overflow-hidden">
      <div className="p-4 sm:p-5 border-b border-border bg-slate-50/50 flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-serif font-bold text-base sm:text-lg text-primary">Live News &amp; Sentiment</h3>
          <p className="text-xs text-primary-muted mt-0.5">Google News RSS with AI long-term impact sentiment</p>
        </div>
        <span className="text-xs font-semibold px-2.5 py-1 rounded bg-slate-100 text-primary-muted flex items-center gap-1.5 shrink-0 whitespace-nowrap">
          <Newspaper className="w-3.5 h-3.5" /> 15m Sync
        </span>
      </div>

      <div className="divide-y divide-border">
        {news.map((item, idx) => {
          let badgeBg = "bg-slate-100 text-primary-muted";
          let Icon = Minus;

          if (item.sentiment === "positive") {
            badgeBg = "bg-accent-light text-accent border border-accent/20";
            Icon = TrendingUp;
          } else if (item.sentiment === "negative") {
            badgeBg = "bg-negative-light text-negative border border-negative/20";
            Icon = TrendingDown;
          }

          return (
            <a
              key={idx}
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-4 sm:px-6 hover:bg-slate-50 flex items-start justify-between gap-4 transition-colors group block"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1.5 min-w-0">
                  <span className="text-xs font-semibold text-primary-muted truncate max-w-[55%]">{item.source || "Financial Press"}</span>
                  {item.published_at && (
                    <>
                      <span className="text-xs text-slate-300 shrink-0">•</span>
                      <span className="text-[11px] text-primary-muted shrink-0">{item.published_at}</span>
                    </>
                  )}
                </div>
                <h4 className="text-sm font-medium text-primary group-hover:text-accent transition-colors line-clamp-2 break-words">
                  {item.title}
                </h4>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                {item.sentiment && (
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold capitalize flex items-center gap-1 whitespace-nowrap ${badgeBg}`}>
                    <Icon className="w-3 h-3" />
                    {item.sentiment}
                  </span>
                )}
                <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-primary transition-colors" />
              </div>
            </a>
          );
        })}

        {news.length === 0 && (
          <div className="p-8 text-center text-sm text-primary-muted">
            No recent news stories found for this ticker.
          </div>
        )}
      </div>
    </div>
  );
}
