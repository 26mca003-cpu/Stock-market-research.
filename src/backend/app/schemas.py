"""Pydantic schemas matching TRD §5 and §5.1 exactly."""
from typing import List, Dict, Any, Optional, Literal
from pydantic import BaseModel, Field


# --- Sub-models ---

class PriceInfo(BaseModel):
    last: float
    day_change_pct: float
    currency: str = "INR"


class LayerInfo(BaseModel):
    name: str
    score: float
    max: int
    confidence: Literal["high", "medium", "low"]
    details: Dict[str, Any] = Field(default_factory=dict)


class ChecklistItem(BaseModel):
    layer: str  # e.g., "L2"
    metric: str
    value: str
    verdict: Literal["pass", "warn", "fail"]
    explanation: str


class RedFlagItem(BaseModel):
    type: str
    title: str
    date: Optional[str] = None
    severity: Literal["minor", "major"] = "major"


class SourceItem(BaseModel):
    name: str
    url: str
    used_for: str


# --- Core Research Report Response (TRD §5.1) ---

class ResearchReportResponse(BaseModel):
    ticker: str
    company_name: str
    price: PriceInfo
    score_total: int = Field(ge=0, le=100)
    rating_band: Literal["Excellent", "Good", "Average", "Weak", "Poor"]
    layers: Dict[str, LayerInfo]
    checklist: List[ChecklistItem]
    red_flags: List[RedFlagItem] = Field(default_factory=list)
    ai_summary: str
    sources: List[SourceItem] = Field(default_factory=list)
    disclaimer: str
    last_analyzed: str
    cached: bool = False


# --- Chart Models ---

class CandleData(BaseModel):
    time: str  # YYYY-MM-DD
    open: float
    high: float
    low: float
    close: float


class VolumeData(BaseModel):
    time: str  # YYYY-MM-DD
    value: float
    color: str


class ChartResponse(BaseModel):
    candles: List[CandleData]
    volumes: List[VolumeData]


# --- News Models ---

class NewsItemResponse(BaseModel):
    title: str
    url: str
    source: Optional[str] = None
    published_at: Optional[str] = None
    sentiment: Optional[Literal["positive", "neutral", "negative"]] = "neutral"


# --- Search & Watchlist Models ---

class SearchResult(BaseModel):
    ticker: str
    name: str
    exchange: str = "NSE"


class WatchlistItem(BaseModel):
    ticker: str
    name: str
    last_price: Optional[float] = None
    day_change_pct: Optional[float] = None
    score_total: Optional[int] = None


class WatchlistAddRequest(BaseModel):
    ticker: str
    company_name: Optional[str] = ""
