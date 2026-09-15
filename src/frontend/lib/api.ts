/** Typed API Client for VRIDDHI Backend (TRD §5) */
import { API_BASE } from "./constants";

export interface SearchResult {
  ticker: string;
  name: string;
  exchange: string;
}

export interface WatchlistItem {
  ticker: string;
  name: string;
  last_price: number | null;
  day_change_pct: number | null;
  score_total: number | null;
}

export interface LayerDetail {
  [key: string]: any;
}

export interface LayerInfo {
  name: string;
  score: number;
  max: number;
  confidence: "high" | "medium" | "low";
  details: LayerDetail;
}

export interface ChecklistItem {
  layer: string;
  metric: string;
  value: string;
  verdict: "pass" | "warn" | "fail";
  explanation: string;
}

export interface RedFlagItem {
  type: string;
  title: string;
  date?: string;
  severity: "minor" | "major";
}

export interface SourceItem {
  name: string;
  url: string;
  used_for: string;
}

export interface PriceInfo {
  last: number;
  day_change_pct: number;
  currency: string;
}

export interface ResearchReport {
  ticker: string;
  company_name: string;
  price: PriceInfo;
  score_total: number;
  rating_band: string;
  layers: {
    L1: LayerInfo;
    L2: LayerInfo;
    L3: LayerInfo;
    L4: LayerInfo;
    L5: LayerInfo;
    L6: LayerInfo;
  };
  checklist: ChecklistItem[];
  red_flags: RedFlagItem[];
  ai_summary: string;
  sources: SourceItem[];
  disclaimer: string;
  last_analyzed: string;
  cached: boolean;
}

export interface CandleData {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
}

export interface VolumeData {
  time: string;
  value: number;
  color: string;
}

export interface ChartData {
  candles: CandleData[];
  volumes: VolumeData[];
}

export interface NewsItem {
  title: string;
  url: string;
  source: string | null;
  published_at: string | null;
  sentiment: "positive" | "neutral" | "negative" | null;
}

export interface NewListingItem {
  ticker: string;
  name: string;
  exchange: string;
  listing_date: string | null;
  sector: string | null;
  industry: string | null;
  market_cap: number | null;
  current_price: number | null;
  is_new_listing: boolean;
  detected_at: string | null;
  series?: string | null;
  is_sme?: boolean;
  category?: string;
}

export interface IPOItem {
  symbol: string;
  company_name: string;
  issue_start_date: string;
  issue_end_date: string;
  issue_price: string;
  issue_size: string;
  status: "Active" | "Closed" | "Forthcoming" | string;
  series: string;
  category?: string;
  exchange?: string;
  lot_size?: string;
  is_sme?: boolean;
}

import { supabase } from "./supabase";

// Fetch helper with error fallback and Supabase auth header injection
async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  let authHeaders: Record<string, string> = {};
  try {
    const { data } = await supabase.auth.getSession();
    if (data?.session?.access_token) {
      authHeaders["Authorization"] = `Bearer ${data.session.access_token}`;
    }
  } catch {
    // ignore if session cannot be retrieved
  }

  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...authHeaders,
      ...(options?.headers || {})
    }
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`API Error ${res.status}: ${errText}`);
  }
  // Handle 204 No Content or any response with an empty body.
  // The backend DELETE /api/watchlist/{ticker} and DELETE /api/portfolio/{ticker}
  // both return 204 with no body. Calling res.json() on an empty body throws:
  //   SyntaxError: Unexpected end of JSON input
  // which the dashboard catch-block treats as failure, rolling back the optimistic
  // UI removal and making deleted stocks reappear on the screen.
  if (res.status === 204) {
    return null as unknown as T;
  }
  const text = await res.text();
  if (!text) {
    return null as unknown as T;
  }
  return JSON.parse(text) as T;
}

export const api = {
  get: async <T = any>(endpoint: string): Promise<T> => {
    const path = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
    return fetchJson(`${API_BASE}${path}`);
  },

  post: async <T = any>(endpoint: string, body?: any): Promise<T> => {
    const path = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
    return fetchJson(`${API_BASE}${path}`, {
      method: "POST",
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  },

  delete: async <T = any>(endpoint: string): Promise<T> => {
    const path = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
    return fetchJson(`${API_BASE}${path}`, {
      method: "DELETE",
    });
  },

  search: (q: string): Promise<SearchResult[]> =>
    fetchJson(`${API_BASE}/search?q=${encodeURIComponent(q)}`),

  getWatchlist: (): Promise<WatchlistItem[]> =>
    fetchJson(`${API_BASE}/watchlist`),

  addToWatchlist: (ticker: string, company_name: string = "") =>
    fetchJson(`${API_BASE}/watchlist`, {
      method: "POST",
      body: JSON.stringify({ ticker, company_name })
    }),

  removeFromWatchlist: (ticker: string) =>
    fetchJson(`${API_BASE}/watchlist/${encodeURIComponent(ticker)}`, { method: "DELETE" }),

  getResearchReport: (ticker: string): Promise<ResearchReport> =>
    fetchJson(`${API_BASE}/research/${ticker}`),

  refreshReport: (ticker: string): Promise<ResearchReport> =>
    fetchJson(`${API_BASE}/research/${ticker}/refresh`, { method: "POST" }),

  getChart: (ticker: string, period: "6m" | "1y" | "5y" = "1y"): Promise<ChartData> =>
    fetchJson(`${API_BASE}/chart/${ticker}?period=${period}`),

  getNews: (ticker: string): Promise<NewsItem[]> =>
    fetchJson(`${API_BASE}/news/${ticker}`),

  getPortfolio: () =>
    fetchJson(`${API_BASE}/portfolio`),

  addPortfolioHolding: (ticker: string, quantity: number, avg_buy_price: number) =>
    fetchJson(`${API_BASE}/portfolio`, {
      method: "POST",
      body: JSON.stringify({ ticker, quantity, avg_buy_price })
    }),

  removePortfolioHolding: (ticker: string) =>
    fetchJson(`${API_BASE}/portfolio/${encodeURIComponent(ticker)}`, { method: "DELETE" }),

  getNewListings: (days: number = 90): Promise<NewListingItem[]> =>
    fetchJson(`${API_BASE}/new-listings?days=${days}`),

  getIPORadar: (): Promise<IPOItem[]> =>
    fetchJson(`${API_BASE}/new-listings/ipo-radar`),

  triggerListingsSync: () =>
    fetchJson(`${API_BASE}/new-listings/sync`, { method: "POST" }),
};

export default api;

