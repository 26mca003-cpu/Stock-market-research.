"""Technicals calculation service for L6 Layer (TRD §6.3)."""
import logging
from typing import Dict, Any, Optional
import numpy as np
import pandas as pd
import yfinance as yf

logger = logging.getLogger(__name__)


class TechnicalsService:
    @staticmethod
    def compute_technicals(ticker: str) -> Dict[str, Any]:
        """Compute 200-day MA, 50-day MA, RSI-14, 52-week position, volume trend."""
        try:
            t = yf.Ticker(ticker)
            df = t.history(period="1y")
            if df.empty or len(df) < 20:
                return TechnicalsService._default_technicals()

            close = df["Close"]
            current_price = float(close.iloc[-1])

            # Moving averages
            ma50 = float(close.rolling(window=50).mean().iloc[-1]) if len(close) >= 50 else current_price
            ma200 = float(close.rolling(window=200).mean().iloc[-1]) if len(close) >= 200 else current_price

            above_ma50 = current_price >= ma50
            above_ma200 = current_price >= ma200

            # RSI-14
            delta = close.diff()
            gain = (delta.where(delta > 0, 0)).rolling(window=14).mean()
            loss = (-delta.where(delta < 0, 0)).rolling(window=14).mean()
            rs = gain / (loss + 1e-9)
            rsi_series = 100 - (100 / (1 + rs))
            rsi14 = float(rsi_series.iloc[-1]) if not pd.isna(rsi_series.iloc[-1]) else 50.0

            # 52-week position (0.0 to 1.0)
            low_52 = float(df["Low"].min())
            high_52 = float(df["High"].max())
            if high_52 > low_52:
                wk52_position = round((current_price - low_52) / (high_52 - low_52), 2)
            else:
                wk52_position = 0.5

            # Volume trend (30-day avg vs 90-day avg)
            vol = df["Volume"]
            vol30 = float(vol.tail(30).mean()) if len(vol) >= 30 else float(vol.mean())
            vol90 = float(vol.tail(90).mean()) if len(vol) >= 90 else vol30
            if vol30 > vol90 * 1.05:
                volume_trend = "rising"
            elif vol30 < vol90 * 0.95:
                volume_trend = "falling"
            else:
                volume_trend = "stable"

            return {
                "current_price": round(current_price, 2),
                "ma50": round(ma50, 2),
                "ma200": round(ma200, 2),
                "above_ma50": above_ma50,
                "above_ma200": above_ma200,
                "rsi14": round(rsi14, 1),
                "wk52_low": round(low_52, 2),
                "wk52_high": round(high_52, 2),
                "wk52_position": max(0.0, min(1.0, wk52_position)),
                "volume_trend": volume_trend
            }
        except Exception as e:
            logger.error(f"Error calculating technicals for {ticker}: {e}")
            return TechnicalsService._default_technicals()

    @staticmethod
    def _default_technicals() -> Dict[str, Any]:
        return {
            "current_price": 0.0,
            "ma50": 0.0,
            "ma200": 0.0,
            "above_ma50": False,
            "above_ma200": False,
            "rsi14": 50.0,
            "wk52_low": 0.0,
            "wk52_high": 0.0,
            "wk52_position": 0.5,
            "volume_trend": "stable"
        }
