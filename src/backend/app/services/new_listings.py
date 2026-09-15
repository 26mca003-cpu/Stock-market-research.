"""
New Listings Detection Service for VRIDDHI.

Automatically detects when private companies go public (IPO listing) by:
1. Diffing the official NSE EQUITY_L.csv master file against the local database daily.
2. Fetching the NSE upcoming/active IPO radar API for pre-listing intelligence.
3. Enriching new tickers with yfinance company info and listing price.
"""

import csv
import io
import json
import logging
import os
from datetime import datetime, timezone, timedelta
from typing import List, Optional, Dict, Any

import httpx

logger = logging.getLogger(__name__)

# Official NSE master equity list (updated daily by NSE post-market close)
NSE_EQUITY_URL = "https://archives.nseindia.com/content/equities/EQUITY_L.csv"

# NSE SME EMERGE listed companies (separate from main equity list)
NSE_SME_URL = "https://archives.nseindia.com/emerge/corporates/content/SME_EQUITY_L.csv"

# NSE Bhav Copy (most complete — all traded series): BhavCopy_NSE_CM_0_0_0_{YYYYMMDD}_F_0000.csv.zip
NSE_BHAV_BASE = "https://nsearchives.nseindia.com/content/cm/BhavCopy_NSE_CM_0_0_0_{date}_F_0000.csv.zip"

# NSE IPO radar — active & upcoming IPOs (real-time, no auth required)
NSE_IPO_URL = "https://www.nseindia.com/api/all-upcoming-issues?category=ipo"

# Local data paths
DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data")
STOCK_INDEX_PATH = os.path.join(DATA_DIR, "nse500.json")
NEW_LISTINGS_PATH = os.path.join(DATA_DIR, "new_listings.json")

# NSE session headers (required to avoid 401 on some API endpoints)
NSE_HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept-Language": "en-US,en;q=0.9",
    "Accept": "application/json, text/plain, */*",
    "Referer": "https://www.nseindia.com/",
}


def _load_stock_index() -> Dict[str, dict]:
    """Load existing stock index as {symbol: entry} dict."""
    if not os.path.exists(STOCK_INDEX_PATH):
        return {}
    with open(STOCK_INDEX_PATH, "r", encoding="utf-8") as f:
        stocks = json.load(f)
    return {s["ticker"].replace(".NS", "").upper(): s for s in stocks}


def _save_stock_index(index: Dict[str, dict]) -> None:
    """Save stock index back to nse500.json preserving priority order."""
    priority_symbols = [
        "RELIANCE", "TCS", "HDFCBANK", "INFY", "ICICIBANK", "HINDUNILVR", "ITC", "SBIN",
        "BHARTIARTL", "KOTAKBANK", "LT", "BAJFINANCE", "ASIANPAINT", "MARUTI", "HCLTECH",
        "SUNPHARMA", "AXISBANK", "TITAN", "TATAMOTORS", "ADANIENT", "ADANIPORTS", "ULTRACEMCO",
        "NTPC", "POWERGRID", "WIPRO", "ONGC", "JSWSTEEL", "TATASTEEL",
    ]
    priority_set = set(priority_symbols)

    all_stocks = list(index.values())
    top = [s for s in all_stocks if s["ticker"].replace(".NS", "") in priority_set]
    top.sort(key=lambda s: priority_symbols.index(s["ticker"].replace(".NS", "")) if s["ticker"].replace(".NS", "") in priority_set else 999)
    others = [s for s in all_stocks if s["ticker"].replace(".NS", "") not in priority_set]
    others.sort(key=lambda s: s["ticker"])

    combined = top + others
    with open(STOCK_INDEX_PATH, "w", encoding="utf-8") as f:
        json.dump(combined, f, indent=2, ensure_ascii=False)
    logger.info(f"Stock index updated: {len(combined)} total stocks saved.")


def _parse_date(date_str: str) -> Optional[datetime]:
    """Parse NSE date string like '11-SEP-2026' or '11-Sep-26'."""
    if not date_str:
        return None
    for fmt in ("%d-%b-%Y", "%d-%b-%y", "%Y-%m-%d", "%d/%m/%Y"):
        try:
            return datetime.strptime(date_str.strip(), fmt)
        except Exception:
            pass
    return None


