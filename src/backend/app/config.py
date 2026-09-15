"""Configuration management for Vriddhi backend (TRD §0 & §10)."""
import os
from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

    APP_NAME: str = "VRIDDHI"
    APP_ENV: str = "dev"
    BACKEND_PORT: int = 8000
    FRONTEND_PORT: int = 3000

    # API Keys
    SUPABASE_URL: str = ""
    SUPABASE_ANON_KEY: str = ""
    SUPABASE_SERVICE_KEY: str = ""
    GEMINI_API_KEY: str = ""
    GROQ_API_KEY: str = ""
    CRAWL4AI_URL: str = "http://127.0.0.1:8077"
    NEXT_PUBLIC_API_URL: str = "http://localhost:8000/api"

    # Cache TTLs in seconds
    ANALYSIS_CACHE_TTL: int = 86400  # 24 hours
    PRICE_CACHE_TTL: int = 900       # 15 minutes

    # Golden Table constants (TRD §0)
    DISCLAIMER_TEXT: str = (
        "Vriddhi is an educational research tool, not investment advice. "
        "Data sourced from public filings and may be delayed or inaccurate. "
        "Consult a SEBI-registered investment advisor before investing."
    )

    FORBIDDEN_WORDS: List[str] = [
        "buy",
        "sell",
        "hold",
        "recommendation",
        "target price",
        "guaranteed",
    ]


settings = Settings()
