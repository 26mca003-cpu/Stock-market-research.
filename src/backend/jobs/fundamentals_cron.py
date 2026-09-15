import sys
import os
from pathlib import Path

# Ensure backend root is in sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import asyncio
import logging
from app.db import DatabaseManager
from app.services.screener import ScreenerService
from app.services.market_data import MarketDataService

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("fundamentals_cron")


from app.services.monitoring import log_job_run_async

@log_job_run_async("fundamentals_cron")
async def run_fundamentals_cron():
    """Daily refresh of stock fundamentals for watchlisted tickers."""
    watchlist = DatabaseManager.get_watchlist()
    tickers = list({item.get("ticker") for item in watchlist if item.get("ticker")})
    if not tickers:
        tickers = ["RELIANCE.NS", "TCS.NS"]

    logger.info(f"Running daily fundamentals refresh for {len(tickers)} stocks...")
    total_processed = 0
    for sym in tickers:
        clean_sym = sym.replace(".NS", "").replace(".BO", "")
        try:
            yf_data = MarketDataService.get_fundamentals(sym)
            scr_data = await ScreenerService.fetch_screener_data(clean_sym)
            merged = {"yf": yf_data, "screener": scr_data}
            DatabaseManager.save_stock_fundamentals(sym, merged)
            total_processed += 1
            logger.info(f"Updated fundamentals cache for {sym}")
        except Exception as e:
            logger.error(f"Error updating fundamentals for {sym}: {e}")

    logger.info("Daily fundamentals cron completed.")
    return total_processed


if __name__ == "__main__":
    asyncio.run(run_fundamentals_cron())