async def fetch_nse_master() -> List[Dict[str, Any]]:
    """Download and parse all NSE equity sources: main list + SME + bhav copy."""
    async with httpx.AsyncClient(timeout=25.0) as client:
        all_stocks: Dict[str, Dict[str, Any]] = {}

        # Source 1: Main NSE equity list + SME EMERGE list
        for url in [NSE_EQUITY_URL, NSE_SME_URL]:
            try:
                r = await client.get(url, headers={"User-Agent": NSE_HEADERS["User-Agent"]})
                if r.status_code == 200:
                    reader = csv.DictReader(io.StringIO(r.text.strip()))
                    for row in reader:
                        symbol = (row.get("SYMBOL") or "").strip().upper()
                        name = (row.get("NAME OF COMPANY") or row.get("NAME_OF_COMPANY") or "").strip()
                        series = (row.get(" SERIES") or row.get("SERIES") or "").strip()
                        date_str = (row.get(" DATE OF LISTING") or row.get("DATE_OF_LISTING") or "").strip()
                        isin = (row.get(" ISIN NUMBER") or row.get("ISIN_NUMBER") or "").strip()
                        if not symbol:
                            continue
                        listing_date = _parse_date(date_str)
                        is_sme = (url == NSE_SME_URL) or (series in ("SM", "ST"))
                        all_stocks[symbol] = {
                            "ticker": f"{symbol}.NS",
                            "name": name,
                            "exchange": "NSE SME" if is_sme else "NSE",
                            "series": series or ("SM" if is_sme else "EQ"),
                            "isin": isin,
                            "is_sme": is_sme,
                            "category": "SME EMERGE" if is_sme else "Mainboard",
                            "listing_date": listing_date.strftime("%Y-%m-%d") if listing_date else None,
                        }
                    logger.info(f"Fetched from {url.split('/')[-1]}: {len(all_stocks)} total so far")
            except Exception as e:
                logger.warning(f"Failed to fetch {url}: {e}")

        # Source 2: Bhav copy — catches all traded series (BE, BZ, SM, ST etc.)
        try:
            from datetime import datetime as dt, timedelta
            import zipfile
            today = dt.now()
            for days_back in range(1, 6):
                d = today - timedelta(days=days_back)
                if d.weekday() >= 5:
                    continue
                bhav_url = NSE_BHAV_BASE.format(date=d.strftime("%Y%m%d"))
                try:
                    r2 = await client.get(bhav_url, headers={"User-Agent": NSE_HEADERS["User-Agent"]}, timeout=20)
                    if r2.status_code == 200 and len(r2.content) > 10000:
                        import io as _io
                        with zipfile.ZipFile(_io.BytesIO(r2.content)) as zf:
                            for fname in zf.namelist():
                                if fname.endswith(".csv"):
                                    with zf.open(fname) as csvfile:
                                        reader = csv.DictReader(io.TextIOWrapper(csvfile, encoding="utf-8"))
                                        for row in reader:
                                            sym = (row.get("TckrSymb") or "").strip().upper()
                                            series = (row.get("SctySrs") or "").strip()
                                            isin = (row.get("ISIN") or "").strip()
                                            nm = (row.get("FinInstrmNm") or sym)
                                            if sym and series in ("EQ", "BE", "BZ", "SM", "ST", "N1", "N2", "N3", "N4", "GR"):
                                                if sym not in all_stocks:
                                                    is_sme = series in ("SM", "ST")
                                                    all_stocks[sym] = {
                                                        "ticker": f"{sym}.NS",
                                                        "name": nm.strip() if nm else sym,
                                                        "exchange": "NSE SME" if is_sme else "NSE",
                                                        "series": series,
                                                        "isin": isin,
                                                        "is_sme": is_sme,
                                                        "category": "SME EMERGE" if is_sme else "Mainboard",
                                                        "listing_date": None,
                                                    }
                        logger.info(f"Bhav copy ({d.strftime('%Y-%m-%d')}): {len(all_stocks)} total stocks")
                        break
                except Exception as e:
                    logger.debug(f"Bhav copy {d.strftime('%Y-%m-%d')} failed: {e}")
        except Exception as e:
            logger.warning(f"Bhav copy expansion failed: {e}")

    return list(all_stocks.values())


