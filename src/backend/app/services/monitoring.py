import time
import httpx
import traceback
from datetime import datetime
from functools import wraps
from typing import Callable, Any, Dict, List
import feedparser

from app.config import settings
from app.db import get_supabase
from app.services.llm import LLMService

async def deep_health_check() -> List[Dict[str, Any]]:
    """
    Runs the deep health checks and records them in the system_checks table.
    """
    supabase = get_supabase()
    results = []
    
    async def record_check(component: str, status: str, latency_ms: int, detail: str = None):
        res = {
            "component": component,
            "status": status,
            "latency_ms": latency_ms,
            "detail": detail
        }
        results.append(res)
        # Write to system_checks table
        try:
            if supabase:
                supabase.table("system_checks").insert(res).execute()
        except Exception as e:
            print(f"Failed to write health check for {component}: {e}")
        return res

    # 1. API self check
    start = time.time()
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.get(f"{settings.NEXT_PUBLIC_API_URL.replace('/api', '')}/api/health", timeout=5.0)
            latency = int((time.time() - start) * 1000)
            if resp.status_code == 200:
                await record_check("api", "ok", latency, "API is responding")
            else:
                await record_check("api", "down", latency, f"HTTP {resp.status_code}")
    except Exception as e:
        latency = int((time.time() - start) * 1000)
        await record_check("api", "down", latency, str(e))

    # 2. Database check
    start = time.time()
    try:
        if not supabase:
            raise Exception("Supabase client not configured")
        # Just select from watchlists limit 1 as a ping
        supabase.table("watchlists").select("id").limit(1).execute()
        latency = int((time.time() - start) * 1000)
        await record_check("database", "ok", latency, "Supabase responding")
    except Exception as e:
        latency = int((time.time() - start) * 1000)
        await record_check("database", "down", latency, str(e))

    # 3. Scraper (Crawl4AI) check
    start = time.time()
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.get(f"{settings.CRAWL4AI_URL}/health", timeout=10.0)
            latency = int((time.time() - start) * 1000)
            if resp.status_code == 200:
                await record_check("scraper", "ok", latency, "Crawl4AI is up")
            else:
                await record_check("scraper", "degraded", latency, f"HTTP {resp.status_code}")
    except Exception as e:
        latency = int((time.time() - start) * 1000)
        await record_check("scraper", "down", latency, str(e))

    # 4. Gemini check
    start = time.time()
    try:
        llm = LLMService()
        await llm.generate_moat("Test business description", "Test MD&A")
        latency = int((time.time() - start) * 1000)
        await record_check("gemini", "ok", latency, "Gemini generated response")
    except Exception as e:
        latency = int((time.time() - start) * 1000)
        await record_check("gemini", "down", latency, str(e))

    # 5. Groq check
    start = time.time()
    try:
        # Assuming groq is used if gemini fails or directly.
        # We'll just ping the Groq API directly for health
        if not settings.GROQ_API_KEY:
            raise Exception("No Groq API key")
        async with httpx.AsyncClient() as client:
            headers = {"Authorization": f"Bearer {settings.GROQ_API_KEY}"}
            payload = {"model": "llama-3.1-8b-instant", "messages": [{"role": "user", "content": "Ping"}]}
            resp = await client.post("https://api.groq.com/openai/v1/chat/completions", json=payload, headers=headers, timeout=10.0)
            latency = int((time.time() - start) * 1000)
            if resp.status_code == 200:
                await record_check("groq", "ok", latency, "Groq responding")
            else:
                await record_check("groq", "down", latency, f"HTTP {resp.status_code}")
    except Exception as e:
        latency = int((time.time() - start) * 1000)
        await record_check("groq", "down", latency, str(e))

    # 6. News RSS check
    start = time.time()
    try:
        feed = feedparser.parse("https://news.google.com/rss/search?q=nifty+stock&hl=en-IN&gl=IN&ceid=IN:en")
        latency = int((time.time() - start) * 1000)
        if len(feed.entries) > 0:
            await record_check("news_rss", "ok", latency, f"Found {len(feed.entries)} items")
        else:
            await record_check("news_rss", "degraded", latency, "No items found")
    except Exception as e:
        latency = int((time.time() - start) * 1000)
        await record_check("news_rss", "down", latency, str(e))

    # 7. Screener check
    start = time.time()
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.get("https://www.screener.in/company/RELIANCE/consolidated/", timeout=10.0)
            latency = int((time.time() - start) * 1000)
            if resp.status_code == 200:
                await record_check("screener", "ok", latency, "Screener responding")
            else:
                await record_check("screener", "degraded", latency, f"HTTP {resp.status_code}")
    except Exception as e:
        latency = int((time.time() - start) * 1000)
        await record_check("screener", "down", latency, str(e))

    # 8. BSE check
    start = time.time()
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.get("https://www.bseindia.com/corporates/ann.html", timeout=10.0)
            latency = int((time.time() - start) * 1000)
            if resp.status_code == 200:
                await record_check("bse", "ok", latency, "BSE responding")
            else:
                await record_check("bse", "degraded", latency, f"HTTP {resp.status_code}")
    except Exception as e:
        latency = int((time.time() - start) * 1000)
        await record_check("bse", "down", latency, str(e))

    return results

