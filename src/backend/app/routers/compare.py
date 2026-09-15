"""Compare router for side-by-side stock research (TRD §5 & P1)."""
from fastapi import APIRouter, Query, HTTPException
from app.services.report import ReportService
from app.services.market_data import normalize_ticker

router = APIRouter(tags=["compare"])


@router.get("/compare")
async def compare_stocks(
    a: str = Query(..., description="First stock ticker"),
    b: str = Query(..., description="Second stock ticker")
):
    """Compare two stocks side-by-side with full 6-layer research reports."""
    sym_a = normalize_ticker(a)
    sym_b = normalize_ticker(b)

    try:
        report_a = await ReportService.get_or_generate_report(sym_a)
        report_b = await ReportService.get_or_generate_report(sym_b)
        return {
            "stock_a": report_a,
            "stock_b": report_b
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error comparing stocks: {str(e)}")
