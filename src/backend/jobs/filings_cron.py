import sys
import os
from pathlib import Path

# Ensure backend root is in sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import asyncio
import logging
from app.db import DatabaseManager, supabase
from app.services.filings import fetch_bse_announcements

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("filings_cron")


from app.services.monitoring import log_job_run_async

@log_job_run_async("filings_cron")
async def run_filings_cron():
    """Hourly scan of BSE filings and corporate announcements (TRD §8.4)."""
    watchlist = DatabaseManager.get_watchlist()
    tickers = list({item.get("ticker") for item in watchlist if item.get("ticker")})
    if not tickers:
        tickers = ["RELIANCE.NS", "TCS.NS", "HDFCBANK.NS", "INFY.NS"]

    logger.info(f"Running filings scan for {len(tickers)} active tickers...")
    total_processed = 0
    for ticker in tickers:
        try:
            announcements = await fetch_bse_announcements(ticker)
            logger.info(f"Fetched {len(announcements)} announcements for {ticker}")
            if supabase and announcements:
                for ann in announcements:
                    try:
                        supabase.table("filings_log").upsert({
                            "ticker": ticker,
                            "title": ann.get("title", ""),
                            "url": ann.get("url", ""),
                            "filing_type": ann.get("filing_type", "other"),
                            "published_at": ann.get("date", "")
                        }, on_conflict="ticker,url").execute()
                        total_processed += 1
                    except Exception as err:
                        logger.debug(f"Filings log upsert: {err}")
        except Exception as e:
            logger.warning(f"Failed to scan announcements for {ticker}: {e}")

    logger.info("Filings scan completed. All tickers current.")
    return total_processed


if __name__ == "__main__":
    asyncio.run(run_filings_cron())

