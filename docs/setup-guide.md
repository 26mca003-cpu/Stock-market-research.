# Setup Guide

## Prerequisites

- Python 3.11+
- Node.js 18+
- npm
- A Supabase project for persistence/authentication (optional for limited local flows)
- Gemini or Groq credentials for AI summaries (optional)

## Environment Variables

Backend:

```bash
cd src/backend
cp .env.example .env
```

Set values in `src/backend/.env` as needed:

| Variable | Description | Required |
|---|---|---|
| `SUPABASE_URL` | Supabase project URL | For Supabase-backed features |
| `SUPABASE_ANON_KEY` | Supabase anonymous key | For Supabase-backed features |
| `SUPABASE_SERVICE_KEY` | Server-side Supabase service key | For server-side persistence |
| `GEMINI_API_KEY` | Google Gemini API key | No |
| `GROQ_API_KEY` | Groq API key | No |
| `CRAWL4AI_URL` | Crawl4AI endpoint for filing extraction | No |

Frontend:

```bash
cd src/frontend
cp .env.example .env.local
```

## Installation

```bash
git clone https://github.com/26mca003-cpu/Stock-market-research..git
cd Stock-market-research.

cd src/backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt

cd ..\frontend
npm install
```

## Running the Application

Backend, from `src/backend`:

```bash
uvicorn app.main:app --reload --port 8000
```

Frontend, from `src/frontend` in a second terminal:

```bash
npm run dev
```

Open `http://localhost:3000`.

## Running Tests

From `src/backend`:

```bash
pytest -v
```

## Troubleshooting

| Issue | Solution |
|---|---|
| `ModuleNotFoundError` | Activate the backend virtual environment and run `pip install -r requirements.txt`. |
| Empty AI summaries | Set `GEMINI_API_KEY` or `GROQ_API_KEY`; the deterministic score still works without them. |
| Database/auth errors | Check Supabase variables and confirm the project schema has been applied. |
| Provider rate limiting | Use cached results, wait, and avoid repeated refreshes during development. |