async def fetch_sme_ipos() -> List[Dict[str, Any]]:
    """Fetch live active & forthcoming SME IPOs from Chittorgarh SME Dashboard."""
    headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"}
    try:
        from bs4 import BeautifulSoup
        import re
        async with httpx.AsyncClient(headers=headers, timeout=12.0) as client:
            r = await client.get("https://www.chittorgarh.com/ipo/ipo_dashboard.asp?a=sme")
            if r.status_code != 200:
                return []

            soup = BeautifulSoup(r.text, "html.parser")
            tables = soup.find_all("table")
            if not tables:
                return []

            results = []
            current_year = datetime.now().year
            for tr in tables[0].find_all("tr"):
                a = tr.find("a")
                if not a:
                    continue
                name = a.get_text(strip=True)
                url = a.get("href", "")
                full_text = tr.get_text(separator=" | ", strip=True)

                # Determine status
                if " | O | " in full_text or "Open" in full_text:
                    status = "Active"
                elif " | P | " in full_text or "Closed" in full_text:
                    status = "Closed"
                else:
                    status = "Forthcoming"

                # Extract date range
                parts = [p.strip() for p in full_text.split("|") if p.strip() and p.strip() not in ("O", "P")]
                date_range = parts[-1] if len(parts) > 1 else ""
                start_date, end_date = "", ""
                if "-" in date_range:
                    dp = date_range.split("-")
                    month_part = ""
                    if len(dp[1].strip().split()) > 1:
                        month_part = " " + dp[1].strip().split()[1]
                    start_date = dp[0].strip() + month_part + f" {current_year}"
                    end_date = dp[1].strip() + f" {current_year}"
                else:
                    start_date = date_range
                    end_date = date_range

                # Generate clean symbol slug
                slug_match = re.search(r"/ipo/([a-z0-9\-]+)-ipo/", url)
                if slug_match:
                    slug_parts = slug_match.group(1).split("-")
                    symbol = "".join([p[:4] for p in slug_parts[:2]]).upper()
                else:
                    symbol = re.sub(r"[^A-Z0-9]", "", name.upper())[:8]

                results.append({
                    "symbol": symbol,
                    "company_name": name,
                    "issue_start_date": start_date.strip(),
                    "issue_end_date": end_date.strip(),
                    "issue_price": "SME Band",
                    "issue_size": "SME EMERGE",
                    "status": status,
                    "series": "SM",
                    "category": "SME IPO",
                    "exchange": "NSE SME / BSE SME",
                    "lot_size": "1,000+ Shares",
                    "is_sme": True,
                })
            return results
    except Exception as e:
        logger.warning(f"SME IPO fetch failed: {e}")
        return []


async def fetch_mainboard_chittorgarh_ipos() -> List[Dict[str, Any]]:
    """Fetch live, forthcoming, and recent Mainboard IPOs from Chittorgarh Mainboard Dashboard."""
    headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"}
    try:
        from bs4 import BeautifulSoup
        import re
        async with httpx.AsyncClient(headers=headers, timeout=12.0) as client:
            r = await client.get("https://www.chittorgarh.com/ipo/ipo_dashboard.asp")
            if r.status_code != 200:
                return []

            soup = BeautifulSoup(r.text, "html.parser")
            tables = soup.find_all("table")
            if not tables:
                return []

            results = []
            current_year = datetime.now().year
            for tr in tables[0].find_all("tr"):
                a = tr.find("a")
                if not a:
                    continue
                name = a.get_text(strip=True)
                url = a.get("href", "")
                full_text = tr.get_text(separator=" | ", strip=True)

                # Determine status
                if " | O | " in full_text or "Open" in full_text:
                    status = "Active"
                elif " | P | " in full_text or "Closed" in full_text:
                    status = "Closed"
                else:
                    status = "Forthcoming"

                # Extract date range
                parts = [p.strip() for p in full_text.split("|") if p.strip() and p.strip() not in ("O", "P")]
                date_range = parts[-1] if len(parts) > 1 else ""
                start_date, end_date = "", ""
                if "-" in date_range:
                    dp = date_range.split("-")
                    month_part = ""
                    if len(dp[1].strip().split()) > 1:
                        month_part = " " + dp[1].strip().split()[1]
                    start_date = dp[0].strip() + month_part + f" {current_year}"
                    end_date = dp[1].strip() + f" {current_year}"
                else:
                    start_date = date_range
                    end_date = date_range

                # Generate clean symbol slug
                slug_match = re.search(r"/ipo/([a-z0-9\-]+)-ipo/", url)
                if slug_match:
                    slug_parts = slug_match.group(1).split("-")
                    symbol = "".join([p[:4] for p in slug_parts[:2]]).upper()
                else:
                    symbol = re.sub(r"[^A-Z0-9]", "", name.upper())[:8]

                results.append({
                    "symbol": symbol,
                    "company_name": name,
                    "issue_start_date": start_date.strip(),
                    "issue_end_date": end_date.strip(),
                    "issue_price": "Book Built",
                    "issue_size": "Mainboard",
                    "status": status,
                    "series": "EQ",
                    "category": "Mainboard IPO",
                    "exchange": "BSE / NSE",
                    "lot_size": "15-50 Shares",
                    "is_sme": False,
                })
            return results
    except Exception as e:
        logger.warning(f"Mainboard Chittorgarh IPO fetch failed: {e}")
        return []


