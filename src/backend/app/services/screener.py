"""Screener.in data ingestion and parser service (TRD §3)."""
import time
import logging
import asyncio
from typing import Dict, Any, Optional, List
import httpx
from bs4 import BeautifulSoup
from app.config import settings

logger = logging.getLogger(__name__)

# Last request timestamp for polite rate-limiting (min 2 seconds per TRD §0)
_last_screener_request_time = 0.0


class ScreenerService:
    @staticmethod
    async def _rate_limit():
        global _last_screener_request_time
        now = time.time()
        elapsed = now - _last_screener_request_time
        if elapsed < 2.0:
            await asyncio.sleep(2.0 - elapsed)
        _last_screener_request_time = time.time()

    @classmethod
    async def fetch_screener_data(cls, symbol: str) -> Dict[str, Any]:
        """Fetch and parse Screener.in consolidated financial page."""
        clean_sym = symbol.replace(".NS", "").replace(".BO", "").strip().upper()
        url = f"https://www.screener.in/company/{clean_sym}/consolidated/"

        await cls._rate_limit()

        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        }

        html = None
        try:
            async with httpx.AsyncClient(timeout=15.0, follow_redirects=True) as client:
                res = await client.get(url, headers=headers)
                if res.status_code == 200:
                    html = res.text
                elif res.status_code == 404:
                    # Try standalone without /consolidated/
                    url_standalone = f"https://www.screener.in/company/{clean_sym}/"
                    await cls._rate_limit()
                    res_std = await client.get(url_standalone, headers=headers)
                    if res_std.status_code == 200:
                        html = res_std.text
        except Exception as e:
            logger.warning(f"Failed direct fetch from Screener.in for {clean_sym}: {e}")

        if not html:
            return cls._empty_screener_data(clean_sym)

        return cls._parse_screener_html(html, clean_sym)

    @classmethod
    def _parse_screener_html(cls, html: str, symbol: str) -> Dict[str, Any]:
        """Parse Screener HTML into structured tables and metrics."""
        soup = BeautifulSoup(html, "html.parser")
        data: Dict[str, Any] = {
            "symbol": symbol,
            "about": "",
            "ratios": {},
            "shareholding": {
                "promoter_holding": None,
                "promoter_trend": "stable",
                "promoter_pledging": 0.0,
                "fii_dii_trend": "flat"
            },
            "profit_loss": {},
            "peers": {},
            "sector_pe": None
        }

        # About / Moat excerpt
        about_div = soup.find("div", class_="about")
        if about_div:
            data["about"] = about_div.get_text(separator=" ", strip=True)

        # Top Ratios list
        top_ratios = soup.find("ul", id="top-ratios")
        if top_ratios:
            for li in top_ratios.find_all("li"):
                name_span = li.find("span", class_="name")
                val_span = li.find("span", class_="nowrap value")
                if name_span and val_span:
                    name = name_span.get_text(strip=True).lower()
                    val_text = val_span.get_text(strip=True).replace(",", "").replace("₹", "").replace("%", "")
                    try:
                        data["ratios"][name] = float(val_text)
                    except ValueError:
                        data["ratios"][name] = val_text

        # Parse Shareholding Pattern Table
        shp_section = soup.find("section", id="shareholding")
        if shp_section:
            table = shp_section.find("table", class_="data-table")
            if table:
                rows = table.find_all("tr")
                for r in rows:
                    cells = [td.get_text(strip=True) for td in r.find_all(["td", "th"])]
                    if not cells:
                        continue
                    row_name = cells[0].lower()
                    if "promoter" in row_name:
                        # Extract latest percentages
                        pct_values = [cls._safe_float(c.replace("%", "")) for c in cells[1:] if cls._safe_float(c.replace("%", "")) is not None]
                        if pct_values:
                            data["shareholding"]["promoter_holding"] = pct_values[-1]
                            if len(pct_values) >= 4:
                                diff = pct_values[-1] - pct_values[-4]
                                if diff >= 0:
                                    data["shareholding"]["promoter_trend"] = "stable/rising"
                                elif diff > -2.0:
                                    data["shareholding"]["promoter_trend"] = "falling_minor"
                                else:
                                    data["shareholding"]["promoter_trend"] = "falling_major"
                    elif "fii" in row_name or "dii" in row_name:
                        pct_values = [cls._safe_float(c.replace("%", "")) for c in cells[1:] if cls._safe_float(c.replace("%", "")) is not None]
                        if len(pct_values) >= 2:
                            diff = pct_values[-1] - pct_values[-2]
                            if diff > 0.2:
                                data["shareholding"]["fii_dii_trend"] = "rising"
                            elif diff < -0.2:
                                data["shareholding"]["fii_dii_trend"] = "falling"
                            else:
                                data["shareholding"]["fii_dii_trend"] = "flat"
                    elif "pledged" in row_name:
                        pct_values = [cls._safe_float(c.replace("%", "")) for c in cells[1:] if cls._safe_float(c.replace("%", "")) is not None]
                        if pct_values:
                            data["shareholding"]["promoter_pledging"] = pct_values[-1]

        # Peer Industry PE table
        peers_section = soup.find("section", id="peers")
        if peers_section:
            peer_table = peers_section.find("table", class_="data-table")
            if peer_table:
                pe_list = []
                for pr in peer_table.find_all("tr"):
                    tds = [td.get_text(strip=True) for td in pr.find_all("td")]
                    if len(tds) > 4:
                        pe_val = cls._safe_float(tds[4])
                        if pe_val and pe_val > 0:
                            pe_list.append(pe_val)
                if pe_list:
                    import statistics
                    data["sector_pe"] = round(statistics.median(pe_list), 2)

        return data

    @staticmethod
    def _safe_float(val: Any) -> Optional[float]:
        try:
            return float(str(val).replace(",", "").replace("%", "").strip())
        except Exception:
            return None

    @classmethod
    def _empty_screener_data(cls, symbol: str) -> Dict[str, Any]:
        return {
            "symbol": symbol,
            "about": "",
            "ratios": {},
            "shareholding": {
                "promoter_holding": None,
                "promoter_trend": "stable",
                "promoter_pledging": 0.0,
                "fii_dii_trend": "flat"
            },
            "profit_loss": {},
            "peers": {},
            "sector_pe": None
        }
