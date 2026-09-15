from app.auth import require_admin
from typing import Dict, Any
from fastapi import APIRouter, HTTPException, Depends
from app.schemas import ResearchReportResponse
from app.services.report import ReportService
from app.services.market_data import normalize_ticker

router = APIRouter(tags=["research"])


@router.get("/research/{ticker}", response_model=ResearchReportResponse)
async def get_research_report(ticker: str):
    """Fetch 6-layer research report for ticker (cached for 24 hours)."""
    sym = normalize_ticker(ticker)
    try:
        report = await ReportService.get_or_generate_report(sym, force_refresh=False)
        return ResearchReportResponse(**report)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate report for {sym}: {str(e)}")


@router.post("/research/{ticker}/refresh", response_model=ResearchReportResponse)
async def refresh_research_report(ticker: str, admin: Dict[str, Any] = Depends(require_admin)):
    """Force recompute 6-layer research report for ticker."""
    sym = normalize_ticker(ticker)
    try:
        report = await ReportService.get_or_generate_report(sym, force_refresh=True)
        return ResearchReportResponse(**report)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to refresh report for {sym}: {str(e)}")
