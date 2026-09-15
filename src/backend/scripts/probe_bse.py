"""
Probe multiple BSE data sources to find a working endpoint for equity list.
"""
import httpx
import json

session_headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    "Accept": "application/json, text/plain, */*",
    "Accept-Language": "en-US,en;q=0.9",
    "Referer": "https://www.bseindia.com/",
    "Origin": "https://www.bseindia.com",
}

# Known working BSE endpoints
endpoints = [
    # Direct JSON endpoint for equity list (used by BSE website XHR)
    "https://api.bseindia.com/BseIndiaAPI/api/ListofScripData/w?Group=&Scripcode=&industry=&segment=Equity&status=Active&scripname=&_=1",
    # Alternative segment-based
    "https://api.bseindia.com/BseIndiaAPI/api/getScripHeaderData/w?Scrip_Cd=500325",
    # BSE download page
    "https://www.bseindia.com/corporates/dwnld/equity_l.csv",
    # NSE equivalent - different path
    "https://archives.nseindia.com/content/equities/EQUITY_L.csv",
    # Open alternative: NSE bhav copy
    "https://archives.nseindia.com/products/content/sec_bhavdata_full.csv",
]

client = httpx.Client(headers=session_headers, follow_redirects=True, timeout=15)
# Warm up BSE session
try:
    client.get("https://www.bseindia.com/")
except Exception as e:
    print(f"Warmup: {e}")

for url in endpoints:
    try:
        r = client.get(url)
        ct = r.headers.get("content-type", "")
        print(f"\nURL: {url}")
        print(f"Status: {r.status_code}, Type: {ct[:50]}, Size: {len(r.content)}")
        if "json" in ct and len(r.content) > 100:
            try:
                data = r.json()
                if isinstance(data, list) and len(data) > 0:
                    print(f"  -> LIST with {len(data)} items")
                    print(f"  Keys: {list(data[0].keys())}")
                    print(f"  Sample: {data[0]}")
                elif isinstance(data, dict):
                    print(f"  -> DICT keys: {list(data.keys())[:5]}")
            except Exception as je:
                print(f"  JSON parse error: {je}")
        elif "csv" in ct or r.text.startswith("SYMBOL") or r.text.startswith("Security"):
            lines = r.text.strip().split("\n")
            print(f"  -> CSV: {len(lines)} rows")
            print(f"  Header: {lines[0][:120]}")
            print(f"  Row1: {lines[1][:120] if len(lines) > 1 else 'N/A'}")
        else:
            print(f"  Preview: {r.text[:200]}")
    except Exception as e:
        print(f"\nURL: {url}")
        print(f"  ERROR: {e}")
