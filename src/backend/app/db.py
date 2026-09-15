"""Database client and cache manager for Vriddhi (Supabase + Local fallback)."""
import json
import logging
from datetime import datetime, timezone, timedelta
from typing import Optional, Dict, Any, List
from app.config import settings

logger = logging.getLogger(__name__)

# Supabase Client Initialization
supabase = None
if settings.SUPABASE_URL and settings.SUPABASE_SERVICE_KEY:
    try:
        from supabase import create_client, Client
        supabase: Optional[Client] = create_client(
            settings.SUPABASE_URL,
            settings.SUPABASE_SERVICE_KEY
        )
        logger.info("Supabase client successfully initialized.")
    except Exception as e:
        logger.warning(f"Failed to initialize Supabase client: {e}. Falling back to local store.")
else:
    logger.info("Supabase credentials not configured. Running with local development store.")

def get_supabase() -> Optional['Client']:
    return supabase

# Local In-Memory / File Fallback Store
_local_store: Dict[str, Dict[str, Any]] = {
    "watchlists": {},
    "portfolios": {},
    "stock_fundamentals": {},
    "analysis_reports": {},
    "news_items": {},
    "filings_log": {}
}

# ---- File-backed persistence for the local fallback store ----
# Keeps watchlists/portfolios stable across backend restarts when Supabase
# isn't the write target (e.g. dev / unauthenticated default_user).
import json as _json
import os as _os

_STORE_FILE = _os.path.join(_os.path.dirname(__file__), "data", "local_store.json")


def _load_local_store() -> None:
    try:
        if _os.path.exists(_STORE_FILE):
            with open(_STORE_FILE, "r", encoding="utf-8") as f:
                data = _json.load(f)
            for key in ("watchlists", "portfolios"):
                if key in data and isinstance(data[key], dict):
                    _local_store[key] = data[key]
    except Exception as e:
        logger.warning(f"Could not load local store: {e}")


def _save_local_store() -> None:
    try:
        _os.makedirs(_os.path.dirname(_STORE_FILE), exist_ok=True)
        with open(_STORE_FILE, "w", encoding="utf-8") as f:
            _json.dump(
                {"watchlists": _local_store["watchlists"], "portfolios": _local_store["portfolios"]},
                f,
                default=str,
            )
    except Exception as e:
        logger.warning(f"Could not save local store: {e}")


_load_local_store()


