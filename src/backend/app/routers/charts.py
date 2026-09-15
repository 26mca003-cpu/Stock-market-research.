"""Chart data router for TradingView Lightweight Charts (TRD §5)."""
from fastapi import APIRouter, Query
from app.schemas import ChartResponse
from app.services.market_data import MarketDataService, normalize_ticker

router = APIRouter(tags=["charts"])


@router.get("/chart/{ticker}", response_model=ChartResponse)
async def get_chart_data(
    ticker: str,
    period: str = Query("1y", pattern="^(6m|1y|5y)$", description="Chart timeframe: 6m, 1y, 5y")
):
    """Retrieve OHLCV candle and volume series for ticker."""
    sym = normalize_ticker(ticker)
    data = MarketDataService.get_chart_data(sym, period=period)
    return ChartResponse(**data)