def log_job_run(job_name: str):
    """
    Decorator to log cron job executions to job_runs table.
    """
    def decorator(func: Callable):
        @wraps(func)
        def wrapper(*args, **kwargs):
            supabase = get_supabase()
            start_time = datetime.utcnow()
            run_id = None
            if supabase:
                try:
                    res = supabase.table("job_runs").insert({
                        "job_name": job_name,
                        "status": "running"
                    }).execute()
                    run_id = res.data[0]["id"]
                except Exception as e:
                    print(f"Failed to start job run log: {e}")

            start_ts = time.time()
            status = "success"
            error_msg = None
            rows_processed = 0
            
            try:
                # Expecting the job to return rows_processed if applicable
                result = func(*args, **kwargs)
                if isinstance(result, int):
                    rows_processed = result
                elif isinstance(result, dict) and "rows_processed" in result:
                    rows_processed = result["rows_processed"]
            except Exception as e:
                status = "failed"
                error_msg = str(e) + "\\n" + traceback.format_exc()
                print(f"Job {job_name} failed: {e}")
                raise
            finally:
                duration_ms = int((time.time() - start_ts) * 1000)
                if supabase and run_id:
                    try:
                        supabase.table("job_runs").update({
                            "status": status,
                            "finished_at": datetime.utcnow().isoformat(),
                            "duration_ms": duration_ms,
                            "rows_processed": rows_processed,
                            "error": error_msg
                        }).eq("id", run_id).execute()
                    except Exception as e:
                        print(f"Failed to finalize job run log: {e}")
            return rows_processed
        return wrapper
    return decorator

# Async version of log_job_run
def log_job_run_async(job_name: str):
    """
    Decorator to log async cron job executions to job_runs table.
    """
    def decorator(func: Callable):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            supabase = get_supabase()
            start_time = datetime.utcnow()
            run_id = None
            if supabase:
                try:
                    res = supabase.table("job_runs").insert({
                        "job_name": job_name,
                        "status": "running"
                    }).execute()
                    run_id = res.data[0]["id"]
                except Exception as e:
                    print(f"Failed to start async job run log: {e}")

            start_ts = time.time()
            status = "success"
            error_msg = None
            rows_processed = 0
            
            try:
                result = await func(*args, **kwargs)
                if isinstance(result, int):
                    rows_processed = result
                elif isinstance(result, dict) and "rows_processed" in result:
                    rows_processed = result["rows_processed"]
            except Exception as e:
                status = "failed"
                error_msg = str(e) + "\\n" + traceback.format_exc()
                print(f"Job {job_name} failed: {e}")
                raise
            finally:
                duration_ms = int((time.time() - start_ts) * 1000)
                if supabase and run_id:
                    try:
                        supabase.table("job_runs").update({
                            "status": status,
                            "finished_at": datetime.utcnow().isoformat(),
                            "duration_ms": duration_ms,
                            "rows_processed": rows_processed,
                            "error": error_msg
                        }).eq("id", run_id).execute()
                    except Exception as e:
                        print(f"Failed to finalize async job run log: {e}")
            return rows_processed
        return wrapper
    return decorator
