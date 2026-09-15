# Recommended Deployment: Genspark + Vercel + Render

The recommended production split is:

```text
Genspark AI (scraper UI/prototype)
              ↓ export or integrate
Vercel        Next.js frontend
              ↓ HTTPS API requests
Render        FastAPI backend
              ↓
Supabase      Auth and PostgreSQL
```

The existing `render.yaml` still supports deploying both services to Render. Use this guide if you prefer Vercel for the frontend.

## 1. Backend on Render

1. Open [Render Dashboard](https://dashboard.render.com/).
2. Create a **Web Service** from `26mca003-cpu/Stock-market-research..git`.
3. Select branch `main`.
4. Set **Root Directory** to `src/backend`.
5. Set **Runtime** to Python.
6. Set **Build Command** to:

   ```bash
   pip install -r requirements.txt
   ```

7. Set **Start Command** to:

   ```bash
   uvicorn app.main:app --host 0.0.0.0 --port $PORT
   ```

8. Set the health check path to `/api/health`.
9. Add the backend variables listed in [docs/render-deployment.md](render-deployment.md).
10. Deploy and copy the backend URL, for example:

   ```text
   https://vriddhi-api.onrender.com
   ```

## 2. Frontend on Vercel

1. Open [Vercel](https://vercel.com/new) and import the GitHub repository.
2. Set **Root Directory** to `src/frontend`.
3. Keep the framework as **Next.js**.
4. Use `npm install` as the install command and `npm run build` as the build command.
5. Add these environment variables:

   | Variable | Value |
   |---|---|
   | `NEXT_PUBLIC_API_URL` | `https://vriddhi-api.onrender.com/api` |
   | `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anonymous key |

6. Deploy and copy the Vercel URL.

`NEXT_PUBLIC_*` values are embedded during the Next.js build, so redeploy Vercel after changing them.

## 3. Supabase URLs

In Supabase Auth settings, set:

- Site URL: your Vercel URL
- Redirect URL: `https://<your-vercel-domain>/**`

## 4. Genspark AI scraper frontend

Use Genspark AI to prototype or generate the scraper-facing UI, then export or copy the resulting frontend components into `src/frontend`. Keep the backend ingestion and scoring logic in `src/backend` so API keys and provider credentials remain server-side.

If the Genspark output is a separate standalone frontend, deploy it as a separate Vercel project and point its API base URL to the same Render backend. Do not place Supabase service keys, Gemini keys, Groq keys, or scraping credentials in browser code.

## 5. Verify the complete system

1. Visit `https://<render-domain>/api/health` and confirm `{"ok":true}`.
2. Open the Vercel frontend.
3. Search for a ticker and confirm requests go to the Render URL, not `localhost:8000`.
4. Test authentication and a research page.
5. Check Render logs for backend errors and Vercel deployment logs for frontend build errors.

