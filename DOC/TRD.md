# TRD — Technical Requirements Document
# Project: VRIDDHI — AI Long-Term Investor Research Platform
# Version: 1.0 | Date: 2026-09-04 | Status: FINAL (verified 3x, consistent with PRD v1.0)
# Audience: AI coding agents (Claude Code / Cursor / Antigravity) + human developers
# RULE FOR AGENTS: Follow this document exactly. Names, ports, tables, endpoints,
# weights, and env vars here are the single source of truth. Do not invent alternatives.

---

## 0. GOLDEN CONSISTENCY TABLE (never deviate)

| Item | Exact value |
|------|-------------|
| App name | VRIDDHI |
| Backend port | 8000 (local), $PORT on Heroku |
| Frontend port | 3000 |
| Score weights | L1=15, L2=25, L3=15, L4=20, L5=15, L6=10 (total=100) |
| Rating bands | 80–100 Excellent, 65–79 Good, 50–64 Average, 35–49 Weak, 0–34 Poor |
| Analysis cache TTL | 24 hours (86400 s) |
| News refresh | every 15 min |
| Fundamentals refresh | daily 18:00 IST |
| Shareholding refresh | daily 19:00 IST |
| Announcements poll | hourly |
| Screener.in rate limit | 1 request / 2 seconds, 24h cache |
| Roles | enum: 'user' (default) \| 'admin' — stored in profiles.role, enforced server-side |
| Admin bootstrap | env var ADMIN_EMAILS (comma-separated) — matching signup auto-gets role='admin' |
| Disclaimer text | "Vriddhi is an educational research tool, not investment advice. Data sourced from public filings and may be delayed or inaccurate. Consult a SEBI-registered investment advisor before investing." |
| Forbidden words in UI output | "buy", "sell", "hold", "recommendation", "target price", "guaranteed" |

---

## 1. ARCHITECTURE

```
┌────────────┐      HTTPS       ┌──────────────────────────────┐
│  Browser   │ ◄──────────────► │  Frontend: Next.js 14 (App   │
│  (mobile + │                  │  Router), Tailwind, shadcn/  │
│  desktop)  │                  │  ui, Lightweight Charts      │
└────────────┘                  └──────────────┬───────────────┘
                                               │ REST /api/*
                                               ▼
                                ┌──────────────────────────────┐
                                │  Backend: FastAPI (Python    │
                                │  3.11), Uvicorn              │
                                │  routers/ services/ jobs/    │
                                └───────┬──────────┬───────────┘
                                        │          │
              ┌─────────────────────────┘          └──────────────────┐
              ▼                                                       ▼
┌───────────────────────────┐                          ┌──────────────────────────┐
│ DATA LAYER                │                          │ AI LAYER                 │
│ • yfinance (prices,       │                          │ • Google Gemini 2.0 Flash │
│   fundamentals)           │                          │   (primary LLM, free)    │
│ • Screener.in (Crawl4AI)  │                          │ • Groq llama-3.1-8b      │
│ • BSE filings (Crawl4AI)  │                          │   (fallback, free)       │
│ • Google News RSS         │                          │ • Docling (PDF→text)     │
└─────────────┬─────────────┘                          └──────────────────────────┘
              ▼
┌───────────────────────────┐
│ STORE: Supabase Postgres  │
│ (free 500MB) + RLS        │
└───────────────────────────┘

Cron jobs: VM crontab (primary) / GitHub Actions (backup)
Hosting: Genspark VM via Caddy (primary), Heroku Basic $7 via credits (backup)
```

---

## 2. TECH STACK (exact versions)

| Layer | Tech | Version | Why |
|-------|------|---------|-----|
| Frontend | Next.js (React) | 14.x | Professional UI, AI-agent-friendly |
| Styling | Tailwind CSS + shadcn/ui | latest | Design system from PRD §6.3 |
| Charts | lightweight-charts | 4.x | Free Apache-2.0 candlesticks |
| Fonts | Fraunces + Inter | Google Fonts | Classic-modern per PRD |
| Backend | FastAPI + Uvicorn | 0.128 / 0.38 | Async, fast, auto-docs |
| Data | yfinance | ≥0.2.40 | Free NSE/BSE OHLCV + fundamentals |
| Scraping | crawl4ai | 0.9.3 | Already deployed on VM |
| PDF parsing | docling | latest | IBM tool, annual reports/results |
| LLM primary | google-generativeai (Gemini 2.0 Flash) | free tier | 1M tokens/day |
| LLM fallback | groq (llama-3.1-8b-instant) | free tier | 14.4k req/day |
| DB + Auth | Supabase (Postgres + Auth) | free tier | RLS security, zero setup |
| HTTP client | httpx (async) | latest | All outbound calls |
| Cache | Postgres tables (no Redis needed MVP) | — | Simplicity |
| Process mgr | pm2 (VM) | — | Auto-restart |

