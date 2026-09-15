import sys
import os
from pathlib import Path

# Ensure backend root is in sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import asyncio
import logging
from app.db import DatabaseManager
from app.services.news import NewsService

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("news_cron")


from app.services.monitoring import log_job_run_async

@log_job_run_async("news_cron")
async def run_news_cron():
    """Fetch latest Google News RSS and score sentiment for all watchlisted tickers."""
    watchlist = DatabaseManager.get_watchlist()
    tickers = list({item.get("ticker") for item in watchlist if item.get("ticker")})
    
    if not tickers:
        tickers = ["RELIANCE.NS", "TCS.NS", "HDFCBANK.NS", "INFY.NS"]

    logger.info(f"Running news cron for {len(tickers)} tickers...")
    total_processed = 0
    for sym in tickers:
        clean_name = sym.replace(".NS", "").replace(".BO", "")
        try:
            items = await NewsService.get_stock_news(sym, clean_name)
            total_processed += len(items)
            logger.info(f"Processed {len(items)} news items for {sym}")
        except Exception as e:
            logger.warning(f"Failed news fetch for {sym}: {e}")

    logger.info("News cron completed successfully.")
    return total_processed


if __name__ == "__main__":
    asyncio.run(run_news_cron())
