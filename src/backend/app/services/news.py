"""Google News RSS ingestion and sentiment tagging service (TRD §3 & §8.2)."""
import urllib.parse
import logging
from datetime import datetime, timezone
from typing import List, Dict, Any
import feedparser
from app.services.llm import LLMService
from app.db import DatabaseManager

logger = logging.getLogger(__name__)


class NewsService:
    @staticmethod
    async def get_stock_news(ticker: str, company_name: str) -> List[Dict[str, Any]]:
        """Fetch latest news for stock, score sentiment, and cache."""
        # 1. Check cached news in DB first
        cached = DatabaseManager.get_news(ticker, limit=10)
        if cached and len(cached) >= 3:
            return cached

        # 2. Fetch fresh RSS feed from Google News
        query = urllib.parse.quote(f"{company_name} stock India")
        rss_url = f"https://news.google.com/rss/search?q={query}&hl=en-IN&gl=IN&ceid=IN:en"

        news_items = []
        try:
            feed = feedparser.parse(rss_url)
            for entry in feed.entries[:10]:
                title = entry.get("title", "")
                link = entry.get("link", "")
                published = entry.get("published", "")
                source = entry.get("source", {}).get("title", "Google News")

                if title and link:
                    news_items.append({
                        "ticker": ticker,
                        "title": title,
                        "url": link,
                        "source": source,
                        "published_at": published,
                        "sentiment": "neutral"
                    })
        except Exception as e:
            logger.warning(f"Error fetching RSS for {ticker}: {e}")

        # 3. Sentiment analysis on headlines
        if news_items:
            titles = [n["title"] for n in news_items]
            sentiments = await LLMService.classify_news_sentiment(titles)
            sent_map = {s["i"]: s["sentiment"] for s in sentiments if "i" in s and "sentiment" in s}
            for idx, item in enumerate(news_items):
                item["sentiment"] = sent_map.get(idx, "neutral")

            # Save to Database / Cache
            DatabaseManager.save_news(ticker, news_items)

        return news_items
