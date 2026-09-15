"""
Daily New Listings Auto-Sync Cron Job for VRIDDHI.

Runs every weekday evening at 18:30 IST (13:00 UTC) — after NSE/BSE market close.

What it does:
  1. Downloads the latest NSE EQUITY_L.csv master file from archives.nseindia.com
  2. Diffs it against our local nse500.json stock index
  3. Detects any newly listed companies (today's IPOs + recent new listings)
  4. Enriches them with yfinance data (sector, market cap, current price)
  5. Adds them automatically to the stock index (nse500.json) and new_listings.json log
  6. Triggers an automatic re-indexing of the search autocomplete universe

Crontab entry (add to VM crontab):
  30 13 * * 1-5 cd /var/www/vriddhi/backend && python jobs/new_listings_cron.py >> /var/log/vriddhi/new_listings_cron.log 2>&1
"""
import sys
import os
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import asyncio
import logging
from datetime import datetime, timezone

from app.services.new_listings import sync_new_listings, fetch_ipo_radar
from app.db import supabase

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S"
)
logger = logging.getLogger("new_listings_cron")


async def run_new_listings_cron():
    """Main cron job: sync new listings and log results."""
    start = datetime.now(timezone.utc)
    logger.info("=" * 60)
    logger.info(f"VRIDDHI New Listings Cron Job started at {start.isoformat()}")
    logger.info("=" * 60)

    # Step 1: Sync new listings from NSE master diff
    try:
        new_listings = await sync_new_listings()
        if new_listings:
            logger.info(f"✅ Detected {len(new_listings)} NEW listings today:")
            for nl in new_listings:
                logger.info(
                    f"  🆕 {nl['ticker']:20} | {nl['name'][:50]:50} | "
                    f"Listed: {nl.get('listing_date', 'N/A')} | "
                    f"Sector: {nl.get('sector', 'N/A')}"
                )

            # Step 2: Persist to Supabase filings_log table for dashboard notifications
            if supabase:
                for nl in new_listings:
                    try:
                        supabase.table("filings_log").upsert({
                            "ticker": nl["ticker"],
                            "title": f"🆕 New IPO Listing: {nl['name']}",
                            "url": f"https://www.nseindia.com/get-quotes/equity?symbol={nl['ticker'].replace('.NS', '')}",
                            "filing_type": "new_listing",
                            "published_at": nl.get("listing_date", start.strftime("%Y-%m-%d")),
                        }, on_conflict="ticker,url").execute()
                        logger.info(f"Saved new listing to filings_log: {nl['ticker']}")
                    except Exception as e:
                        logger.warning(f"Supabase save failed for {nl['ticker']}: {e}")
        else:
            logger.info("✅ No new listings detected since last sync. Stock universe is current.")

    except Exception as e:
        logger.error(f"❌ New listings sync failed: {e}", exc_info=True)

    # Step 3: Fetch and log active IPO radar (informational)
    try:
        ipos = await fetch_ipo_radar()
        if ipos:
            logger.info(f"\n📋 NSE IPO RADAR — {len(ipos)} active/upcoming IPOs:")
            for ipo in ipos:
                logger.info(
                    f"  {'🔴' if ipo.get('status') == 'Active' else '🟡'} "
                    f"{ipo.get('symbol', 'N/A'):20} | {ipo.get('companyName', '')[:45]:45} | "
                    f"Open: {ipo.get('issueStartDate', 'N/A')} → Close: {ipo.get('issueEndDate', 'N/A')} | "
                    f"Price: {ipo.get('issuePrice', 'N/A')} | Status: {ipo.get('status', 'N/A')}"
                )
    except Exception as e:
        logger.warning(f"IPO radar logging failed: {e}")

    elapsed = (datetime.now(timezone.utc) - start).total_seconds()
    logger.info(f"\nNew listings cron job completed in {elapsed:.1f}s")


if __name__ == "__main__":
    asyncio.run(run_new_listings_cron())
