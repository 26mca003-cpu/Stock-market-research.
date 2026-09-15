from typing import Dict, Any, List
from datetime import datetime, timezone
from app.db import get_supabase

class AdminService:
    @staticmethod
    def get_overview_totals() -> Dict[str, Any]:
        supabase = get_supabase()
        if not supabase:
            return {"users": 0, "tickers_tracked": 0, "reports_24h": 0, "news_24h": 0}
            
        try:
            # users total
            users_res = supabase.table("profiles").select("id", count="exact").execute()
            users_count = users_res.count if hasattr(users_res, 'count') and users_res.count is not None else len(users_res.data)
            
            # tickers tracked
            watchlists_res = supabase.table("watchlists").select("ticker").execute()
            tickers_tracked = len(set([row["ticker"] for row in watchlists_res.data]))
            
            # reports in last 24h
            from datetime import timedelta
            cutoff = (datetime.now(timezone.utc) - timedelta(days=1)).isoformat()
            reports_res = supabase.table("analysis_reports").select("id", count="exact").gt("created_at", cutoff).execute()
            reports_24h = reports_res.count if hasattr(reports_res, 'count') and reports_res.count is not None else len(reports_res.data)
            
            # news in last 24h
            news_res = supabase.table("news_items").select("id", count="exact").gt("published_at", cutoff).execute()
            news_24h = news_res.count if hasattr(news_res, 'count') and news_res.count is not None else len(news_res.data)
            
            return {
                "users": users_count,
                "tickers_tracked": tickers_tracked,
                "reports_24h": reports_24h,
                "news_24h": news_24h
            }
        except Exception:
            return {"users": 0, "tickers_tracked": 0, "reports_24h": 0, "news_24h": 0}

    @staticmethod
    def log_audit(admin_id: str, action: str, target: str, meta: Dict[str, Any] = None):
        supabase = get_supabase()
        if supabase:
            try:
                supabase.table("audit_log").insert({
                    "admin_id": admin_id,
                    "action": action,
                    "target": target,
                    "meta": meta or {}
                }).execute()
            except Exception as e:
                print(f"Audit log failed: {e}")