---

## 3. DATA SOURCES (exact URLs/patterns)

| Data | Source | Exact pattern | Method | Refresh |
|------|--------|---------------|--------|---------|
| OHLCV daily | yfinance | `yf.Ticker("{SYM}.NS").history(period="5y")` | API | daily |
| Live-ish price | yfinance | `Ticker.fast_info["last_price"]` | API | on view (15-min cache) |
| Fundamentals (PE, PB, ROE, D/E, margins) | yfinance | `Ticker("{SYM}.NS").info` | API | daily |
| Financial statements | yfinance | `.financials, .balance_sheet, .cashflow` (yearly) | API | daily |
| 10-yr ratios, quarterly results, shareholding | Screener.in | `https://www.screener.in/company/{SYM}/consolidated/` | Crawl4AI, parse tables | daily |
| Shareholding pattern & pledging | Screener.in (shareholding table) + BSE | same URL above; BSE fallback `https://www.bseindia.com/corporates/shpPromoterNGroup.aspx?scripcode={CODE}` | Crawl4AI | daily |
| Corporate announcements | BSE | `https://www.bseindia.com/corporates/ann.html` filtered by company | Crawl4AI | hourly |
| Annual report / results PDFs | BSE filings + company IR page | links discovered via announcements | Crawl4AI download → Docling | on publish |
| News | Google News RSS | `https://news.google.com/rss/search?q={COMPANY_NAME}+stock&hl=en-IN&gl=IN&ceid=IN:en` | feedparser (or Crawl4AI fallback) | 15 min |
| Industry PE median | Screener.in sector page | `https://www.screener.in/screens/...` peer table on company page | Crawl4AI | daily |

Rules:
- NEVER scrape nseindia.com (Akamai block + ToS). All NSE data comes via yfinance/Screener/BSE.
- All scraping: 2s minimum delay, retry 3x with backoff, cache 24h, user-agent rotation via crawl4ai defaults.
- If a field is missing → store null, set confidence flag; never fabricate.

---

## 4. DATABASE SCHEMA (Supabase Postgres)

