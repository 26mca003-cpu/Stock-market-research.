# PRD — Product Requirements Document
# Project: VRIDDHI (वृद्धि)
# AI-Powered Long-Term Investor Research Platform for Indian Stocks
# Version: 1.0 | Date: 2026-09-04 | Status: FINAL (verified 3x)

---

## 1. PRODUCT OVERVIEW

### 1.1 One-Line Description
Vriddhi is a free, AI-powered web platform that gives Indian retail investors institutional-grade, long-term stock research — automatically analyzing any NSE/BSE stock across 6 professional layers and producing a simple Quality Score with a full evidence report.

### 1.2 Vision Statement
"Give every Indian retail investor the same research quality that costs ₹50,000/year on institutional terminals — free, instant, and in simple language."

### 1.3 The Problem
- India has 15+ crore retail investors; 90% lose money because they invest without research.
- Institutional-grade research (fundamental analysis, governance checks, document reading) is expensive, complex, and English-jargon-heavy.
- Existing free tools (Screener.in, Tickertape) show raw data but don't EXPLAIN it, don't READ documents, and don't combine everything into one clear verdict.
- Investors rely on WhatsApp tips and YouTube — no tool checks their specific stock across all dimensions in one click.

### 1.4 The Solution
User adds a stock to their watchlist → clicks "Research" → within ~15 seconds, Vriddhi produces:
1. A 6-layer analysis report (Business Quality, Financial Strength, Valuation, Governance, Growth, Technicals)
2. A composite Quality Score (0–100) with rating band
3. Per-metric pass/fail checklist (✅/⚠️/❌) with plain-language explanations
4. Latest news with AI sentiment summary
5. Professional candlestick charts
6. AI-generated plain-English summary (with Hindi/Gujarati option)

### 1.5 Legal Positioning (CRITICAL — SEBI Compliance)
- Vriddhi NEVER displays "Buy", "Sell", or "Hold" recommendations.
- Output is framed as: Quality Score, analysis checklist, and educational insights.
- Every report page shows this exact disclaimer:
  "Vriddhi is an educational research tool, not investment advice. Data sourced from public filings and may be delayed or inaccurate. Consult a SEBI-registered investment advisor before investing."
- Reason: SEBI regulations require RIA/RA registration to give buy/sell/hold recommendations in India. Scores + educational framing keep the product legal.

---

## 2. TARGET USERS & PERSONAS

### 2.1 Primary Persona: "Retail Rohan" (22–35)
- Salaried Indian, invests ₹5–50k/month via Zerodha/Groww
- Wants long-term wealth, doesn't know how to analyze stocks
- Uses WhatsApp tips; fears losing money
- Needs: "Is this stock good for 5+ years? Explain simply."

### 2.2 Secondary Persona: "Student Sneha" (18–25)
- College student learning investing
- Wants to understand WHY a stock is good/bad
- Needs: educational explanations, not just numbers

### 2.3 Hackathon Persona: "Judge"
- Sees demo: add RELIANCE → Research → full report in 15 seconds
- Needs: wow factor, real impact story, working product

### 2.4 Admin Persona: "Operator Omi" (the product owner — YOU)
- Runs the platform, must know instantly if anything breaks
- Needs one screen answering: "Is my website working? Is data fresh? Are algorithms correct? Is scraping alive?"
- Needs proof, not guesses: every number in admin panel backed by logs/timestamps
- Must be able to fix common issues with one click (re-run job, invalidate cache)

---

## 3. THE 6-LAYER ANALYSIS MODEL (Product Spec)

Every stock report contains exactly these 6 layers, always in this order:

| # | Layer | Weight (of 100) | Automated By |
|---|-------|------------------|--------------|
| L1 | Business Quality | 15 | LLM (moat classification from annual report text) + margin-stability math |
| L2 | Financial Strength | 25 | Deterministic ratio computation (no LLM) |
| L3 | Valuation | 15 | Deterministic (PE/PEG/PB vs industry + PE bands) |
| L4 | Management & Governance | 20 | Shareholding data (math) + LLM red-flag scan of filings |
| L5 | Growth Story | 15 | Historical CAGR (math) + LLM concall/results summary |
| L6 | Technicals | 10 | Deterministic (MA200, RSI, 52-week position, volume) |
| — | TOTAL | 100 | — |

### 3.1 Layer Detail & Metrics

