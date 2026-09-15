"""Background Automation Scheduler for VRIDDHI (TRD §8 & §14).
Runs:
- news_cron every 15 minutes (900s)
- filings_cron every 60 minutes (3600s)
- fundamentals_cron daily
"""
import sys
import os
import time
import asyncio
import logging
from datetime import datetime, timezone
from pathlib import Path

# Ensure backend root is in sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent))

from jobs.news_cron import run_news_cron
from jobs.filings_cron import run_filings_cron
from jobs.fundamentals_cron import run_fundamentals_cron
from jobs.deep_health_cron import run_deep_health_cron

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("scheduler")

async def schedule_deep_health_loop():
    while True:
        try:
            logger.info("Triggering deep health check cron...")
            await run_deep_health_cron()
        except Exception as e:
            logger.error(f"Error in deep health check cron: {e}")
        # Sleep for 15 minutes (900s)
        await asyncio.sleep(900)

async def schedule_news_loop():
    while True:
        try:
            logger.info("Triggering scheduled news & sentiment cron...")
            await run_news_cron()
        except Exception as e:
            logger.error(f"Error in scheduled news cron: {e}")
        # Sleep for 15 minutes (900s) per TRD §0 & §8.2
        await asyncio.sleep(900)


async def schedule_filings_loop():
    while True:
        try:
            logger.info("Triggering scheduled filings scan cron...")
            await run_filings_cron()
        except Exception as e:
            logger.error(f"Error in scheduled filings cron: {e}")
        # Sleep for 60 minutes (3600s) per TRD §8.4
        await asyncio.sleep(3600)


async def schedule_fundamentals_loop():
    # Run once on startup, then daily (every 24h)
    while True:
        try:
            logger.info("Triggering daily fundamentals refresh cron...")
            await run_fundamentals_cron()
        except Exception as e:
            logger.error(f"Error in fundamentals cron: {e}")
        # Sleep for 24 hours (86400s)
        await asyncio.sleep(86400)


async def main():
    logger.info("VRIDDHI Automated Background Scheduler started.")
    logger.info("- Deep Health Cron: every 15 min")
    logger.info("- News Cron: every 15 min")
    logger.info("- Filings Cron: every 60 min")
    logger.info("- Fundamentals Cron: daily sync")
    await asyncio.gather(
        schedule_deep_health_loop(),
        schedule_news_loop(),
        schedule_filings_loop(),
        schedule_fundamentals_loop()
    )


if __name__ == "__main__":
    asyncio.run(main())
