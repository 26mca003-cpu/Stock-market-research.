import sys
import os
from pathlib import Path

# Ensure backend root is in sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import asyncio
import logging
from app.services.monitoring import deep_health_check, log_job_run_async

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("deep_health_cron")

@log_job_run_async("deep_health")
async def run_deep_health_cron():
    """Runs the deep health check for all components and stores in system_checks."""
    logger.info("Running deep health check...")
    results = await deep_health_check()
    
    ok_count = sum(1 for r in results if r.get("status") == "ok")
    logger.info(f"Deep health check completed. {ok_count}/{len(results)} components OK.")
    
    return len(results)

if __name__ == "__main__":
    asyncio.run(run_deep_health_cron())