**L1 — Business Quality (15 pts)**
- Moat type classification: Strong Moat / Narrow Moat / No Moat (LLM, from business description + MD&A)
- Margin stability: gross margin variance over 5 years (math)
- Business simplicity: LLM one-line "how this company makes money"
- Output: sub-score 0–15 + moat label + plain-English business explanation

**L2 — Financial Strength (25 pts)** — ALL deterministic:
| Metric | Full points | Partial | Zero |
|--------|------------|---------|------|
| ROE (5-yr avg) | ≥15% | 10–15% | <10% |
| ROCE (5-yr avg) | ≥15% | 10–15% | <10% |
| Debt-to-Equity | <0.5 | 0.5–1.0 | >1.0 |
| Free Cash Flow | Positive 4/5 years | 2–3/5 years | <2/5 |
| Operating Margin trend | Stable/rising 5 yrs | Flat | Declining |
| Interest Coverage | >4x | 2–4x | <2x |
| Revenue CAGR (5yr) | ≥12% | 5–12% | <5% |
| Profit CAGR (5yr) | ≥12% | 5–12% | <5% |

**L3 — Valuation (15 pts)**
- Current PE vs industry median PE (below = good)
- PEG ratio (<1 excellent, 1–2 ok, >2 poor)
- PB ratio vs sector norm
- Historical PE band: current PE position within own 5-year range (bottom third = good)

**L4 — Management & Governance (20 pts)**
- Promoter holding: ≥50% & stable/rising = best; falling 3 quarters = red flag
- Promoter pledging: 0% = best; >10% = red flag; >30% = critical flag
- FII+DII trend over 4 quarters (rising = good)
- LLM red-flag scan of last 90 days announcements: auditor resignation, SEBI order, qualified audit opinion, fraud keywords
- Output: sub-score + explicit red-flag list (empty list = clean)

**L5 — Growth Story (15 pts)**
- Revenue/EPS CAGR 3yr & 5yr (math)
- Latest quarter YoY growth (math)
- LLM summary of latest concall/results: management guidance, capacity expansion, order book
- Forward outlook label: Positive / Neutral / Negative (LLM, with confidence: high/medium/low)

**L6 — Technicals (10 pts)**
- Price vs 200-day MA (above = uptrend)
- Price vs 50-day MA
- RSI-14 (30–70 healthy; >80 overbought penalty; <30 opportunity note)
- 52-week range position (closer to low = better entry zone for long-term)
- Volume trend (30-day avg vs 90-day avg)

### 3.2 Composite Score & Rating Bands
- Total = sum of 6 layer sub-scores (0–100)
- Bands: 80–100 "Excellent Quality" | 65–79 "Good Quality" | 50–64 "Average" | 35–49 "Weak" | 0–34 "Poor Quality"
- Display: big number + colored gauge + band label. NEVER "buy/sell/hold" words.

### 3.3 Data Confidence Label
- Each LLM-produced layer (L1, L4-redflags, L5-summary) carries confidence: high / medium / low
- Confidence = amount of source data found (rules in TRD)
- Low-confidence items displayed with ⚠️ and "limited public data" note — never guessed.

---

## 4. CORE FEATURES (MoSCoW Priority)

### P0 — MUST HAVE (MVP, hackathon demo)
1. **User auth** — email signup/login (Supabase Auth)
2. **Watchlist** — add/remove NSE tickers, see live price + day change
3. **Research button** — runs 6-layer analysis, shows full report page
4. **Quality Score display** — gauge + band + per-layer bars
5. **Checklist view** — every metric with ✅/⚠️/❌ + one-line plain-English explanation
6. **Candlestick chart** — 6M/1Y/5Y periods, volume bars, green/red
7. **News feed per stock** — latest 10 news with AI sentiment (positive/neutral/negative)
8. **AI plain-English summary** — 150-word "should a long-term investor care about this company" summary with citations
9. **SEBI disclaimer** on every report
10. **24h analysis cache** — repeat views instant

### P1 — SHOULD HAVE (post-MVP week 1–2)
11. **Portfolio** — add holdings (qty + avg buy price), P&L, per-holding score, portfolio health (sector concentration warning)
12. **Hindi/Gujarati summary toggle**
13. **Compare 2 stocks** side-by-side scores
14. **Alerts** — new filing/result on watchlist stock → in-app notification
15. **PDF export** of research report

### P2 — NICE TO HAVE (later)
16. Screener page (filter all stocks by score)
17. WhatsApp alerts
18. Bias insights from uploaded trade history (BiasBuster module)
19. IPO Lens module (DRHP red-flag analyzer)

---