```sql
-- users handled by Supabase Auth (auth.users). We extend with profile if needed.

create table watchlists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  ticker text not null,               -- e.g. 'RELIANCE.NS'
  company_name text,
  added_at timestamptz default now(),
  unique(user_id, ticker)
);

create table portfolios (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  ticker text not null,
  quantity numeric not null check (quantity > 0),
  avg_buy_price numeric not null check (avg_buy_price > 0),
  added_at timestamptz default now(),
  unique(user_id, ticker)
);

create table stock_fundamentals (
  ticker text primary key,            -- 'RELIANCE.NS'
  payload jsonb not null,             -- raw merged yfinance + screener data
  fetched_at timestamptz default now()
);

create table analysis_reports (
  id uuid primary key default gen_random_uuid(),
  ticker text not null,
  score_total int not null check (score_total between 0 and 100),
  rating_band text not null,          -- Excellent/Good/Average/Weak/Poor
  layers jsonb not null,              -- {L1:{score,max,confidence,details},...}
  checklist jsonb not null,           -- [{metric,value,verdict:pass|warn|fail,explanation}]
  red_flags jsonb not null default '[]',
  ai_summary text,
  sources jsonb not null default '[]',-- [{name,url,used_for}]
  model_meta jsonb,                   -- {llm:"gemini-2.0-flash", version:"1.0"}
  created_at timestamptz default now(),
  expires_at timestamptz not null     -- created_at + 24h
);
create index on analysis_reports (ticker, expires_at);

create table news_items (
  id uuid primary key default gen_random_uuid(),
  ticker text not null,
  title text not null,
  url text not null,
  source text,
  published_at timestamptz,
  sentiment text check (sentiment in ('positive','neutral','negative')),
  fetched_at timestamptz default now(),
  unique(ticker, url)
);
create index on news_items (ticker, published_at desc);

create table filings_log (
  id uuid primary key default gen_random_uuid(),
  ticker text,
  filing_type text,                   -- result|announcement|annual_report|concall
  title text,
  url text not null,
  processed boolean default false,
  fetched_at timestamptz default now(),
  unique(url)
);

-- ===== ADMIN / MONITORING TABLES =====

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  role text not null default 'user' check (role in ('user','admin')),
  created_at timestamptz default now()
);

create table job_runs (
  id uuid primary key default gen_random_uuid(),
  job_name text not null,             -- news_cron|fundamentals_cron|filings_cron|deep_health
  status text not null check (status in ('running','success','failed')),
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  duration_ms int,
  rows_processed int default 0,
  error text
);
create index on job_runs (job_name, started_at desc);

create table system_checks (
  id uuid primary key default gen_random_uuid(),
  component text not null,            -- api|database|scraper|gemini|groq|news_rss|screener|bse
  status text not null check (status in ('ok','degraded','down')),
  latency_ms int,
  detail text,
  checked_at timestamptz default now()
);
create index on system_checks (component, checked_at desc);

create table scrape_logs (
  id uuid primary key default gen_random_uuid(),
  source text not null,               -- screener|bse|google_news|company_ir
  url text not null,
  status text not null check (status in ('success','failed')),
  http_code int,
  bytes int,
  duration_ms int,
  error text,
  created_at timestamptz default now()
);
create index on scrape_logs (source, created_at desc);

create table llm_usage (
  id uuid primary key default gen_random_uuid(),
  provider text not null,             -- gemini|groq
  model text not null,
  purpose text not null,              -- moat|redflags|outlook|sentiment|summary
  tokens_in int default 0,
  tokens_out int default 0,
  latency_ms int,
  fallback boolean default false,
  created_at timestamptz default now()
);
create index on llm_usage (created_at desc);

create table audit_log (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid references auth.users(id),
  action text not null,               -- invalidate_cache|force_reanalyze|run_job|retest_scraper
  target text,
  meta jsonb,
  created_at timestamptz default now()
);
```

RLS policies: watchlists/portfolios → `user_id = auth.uid()` for select/insert/update/delete. stock_fundamentals, analysis_reports, news_items, filings_log → read allowed for all authenticated users; writes only by service role key (backend). profiles → user reads own row only; role changes only via service key. job_runs, system_checks, scrape_logs, llm_usage, audit_log → SELECT restricted to admins (policy: exists (select 1 from profiles where id = auth.uid() and role='admin')); writes only by service key.

---

## 4B. AUTH & ROLE LOGIC

