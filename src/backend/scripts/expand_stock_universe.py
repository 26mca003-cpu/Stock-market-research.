"""
Multi-Source Indian Stock Universe Expander for VRIDDHI.

Strategy (since BSE blocks direct API access):
  Source 1: NSE EQUITY_L.csv      → 2,568 NSE stocks (already done)
  Source 2: NSE Sectoral Indices  → Additional NSE stocks via index composition APIs
  Source 3: yfinance search       → Verify BSE-only tickers (.BO suffix) via ISIN mapping
  Source 4: NSE SME platform      → EMERGE (SME IPO) listed companies
  Source 5: NSE FO list           → All F&O eligible stocks
  Source 6: NSE IXIC/Holi lists  → All holiday/index listed stocks

Total target: 4,000–5,000 unique tickers
"""
import csv
import io
import json
import os
import sys
import time
import logging
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import httpx

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s: %(message)s")
logger = logging.getLogger("expand_stocks")

DATA_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "app", "data")
DATA_DIR = os.path.normpath(DATA_DIR)
OUTPUT_PATH = os.path.join(DATA_DIR, "nse500.json")

NSE_HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    "Accept-Language": "en-US,en;q=0.9",
    "Accept": "application/json, text/plain, */*",
    "Referer": "https://www.nseindia.com/",
}

# All known NSE equity list URLs (main + SME + additional segments)
NSE_EQUITY_URLS = [
    # Main equity list (EQ series)
    "https://archives.nseindia.com/content/equities/EQUITY_L.csv",
    # NSE SME Emerge list (572 additional SME/startup companies)
    "https://archives.nseindia.com/emerge/corporates/content/SME_EQUITY_L.csv",
]

# NSE Index composition APIs (correct path for cookie-based session)
NSE_INDEX_APIS = [
    "https://www.nseindia.com/api/allIndices",
    "https://www.nseindia.com/api/equity-stockIndices?index=NIFTY%20500",
    "https://www.nseindia.com/api/equity-stockIndices?index=NIFTY%20TOTAL%20MARKET",
    "https://www.nseindia.com/api/equity-stockIndices?index=NIFTY%20MICROCAP%20250",
    "https://www.nseindia.com/api/equity-stockIndices?index=NIFTY%20SMALLCAP%20250",
    "https://www.nseindia.com/api/equity-stockIndices?index=NIFTY%20MIDCAP%20150",
]


def load_existing() -> dict:
    """Load existing stock index as {symbol: entry}."""
    if not os.path.exists(OUTPUT_PATH):
        return {}
    with open(OUTPUT_PATH, "r", encoding="utf-8") as f:
        stocks = json.load(f)
    return {s["ticker"].replace(".NS", "").replace(".BO", "").upper(): s for s in stocks}


def parse_date(d: str) -> str | None:
    from datetime import datetime
    for fmt in ["%d-%b-%Y", "%d-%B-%Y", "%Y-%m-%d"]:
        try:
            return datetime.strptime(d.strip(), fmt).strftime("%Y-%m-%d")
        except Exception:
            pass
    return None


def fetch_nse_csv(url: str, client: httpx.Client) -> list[dict]:
    """Download and parse an NSE equity CSV file."""
    try:
        r = client.get(url, timeout=20)
        if r.status_code != 200 or "text/csv" not in r.headers.get("content-type", ""):
            logger.warning(f"CSV fetch failed: {url} -> {r.status_code}")
            return []
        reader = csv.DictReader(io.StringIO(r.text.strip()))
        results = []
        for row in reader:
            symbol = (row.get("SYMBOL") or row.get("Symbol") or "").strip()
            name = (row.get("NAME OF COMPANY") or row.get("Company Name") or "").strip()
            date_str = (row.get(" DATE OF LISTING") or row.get("DATE OF LISTING") or row.get("Date of Listing") or "").strip()
            isin = (row.get(" ISIN NUMBER") or row.get("ISIN") or "").strip()
            series = (row.get(" SERIES") or row.get("Series") or "EQ").strip()

            if not symbol:
                continue

            results.append({
                "ticker": f"{symbol}.NS",
                "name": name,
                "exchange": "NSE",
                "series": series,
                "isin": isin,
                "listing_date": parse_date(date_str),
            })
        logger.info(f"  Fetched {len(results)} stocks from {url.split('/')[-1]}")
        return results
    except Exception as e:
        logger.error(f"Error fetching {url}: {e}")
        return []


def fetch_nse_index(url: str, client: httpx.Client) -> list[dict]:
    """Fetch stock list from NSE index composition API."""
    try:
        r = client.get(url, timeout=15)
        if r.status_code != 200:
            return []
        data = r.json()
        stocks = data.get("data", [])
        results = []
        for item in stocks:
            symbol = item.get("symbol", "").strip()
            name = item.get("companyName", "").strip()
            if not symbol or symbol in ("NIFTY 50",):
                continue
            results.append({
                "ticker": f"{symbol}.NS",
                "name": name,
                "exchange": "NSE",
                "series": "EQ",
                "isin": item.get("isin", ""),
                "sector": item.get("industry", ""),
                "listing_date": None,
            })
        index_name = url.split("index=")[-1].replace("%20", " ")
        logger.info(f"  Index [{index_name}]: {len(results)} stocks")
        return results
    except Exception as e:
        logger.debug(f"Index fetch failed {url}: {e}")
        return []


