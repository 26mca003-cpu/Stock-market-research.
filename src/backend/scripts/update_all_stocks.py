"""Script to fetch and index all active Indian listed stocks from official NSE archives (TRD §5)."""
import csv
import io
import json
import os
import httpx

OUTPUT_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "app", "data", "nse500.json")
NSE_EQUITY_URL = "https://archives.nseindia.com/content/equities/EQUITY_L.csv"

# Top well-known bluechips to place at top of search priority
PRIORITY_SYMBOLS = [
    "RELIANCE", "TCS", "HDFCBANK", "INFY", "ICICIBANK", "HINDUNILVR", "ITC", "SBIN",
    "BHARTIARTL", "KOTAKBANK", "LT", "BAJFINANCE", "ASIANPAINT", "MARUTI", "HCLTECH",
    "SUNPHARMA", "AXISBANK", "TITAN", "TATAMOTORS", "ADANIENT", "ADANIPORTS", "ULTRACEMCO",
    "NTPC", "POWERGRID", "WIPRO", "ONGC", "JSWSTEEL", "TATASTEEL", "M&M", "COALINDIA",
    "BAJAJFINSV", "NESTLEIND", "GRASIM", "TECHM", "EICHERMOT", "INDUSINDBK", "CIPLA",
    "DRREDDY", "BRITANNIA", "APOLLOHOSP", "HEROMOTOCO", "DIVISLAB", "HINDALCO", "BPCL",
    "TATACONSUM", "SBILIFE", "HDFCLIFE", "LTIM", "SHRIRAMFIN", "TRENT", "ZOMATO"
]


def update_all_indian_stocks():
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
    }
    print(f"Fetching official NSE equity list from {NSE_EQUITY_URL}...")
    response = httpx.get(NSE_EQUITY_URL, headers=headers, timeout=20.0)
    response.raise_for_status()

    reader = csv.DictReader(io.StringIO(response.text.strip()))
    all_stocks = []
    seen = set()

    raw_list = []
    for row in reader:
        symbol = row.get("SYMBOL", "").strip()
        name = row.get("NAME OF COMPANY", "").strip()
        date_str = row.get(" DATE OF LISTING", "").strip()
        isin = row.get(" ISIN NUMBER", "").strip()

        if not symbol or symbol in seen:
            continue
        seen.add(symbol)

        # Parse listing date
        listing_date = None
        try:
            from datetime import datetime
            listing_date = datetime.strptime(date_str, "%d-%b-%Y").strftime("%Y-%m-%d")
        except Exception:
            pass

        raw_list.append({
            "ticker": f"{symbol}.NS",
            "name": name,
            "exchange": "NSE",
            "isin": isin,
            "listing_date": listing_date,
        })

    # Sort with priority symbols first, then alphabetically
    priority_set = set(PRIORITY_SYMBOLS)
    top_stocks = [s for s in raw_list if s["ticker"].replace(".NS", "") in priority_set]
    # preserve priority order
    top_stocks.sort(key=lambda s: PRIORITY_SYMBOLS.index(s["ticker"].replace(".NS", "")) if s["ticker"].replace(".NS", "") in priority_set else 999)
    
    other_stocks = [s for s in raw_list if s["ticker"].replace(".NS", "") not in priority_set]
    other_stocks.sort(key=lambda s: s["ticker"])

    combined = top_stocks + other_stocks

    print(f"Total unique Indian listed stocks processed: {len(combined)}")

    # Write to nse500.json
    with open(OUTPUT_PATH, "w", encoding="utf-8") as f:
        json.dump(combined, f, indent=2, ensure_ascii=False)

    print(f"Successfully saved {len(combined)} Indian stocks to {OUTPUT_PATH}!")
    return len(combined)


if __name__ == "__main__":
    update_all_indian_stocks()