class DatabaseManager:
    """Unified access layer supporting Supabase with transparent local fallback."""

    @staticmethod
    def get_analysis_report(ticker: str) -> Optional[Dict[str, Any]]:
        now = datetime.now(timezone.utc)
        if supabase:
            try:
                res = (
                    supabase.table("analysis_reports")
                    .select("*")
                    .eq("ticker", ticker)
                    .gt("expires_at", now.isoformat())
                    .order("created_at", desc=True)
                    .limit(1)
                    .execute()
                )
                if res.data and len(res.data) > 0:
                    return res.data[0]
            except Exception as e:
                logger.error(f"Error querying analysis_reports from Supabase: {e}")

        # Local fallback
        report = _local_store["analysis_reports"].get(ticker)
        if report:
            exp_str = report.get("expires_at")
            if exp_str:
                exp_dt = datetime.fromisoformat(exp_str)
                if exp_dt > now:
                    return report
        return None

    @staticmethod
    def save_analysis_report(report_data: Dict[str, Any]) -> None:
        ticker = report_data.get("ticker")
        if not ticker:
            return
        
        # Ensure expires_at is set
        if "expires_at" not in report_data:
            expires = datetime.now(timezone.utc) + timedelta(seconds=settings.ANALYSIS_CACHE_TTL)
            report_data["expires_at"] = expires.isoformat()
        if "created_at" not in report_data:
            report_data["created_at"] = datetime.now(timezone.utc).isoformat()

        # Update local store
        _local_store["analysis_reports"][ticker] = report_data

        if supabase:
            try:
                supabase.table("analysis_reports").insert(report_data).execute()
            except Exception as e:
                logger.error(f"Error writing analysis_reports to Supabase: {e}")

    @staticmethod
    def get_stock_fundamentals(ticker: str) -> Optional[Dict[str, Any]]:
        now = datetime.now(timezone.utc)
        if supabase:
            try:
                res = (
                    supabase.table("stock_fundamentals")
                    .select("*")
                    .eq("ticker", ticker)
                    .limit(1)
                    .execute()
                )
                if res.data and len(res.data) > 0:
                    return res.data[0].get("payload")
            except Exception as e:
                logger.error(f"Error querying stock_fundamentals from Supabase: {e}")

        return _local_store["stock_fundamentals"].get(ticker)

    @staticmethod
    def save_stock_fundamentals(ticker: str, payload: Dict[str, Any]) -> None:
        def sanitize(val):
            if isinstance(val, dict):
                return {str(k): sanitize(v) for k, v in val.items()}
            elif isinstance(val, (list, tuple, set)):
                return [sanitize(x) for x in val]
            elif hasattr(val, "isoformat"):
                return val.isoformat()
            elif hasattr(val, "item"):
                return val.item()
            elif isinstance(val, float) and (val != val or val == float("inf") or val == float("-inf")):
                return None
            return val

        clean_payload = sanitize(payload)
        _local_store["stock_fundamentals"][ticker] = clean_payload
        if supabase:
            try:
                data = {
                    "ticker": ticker,
                    "payload": clean_payload,
                    "fetched_at": datetime.now(timezone.utc).isoformat()
                }
                supabase.table("stock_fundamentals").upsert(data).execute()
            except Exception as e:
                logger.error(f"Error upserting stock_fundamentals in Supabase: {e}")

    @staticmethod
    def get_news(ticker: str, limit: int = 10) -> List[Dict[str, Any]]:
        if supabase:
            try:
                res = (
                    supabase.table("news_items")
                    .select("*")
                    .eq("ticker", ticker)
                    .order("published_at", desc=True)
                    .limit(limit)
                    .execute()
                )
                if res.data:
                    return res.data
            except Exception as e:
                logger.error(f"Error querying news_items from Supabase: {e}")

        items = _local_store["news_items"].get(ticker, [])
        return items[:limit]

    @staticmethod
    def save_news(ticker: str, news_list: List[Dict[str, Any]]) -> None:
        existing = _local_store["news_items"].get(ticker, [])
        urls = {item.get("url") for item in existing}
        for n in news_list:
            if n.get("url") not in urls:
                existing.append(n)
                urls.add(n.get("url"))
        _local_store["news_items"][ticker] = existing

        if supabase:
            for item in news_list:
                try:
                    supabase.table("news_items").upsert(item, on_conflict="ticker,url").execute()
                except Exception as e:
                    logger.debug(f"Supabase news upsert: {e}")

    @staticmethod
    def get_watchlist(user_id: str = "default_user") -> List[Dict[str, Any]]:
        if supabase and user_id != "default_user":
            try:
                res = supabase.table("watchlists").select("*").eq("user_id", user_id).execute()
                if res.data is not None:
                    return res.data
            except Exception as e:
                logger.error(f"Error querying watchlist from Supabase: {e}")

        return list(_local_store["watchlists"].get(user_id, {}).values())

    @staticmethod
    def add_to_watchlist(ticker: str, company_name: str = "", user_id: str = "default_user") -> Dict[str, Any]:
        item = {
            "id": f"{user_id}_{ticker}",
            "user_id": user_id,
            "ticker": ticker,
            "company_name": company_name,
            "added_at": datetime.now(timezone.utc).isoformat()
        }
        _local_store["watchlists"].setdefault(user_id, {})[ticker] = item
        _save_local_store()
        if supabase and user_id != "default_user":
            try:
                # DB payload WITHOUT the fabricated `id` — the watchlists.id column is a
                # uuid with a default; sending a non-UUID string makes the insert fail.
                db_item = {
                    "user_id": user_id,
                    "ticker": ticker,
                    "company_name": company_name,
                    "added_at": item["added_at"],
                }
                supabase.table("watchlists").upsert(db_item, on_conflict="user_id,ticker").execute()
            except Exception as e:
                logger.error(f"Error adding to watchlist in Supabase: {e}")
                raise
        return item

    @staticmethod
    def remove_from_watchlist(ticker: str, user_id: str = "default_user") -> bool:
        removed = False
        local = _local_store["watchlists"].get(user_id, {})
        if ticker in local:
            local.pop(ticker, None)
            removed = True
        _save_local_store()
        if supabase and user_id != "default_user":
            try:
                res = (
                    supabase.table("watchlists")
                    .delete()
                    .eq("user_id", user_id)
                    .eq("ticker", ticker)
                    .execute()
                )
                # PostgREST returns the deleted rows in res.data
                if res.data:
                    removed = True
            except Exception as e:
                logger.error(f"Error removing from watchlist in Supabase: {e}")
                raise
        return removed

    # ===== Portfolio (persistent, per-user) =====
    @staticmethod
    def get_portfolio_holdings(user_id: str = "default_user") -> List[Dict[str, Any]]:
        if supabase and user_id != "default_user":
            try:
                res = supabase.table("portfolios").select("*").eq("user_id", user_id).execute()
                if res.data is not None:
                    return res.data
            except Exception as e:
                logger.error(f"Error querying portfolio from Supabase: {e}")
        return list(_local_store["portfolios"].get(user_id, {}).values())

    @staticmethod
    def upsert_portfolio_holding(
        ticker: str, quantity: float, avg_buy_price: float, user_id: str = "default_user"
    ) -> Dict[str, Any]:
        item = {
            "user_id": user_id,
            "ticker": ticker,
            "quantity": quantity,
            "avg_buy_price": avg_buy_price,
            "added_at": datetime.now(timezone.utc).isoformat(),
        }
        _local_store["portfolios"].setdefault(user_id, {})[ticker] = item
        _save_local_store()
        if supabase and user_id != "default_user":
            try:
                supabase.table("portfolios").upsert(item, on_conflict="user_id,ticker").execute()
            except Exception as e:
                logger.error(f"Error upserting portfolio holding in Supabase: {e}")
                raise
        return item

    @staticmethod
    def remove_portfolio_holding(ticker: str, user_id: str = "default_user") -> bool:
        removed = False
        local = _local_store["portfolios"].get(user_id, {})
        if ticker in local:
            local.pop(ticker, None)
            removed = True
        _save_local_store()
        if supabase and user_id != "default_user":
            try:
                res = (
                    supabase.table("portfolios")
                    .delete()
                    .eq("user_id", user_id)
                    .eq("ticker", ticker)
                    .execute()
                )
                if res.data:
                    removed = True
            except Exception as e:
                logger.error(f"Error removing portfolio holding in Supabase: {e}")
                raise
        return removed