async def fetch_ipo_radar() -> List[Dict[str, Any]]:
    """Fetch all active & upcoming IPOs (Mainboard from NSE + Chittorgarh Mainboard + Chittorgarh SME)."""
    import re
    all_ipos: List[Dict[str, Any]] = []
    seen_names = set()

    def _normalize_name(name: str) -> str:
        n = name.lower()
        n = re.sub(r"\b(limited|ltd|pvt|private|india|ipo)\b", "", n)
        return re.sub(r"[^a-z0-9]", "", n)

    # 1. Fetch Mainboard IPOs from official NSE API
    try:
        async with httpx.AsyncClient(timeout=15.0, headers=NSE_HEADERS) as client:
            await client.get("https://www.nseindia.com", timeout=10.0)
            r = await client.get(NSE_IPO_URL)
            if r.status_code == 200 and r.text.strip():
                for item in r.json():
                    c_name = item.get("companyName", "")
                    norm = _normalize_name(c_name)
                    if norm:
                        seen_names.add(norm)
                    all_ipos.append({
                        "symbol": item.get("symbol", ""),
                        "company_name": c_name,
                        "issue_start_date": item.get("issueStartDate", ""),
                        "issue_end_date": item.get("issueEndDate", ""),
                        "issue_price": item.get("issuePrice", ""),
                        "issue_size": str(item.get("issueSize", "")),
                        "status": item.get("status", ""),
                        "series": "EQ",
                        "category": "Mainboard IPO",
                        "exchange": "NSE",
                        "lot_size": "15-50 Shares",
                        "is_sme": False,
                    })
    except Exception as e:
        logger.warning(f"Mainboard IPO radar fetch failed: {e}")

    # 2. Fetch Mainboard IPOs from Chittorgarh (to include Kanohar Electricals, Glass Wall Systems, etc.)
    try:
        chittor_mainboard = await fetch_mainboard_chittorgarh_ipos()
        for item in chittor_mainboard:
            norm = _normalize_name(item["company_name"])
            if norm not in seen_names:
                seen_names.add(norm)
                all_ipos.append(item)
    except Exception as e:
        logger.warning(f"Failed adding Chittorgarh Mainboard IPOs: {e}")

    # 3. Fetch SME IPOs
    try:
        sme_ipos = await fetch_sme_ipos()
        for item in sme_ipos:
            norm = _normalize_name(item["company_name"])
            if norm not in seen_names:
                seen_names.add(norm)
                all_ipos.append(item)
    except Exception as e:
        logger.warning(f"Failed adding SME IPOs: {e}")

    return all_ipos


async def sync_new_listings() -> List[Dict[str, Any]]:
    """
    Core sync worker: detects newly listed companies by diffing exchange master
    against our local stock index. Returns list of newly discovered stocks.
    """
    logger.info("Starting new listings sync worker...")

    # Load existing index
    existing_index = _load_stock_index()
    logger.info(f"Existing local stock index: {len(existing_index)} companies.")

    # Download fresh master list from NSE
    try:
        nse_master = await fetch_nse_master()
    except Exception as e:
        logger.error(f"Failed to download NSE master list: {e}")
        return []

    logger.info(f"NSE master list: {len(nse_master)} companies.")

    # Detect new listings (in NSE master but NOT in our local index)
    new_listings = []
    for stock in nse_master:
        symbol = stock["ticker"].replace(".NS", "").upper()
        if symbol not in existing_index:
            # Enrich with yfinance company info
            enriched = await _enrich_new_listing(stock)
            new_listings.append(enriched)
            # Add to index
            existing_index[symbol] = {
                "ticker": stock["ticker"],
                "name": enriched.get("name", stock["name"]),
                "exchange": "NSE",
                "is_new_listing": True,
                "listing_date": stock.get("listing_date"),
            }
            logger.info(f"New listing detected: {stock['ticker']} — {stock['name']} (Listed: {stock.get('listing_date')})")

    if new_listings:
        logger.info(f"Found {len(new_listings)} newly listed companies! Updating stock index...")
        _save_stock_index(existing_index)
        _save_new_listings_log(new_listings)
    else:
        logger.info("No new listings detected since last sync.")

    return new_listings