### 4B.1 Request auth flow
1. Frontend sends Supabase JWT in `Authorization: Bearer <jwt>`.
2. Backend verifies JWT via Supabase Auth (server-side, every request).
3. Backend loads profiles.role. Dependency `require_user` for all /api/*; dependency `require_admin` for /api/admin/* (returns 403 {"error":"admin only"} if role != 'admin').

### 4B.2 Admin bootstrap
- On signup trigger (Supabase webhook or first-login check): if user email in ADMIN_EMAILS env → insert profiles row with role='admin', else 'user'.
- No public endpoint can set roles. Role changes only via Supabase dashboard or service key.

## 5. API SPEC (FastAPI; base prefix /api)

| Method | Endpoint | Auth | Request | Response (200) |
|--------|----------|------|---------|----------------|
| GET | /api/health | no | — | {"ok": true} |
| GET | /api/search?q=reliance | yes | query | [{ticker, name, exchange}] (top 10, from static NSE-500 list + yfinance search) |
| GET | /api/watchlist | yes | — | [{ticker, name, last_price, day_change_pct, score_total|null}] |
| POST | /api/watchlist | yes | {ticker} | 201 created |
| DELETE | /api/watchlist/{ticker} | yes | — | 204 |
| GET | /api/research/{ticker} | yes | — | Full report JSON (see §5.1). Serves cache if expires_at > now |
| POST | /api/research/{ticker}/refresh | yes | — | Forces recompute, returns fresh report |
| GET | /api/chart/{ticker}?period=6m\|1y\|5y | yes | — | {candles:[{time,open,high,low,close}], volumes:[{time,value,color}]} |
| GET | /api/news/{ticker} | yes | — | [{title,url,source,published_at,sentiment}] (10 latest) |
| GET/POST/DELETE | /api/portfolio[...] | yes | portfolio CRUD | per schema |
| GET | /api/compare?a=X&b=Y | yes | — | {a: report, b: report} (P1) |

### 5.1 Research Report JSON (exact shape)

```json
{
  "ticker": "RELIANCE.NS",
  "company_name": "Reliance Industries Ltd",
  "price": {"last": 2450.5, "day_change_pct": 1.2, "currency": "INR"},
  "score_total": 78,
  "rating_band": "Good",
  "layers": {
    "L1": {"name":"Business Quality","score":12,"max":15,"confidence":"high",
           "details":{"moat":"Narrow Moat","business_one_liner":"...","margin_stability":"stable"}},
    "L2": {"name":"Financial Strength","score":20,"max":25,"confidence":"high",
           "details":{"roe_5y":14.2,"roce_5y":13.1,"de_ratio":0.44,"fcf_positive_years":4}},
    "L3": {"name":"Valuation","score":10,"max":15,"confidence":"high",
           "details":{"pe":24.1,"industry_pe":26.0,"peg":1.4,"pb":2.1,"pe_band_position":"mid"}},
    "L4": {"name":"Governance","score":16,"max":20,"confidence":"medium",
           "details":{"promoter_holding":50.3,"promoter_trend":"stable","pledge_pct":0.0,"fii_dii_trend":"rising"}},
    "L5": {"name":"Growth","score":12,"max":15,"confidence":"medium",
           "details":{"revenue_cagr_5y":11.8,"profit_cagr_5y":12.4,"outlook":"Positive","outlook_confidence":"medium"}},
    "L6": {"name":"Technicals","score":8,"max":10,"confidence":"high",
           "details":{"above_ma200":true,"above_ma50":true,"rsi14":58.2,"wk52_position":0.62,"volume_trend":"rising"}}
  },
  "checklist": [
    {"layer":"L2","metric":"ROE (5-yr avg)","value":"14.2%","verdict":"warn","explanation":"Good but below the 15% top-investor threshold."}
  ],
  "red_flags": [],
  "ai_summary": "150-word plain-English summary with [1][2] citations…",
  "sources": [{"name":"Screener.in","url":"...","used_for":"L2,L3,L4"}],
  "disclaimer": "<exact disclaimer from Golden Table>",
  "last_analyzed": "2026-09-04T10:00:00+05:30",
  "cached": true
}
```

verdict enum: pass | warn | fail. confidence enum: high | medium | low.

### 5.2 Admin API (all under /api/admin, require_admin)

| Method | Endpoint | Returns |
|--------|----------|---------|
| GET | /api/admin/overview | {components:[{component,status,latency_ms,last_ok,detail}], totals:{users,tickers_tracked,reports_24h,news_24h}} |
| GET | /api/admin/jobs | [{job_name,last_status,last_started,last_finished,duration_ms,rows_processed,error,next_run}] |
| POST | /api/admin/jobs/{job_name}/run | 202 {run_id} — executes async, writes job_runs + audit_log |
| GET | /api/admin/scrapers | [{source,success_rate_24h,avg_latency_ms,last_success,last_error,items_today}] |
| GET | /api/admin/llm | {providers:[{provider,requests_today,tokens_in_today,tokens_out_today,quota_pct,avg_latency_ms,fallback_events}]} |
| GET | /api/admin/algorithm/test | Runs §5.4 sanity test → {status:"PASS\|FAIL", expected, actual, diff, ran_at} |
| GET | /api/admin/algorithm/distribution | {bands:{Excellent:n,Good:n,Average:n,Weak:n,Poor:n}, avg_score, reports_total} |
| GET | /api/admin/data-quality | {tickers_with_missing:[{ticker,missing_fields}], partial_reports, stale_cache, failed_tickers} |
| GET | /api/admin/users | {total, signups_7d, active_7d, watchlist_adds_7d, research_requests_24h, list:[{email,joined,stocks_count}]} (no passwords) |
| GET | /api/admin/reports?limit=50 | latest reports list; GET /api/admin/reports/{id} → full report JSON |
| POST | /api/admin/cache/invalidate {ticker} | sets expires_at=now; audit_log entry |
| POST | /api/admin/reports/{ticker}/reanalyze | force fresh pipeline run; audit_log entry |

### 5.3 Deep health check (used by overview + deep_health cron every 15 min)
Each probe returns {component,status,latency_ms,detail} and writes system_checks:
- api: self GET /api/health
- database: `select 1` via supabase
- scraper: GET {CRAWL4AI_URL}/health (10s timeout)
- gemini: 20-token ping completion
- groq: 20-token ping completion
- news_rss: fetch Google News RSS for 'nifty' → >=1 item
- screener: fetch screener.in/company/RELIANCE/consolidated/ → HTTP 200 (respect 2s limit, cache result 15 min)
- bse: fetch bseindia.com announcements page → HTTP 200
Status rules: ok = success within timeout; degraded = success but >2x normal latency or 1 retry; down = failure. detail = one-line plain English, e.g. "Gemini quota 82% used — fallback to Groq likely".

### 5.4 Algorithm sanity test (proves scoring correctness)
- Fixture: tests/fixtures/reliance_sample.json — frozen inputs (fundamentals, shareholding series, prices, announcements, LLM stub outputs) + expected_output {score_total, layers L1..L6 scores}.
- /api/admin/algorithm/test runs scoring.py on fixture with LLM mocked → compares → PASS if exact, else FAIL with per-layer diff.
- Also runs in CI and on every deploy. tests/test_scoring.py includes this fixture case.

---

## 6. SCORING ENGINE (deterministic — implement EXACTLY)

### 6.1 L2 Financial Strength (25 pts) — pure math
| Metric | Points | pass | warn | fail |
|--------|-------|------|------|------|
| ROE 5y avg | 4 | ≥15% | 10–15% (2) | <10% (0) |
| ROCE 5y avg | 4 | ≥15% | 10–15% (2) | <10% (0) |
| Debt-to-Equity | 4 | <0.5 | 0.5–1.0 (2) | >1.0 (0) |
| FCF positive years (of 5) | 3 | ≥4 | 2–3 (1.5) | <2 (0) |
| Operating margin trend 5y | 3 | rising/stable | — (1.5 flat±2pp) | declining (0) |
| Interest coverage | 3 | >4 | 2–4 (1.5) | <2 (0) |
| Revenue CAGR 5y | 2 | ≥12% | 5–12% (1) | <5% (0) |
| Profit CAGR 5y | 2 | ≥12% | 5–12% (1) | <5% (0) |

### 6.2 L3 Valuation (15 pts)
| Metric | Points | rule |
|--------|-------|------|
| PE vs industry median | 5 | ≤ industry (5) | ≤1.25× (3) | >1.25× (1) |
| PEG | 4 | <1 (4) | 1–2 (2) | >2 (0); PEG = PE / profit CAGR 5y%; if CAGR ≤0 → 0 |
| PB vs sector | 3 | ≤ sector (3) | ≤1.5× (1.5) | > (0) |
| PE band position (5y own range) | 3 | bottom third (3) | middle (1.5) | top third (0) |

### 6.3 L6 Technicals (10 pts)
| Metric | Points | rule |
|--------|-------|------|
| Price vs MA200 | 3 | above (3) else 0 |
| Price vs MA50 | 2 | above (2) else 0 |
| RSI-14 | 3 | 40–70 (3) | 30–40 or 70–80 (1.5) | <30 or >80 (0; note added) |
| 52-wk position (0–1) | 2 | ≤0.5 (2) | 0.5–0.8 (1) | >0.8 (0) |

### 6.4 L4 Governance (20 pts)
| Metric | Points | rule |
|--------|-------|------|
| Promoter pledging | 6 | 0% (6) | 0–10% (4) | 10–30% (1) | >30% (0 + critical red flag) |
| Promoter holding trend (4 qtrs) | 5 | stable/rising (5) | falling <2pp (3) | falling ≥2pp (0 + red flag) |
| Promoter holding level | 3 | ≥50% (3) | 25–50% (2) | <25% (1) |
| FII+DII trend | 3 | rising (3) | flat (1.5) | falling (0) |
| Announcement red-flag scan (90d) | 3 | none (3) | 1 minor (1.5) | any major (0 + red flag) |
Major keywords: "auditor resignation", "resignation of statutory auditor", "SEBI order", "fraud", "qualified opinion", "default", "pledge invocation", "arrest".

### 6.5 L1 Business Quality (15 pts)
| Component | Points | method |
|-----------|-------|--------|
| Moat classification | 8 | LLM on Screener description + latest AR MD&A: Strong(8)/Narrow(5)/None(2) |
| Margin stability (5y gross margin stdev) | 4 | stdev <3pp (4) | 3–6pp (2) | >6pp (0) |
| Business clarity (LLM produces valid one-liner + revenue segments found) | 3 | found (3) else (1) |

### 6.6 L5 Growth (15 pts)
| Component | Points | rule |
|-----------|-------|------|
| Revenue CAGR 5y | 4 | ≥15% (4) | 10–15% (3) | 5–10% (1.5) | <5% (0) |
| Profit CAGR 5y | 4 | same bands |
| Latest quarter YoY profit growth | 3 | >10% (3) | 0–10% (1.5) | <0% (0) |
| LLM outlook from latest results/concall | 4 | Positive (4) | Neutral (2) | Negative (0) |

### 6.7 Total, band, confidence
- score_total = round(sum of all layers). Band per Golden Table.
- confidence rules: high = all inputs present; medium = 1–2 inputs missing or LLM with thin sources; low = ≥3 missing (UI shows ⚠️ "limited public data").
- Missing numeric input → 0 points for that metric + checklist verdict "warn" + explanation "data unavailable".

---

## 7. LLM INTEGRATION (exact prompts — do not improvise)

Provider order: Gemini 2.0 Flash → on failure/rate-limit → Groq llama-3.1-8b-instant. Timeout 30s, retry 2x. Temperature 0.2. All prompts demand JSON output validated by pydantic; on parse failure → one repair retry → else confidence=low + safe default.

### 7.1 Moat classification (L1)
```
System: You are a conservative equity research assistant. Answer ONLY from the SOURCE TEXT. Cite evidence. Output strict JSON.
User: SOURCE TEXT:\n{business_description}\n{mdna_excerpt}\n\nClassify the company's economic moat.
Output JSON: {"moat":"Strong Moat|Narrow Moat|No Moat","evidence":["..."],"business_one_liner":"...","confidence":"high|medium|low"}
```

### 7.2 Governance red-flag scan (L4)
```
System: You scan Indian corporate announcements for governance red flags. Only flag items explicitly present. Output strict JSON.
User: ANNOUNCEMENTS (last 90 days):\n{titles_and_dates}\n\nFlag any of: auditor resignation, SEBI/regulatory order, fraud, qualified audit opinion, debt default, pledge invocation, key-person arrest.
Output JSON: {"red_flags":[{"type":"...","title":"...","date":"...","severity":"minor|major"}],"confidence":"high|medium|low"}
```

### 7.3 Growth outlook (L5)
```
System: Conservative analyst. Only use SOURCE TEXT. Output strict JSON.
User: LATEST RESULT/CONCALL EXCERPTS:\n{text}\n\nSummarize forward outlook for a long-term investor.
Output JSON: {"outlook":"Positive|Neutral|Negative","key_points":["..."],"confidence":"high|medium|low"}
```

### 7.4 News sentiment (batch)
```
Classify each headline for long-term investor impact. JSON array only:
[{"i":0,"sentiment":"positive|neutral|negative"}]
HEADLINES:\n{numbered_titles}
```

### 7.5 Final AI summary (150 words max, plain English, must reference numbers from the computed layers and cite sources [1][2] mapped to sources array; must end with the exact disclaimer sentence from Golden Table).

---

## 8. PIPELINES & JOBS

### 8.1 Research pipeline (trigger: GET /api/research/{ticker} cache-miss or /refresh)
```
1. fetch_fundamentals(ticker)   # yfinance info+statements  [→ stock_fundamentals]
2. fetch_screener(ticker)       # crawl4ai, parse: ratios table, quarterly, shareholding
3. compute L2, L3, L6           # pandas, §6
4. compute L4 math parts        # shareholding/pledging
5. llm: moat (L1), red flags (L4), outlook (L5)   # §7, with latest docs from filings_log
6. assemble checklist + score   # §6
7. llm: final summary           # §7.5
8. insert analysis_reports (expires_at = now + 24h)
Target <20s. Wrap each step in try/except → on failure mark metric missing (§6.7), never crash the whole report.
```

### 8.2 News cron (every 15 min, VM crontab)
- For each distinct ticker in watchlists: fetch Google News RSS → dedupe by URL → sentiment via §7.4 (batch 20/call) → insert news_items (keep latest 50/ticker).

### 8.3 Fundamentals cron (daily 18:00 IST)
- Refresh stock_fundamentals + screener snapshot for all watchlisted tickers. Respect 2s Screener delay.

### 8.4 Announcements cron (hourly)
- Fetch BSE announcements page for watchlisted companies → new URLs → filings_log → if filing_type in (result, concall, annual_report): download PDF → Docling → store text excerpt (max 8k chars) for LLM use → invalidate analysis cache for that ticker (set expires_at = now).

---

## 9. FRONTEND NOTES (for the coding agent)

- Routes per PRD §6.1. shadcn/ui components: Card, Tabs, Badge, Progress (layer bars), Skeleton, Dialog, Toast.
- The composite score MUST be labeled "Quality Score" in the UI (never "Buy/Sell/Hold" — see Golden Table forbidden words).
- Score gauge: radial SVG, emerald gradient stroke, 64px number (Fraunces), with rating band label under it.
- Chart: lightweight-charts v4 — candlestickSeries (upColor #10B981, downColor #EF4444), volume histogram overlay, MA50/MA200 line series toggle, timeframes 6M/1Y/5Y from /api/chart. Footer text: "Charts by TradingView Lightweight Charts™".
- Verdict chips: pass=emerald ✅, warn=amber ⚠️, fail=red ❌.
- Loading state during fresh research: multi-step progress ("Fetching financials…", "Reading filings…", "AI analyzing…", "Scoring…").
- Block display of any string matching forbidden words list (Golden Table) in AI output — server-side sanitizer replaces with neutral wording before storing.
- Mobile: bottom tab bar (Dashboard, Research, Portfolio, News).
- Admin pages share the app layout + a sidebar; status cards green #10B981 / amber #F59E0B / red #EF4444; every card shows last-checked timestamp and a "Run now"/"Re-test" action where applicable. /admin/* hidden from non-admins in UI AND enforced by require_admin server-side.

---

## 10. ENVIRONMENT VARIABLES (.env — exact names)

```
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_KEY=
GEMINI_API_KEY=
GROQ_API_KEY=
CRAWL4AI_URL=http://127.0.0.1:8077
ADMIN_EMAILS=you@example.com,partner@example.com
NEXT_PUBLIC_API_URL=http://localhost:8000/api
APP_ENV=dev
```

---

## 11. FOLDER STRUCTURE (monorepo — create exactly)

```
vriddhi/
├── frontend/                  # Next.js
│   ├── app/                   # routes: page.tsx, login/, dashboard/,
│   │                          #   research/[ticker]/, portfolio/, compare/,
│   │                          #   admin/ (page.tsx=overview, pipelines/, scrapers/,
│   │                          #   llm/, algorithm/, data-quality/, users/, reports/)
│   ├── components/            # ui/ (shadcn), ScoreGauge.tsx, LayerBars.tsx,
│   │                          #   ChecklistTable.tsx, StockChart.tsx, NewsCard.tsx,
│   │                          #   RedFlagCard.tsx, Disclaimer.tsx
│   ├── lib/                   # api.ts (fetch wrappers), format.ts, constants.ts
│   └── public/                # logo (tortoise), fonts
├── backend/
│   ├── app/
│   │   ├── main.py            # FastAPI app, CORS, router include
│   │   ├── config.py          # env loading (pydantic-settings)
│   │   ├── db.py              # supabase client (service key, server-only)
│   │   ├── routers/           # research.py, watchlist.py, portfolio.py,
│   │   │                      #   charts.py, news.py, search.py, compare.py, admin.py
│   │   ├── services/
│   │   │   ├── market_data.py # yfinance wrapper + retry
│   │   │   ├── screener.py    # crawl4ai Screener.in parser
│   │   │   ├── filings.py     # BSE announcements + PDF (docling)
│   │   │   ├── news.py        # RSS + sentiment
│   │   │   ├── technicals.py  # MA/RSI/52wk/volume
│   │   │   ├── scoring.py     # §6 engine — pure functions, no I/O
│   │   │   ├── llm.py         # provider chain, JSON validation, sanitizer
│   │   │   ├── report.py      # pipeline orchestration §8.1
│   │   │   ├── monitoring.py  # deep health probes §5.3 + log_job_run wrapper
│   │   │   └── admin.py       # admin aggregations §5.2 (data quality, users, distribution)
│   │   ├── prompts/           # moat.py, governance.py, outlook.py,
│   │   │                      #   sentiment.py, summary.py (exact §7 text)
│   │   └── schemas.py         # pydantic models matching §5.1
│   ├── jobs/                  # news_cron.py, fundamentals_cron.py, filings_cron.py
│   ├── tests/                 # test_scoring.py (MANDATORY), test_api.py
│   └── requirements.txt
└── docs/                      # PRD.md, TRD.md
```

---

## 12. BUILD PHASES (AI agent must follow in order; each phase ends green)

| Phase | Deliverable | Acceptance test |
|-------|-------------|-----------------|
| 0 | Repo + env + Supabase schema applied | `/api/health` 200; tables exist |
| 1 | market_data.py + screener.py + fundamentals cache | RELIANCE.NS fundamentals row written; pytest passes on parser fixtures |
| 2 | scoring.py (L2,L3,L4-math,L6) | `pytest tests/test_scoring.py` — 20+ cases incl. edge (missing data → 0 pts + warn) |
| 3 | llm.py + prompts + L1/L4-scan/L5 | Mocked-LLM unit tests; live smoke test on RELIANCE.NS |
| 4 | All routers + report pipeline | `GET /api/research/RELIANCE.NS` <20s, matches §5.1 schema, cache hit <500ms |
| 5 | Frontend all pages + chart | Dashboard→Research flow works; forbidden-words check on UI snapshot test |
| 6 | Cron jobs running | news_items rows appear within 20 min; filings poll logs OK |
| 7 | Auth + RLS + polish + deploy | User A cannot read User B watchlist; live URL works on mobile |
| 8 | Admin panel (8 pages + admin APIs + monitoring tables) | Non-admin gets 403 on /api/admin/*; overview shows 8 component statuses; sanity test returns PASS; run-now button creates job_runs row + audit_log entry |

---

## 13. TESTING REQUIREMENTS

- `test_scoring.py` mandatory: every band boundary (e.g., ROE 14.9→2pts, 15.0→4pts), PEG with negative growth → 0, pledge 30.1% → 0 + critical flag, missing inputs → warn, plus the §5.4 fixture test (tests/fixtures/reliance_sample.json → expected_output exact match).
- `test_admin.py` mandatory: non-admin JWT → 403 on every /api/admin/* endpoint; admin JWT → 200; role-escalation attempt via API → still 403.
- Sanitizer test: feed LLM text containing "buy this stock" → stored summary must NOT contain forbidden words.
- API contract test: response validates against §5.1 pydantic schema.
- Load smoke: 5 parallel research requests → no crash, each <25s.

---

## 14. DEPLOYMENT

Primary (VM): pm2 run uvicorn on 8000 + Next.js on 3000; Caddy routes:
- qhwtygxg.gensparkclaw.com → frontend:3000
- qhwtygxg.gensparkclaw.com/api/* → backend:8000
Backup (Heroku Basic $7 via credits): container stack, Dockerfile runs uvicorn on $PORT (see /heroku-crawl4ai pattern).
Crontab (VM):
```
*/15 * * * * cd /app/backend && python jobs/news_cron.py
*/15 * * * * cd /app/backend && python jobs/deep_health_cron.py
0 18 * * *  cd /app/backend && python jobs/fundamentals_cron.py
0 * * * *   cd /app/backend && python jobs/filings_cron.py
```
Every job MUST use the monitoring.log_job_run(job_name) wrapper so each run lands in job_runs (status, duration, rows, error) — this powers /admin/pipelines.

---

## 15. KNOWN LIMITATIONS (accept, document in README)
- Prices up to 15-min delayed (yfinance).
- Small-cap data gaps → partial report badge.
- LLM qualitative layers are estimates with confidence labels.
- Single-dyno/VM MVP capacity ~20 concurrent users.
