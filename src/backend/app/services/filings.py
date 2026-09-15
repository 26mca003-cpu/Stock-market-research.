"""BSE Announcements + Docling PDF parser service for VRIDDHI (TRD §8.4, §11).

Fetches corporate announcements hourly, downloads new PDFs via Crawl4AI,
parses them with Docling (or fallback text extraction), and stores excerpts
for LLM use in the research pipeline.
"""
import logging
import re
import asyncio
from datetime import datetime, timezone, timedelta
from typing import List, Optional, Dict, Any

import httpx
from bs4 import BeautifulSoup

from app.config import settings
from app.db import get_supabase

logger = logging.getLogger(__name__)

# BSE announcement endpoint patterns (TRD §3)
BSE_ANN_URL = "https://www.bseindia.com/corporates/ann.html"
BSE_CODE_SEARCH = "https://api.bseindia.com/BseIndiaAPI/api/AnnSubCategoryGetData/w?strCat=-1&strType=C&strScrip={code}&strSearch=P&strTodt={to}&strFromdt={from_dt}&recordCount=20"

# Filing types to download PDFs for
IMPORTANT_TYPES = {"result", "annual_report", "concall", "agm"}

# Max excerpt length stored per filing (TRD §8.4)
MAX_EXCERPT_CHARS = 8000


async def fetch_bse_code_for_ticker(ticker: str) -> Optional[str]:
    """Map NSE ticker (e.g. RELIANCE.NS) to BSE scrip code via yfinance info."""
    try:
        import yfinance as yf
        info = yf.Ticker(ticker).info
        isin = info.get("isin", "")
        # Try getting BSE code from known field
        bse_code = str(info.get("exchange", ""))
        # Fallback: search BSE for company name
        company = info.get("longName", ticker.replace(".NS", ""))
        return company
    except Exception as e:
        logger.warning(f"Could not resolve BSE code for {ticker}: {e}")
        return None


async def fetch_bse_announcements(ticker: str, days_back: int = 3) -> List[Dict[str, Any]]:
    """Fetch recent BSE announcements for a ticker using Crawl4AI.

    Returns list of dicts: {title, url, filing_type, date}
    TRD §3 pattern: crawl4ai on BSE announcements page.
    """
    announcements = []
    company_name = ticker.replace(".NS", "").replace(".BO", "")

    crawl_url = f"{settings.CRAWL4AI_URL}"
    payload = {
        "url": f"https://www.bseindia.com/corporates/ann.html",
        "js_code": f"document.querySelector('#ctl00_ContentPlaceHolder1_txtScrip').value = '{company_name}';",
        "wait_for": "css:.anntable",
        "extract_type": "text",
    }

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.post(crawl_url, json=payload)
            if resp.status_code == 200:
                data = resp.json()
                raw_html = data.get("html", "") or data.get("content", "")
                announcements = _parse_bse_ann_html(raw_html, company_name)
    except Exception as e:
        logger.warning(f"BSE announcement fetch failed for {ticker}: {e} — using empty list")

    return announcements


def _parse_bse_ann_html(html: str, company_name: str) -> List[Dict[str, Any]]:
    """Parse BSE announcements HTML table into structured list."""
    results = []
    try:
        soup = BeautifulSoup(html, "html.parser")
        rows = soup.select("table tr")
        for row in rows[1:21]:  # Skip header, max 20
            cols = row.find_all("td")
            if len(cols) < 3:
                continue
            link_tag = cols[0].find("a") or cols[1].find("a")
            title = link_tag.get_text(strip=True) if link_tag else cols[0].get_text(strip=True)
            url = link_tag.get("href", "") if link_tag else ""
            if url and not url.startswith("http"):
                url = f"https://www.bseindia.com{url}"
            date_text = cols[-1].get_text(strip=True) if cols else ""
            filing_type = _classify_filing_type(title)
            if title:
                results.append({
                    "title": title,
                    "url": url,
                    "filing_type": filing_type,
                    "date": date_text,
                    "company": company_name,
                })
    except Exception as e:
        logger.warning(f"Failed to parse BSE HTML: {e}")
    return results


def _classify_filing_type(title: str) -> str:
    """Classify a BSE announcement into a filing type."""
    title_lower = title.lower()
    if any(k in title_lower for k in ["annual report", "annual general"]):
        return "annual_report"
    if any(k in title_lower for k in ["financial result", "quarterly result", "q1", "q2", "q3", "q4"]):
        return "result"
    if any(k in title_lower for k in ["investor meet", "concall", "conference call", "earnings call"]):
        return "concall"
    if any(k in title_lower for k in ["agm", "extraordinary general"]):
        return "agm"
    if any(k in title_lower for k in ["announcement", "notice", "intimation"]):
        return "announcement"
    return "other"


