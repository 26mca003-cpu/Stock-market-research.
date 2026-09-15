"""API and Integration Tests for VRIDDHI (TRD §13)."""
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.schemas import ResearchReportResponse
from app.services.llm import LLMService

client = TestClient(app)


def test_health_check():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data.get("ok") is True
    assert data.get("app") == "VRIDDHI"


def test_search_autocomplete():
    response = client.get("/api/search?q=reliance")
    assert response.status_code == 200
    results = response.json()
    assert len(results) > 0
    assert any("RELIANCE" in r["ticker"] for r in results)


def test_watchlist_operations():
    # Add stock
    add_resp = client.post("/api/watchlist", json={"ticker": "TCS.NS", "company_name": "Tata Consultancy Services"})
    assert add_resp.status_code == 201

    # Get watchlist
    list_resp = client.get("/api/watchlist")
    assert list_resp.status_code == 200
    items = list_resp.json()
    assert any(item["ticker"] == "TCS.NS" for item in items)


def test_forbidden_words_sanitizer():
    # Feeding forbidden words to LLM sanitizer
    toxic_text = (
        "We give a strong buy recommendation for this stock. "
        "You should buy now with a target price of 3000. "
        "Hold onto existing positions, high returns are guaranteed. "
        "Do not sell."
    )
    cleaned = LLMService.sanitize_text(toxic_text)

    # Assert NONE of the forbidden words appear in the sanitized output
    forbidden = ["buy", "sell", "hold", "recommendation", "target price", "guaranteed"]
    for word in forbidden:
        assert word not in cleaned.lower(), f"Forbidden word '{word}' found in sanitized text: {cleaned}"


def test_chart_endpoint():
    response = client.get("/api/chart/RELIANCE.NS?period=6m")
    assert response.status_code == 200
    data = response.json()
    assert "candles" in data
    assert "volumes" in data


def test_research_pipeline_and_schema():
    response = client.get("/api/research/RELIANCE.NS")
    assert response.status_code == 200
    data = response.json()

    # Validate against strict Pydantic model
    validated = ResearchReportResponse(**data)
    assert validated.ticker == "RELIANCE.NS"
    assert 0 <= validated.score_total <= 100
    assert validated.rating_band in ["Excellent", "Good", "Average", "Weak", "Poor"]
    assert "L1" in validated.layers
    assert "L2" in validated.layers
    assert "L3" in validated.layers
    assert "L4" in validated.layers
    assert "L5" in validated.layers
    assert "L6" in validated.layers
    assert len(validated.checklist) > 0
    assert validated.disclaimer != ""

