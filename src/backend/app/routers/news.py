"""News router for company news and AI sentiment (TRD §5)."""
from typing import List
from fastapi import APIRouter
from app.schemas import NewsItemResponse
from app.services.news import NewsService
from app.services.market_data import normalize_ticker

router = APIRouter(tags=["news"])


@router.get("/news/{ticker}", response_model=List[NewsItemResponse])
async def get_news(ticker: str):
    """Retrieve 10 latest news items with AI sentiment ratings."""
    sym = normalize_ticker(ticker)
    clean_name = sym.replace(".NS", "").replace(".BO", "")
    items = await NewsService.get_stock_news(sym, clean_name)
    return [NewsItemResponse(**item) for item in items]