async def _enrich_new_listing(stock: Dict[str, Any]) -> Dict[str, Any]:
    """Attempt to enrich a new listing with yfinance data."""
    ticker = stock["ticker"]
    enriched = dict(stock)
    enriched["detected_at"] = datetime.now(timezone.utc).isoformat()
    enriched["is_new_listing"] = True

    try:
        import yfinance as yf
        info = yf.Ticker(ticker).info
        enriched["name"] = info.get("longName") or stock["name"]
        enriched["sector"] = info.get("sector", "")
        enriched["industry"] = info.get("industry", "")
        enriched["market_cap"] = info.get("marketCap")
        enriched["current_price"] = info.get("currentPrice") or info.get("regularMarketPrice")
        enriched["website"] = info.get("website", "")
        logger.info(f"Enriched {ticker} with yfinance: {enriched['name']}")
    except Exception as e:
        logger.debug(f"yfinance enrichment skipped for {ticker}: {e}")

    return enriched


def _save_new_listings_log(new_listings: List[Dict[str, Any]]) -> None:
    """Append newly detected listings to the new_listings.json log file."""
    existing = []
    if os.path.exists(NEW_LISTINGS_PATH):
        try:
            with open(NEW_LISTINGS_PATH, "r", encoding="utf-8") as f:
                existing = json.load(f)
        except Exception:
            existing = []

    # Merge, avoiding duplicates by ticker
    existing_tickers = {e["ticker"] for e in existing}
    for nl in new_listings:
        if nl["ticker"] not in existing_tickers:
            existing.append(nl)
            existing_tickers.add(nl["ticker"])

    # Sort by listing date descending
    existing.sort(key=lambda x: x.get("listing_date", "") or "", reverse=True)

    with open(NEW_LISTINGS_PATH, "w", encoding="utf-8") as f:
        json.dump(existing, f, indent=2, ensure_ascii=False)
    logger.info(f"New listings log saved with {len(existing)} total entries.")


def get_recent_listings(days_back: int = 90) -> List[Dict[str, Any]]:
    """Return recently listed companies (default: last 90 days). Used by API endpoint."""
    if not os.path.exists(NEW_LISTINGS_PATH):
        # Build initial cache from master stock index listing dates
        return _build_recent_from_master(days_back)

    try:
        with open(NEW_LISTINGS_PATH, "r", encoding="utf-8") as f:
            all_listings = json.load(f)

        cutoff = (datetime.now() - timedelta(days=days_back)).strftime("%Y-%m-%d")
        return [l for l in all_listings if (l.get("listing_date") or "") >= cutoff]
    except Exception as e:
        logger.error(f"Error reading new listings: {e}")
        return _build_recent_from_master(days_back)


def _build_recent_from_master(days_back: int = 90) -> List[Dict[str, Any]]:
    """Build recent listings from nse500.json listing dates (initial state)."""
    if not os.path.exists(STOCK_INDEX_PATH):
        return []
    try:
        with open(STOCK_INDEX_PATH, "r", encoding="utf-8") as f:
            all_stocks = json.load(f)
        cutoff = (datetime.now() - timedelta(days=days_back)).strftime("%Y-%m-%d")
        recent = []
        for s in all_stocks:
            ld = s.get("listing_date") or ""
            if ld and ld >= cutoff:
                is_sme = bool(s.get("is_sme") or s.get("series") in ("SM", "ST") or s.get("exchange") == "NSE SME")
                item = dict(s)
                item["is_sme"] = is_sme
                item["category"] = "SME EMERGE" if is_sme else "Mainboard"
                item["exchange"] = "NSE SME" if is_sme else s.get("exchange", "NSE")
                recent.append(item)
        recent.sort(key=lambda x: x.get("listing_date") or "", reverse=True)
        return recent
    except Exception:
        return []
