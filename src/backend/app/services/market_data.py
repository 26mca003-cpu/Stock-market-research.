"""Market Data Service using yfinance (TRD §3)."""
import logging
from typing import Dict, Any, Optional
import yfinance as yf
import pandas as pd

logger = logging.getLogger(__name__)


def normalize_ticker(ticker: str) -> str:
    """Ensure Indian ticker ends with .NS or .BO."""
    ticker_clean = ticker.strip().upper()
    if not (ticker_clean.endswith(".NS") or ticker_clean.endswith(".BO")):
        ticker_clean = f"{ticker_clean}.NS"
    return ticker_clean


class MarketDataService:
    @staticmethod
    def get_price_info(ticker: str) -> Dict[str, Any]:
        """Fetch latest price and day change."""
        sym = normalize_ticker(ticker)
        try:
            t = yf.Ticker(sym)
            fast = t.fast_info
            last_price = float(fast.get("last_price", 0.0) or 0.0)
            prev_close = float(fast.get("previous_close", 0.0) or last_price or 1.0)
            day_change_pct = round(((last_price - prev_close) / prev_close) * 100, 2) if prev_close else 0.0
            
            # If fast_info was 0, fallback to regular info
            if last_price == 0.0:
                info = t.info or {}
                last_price = float(info.get("currentPrice", info.get("regularMarketPrice", 0.0)) or 0.0)
                prev_close = float(info.get("previousClose", last_price) or last_price or 1.0)
                day_change_pct = round(((last_price - prev_close) / prev_close) * 100, 2) if prev_close else 0.0

            # Yahoo can return 0 for Indian symbols in fast_info/info while
            # history still has valid candles. Use the latest two closes.
            if last_price <= 0.0:
                df = t.history(period="5d")
                if not df.empty and "Close" in df:
                    closes = df["Close"].dropna()
                    closes = closes[closes > 0]
                    if not closes.empty:
                        last_price = float(closes.iloc[-1])
                        prev_close = float(closes.iloc[-2]) if len(closes) > 1 else last_price
                        day_change_pct = round(((last_price - prev_close) / prev_close) * 100, 2) if prev_close else 0.0

            return {
                "last": round(last_price, 2),
                "day_change_pct": day_change_pct,
                "currency": "INR"
            }
        except Exception as e:
            logger.warning(f"Error fetching price info for {sym}: {e}")
            return {"last": 0.0, "day_change_pct": 0.0, "currency": "INR"}

    @staticmethod
    def get_chart_data(ticker: str, period: str = "1y") -> Dict[str, Any]:
        """Fetch OHLCV candles and volumes formatted for TradingView Lightweight Charts."""
        sym = normalize_ticker(ticker)
        # Map period string
        p_map = {"6m": "6mo", "1y": "1y", "5y": "5y"}
        yf_period = p_map.get(period.lower(), "1y")
        try:
            t = yf.Ticker(sym)
            df = t.history(period=yf_period)
            if df.empty:
                return {"candles": [], "volumes": []}

            candles = []
            volumes = []
            for idx, row in df.iterrows():
                date_str = idx.strftime("%Y-%m-%d")
                o = float(row.get("Open", 0.0))
                h = float(row.get("High", 0.0))
                l = float(row.get("Low", 0.0))
                c = float(row.get("Close", 0.0))
                v = float(row.get("Volume", 0.0))

                candles.append({
                    "time": date_str,
                    "open": round(o, 2),
                    "high": round(h, 2),
                    "low": round(l, 2),
                    "close": round(c, 2)
                })
                # Green volume if close >= open, else red
                vol_color = "#10B981" if c >= o else "#EF4444"
                volumes.append({
                    "time": date_str,
                    "value": round(v, 2),
                    "color": vol_color
                })

            return {"candles": candles, "volumes": volumes}
        except Exception as e:
            logger.error(f"Error fetching chart data for {sym}: {e}")
            return {"candles": [], "volumes": []}

    @staticmethod
    def get_fundamentals(ticker: str) -> Dict[str, Any]:
        """Fetch yfinance fundamentals, statements, and ratios."""
        sym = normalize_ticker(ticker)
        try:
            t = yf.Ticker(sym)
            info = t.info or {}
            
            # Fetch statements if available
            try:
                financials = t.financials.to_dict() if hasattr(t, "financials") and t.financials is not None else {}
            except Exception:
                financials = {}

            try:
                balance_sheet = t.balance_sheet.to_dict() if hasattr(t, "balance_sheet") and t.balance_sheet is not None else {}
            except Exception:
                balance_sheet = {}

            try:
                cashflow = t.cashflow.to_dict() if hasattr(t, "cashflow") and t.cashflow is not None else {}
            except Exception:
                cashflow = {}

            return {
                "info": info,
                "financials": financials,
                "balance_sheet": balance_sheet,
                "cashflow": cashflow
            }
        except Exception as e:
            logger.error(f"Error fetching fundamentals for {sym}: {e}")
            return {"info": {}, "financials": {}, "balance_sheet": {}, "cashflow": {}}

