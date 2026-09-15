# Vriddhi — AI Stock Research Platform

> Explainable, educational stock research for Indian retail investors.

## Team

| Field | Value |
|---|---|
| Team Name | Vriddhi |
| Track | AI |
| Team Lead | Dharsandiya Prit Dilipbhai — 26mca003@charusat.edu.in |
| Members | Dhruv Joshi Rahul, Nanda Bhavya, Devani Kunj Dipakbhai |

## Problem Statement

Indian retail investors must combine delayed market data, financial statements, corporate filings, news, and technical indicators across disconnected sources. This makes research slow and inconsistent and increases the risk of missing governance or financial-quality signals.

## Solution

Vriddhi brings Indian-stock research into one workflow. Its FastAPI backend gathers public market and filing data, applies a transparent six-layer scoring framework, and produces sanitized educational research that the Next.js dashboard presents with traceable metrics and disclaimers.

## Key Features

- Six-layer scoring across business quality, financial strength, valuation, governance, growth, and technical setup.
- Market data, news, corporate announcements, and filing extraction in one workflow.
- Optional AI-assisted summaries with output sanitization and educational disclaimers.
- Interactive research dashboard with charts, score bands, red flags, comparisons, watchlists, and portfolios.
- Scheduled ingestion jobs and caching to reduce repeated upstream requests.

## Tech Stack

| Category | Technologies |
|---|---|
| Languages | Python, TypeScript, SQL |
| Frameworks | FastAPI, Next.js, React, Tailwind CSS |
| Data and AI | yfinance, Supabase/PostgreSQL, Google Gemini API, Groq API |
| Deployment | Vercel, Render, Genspark AI, cron-job.org |

## Repository Structure

```text
├── src/
│   ├── backend/              # FastAPI API, scoring, ingestion, and tests
│   └── frontend/             # Next.js dashboard
├── docs/
│   ├── problem-statement.md
│   ├── solution-overview.md
│   ├── architecture.md
│   ├── setup-guide.md
│   └── team.md
├── demo/
│   ├── screenshots/
│   ├── demo-video-link.txt
│   └── live-demo-url.txt
├── presentation/
└── submission.yaml
```

## How to Run

See [`docs/setup-guide.md`](docs/setup-guide.md) for the complete setup and test commands.

```bash
# Backend
cd src/backend
python -m venv .venv
.venv\\Scripts\\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000

# Frontend, in a second terminal
cd src/frontend
npm install
npm run dev
```

Open `http://localhost:3000`.

Run backend tests from `src/backend` with `pytest -v`.

## Demo Artifacts

| Artifact | Location |
|---|---|
| Demo video | [`demo/demo-video-link.txt`](demo/demo-video-link.txt) |
| Live demo | [`demo/live-demo-url.txt`](demo/live-demo-url.txt) |
| Project photos | [Google Drive folder](https://drive.google.com/drive/folders/1iW9uNCMlKc1lek__hjHFoS3TfmvBm50C?usp=sharing) |
| Presentation | [`presentation/`](presentation/) |

## Known Limitations

- Free-tier market data may be delayed by 5–15 minutes.
- BSE/NSE and filing sources can rate-limit requests.
- Small-cap companies may have sparse governance and growth disclosures.
- AI summaries require user-supplied Gemini or Groq credentials.

## Responsible Use

Vriddhi is an educational and factual computational platform, not investment advice. It does not provide buy, sell, or hold recommendations or price targets. Users should verify data and consult a SEBI-registered investment adviser before making financial decisions.