def save_stock_index(index: dict) -> None:
    """Save merged stock index with priority ordering."""
    priority_symbols = [
        "RELIANCE", "TCS", "HDFCBANK", "INFY", "ICICIBANK", "HINDUNILVR", "ITC", "SBIN",
        "BHARTIARTL", "KOTAKBANK", "LT", "BAJFINANCE", "ASIANPAINT", "MARUTI", "HCLTECH",
        "SUNPHARMA", "AXISBANK", "TITAN", "TATAMOTORS", "ADANIENT", "ADANIPORTS", "ULTRACEMCO",
        "NTPC", "POWERGRID", "WIPRO", "ONGC", "JSWSTEEL", "TATASTEEL",
    ]
    priority_set = set(priority_symbols)
    all_stocks = list(index.values())
    top = [s for s in all_stocks if s["ticker"].split(".")[0] in priority_set]
    top.sort(key=lambda s: priority_symbols.index(s["ticker"].split(".")[0]) if s["ticker"].split(".")[0] in priority_set else 999)
    others = [s for s in all_stocks if s["ticker"].split(".")[0] not in priority_set]
    others.sort(key=lambda s: s["ticker"])
    combined = top + others
    with open(OUTPUT_PATH, "w", encoding="utf-8") as f:
        json.dump(combined, f, indent=2, ensure_ascii=False)
    logger.info(f"Saved {len(combined)} stocks to nse500.json")


def main():
    logger.info("=" * 60)
    logger.info("VRIDDHI Stock Universe Expander")
    logger.info("=" * 60)

    # Load existing index
    existing = load_existing()
    before_count = len(existing)
    logger.info(f"Existing stocks: {before_count}")

    client = httpx.Client(
        headers={"User-Agent": NSE_HEADERS["User-Agent"]},
        follow_redirects=True,
    )

    # --- SOURCE 1: NSE Main Equity CSV ---
    logger.info("\n[1/3] NSE Main Equity Lists (CSV)...")
    for url in NSE_EQUITY_URLS:
        stocks = fetch_nse_csv(url, client)
        new = 0
        for s in stocks:
            key = s["ticker"].replace(".NS", "").upper()
            if key not in existing:
                existing[key] = s
                new += 1
            else:
                # Update listing_date if missing
                if not existing[key].get("listing_date") and s.get("listing_date"):
                    existing[key]["listing_date"] = s["listing_date"]
                if not existing[key].get("isin") and s.get("isin"):
                    existing[key]["isin"] = s["isin"]
        logger.info(f"  +{new} new stocks from {url.split('/')[-1]}")

    after_csv = len(existing)
    logger.info(f"After CSV sources: {after_csv} stocks (+{after_csv - before_count})")

    # --- SOURCE 2: NSE Index APIs (with session) ---
    logger.info("\n[2/3] NSE Index Composition APIs...")
    nse_client = httpx.Client(
        headers=NSE_HEADERS,
        follow_redirects=True,
        timeout=15,
    )
    # Warm up NSE session
    try:
        nse_client.get("https://www.nseindia.com", timeout=10)
        time.sleep(0.5)
    except Exception:
        pass

    index_new = 0
    for url in NSE_INDEX_APIS:
        stocks = fetch_nse_index(url, nse_client)
        for s in stocks:
            key = s["ticker"].replace(".NS", "").upper()
            if key not in existing:
                existing[key] = s
                index_new += 1
            else:
                # Enrich with sector if missing
                if not existing[key].get("sector") and s.get("sector"):
                    existing[key]["sector"] = s["sector"]
        time.sleep(0.3)

    after_index = len(existing)
    logger.info(f"After index sources: {after_index} stocks (+{index_new} new from indices)")

    # --- SOURCE 3: NSE F&O List (additional mainboard stocks) ---
    logger.info("\n[3/3] NSE F&O Eligible Stocks...")
    try:
        r = nse_client.get("https://www.nseindia.com/api/master-quote", timeout=10)
        if r.status_code == 200 and r.text.strip():
            data = r.json()
            fo_new = 0
            for symbol in data:
                key = symbol.strip().upper()
                if key and key not in existing:
                    existing[key] = {
                        "ticker": f"{key}.NS",
                        "name": key,
                        "exchange": "NSE",
                        "series": "EQ",
                    }
                    fo_new += 1
            logger.info(f"  +{fo_new} new stocks from F&O list")
    except Exception as e:
        logger.debug(f"F&O list failed: {e}")

    # --- FINAL SAVE ---
    final_count = len(existing)
    save_stock_index(existing)

    logger.info("\n" + "=" * 60)
    logger.info("EXPANSION COMPLETE")
    logger.info("=" * 60)
    logger.info(f"Before : {before_count:,} stocks")
    logger.info(f"After  : {final_count:,} stocks")
    logger.info(f"Added  : {final_count - before_count:,} new stocks")


if __name__ == "__main__":
    main()
