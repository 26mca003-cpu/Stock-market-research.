"""
VRIDDHI Stock Universe Final Expander - Phase 2.

Adds all remaining stocks using NSE daily bhav copy (price file) which contains
EVERY stock that traded on NSE that day — including all EQ, SME, BE, BZ segments.
This is the most complete freely available source for all NSE-listed equities.

Also uses the NSE F&O participant-wise data to get every F&O-eligible stock.
"""
import csv
import io
import json
import os
import sys
import time
import logging
from pathlib import Path
from datetime import datetime, timedelta

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
import httpx

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s: %(message)s")
logger = logging.getLogger("expand_v2")

DATA_DIR = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "app", "data"))
OUTPUT_PATH = os.path.join(DATA_DIR, "nse500.json")

NSE_HEADERS = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"}


def load_existing() -> dict:
    with open(OUTPUT_PATH, "r", encoding="utf-8") as f:
        stocks = json.load(f)
    return {s["ticker"].split(".")[0].upper(): s for s in stocks}


def save_index(index: dict):
    priority = [
        "RELIANCE", "TCS", "HDFCBANK", "INFY", "ICICIBANK", "HINDUNILVR", "ITC", "SBIN",
        "BHARTIARTL", "KOTAKBANK", "LT", "BAJFINANCE", "ASIANPAINT", "MARUTI", "HCLTECH",
        "SUNPHARMA", "AXISBANK", "TITAN", "TATAMOTORS", "ADANIENT", "ADANIPORTS",
    ]
    p_set = set(priority)
    top = sorted([s for s in index.values() if s["ticker"].split(".")[0] in p_set],
                 key=lambda s: priority.index(s["ticker"].split(".")[0]) if s["ticker"].split(".")[0] in p_set else 999)
    others = sorted([s for s in index.values() if s["ticker"].split(".")[0] not in p_set],
                    key=lambda s: s["ticker"])
    combined = top + others
    with open(OUTPUT_PATH, "w", encoding="utf-8") as f:
        json.dump(combined, f, indent=2, ensure_ascii=False)
    logger.info(f"Saved {len(combined):,} stocks to nse500.json")
    return len(combined)


def fetch_bhav_copy(client: httpx.Client) -> dict:
    """
    Download NSE CM bhav copy (daily price file) which contains every equity
    that traded on NSE. Uses the new 2022+ NSE Archives format.
    Returns {symbol: {ticker, name, exchange, series, isin}} dict.
    """
    found = {}
    today = datetime.now()

    for days_back in range(1, 8):
        dt = today - timedelta(days=days_back)
        if dt.weekday() >= 5:  # Skip weekends
            continue

        date_compact = dt.strftime("%Y%m%d")  # e.g. 20260911

        # New NSE Archives format (2022+)
        url = f"https://nsearchives.nseindia.com/content/cm/BhavCopy_NSE_CM_0_0_0_{date_compact}_F_0000.csv.zip"
        try:
            logger.info(f"Trying bhav copy: {url}")
            r = client.get(url, timeout=25)
            if r.status_code == 200 and len(r.content) > 10000:
                import zipfile
                with zipfile.ZipFile(io.BytesIO(r.content)) as zf:
                    for name in zf.namelist():
                        if name.endswith(".csv"):
                            with zf.open(name) as csvfile:
                                reader = csv.DictReader(io.TextIOWrapper(csvfile, encoding="utf-8"))
                                for row in reader:
                                    symbol = (row.get("TckrSymb") or row.get("SYMBOL") or "").strip().upper()
                                    series = (row.get("SctySrs") or row.get("SERIES") or "").strip()
                                    isin = (row.get("ISIN") or "").strip()
                                    name_val = (row.get("FinInstrmNm") or symbol)
                                    if symbol and series in ("EQ", "BE", "BZ", "SM", "ST", "N1", "N2", "N3", "N4", "GR"):
                                        found[symbol] = {
                                            "ticker": f"{symbol}.NS",
                                            "name": name_val.strip() if name_val else symbol,
                                            "exchange": "NSE",
                                            "series": series,
                                            "isin": isin,
                                        }
                logger.info(f"Bhav copy ({dt.strftime('%Y-%m-%d')}): {len(found):,} equity symbols")
                return found
            else:
                logger.debug(f"  Not found: {r.status_code}")
        except Exception as e:
            logger.debug(f"  Bhav {date_compact} error: {e}")

    logger.warning("Could not fetch bhav copy — NSE archives may be updating")
    return found


def fetch_nse_fno_symbols(client: httpx.Client) -> list[str]:
    """Get all F&O enabled stock symbols from NSE."""
    try:
        # Warm NSE session
        client.get("https://www.nseindia.com", timeout=8)
        time.sleep(0.5)
        r = client.get(
            "https://www.nseindia.com/api/equity-stock-indices-data?index=SECURITIES%20IN%20F%26O",
            timeout=10,
        )
        if r.status_code == 200:
            data = r.json()
            stocks = data.get("data", [])
            symbols = [s.get("symbol", "").strip().upper() for s in stocks if s.get("symbol")]
            logger.info(f"F&O API: {len(symbols)} symbols")
            return symbols
    except Exception as e:
        logger.debug(f"F&O fetch failed: {e}")
    return []


def main():
    logger.info("=" * 60)
    logger.info("VRIDDHI Phase 2 Stock Expander — Bhav Copy + F&O")
    logger.info("=" * 60)

    existing = load_existing()
    before = len(existing)
    logger.info(f"Current index: {before:,} stocks")

    client = httpx.Client(headers=NSE_HEADERS, follow_redirects=True)

    # --- Source: Bhav Copy (most complete) ---
    logger.info("\n[1/2] NSE Daily Bhav Copy (all traded equities)...")
    bhav = fetch_bhav_copy(client)
    bhav_new = 0
    for symbol, entry in bhav.items():
        if symbol not in existing:
            existing[symbol] = entry
            bhav_new += 1
        else:
            # Update ISIN if missing
            if not existing[symbol].get("isin") and entry.get("isin"):
                existing[symbol]["isin"] = entry["isin"]
    logger.info(f"Bhav copy: +{bhav_new} new symbols")

    # --- Source: F&O stocks ---
    logger.info("\n[2/2] NSE F&O Eligible Stocks...")
    fno_client = httpx.Client(
        headers={
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
            "Accept": "application/json, text/plain, */*",
            "Referer": "https://www.nseindia.com/",
        },
        follow_redirects=True,
    )
    fno_symbols = fetch_nse_fno_symbols(fno_client)
    fno_new = 0
    for symbol in fno_symbols:
        if symbol and symbol not in existing:
            existing[symbol] = {
                "ticker": f"{symbol}.NS",
                "name": symbol,
                "exchange": "NSE",
                "series": "EQ",
            }
            fno_new += 1
    logger.info(f"F&O: +{fno_new} new symbols")

    # --- Save ---
    final = save_index(existing)

    logger.info("\n" + "=" * 60)
    logger.info("COMPLETE")
    logger.info(f"Before : {before:,}")
    logger.info(f"After  : {final:,}")
    logger.info(f"Added  : {final - before:,} new stocks")
    logger.info("=" * 60)


if __name__ == "__main__":
    main()
