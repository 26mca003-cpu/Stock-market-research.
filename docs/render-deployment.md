# Render Deployment Guide

This repository includes `render.yaml`, a Render Blueprint for two web services:

- `vriddhi-api`: FastAPI backend at `/api/health`
- `vriddhi-frontend`: Next.js application

Render supports monorepos through `rootDir`; each service is built from its own directory. The Blueprint uses `sync: false` for credentials so secrets are entered in Render rather than committed to Git.

## 1. Open Render

1. Go to [Render Dashboard](https://dashboard.render.com/).
2. Sign in with GitHub.
3. Select **New → Blueprint**.
4. Choose the repository `26mca003-cpu/Stock-market-research..git` and branch `main`.
5. Confirm that Render detects the root-level `render.yaml`.

## 2. Create the Blueprint

1. Review the two services named `vriddhi-api` and `vriddhi-frontend`.
2. Choose the Singapore region to keep both services close to each other.
3. Select the Free plan for testing, if available for your Render account.
4. Enter the requested secret values when Render prompts for them.
5. Click **Apply** or **Create Blueprint**.

## 3. Configure backend variables

In the `vriddhi-api` service, add or verify:

| Variable | Value |
|---|---|
| `APP_ENV` | `production` |
| `SUPABASE_URL` | Your Supabase project URL |
| `SUPABASE_ANON_KEY` | Supabase anonymous key |
| `SUPABASE_SERVICE_KEY` | Server-side Supabase service key |
| `GEMINI_API_KEY` | Optional Gemini key |
| `GROQ_API_KEY` | Optional Groq key |
| `CRAWL4AI_URL` | Optional Crawl4AI endpoint; leave blank if unavailable |
| `NEXT_PUBLIC_API_URL` | `https://<backend-service>.onrender.com/api` |

Do not commit these values to GitHub.

## 4. Configure frontend variables

After the backend deploys, copy its public Render URL. In the `vriddhi-frontend` service, set:

| Variable | Value |
|---|---|
| `NEXT_PUBLIC_API_URL` | `https://<backend-service>.onrender.com/api` |
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key |

Because `NEXT_PUBLIC_*` values are embedded during `npm run build`, save these values and manually trigger a frontend redeploy after changing them.

## 5. Verify the deployment

1. Open `https://<backend-service>.onrender.com/api/health`; it should return JSON with `ok: true`.
2. Open the frontend service URL, `https://<frontend-service>.onrender.com`.
3. Check browser developer tools for failed API requests.
4. If the frontend calls `localhost:8000`, update `NEXT_PUBLIC_API_URL` and redeploy the frontend.

## 6. Supabase configuration

If authentication is enabled, add the frontend Render URL to Supabase Auth URL configuration:

- Site URL: `https://<frontend-service>.onrender.com`
- Redirect URLs: `https://<frontend-service>.onrender.com/**`

## 7. Important Render limitations

- Free services can spin down when idle, so the first request may be slow.
- The current scheduler is not declared as a Render worker or cron service; scheduled ingestion should be added separately after the web deployment is stable.
- Render environment values are strings; keep URLs and keys exactly as provided by the service.
