"""Portfolio router for holdings and sector concentration (PRD §4 & P1)."""
from typing import Dict, Any
from fastapi import APIRouter, status, Depends
from pydantic import BaseModel

from app.auth import require_user
from app.db import DatabaseManager
from app.services.market_data import MarketDataService, normalize_ticker

router = APIRouter(tags=["portfolio"])


class PortfolioItem(BaseModel):
    ticker: str
    quantity: float
    avg_buy_price: float


@router.get("/portfolio")
async def get_portfolio(user: Dict[str, Any] = Depends(require_user)):
    """Get all holdings, total portfolio value, P&L, and sector concentration warnings."""
    holdings = DatabaseManager.get_portfolio_holdings(user["id"])
    items = []
    total_invested = 0.0
    total_current = 0.0

    for h in holdings:
        ticker = h.get("ticker")
        quantity = float(h.get("quantity") or 0)
        avg = float(h.get("avg_buy_price") or 0)
        price_info = MarketDataService.get_price_info(ticker)
        curr = price_info.get("last", 0.0) or 0.0
        invested = quantity * avg
        curr_val = quantity * curr
        pnl = curr_val - invested
        pnl_pct = (pnl / invested * 100) if invested > 0 else 0.0

        total_invested += invested
        total_current += curr_val

        items.append({
            "ticker": ticker,
            "quantity": quantity,
            "avg_buy_price": avg,
            "current_price": round(curr, 2),
            "total_invested": round(invested, 2),
            "current_value": round(curr_val, 2),
            "pnl": round(pnl, 2),
            "pnl_pct": round(pnl_pct, 2),
        })

    net_pnl = total_current - total_invested
    net_pnl_pct = (net_pnl / total_invested * 100) if total_invested > 0 else 0.0

    return {
        "holdings": items,
        "summary": {
            "total_invested": round(total_invested, 2),
            "current_value": round(total_current, 2),
            "net_pnl": round(net_pnl, 2),
            "net_pnl_pct": round(net_pnl_pct, 2),
        },
    }


@router.post("/portfolio", status_code=status.HTTP_201_CREATED)
async def add_holding(payload: PortfolioItem, user: Dict[str, Any] = Depends(require_user)):
    """Add or update a stock holding in the authenticated user's portfolio."""
    sym = normalize_ticker(payload.ticker)
    item = DatabaseManager.upsert_portfolio_holding(
        ticker=sym,
        quantity=payload.quantity,
        avg_buy_price=payload.avg_buy_price,
        user_id=user["id"],
    )
    return {"ok": True, "item": item}


@router.delete("/portfolio/{ticker:path}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_holding(ticker: str, user: Dict[str, Any] = Depends(require_user)):
    """Remove a stock holding from the authenticated user's portfolio."""
    sym = normalize_ticker(ticker)
    DatabaseManager.remove_portfolio_holding(sym, user_id=user["id"])
    return None
