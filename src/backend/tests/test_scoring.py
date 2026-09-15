"""Comprehensive pytest suite for VRIDDHI Scoring Engine (TRD §6 & §13)."""
import pytest
from app.services.scoring import (
    compute_l2_financial_strength,
    compute_l3_valuation,
    compute_l4_governance,
    compute_l1_business_quality,
    compute_l5_growth,
    compute_l6_technicals,
    get_rating_band
)


# --- L2 Financial Strength Tests ---

def test_l2_perfect_score():
    data = {
        "roe_5y": 18.5,
        "roce_5y": 20.2,
        "de_ratio": 0.25,
        "fcf_positive_years": 5,
        "opm_trend": "rising",
        "interest_coverage": 8.5,
        "revenue_cagr_5y": 15.0,
        "profit_cagr_5y": 16.0,
    }
    score, checklist, details, confidence = compute_l2_financial_strength(data)
    assert score == 25.0
    assert confidence == "high"
    assert all(c["verdict"] == "pass" for c in checklist)


def test_l2_boundary_thresholds():
    # Test boundary 14.9 vs 15.0 for ROE and ROCE
    data_boundary = {
        "roe_5y": 14.9,           # 2 pts (10-15%)
        "roce_5y": 15.0,          # 4 pts (>=15%)
        "de_ratio": 0.50,         # 2 pts (0.5-1.0)
        "fcf_positive_years": 3,  # 1.5 pts (2-3)
        "opm_trend": "flat",      # 1.5 pts
        "interest_coverage": 4.0, # 1.5 pts (2-4x)
        "revenue_cagr_5y": 11.9,  # 1 pt (5-12%)
        "profit_cagr_5y": 4.9,    # 0 pts (<5%)
    }
    score, checklist, details, confidence = compute_l2_financial_strength(data_boundary)
    # Expected: 2 + 4 + 2 + 1.5 + 1.5 + 1.5 + 1 + 0 = 13.5
    assert score == 13.5


def test_l2_missing_data_resilience():
    # All None inputs must give 0 points with 'warn' checklist verdict, no crash
    empty_data = {}
    score, checklist, details, confidence = compute_l2_financial_strength(empty_data)
    assert score == 3.0  # opm_trend defaults to stable (3 pts), all other 7 metrics are 0
    assert confidence == "low"
    warn_items = [c for c in checklist if c["verdict"] == "warn"]
    assert len(warn_items) == 7


# --- L3 Valuation Tests ---

def test_l3_pe_and_peg_valuation():
    # PE below industry, PEG < 1.0, PB <= sector, bottom third
    data_good = {
        "pe": 18.0,
        "industry_pe": 24.0,
        "profit_cagr_5y": 25.0,  # PEG = 18/25 = 0.72 (<1 -> 4 pts)
        "pb": 2.5,
        "sector_pb": 3.0,
        "pe_band_position": "bottom"
    }
    score, checklist, details, confidence = compute_l3_valuation(data_good)
    assert score == 15.0  # 5 + 4 + 3 + 3 = 15
    assert confidence == "high"


def test_l3_negative_growth_peg_zero():
    # Negative profit CAGR should not produce negative PEG, should return 0 pts
    data_neg = {
        "pe": 25.0,
        "industry_pe": 20.0,  # 25 <= 20*1.25 (25.0) -> 3 pts
        "profit_cagr_5y": -4.0,  # PEG invalid -> 0 pts
        "pb": 5.0,
        "sector_pb": 3.0,     # pb > 1.5*sector (4.5) -> 0 pts
        "pe_band_position": "top"  # 0 pts
    }
    score, checklist, details, confidence = compute_l3_valuation(data_neg)
    assert score == 3.0
    peg_check = next(c for c in checklist if c["metric"] == "PEG Ratio")
    assert peg_check["verdict"] == "warn"


# --- L4 Governance & Red Flags Tests ---

def test_l4_pristine_governance():
    data = {
        "promoter_pledging": 0.0,
        "promoter_trend": "stable/rising",
        "promoter_holding": 54.0,
        "fii_dii_trend": "rising"
    }
    score, checklist, details, red_flags, confidence = compute_l4_governance(data, announcement_red_flags=[])
    # 6 (pledge 0) + 5 (trend) + 3 (holding >=50) + 3 (fii rising) + 3 (scan clean) = 20 pts
    assert score == 20.0
    assert len(red_flags) == 0


def test_l4_critical_pledge_flag():
    # Pledge > 30% triggers 0 points and critical red flag
    data = {
        "promoter_pledging": 35.0,
        "promoter_trend": "stable",
        "promoter_holding": 40.0,
        "fii_dii_trend": "flat"
    }
    score, checklist, details, red_flags, confidence = compute_l4_governance(data, announcement_red_flags=[])
    assert any(rf["severity"] == "major" and "pledge" in rf["title"].lower() for rf in red_flags)


def test_l4_promoter_stake_fall_red_flag():
    data = {
        "promoter_pledging": 0.0,
        "promoter_trend": "falling_major",
        "promoter_holding": 30.0,
        "fii_dii_trend": "falling"
    }
    score, checklist, details, red_flags, confidence = compute_l4_governance(data, announcement_red_flags=[])
    assert any("dilution" in rf["type"].lower() for rf in red_flags)


# --- L6 Technicals Tests ---

def test_l6_technicals_uptrend():
    data = {
        "above_ma200": True,
        "above_ma50": True,
        "rsi14": 56.5,
        "wk52_position": 0.35,
        "volume_trend": "rising"
    }
    score, checklist, details, confidence = compute_l6_technicals(data)
    # 3 (ma200) + 2 (ma50) + 3 (rsi 40-70) + 2 (wk52 <=0.5) = 10 pts
    assert score == 10.0


def test_l6_technicals_overbought_rsi():
    data = {
        "above_ma200": True,
        "above_ma50": False,
        "rsi14": 84.0,  # Overbought penalty -> 0 pts
        "wk52_position": 0.90,  # >0.8 -> 0 pts
        "volume_trend": "falling"
    }
    score, checklist, details, confidence = compute_l6_technicals(data)
    # 3 + 0 + 0 + 0 = 3 pts
    assert score == 3.0


# --- L1 & L5 Qualitative Tests ---

def test_l1_business_quality():
    score, checklist, details, confidence = compute_l1_business_quality("Strong Moat", gross_margin_stdev=1.8, has_business_clarity=True)
    # 8 + 4 + 3 = 15 pts
    assert score == 15.0


def test_l5_growth():
    data = {
        "revenue_cagr_5y": 16.0,
        "profit_cagr_5y": 18.0,
        "latest_quarter_yoy_profit": 14.5
    }
    score, checklist, details, confidence = compute_l5_growth(data, llm_outlook="Positive")
    # 4 + 4 + 3 + 4 = 15 pts
    assert score == 15.0


# --- Rating Bands Golden Table Verification ---

def test_rating_bands_exact():
    assert get_rating_band(100) == "Excellent"
    assert get_rating_band(80) == "Excellent"
    assert get_rating_band(79) == "Good"
    assert get_rating_band(65) == "Good"
    assert get_rating_band(64) == "Average"
    assert get_rating_band(50) == "Average"
    assert get_rating_band(49) == "Weak"
    assert get_rating_band(35) == "Weak"
    assert get_rating_band(34) == "Poor"
    assert get_rating_band(0) == "Poor"
