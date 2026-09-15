"""
New Listings API Router for VRIDDHI.

Endpoints:
  GET /api/new-listings              — Returns recently listed companies (last N days)
  GET /api/new-listings/ipo-radar   — Returns active & upcoming IPOs from NSE
  POST /api/new-listings/sync       — Manually trigger the daily sync worker
"""

import logging
from typing import List, Optional
from fastapi import APIRouter, Query, BackgroundTasks
from pydantic import BaseModel

from app.services.new_listings import (
    get_recent_listings,
    fetch_ipo_radar,
    sync_new_listings,
)

logger = logging.getLogger(__name__)
router = APIRouter(tags=["new-listings"])


class NewListingItem(BaseModel):
    ticker: str
    name: str
    exchange: str = "NSE"
    listing_date: Optional[str] = None
    sector: Optional[str] = None
    industry: Optional[str] = None
    market_cap: Optional[float] = None
    current_price: Optional[float] = None
    is_new_listing: bool = True
    detected_at: Optional[str] = None
    series: Optional[str] = None
    is_sme: bool = False
    category: Optional[str] = "Mainboard"


class IPOItem(BaseModel):
    symbol: str
    company_name: str
    issue_start_date: str
    issue_end_date: str
    issue_price: str
    issue_size: str
    status: str
    series: str = "EQ"
    category: Optional[str] = "Mainboard IPO"
    exchange: Optional[str] = "NSE"
    lot_size: Optional[str] = None
    is_sme: bool = False


@router.get("/new-listings", response_model=List[NewListingItem])
async def get_new_listings(
    days: int = Query(default=90, ge=7, le=365, description="Look-back window in days")
):
    """
    Returns companies that went public (IPO / new listing) within the last N days.
    Powered by the daily NSE master list diff engine.
    """
    recent = get_recent_listings(days_back=days)
    results = []
    for item in recent:
        is_sme = bool(item.get("is_sme") or item.get("series") in ("SM", "ST") or item.get("exchange") == "NSE SME")
        results.append(NewListingItem(
            ticker=item.get("ticker", ""),
            name=item.get("name", ""),
            exchange="NSE SME" if is_sme else item.get("exchange", "NSE"),
            listing_date=item.get("listing_date"),
            sector=item.get("sector"),
            industry=item.get("industry"),
            market_cap=item.get("market_cap"),
            current_price=item.get("current_price"),
            is_new_listing=True,
            detected_at=item.get("detected_at"),
            series=item.get("series"),
            is_sme=is_sme,
            category="SME EMERGE" if is_sme else "Mainboard",
        ))
    return results


@router.get("/new-listings/ipo-radar", response_model=List[IPOItem])
async def get_ipo_radar():
    """
    Live NSE & SME IPO Radar: Returns currently active and upcoming IPOs.
    Data sources: Official NSE IPO API (Mainboard) + Chittorgarh SME Dashboard (SME IPOs).
    """
    try:
        raw = await fetch_ipo_radar()
        results = []
        for item in raw:
            is_sme = bool(item.get("is_sme") or item.get("series") in ("SM", "ST") or item.get("category") == "SME IPO")
            results.append(IPOItem(
                symbol=item.get("symbol", ""),
                company_name=item.get("companyName") or item.get("company_name", ""),
                issue_start_date=item.get("issueStartDate") or item.get("issue_start_date", ""),
                issue_end_date=item.get("issueEndDate") or item.get("issue_end_date", ""),
                issue_price=item.get("issuePrice") or item.get("issue_price", ""),
                issue_size=str(item.get("issueSize") or item.get("issue_size", "")),
                status=item.get("status", "Active"),
                series=item.get("series", "SM" if is_sme else "EQ"),
                category="SME IPO" if is_sme else "Mainboard IPO",
                exchange=item.get("exchange", "NSE SME / BSE SME" if is_sme else "NSE"),
                lot_size=item.get("lot_size", "1,000+ Shares" if is_sme else "15-50 Shares"),
                is_sme=is_sme,
            ))
        return results
    except Exception as e:
        logger.error(f"IPO radar fetch error: {e}")
        return []


@router.post("/new-listings/sync")
async def trigger_sync(background_tasks: BackgroundTasks):
    """
    Manually trigger the daily new listings sync worker.
    Runs as a background task — returns immediately.
    """
    background_tasks.add_task(sync_new_listings)
    return {
        "ok": True,
        "message": "New listings sync started in background. Check logs for results.",
    }
