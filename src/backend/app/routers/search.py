"""Search router for stock autocomplete (TRD §5)."""
import json
import os
from typing import List
from fastapi import APIRouter, Query
from app.schemas import SearchResult

router = APIRouter(tags=["search"])

# Load Indian ticker data (NSE listed universe)
DATA_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "nse500.json")
_STOCKS: List[dict] = []

def get_stocks() -> List[dict]:
    global _STOCKS
    if not _STOCKS and os.path.exists(DATA_PATH):
        try:
            with open(DATA_PATH, "r", encoding="utf-8") as f:
                _STOCKS = json.load(f)
        except Exception:
            _STOCKS = []
    return _STOCKS

_STOCKS = get_stocks()


@router.get("/search", response_model=List[SearchResult])
async def search_stocks(q: str = Query(..., min_length=1, description="Ticker or company name")):
    """Autocomplete search across NSE-500 tickers."""
    query = q.strip().upper()
    matches = []
    
    # Prefix matches first
    for s in _STOCKS:
        if s["ticker"].startswith(query) or s["name"].upper().startswith(query):
            matches.append(SearchResult(**s))
            if len(matches) >= 10:
                return matches

    # Substring matches second
    for s in _STOCKS:
        if query in s["ticker"] or query in s["name"].upper():
            sr = SearchResult(**s)
            if sr not in matches:
                matches.append(sr)
                if len(matches) >= 10:
                    return matches

    # If no local match, return query as ticker
    if not matches:
        sym = query if query.endswith(".NS") else f"{query}.NS"
        matches.append(SearchResult(ticker=sym, name=query, exchange="NSE"))

    return matches