async def download_and_extract_pdf(url: str) -> Optional[str]:
    """Download a PDF filing and extract text using Docling or fallback.

    Returns up to MAX_EXCERPT_CHARS of text for LLM use.
    TRD §8.4: Docling (IBM tool) is the primary; text extraction is fallback.
    """
    if not url or not url.lower().endswith(".pdf"):
        return None

    try:
        # Try Docling first (if installed)
        try:
            from docling.document_converter import DocumentConverter  # type: ignore
            converter = DocumentConverter()
            async with httpx.AsyncClient(timeout=60.0) as client:
                resp = await client.get(url, follow_redirects=True)
                if resp.status_code != 200:
                    return None
                # Write to temp file
                import tempfile, os
                with tempfile.NamedTemporaryFile(suffix=".pdf", delete=False) as tmp:
                    tmp.write(resp.content)
                    tmp_path = tmp.name
            result = converter.convert(tmp_path)
            text = result.document.export_to_markdown()
            os.unlink(tmp_path)
            logger.info(f"Docling extracted {len(text)} chars from {url}")
            return text[:MAX_EXCERPT_CHARS]
        except ImportError:
            pass  # Docling not installed, use fallback

        # Fallback: try Crawl4AI text extraction
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.post(
                settings.CRAWL4AI_URL,
                json={"url": url, "extract_type": "text"},
                timeout=30.0,
            )
            if resp.status_code == 200:
                data = resp.json()
                text = data.get("text", "") or data.get("content", "")
                logger.info(f"Crawl4AI extracted {len(text)} chars from {url}")
                return text[:MAX_EXCERPT_CHARS]
    except Exception as e:
        logger.warning(f"PDF extraction failed for {url}: {e}")

    return None


async def process_new_filings(ticker: str) -> int:
    """Main entry: fetch announcements, store new ones, process important PDFs.

    Returns count of new filings processed.
    Called by filings_cron.py hourly (TRD §8.4).
    """
    processed = 0
    announcements = await fetch_bse_announcements(ticker, days_back=3)

    for ann in announcements:
        url = ann.get("url", "")
        if not url:
            continue

        supabase = get_supabase()
        # Check if already in filings_log
        existing = supabase.table("filings_log").select("id").eq("url", url).execute() if supabase else None
        if existing and existing.data:
            continue  # Already logged

        filing_type = ann.get("filing_type", "other")
        title = ann.get("title", "")

        # Insert into filings_log
        entry = {
            "ticker": ticker,
            "filing_type": filing_type,
            "title": title,
            "url": url,
            "processed": False,
        }
        try:
            supabase = get_supabase()
            if supabase:
                supabase.table("filings_log").upsert(entry, on_conflict="url").execute()
        except Exception as e:
            logger.warning(f"Could not insert filing_log for {ticker}: {e}")

        # For important types, download PDF and store excerpt
        if filing_type in IMPORTANT_TYPES and url.lower().endswith(".pdf"):
            excerpt = await download_and_extract_pdf(url)
            if excerpt:
                try:
                    supabase = get_supabase()
                    if supabase:
                        supabase.table("filings_log").update(
                            {"processed": True}
                        ).eq("url", url).execute()
                    processed += 1
                    # Invalidate analysis cache for this ticker (TRD §8.4)
                    if supabase:
                        supabase.table("analysis_reports").update(
                            {"expires_at": datetime.now(timezone.utc).isoformat()}
                        ).eq("ticker", ticker).execute()
                        logger.info(f"Cache invalidated for {ticker} after new {filing_type} filing")
                except Exception as e:
                    logger.warning(f"Failed to update filing status: {e}")

    return processed


async def get_recent_filing_excerpts(ticker: str, filing_types: Optional[List[str]] = None) -> List[Dict[str, Any]]:
    """Retrieve recent filing excerpts for LLM use in research pipeline.

    Returns list of {title, url, filing_type, fetched_at} for the pipeline's
    LLM prompts (moat, governance, outlook).
    """
    if filing_types is None:
        filing_types = list(IMPORTANT_TYPES)

    try:
        supabase = get_supabase()
        if supabase:
            resp = (
                supabase.table("filings_log")
                .select("*")
                .eq("ticker", ticker)
                .in_("filing_type", filing_types)
                .eq("processed", True)
                .order("fetched_at", desc=True)
                .limit(5)
                .execute()
            )
            return resp.data or []
    except Exception as e:
        logger.warning(f"Could not fetch filing excerpts for {ticker}: {e}")

    return []
