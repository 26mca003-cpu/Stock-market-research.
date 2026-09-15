"""Watchlist router (TRD §5)."""
from typing import List, Dict, Any
from fastapi import APIRouter, status, Depends
from app.schemas import WatchlistItem, WatchlistAddRequest
from app.auth import require_user
from app.db import DatabaseManager
from app.services.market_data import MarketDataService, normalize_ticker

router = APIRouter(tags=["watchlist"])


@router.get("/watchlist", response_model=List[WatchlistItem])
async def get_watchlist(user: Dict[str, Any] = Depends(require_user)):
    """Retrieve the authenticated user's watchlist with live-ish prices and mini Quality Scores."""
    raw_list = DatabaseManager.get_watchlist(user["id"])
    items = []
    for item in raw_list:
        ticker = item.get("ticker", "")
        if not ticker:
            continue
        price_info = MarketDataService.get_price_info(ticker)
        cached_rep = DatabaseManager.get_analysis_report(ticker)
        score_total = cached_rep.get("score_total") if cached_rep else None

        items.append(WatchlistItem(
            ticker=ticker,
            name=item.get("company_name") or ticker,
            last_price=price_info.get("last"),
            day_change_pct=price_info.get("day_change_pct"),
            score_total=score_total
        ))
    return items


@router.post("/watchlist", status_code=status.HTTP_201_CREATED)
async def add_to_watchlist(payload: WatchlistAddRequest, user: Dict[str, Any] = Depends(require_user)):
    """Add a stock to the authenticated user's watchlist."""
    sym = normalize_ticker(payload.ticker)
    company_name = payload.company_name or sym
    item = DatabaseManager.add_to_watchlist(ticker=sym, company_name=company_name, user_id=user["id"])
    return {"ok": True, "item": item}


@router.delete("/watchlist/{ticker:path}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_from_watchlist(ticker: str, user: Dict[str, Any] = Depends(require_user)):
    """Remove a stock from the authenticated user's watchlist."""
    sym = normalize_ticker(ticker)
    DatabaseManager.remove_from_watchlist(sym, user_id=user["id"])
    return None