## 4A. ROLES & ADMIN PANEL (Product Spec)

### 4A.1 Roles
- Exactly 2 roles (stored as enum): **'user'** (default) and **'admin'**.
- `user`: all features in §4. Default role on signup.
- `admin`: everything a user can do + the Admin Panel. Assigned manually (see TRD §4B.2 bootstrap).
- Role is enforced **server-side on every request** — never trust the frontend.

### 4A.2 Admin Panel Purpose
One mission: **prove the platform is healthy and correct** — or show exactly what is broken, where, since when, and let admin fix it in one click. If a judge or user asks "is the data right?", the admin panel is the evidence.

### 4A.3 Admin Panel Pages (all under /admin, admin-only)

| Page | Route | Shows | Answers the question |
|------|-------|-------|----------------------|
| **Overview** | /admin | Status cards: API, Database, Scraper, LLM, News cron, Fundamentals cron, Filings cron — each green/red with last-checked time + latency | "Is my website working RIGHT NOW?" |
| **Pipelines** | /admin/pipelines | Every cron job: last run time, duration, success/fail, rows processed, error message if failed, next scheduled run + **"Run now"** button | "Are all automated steps working?" |
| **Scrapers** | /admin/scrapers | Per-source health (Screener.in, BSE, Google News): success rate 24h, avg response time, last success, last failure reason, items scraped today | "Is data extraction working? What is being scraped?" |
| **AI / LLM** | /admin/llm | Per provider (Gemini, Groq): requests today, tokens in/out today, estimated quota usage %, fallback events, avg latency | "Is the AI working and within free limits?" |
| **Algorithm Check** | /admin/algorithm | **"Run sanity test"** button: scoring engine runs against a known fixture dataset with a known expected score → PASS/FAIL + diff. Also shows score distribution of all reports generated | "Are the algorithms calculating correctly?" |
| **Data Quality** | /admin/data-quality | Tickers with missing fields (which field, which ticker), partial reports count, stale cache count, failed tickers list | "Is the information shown to users complete and right?" |
| **Users** | /admin/users | Total users, signups/day, active users 7d, watchlist adds, research requests/day. Read-only list (email, joined, #stocks). No password/personal data shown | "Is the product being used?" |
| **Reports** | /admin/reports | Latest 50 analysis reports: ticker, score, band, confidence, time taken, sources used, **"view JSON"** — the raw evidence behind every score | "What did the system tell users? Prove it." |
| **Actions** | (buttons on pages) | Invalidate cache for ticker, force re-analyze ticker, re-run any cron job, re-test scraper source | "Fix it in one click" |

### 4A.4 Admin Rules
- Admin panel is **read-mostly**: it shows evidence; mutations only via explicit action buttons (each writes an audit log entry: who, what, when).
- Every status card shows: status (🟢/🔴), last success timestamp, latency ms, and a one-line plain-English explanation.
- Admin page access: non-admin visiting /admin → redirect to /dashboard (no error leak).
- All admin APIs return 403 for non-admins (server-enforced).

---

## 5. USER FLOWS (Exact, Step-by-Step)

### Flow A — New User First Visit
1. Lands on homepage → sees hero: "Institutional-grade stock research. Free. In 15 seconds."
2. Clicks "Get Started" → email signup (Supabase Auth)
3. Lands on Dashboard (empty state: "Add your first stock")
4. Clicks "+ Add Stock" → types "Reliance" → autocomplete suggests "RELIANCE.NS — Reliance Industries"
5. Stock appears in watchlist with live price
6. Clicks "🔬 Research" → loading screen with progress steps ("Fetching financials… Reading filings… AI analyzing…")
7. Report page appears: score gauge top, 6 layer cards, checklist, chart, news, AI summary
8. Disclaimer visible at bottom

### Flow B — Returning User Quick Check
1. Login → Dashboard shows watchlist with mini-scores (from cache)
2. Clicks a stock → report opens instantly (cached <24h)
3. Sees "Last analyzed: 4 hours ago" + "Refresh" button

### Flow C — Portfolio Health (P1)
1. User adds holdings: TCS 10 shares @3500, INFY 5 @1400
2. Portfolio page shows total value, day P&L, per-stock score
3. Warning banner if one sector >40%: "High concentration: 62% in IT sector"

---

## 6. PAGES & UI SPEC

### 6.1 Page List
| Page | Route | Purpose |
|------|-------|---------|
| Landing | / | Hero, how-it-works (3 steps), 6-layer explainer, CTA |
| Auth | /login, /signup | Email auth |
| Dashboard | /dashboard | Watchlist grid + mini scores |
| Research Report | /research/[ticker] | THE core page (full 6-layer report) |
| Portfolio | /portfolio | Holdings + health (P1) |
| Compare | /compare?a=X&b=Y | Side-by-side (P1) |
| Admin (8 pages) | /admin/* | Operations & health — see §4A.3 |

### 6.2 Research Report Page Layout (top → bottom)
1. Header: company name, ticker, current price, day change (green/red)
2. Quality Score gauge (big, center) + rating band label
3. 6 layer sub-score bars (horizontal, labeled L1–L6 with weight)
4. Tabs: [Checklist] [Chart] [News] [Documents] [AI Summary]
   - Checklist: all metrics, ✅/⚠️/❌, plain-English line each
   - Chart: candlestick + volume, period selector 6M/1Y/5Y, MA50/MA200 overlay toggle
   - News: cards with headline, source, time-ago, sentiment chip
   - Documents: list of source documents used (annual report, filings) with links — builds trust
   - AI Summary: 150-word plain English + language toggle (P1)
5. Red flags section (only if any L4 flags) — prominent amber/red card
6. Footer: disclaimer + "Last analyzed: timestamp" + data sources credit

### 6.3 Design System (STRICT — follow exactly)
- **Brand name:** VRIDDHI | **Tagline:** "Research like the top 1%"
- **Style:** Classic-minimal-modern. Reference: Linear, Stripe, Zerodha Kite
- **Colors:**
  - Background: #FAFAF8 (off-white)
  - Surface/cards: #FFFFFF with soft shadow (0 1px 3px rgba(0,0,0,0.06))
  - Primary text: #0F172A (deep navy)
  - Secondary text: #64748B
  - Accent/positive: #10B981 (emerald) — scores, up-moves, ✅
  - Negative: #EF4444 (red) — ONLY for down-moves, ❌, red flags
  - Warning: #F59E0B (amber) — ⚠️ partial/uncertain
  - Borders: #E2E8F0, radius 12px
- **Fonts:** Headlines = Fraunces (serif, classic); UI/body = Inter
- **Components:** rounded-xl cards, generous whitespace, big bold numbers (score = 64px), minimal icons (Lucide)
- **Charts:** Lightweight Charts (TradingView) — upColor #10B981, downColor #EF4444; footer credit "Charts by TradingView Lightweight Charts™"
- **Logo:** tortoise-with-chart-shell concept (emerald), files in /logo-options
- **Motion:** subtle — 200ms ease transitions, skeleton loaders during analysis
- **Mobile:** fully responsive, bottom tab bar on mobile

---

## 7. NON-FUNCTIONAL REQUIREMENTS

| Requirement | Target |
|-------------|--------|
| Research report generation | <20 seconds (fresh), <500ms (cached) |
| Page load | <2s on 4G |
| Uptime | 99% (VM + PM2; Heroku backup) |
| Data freshness | Prices: 15-min delayed OK; Fundamentals: daily; News: 15 min; Analysis cache: 24h |
| Concurrent users (MVP) | 20 simultaneous OK |
| Security | HTTPS everywhere, Supabase RLS (users see only own data), API key on scraper |
| Legal | SEBI disclaimer on every report; no buy/sell/hold language; sources credited |
| Cost | ₹0/month (all free tiers) |

---

## 8. SUCCESS METRICS

- Demo: judge adds any NSE stock → report in <20s (must never crash)
- Analysis completes successfully for 90%+ of NSE-500 stocks
- Every score backed by visible evidence (documents/metrics) — no black box
- User test: a non-finance student understands the report without help

---

## 9. OUT OF SCOPE (MVP)

- Real-money trading/orders (never)
- Intraday/F&O features
- Recommendations/advice language (SEBI)
- Mutual funds, crypto, US stocks
- Real-time tick-by-tick data

---

## 10. RISKS & MITIGATIONS

| Risk | Mitigation |
|------|-----------|
| Free data gaps on small-caps | "Partial report" badge; show what's available |
| LLM hallucination | RAG-only answers with citations; deterministic math for all numbers; confidence labels |
| SEBI legal issue | Scores + educational framing + disclaimer; no buy/sell words |
| Scraper blocked | Screener.in rate-limit 2s; BSE polite hourly; Google News RSS primary for news |
| Gemini free limit (1M tokens/day) | 24h cache = each stock analyzed once/day; Groq fallback |
