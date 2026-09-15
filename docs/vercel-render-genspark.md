# Recommended Deployment: Genspark + Vercel + Render

The current production split is:

```text
Genspark AI / Crawl4AI scraper prototype
              -> sends data or scraper UI output
Vercel        Next.js frontend
              -> HTTPS API requests
Render        FastAPI backend
              ->
Supabase      Auth and PostgreSQL
cron-job.org  Keep-awake health ping for the free Render service
```

Live URLs:

| Service | URL |
|---|---|
| Frontend | https://vriddhi-research.vercel.app/ |
| Backend | https://stock-market-research.onrender.com |
| Backend health check | https://stock-market-research.onrender.com/api/health |
| Project photos | https://drive.google.com/drive/folders/1iW9uNCMlKc1lek__hjHFoS3TfmvBm50C?usp=sharing |
| Demo video | https://drive.google.com/file/d/17nSXwkBAdz7bfVWj1jPT7Zx2saPkJUhJ/view?usp=sharing |

The existing `render.yaml` still supports deploying both services to Render. Use this guide when the frontend is hosted on Vercel and the backend is hosted on Render.

## 1. Backend on Render

1. Open [Render Dashboard](https://dashboard.render.com/).
2. Create a Web Service from `26mca003-cpu/Stock-market-research..git`.
3. Select branch `main`.
4. Set Root Directory to `src/backend`.
5. Set Runtime to Python.
6. Set Build Command to:

   ```bash
   pip install -r requirements.txt
   ```

7. Set Start Command to:

   ```bash
   uvicorn app.main:app --host 0.0.0.0 --port $PORT
   ```

8. Set the health check path to `/api/health`.
9. Add the backend variables listed in [docs/render-deployment.md](render-deployment.md).
10. Deploy and verify the backend at:

   ```text
   https://stock-market-research.onrender.com/api/health
   ```

## 2. Frontend on Vercel

1. Open [Vercel](https://vercel.com/new) and import the GitHub repository.
2. Set Root Directory to `src/frontend`.
3. Keep the framework as Next.js.
4. Use `npm install` as the install command and `npm run build` as the build command.
5. Add these environment variables:

   | Variable | Value |
   |---|---|
   | `NEXT_PUBLIC_API_URL` | `https://stock-market-research.onrender.com/api` |
   | `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anonymous key |

6. Deploy and verify the frontend at:

   ```text
   https://vriddhi-research.vercel.app/
   ```

`NEXT_PUBLIC_*` values are embedded during the Next.js build, so redeploy Vercel after changing them.

## 3. Supabase URLs

In Supabase Auth settings, set:

- Site URL: `https://vriddhi-research.vercel.app/`
- Redirect URL: `https://vriddhi-research.vercel.app/**`

## 4. Genspark AI scraper frontend

Use Genspark AI to prototype or host the scraper-facing frontend. Crawl4AI can stay as the open-source scraping engine behind the scraper workflow, while private API keys and scraping credentials remain server-side.

If the Genspark output is a separate standalone frontend, point its API base URL to the same Render backend:

```text
https://stock-market-research.onrender.com/api
```

Do not place Supabase service keys, Gemini keys, Groq keys, or scraping credentials in browser code.

## 5. cron-job.org keep-awake setup

Render free services can sleep when idle. To reduce cold starts, create a cron-job.org monitor:

| Field | Value |
|---|---|
| URL | `https://stock-market-research.onrender.com/api/health` |
| Method | `GET` |
| Schedule | Every 10 or 15 minutes |
| Expected result | HTTP 200 and JSON health response |

Use [cron-job.org](https://console.cron-job.org/) and paste the health URL directly.

## 6. Verify the complete system

1. Visit `https://stock-market-research.onrender.com/api/health` and confirm the backend responds.
2. Open `https://vriddhi-research.vercel.app/`.
3. Search for a ticker and confirm requests go to the Render URL, not `localhost:8000`.
4. Test authentication and a research page.
5. Check Render logs for backend errors and Vercel deployment logs for frontend build errors.
