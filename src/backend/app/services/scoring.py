"""Deterministic Scoring Engine for VRIDDHI (TRD §6).
Pure functions, zero external I/O.
"""
from typing import Dict, Any, List, Tuple, Optional
import math


def compute_l2_financial_strength(data: Dict[str, Any]) -> Tuple[float, List[Dict[str, Any]], Dict[str, Any], str]:
    """L2 Financial Strength (25 pts max).
    Metrics:
    - ROE 5y avg (4 pts)
    - ROCE 5y avg (4 pts)
    - Debt-to-Equity (4 pts)
    - FCF positive years of 5 (3 pts)
    - Operating margin trend 5y (3 pts)
    - Interest coverage (3 pts)
    - Revenue CAGR 5y (2 pts)
    - Profit CAGR 5y (2 pts)
    """
    score = 0.0
    checklist = []
    details = {}
    missing_count = 0

    # 1. ROE (5y avg) (4 pts)
    roe = data.get("roe_5y")
    details["roe_5y"] = roe
    if roe is None:
        missing_count += 1
        checklist.append({
            "layer": "L2",
            "metric": "ROE (5-yr avg)",
            "value": "N/A",
            "verdict": "warn",
            "explanation": "Historical Return on Equity data unavailable."
        })
    elif roe >= 15.0:
        score += 4.0
        checklist.append({
            "layer": "L2",
            "metric": "ROE (5-yr avg)",
            "value": f"{roe:.1f}%",
            "verdict": "pass",
            "explanation": "Excellent capital efficiency, exceeding the 15% benchmark."
        })
    elif 10.0 <= roe < 15.0:
        score += 2.0
        checklist.append({
            "layer": "L2",
            "metric": "ROE (5-yr avg)",
            "value": f"{roe:.1f}%",
            "verdict": "warn",
            "explanation": "Moderate capital efficiency, below the 15% top-tier threshold."
        })
    else:
        checklist.append({
            "layer": "L2",
            "metric": "ROE (5-yr avg)",
            "value": f"{roe:.1f}%",
            "verdict": "fail",
            "explanation": "Weak capital efficiency, under 10%."
        })

    # 2. ROCE (5y avg) (4 pts)
    roce = data.get("roce_5y")
    details["roce_5y"] = roce
    if roce is None:
        missing_count += 1
        checklist.append({
            "layer": "L2",
            "metric": "ROCE (5-yr avg)",
            "value": "N/A",
            "verdict": "warn",
            "explanation": "ROCE data unavailable."
        })
    elif roce >= 15.0:
        score += 4.0
        checklist.append({
            "layer": "L2",
            "metric": "ROCE (5-yr avg)",
            "value": f"{roce:.1f}%",
            "verdict": "pass",
            "explanation": "Strong return on capital employed (≥15%)."
        })
    elif 10.0 <= roce < 15.0:
        score += 2.0
        checklist.append({
            "layer": "L2",
            "metric": "ROCE (5-yr avg)",
            "value": f"{roce:.1f}%",
            "verdict": "warn",
            "explanation": "Acceptable ROCE between 10% and 15%."
        })
    else:
        checklist.append({
            "layer": "L2",
            "metric": "ROCE (5-yr avg)",
            "value": f"{roce:.1f}%",
            "verdict": "fail",
            "explanation": "Poor return on capital employed (<10%)."
        })

    # 3. Debt-to-Equity (4 pts)
    de = data.get("de_ratio")
    details["de_ratio"] = de
    if de is None:
        missing_count += 1
        checklist.append({
            "layer": "L2",
            "metric": "Debt-to-Equity",
            "value": "N/A",
            "verdict": "warn",
            "explanation": "Debt-to-Equity ratio data unavailable."
        })
    elif de < 0.5:
        score += 4.0
        checklist.append({
            "layer": "L2",
            "metric": "Debt-to-Equity",
            "value": f"{de:.2f}",
            "verdict": "pass",
            "explanation": "Conservative balance sheet with low leverage (<0.5)."
        })
    elif 0.5 <= de <= 1.0:
        score += 2.0
        checklist.append({
            "layer": "L2",
            "metric": "Debt-to-Equity",
            "value": f"{de:.2f}",
            "verdict": "warn",
            "explanation": "Moderate leverage (0.5 to 1.0)."
        })
    else:
        checklist.append({
            "layer": "L2",
            "metric": "Debt-to-Equity",
            "value": f"{de:.2f}",
            "verdict": "fail",
            "explanation": "High financial leverage with Debt-to-Equity exceeding 1.0."
        })

    # 4. Free Cash Flow positive years of 5 (3 pts)
    fcf_years = data.get("fcf_positive_years")
    details["fcf_positive_years"] = fcf_years
    if fcf_years is None:
        missing_count += 1
        checklist.append({
            "layer": "L2",
            "metric": "Free Cash Flow Consistency",
            "value": "N/A",
            "verdict": "warn",
            "explanation": "Cash flow history unavailable."
        })
    elif fcf_years >= 4:
        score += 3.0
        checklist.append({
            "layer": "L2",
            "metric": "Free Cash Flow Consistency",
            "value": f"{fcf_years}/5 years",
            "verdict": "pass",
            "explanation": "Consistently generates positive free cash flow."
        })
    elif 2 <= fcf_years <= 3:
        score += 1.5
        checklist.append({
            "layer": "L2",
            "metric": "Free Cash Flow Consistency",
            "value": f"{fcf_years}/5 years",
            "verdict": "warn",
            "explanation": "Lumpy free cash flow generation over 5 years."
        })
    else:
        checklist.append({
            "layer": "L2",
            "metric": "Free Cash Flow Consistency",
            "value": f"{fcf_years}/5 years",
            "verdict": "fail",
            "explanation": "Negative free cash flow in 4 or more of the last 5 years."
        })

    # 5. Operating Margin Trend (3 pts)
    opm_trend = data.get("opm_trend", "stable")
    details["opm_trend"] = opm_trend
    if opm_trend == "rising" or opm_trend == "stable":
        score += 3.0
        checklist.append({
            "layer": "L2",
            "metric": "Operating Margin Trend",
            "value": opm_trend.capitalize(),
            "verdict": "pass",
            "explanation": "Stable or expanding operating margins over 5 years."
        })
    elif opm_trend == "flat":
        score += 1.5
        checklist.append({
            "layer": "L2",
            "metric": "Operating Margin Trend",
            "value": "Flat",
            "verdict": "warn",
            "explanation": "Margins have remained flat within a ±2% band."
        })
    else:
        checklist.append({
            "layer": "L2",
            "metric": "Operating Margin Trend",
            "value": "Declining",
            "verdict": "fail",
            "explanation": "Deteriorating operating profit margins over the period."
        })

    # 6. Interest Coverage (3 pts)
    int_cov = data.get("interest_coverage")
    details["interest_coverage"] = int_cov
    if int_cov is None:
        missing_count += 1
        checklist.append({
            "layer": "L2",
            "metric": "Interest Coverage",
            "value": "N/A",
            "verdict": "warn",
            "explanation": "Interest coverage data unavailable."
        })
    elif int_cov > 4.0:
        score += 3.0
        checklist.append({
            "layer": "L2",
            "metric": "Interest Coverage",
            "value": f"{int_cov:.1f}x",
            "verdict": "pass",
            "explanation": "Robust debt servicing ability (>4x)."
        })
    elif 2.0 <= int_cov <= 4.0:
        score += 1.5
        checklist.append({
            "layer": "L2",
            "metric": "Interest Coverage",
            "value": f"{int_cov:.1f}x",
            "verdict": "warn",
            "explanation": "Adequate but moderate interest coverage (2x to 4x)."
        })
    else:
        checklist.append({
            "layer": "L2",
            "metric": "Interest Coverage",
            "value": f"{int_cov:.1f}x",
            "verdict": "fail",
            "explanation": "Strained debt servicing capacity (<2x)."
        })

    # 7. Revenue CAGR 5y (2 pts)
    rev_cagr = data.get("revenue_cagr_5y")
    details["revenue_cagr_5y"] = rev_cagr
    if rev_cagr is None:
        missing_count += 1
        checklist.append({
            "layer": "L2",
            "metric": "Revenue CAGR (5-yr)",
            "value": "N/A",
            "verdict": "warn",
            "explanation": "5-year revenue CAGR data unavailable."
        })
    elif rev_cagr >= 12.0:
        score += 2.0
        checklist.append({
            "layer": "L2",
            "metric": "Revenue CAGR (5-yr)",
            "value": f"{rev_cagr:.1f}%",
            "verdict": "pass",
            "explanation": "Healthy multi-year top-line compound growth (≥12%)."
        })
    elif 5.0 <= rev_cagr < 12.0:
        score += 1.0
        checklist.append({
            "layer": "L2",
            "metric": "Revenue CAGR (5-yr)",
            "value": f"{rev_cagr:.1f}%",
            "verdict": "warn",
            "explanation": "Moderate revenue growth between 5% and 12%."
        })
    else:
        checklist.append({
            "layer": "L2",
            "metric": "Revenue CAGR (5-yr)",
            "value": f"{rev_cagr:.1f}%",
            "verdict": "fail",
            "explanation": "Sluggish revenue compounding below 5%."
        })

    # 8. Profit CAGR 5y (2 pts)
    profit_cagr = data.get("profit_cagr_5y")
    details["profit_cagr_5y"] = profit_cagr
    if profit_cagr is None:
        missing_count += 1
        checklist.append({
            "layer": "L2",
            "metric": "Profit CAGR (5-yr)",
            "value": "N/A",
            "verdict": "warn",
            "explanation": "5-year profit CAGR data unavailable."
        })
    elif profit_cagr >= 12.0:
        score += 2.0
        checklist.append({
            "layer": "L2",
            "metric": "Profit CAGR (5-yr)",
            "value": f"{profit_cagr:.1f}%",
            "verdict": "pass",
            "explanation": "Solid multi-year net earnings expansion (≥12%)."
        })
    elif 5.0 <= profit_cagr < 12.0:
        score += 1.0
        checklist.append({
            "layer": "L2",
            "metric": "Profit CAGR (5-yr)",
            "value": f"{profit_cagr:.1f}%",
            "verdict": "warn",
            "explanation": "Moderate profit growth between 5% and 12%."
        })
    else:
        checklist.append({
            "layer": "L2",
            "metric": "Profit CAGR (5-yr)",
            "value": f"{profit_cagr:.1f}%",
            "verdict": "fail",
            "explanation": "Weak net earnings growth (<5%)."
        })

    confidence = "high" if missing_count == 0 else ("medium" if missing_count <= 2 else "low")
    return round(score, 1), checklist, details, confidence


def compute_l3_valuation(data: Dict[str, Any]) -> Tuple[float, List[Dict[str, Any]], Dict[str, Any], str]:
    """L3 Valuation (15 pts max).
    Metrics:
    - Current PE vs Industry Median (5 pts)
    - PEG ratio (4 pts)
    - PB vs Sector norm (3 pts)
    - Historical 5y PE band position (3 pts)
    """
    score = 0.0
    checklist = []
    details = {}
    missing_count = 0

    pe = data.get("pe")
    ind_pe = data.get("industry_pe")
    details["pe"] = pe
    details["industry_pe"] = ind_pe

    # 1. PE vs Industry Median (5 pts)
    if pe is None or ind_pe is None or ind_pe <= 0:
        missing_count += 1
        checklist.append({
            "layer": "L3",
            "metric": "P/E vs Industry Median",
            "value": f"{pe:.1f}x" if pe else "N/A",
            "verdict": "warn",
            "explanation": "Industry median P/E unavailable for relative comparison."
        })
    elif pe <= ind_pe:
        score += 5.0
        checklist.append({
            "layer": "L3",
            "metric": "P/E vs Industry Median",
            "value": f"{pe:.1f}x vs {ind_pe:.1f}x",
            "verdict": "pass",
            "explanation": "Trading at or below industry median P/E."
        })
    elif pe <= ind_pe * 1.25:
        score += 3.0
        checklist.append({
            "layer": "L3",
            "metric": "P/E vs Industry Median",
            "value": f"{pe:.1f}x vs {ind_pe:.1f}x",
            "verdict": "warn",
            "explanation": "Trading at a mild premium (up to 1.25x) over industry peers."
        })
    else:
        score += 1.0
        checklist.append({
            "layer": "L3",
            "metric": "P/E vs Industry Median",
            "value": f"{pe:.1f}x vs {ind_pe:.1f}x",
            "verdict": "fail",
            "explanation": "Trading at a significant premium (>1.25x) over industry median."
        })

    # 2. PEG Ratio (4 pts)
    profit_cagr = data.get("profit_cagr_5y")
    if pe is not None and profit_cagr is not None and profit_cagr > 0:
        peg = round(pe / profit_cagr, 2)
    else:
        peg = None
    details["peg"] = peg

    if peg is None:
        missing_count += 1
        checklist.append({
            "layer": "L3",
            "metric": "PEG Ratio",
            "value": "N/A" if profit_cagr is None else "Neg/Zero Growth",
            "verdict": "warn",
            "explanation": "PEG cannot be computed due to non-positive profit growth or missing P/E."
        })
    elif peg < 1.0:
        score += 4.0
        checklist.append({
            "layer": "L3",
            "metric": "PEG Ratio",
            "value": f"{peg:.2f}",
            "verdict": "pass",
            "explanation": "Attractive valuation relative to multi-year earnings growth (PEG < 1)."
        })
    elif 1.0 <= peg <= 2.0:
        score += 2.0
        checklist.append({
            "layer": "L3",
            "metric": "PEG Ratio",
            "value": f"{peg:.2f}",
            "verdict": "warn",
            "explanation": "Fairly valued for growth (PEG between 1 and 2)."
        })
    else:
        checklist.append({
            "layer": "L3",
            "metric": "PEG Ratio",
            "value": f"{peg:.2f}",
            "verdict": "fail",
            "explanation": "Expensive relative to growth rates (PEG > 2)."
        })

    # 3. PB vs Sector Norm (3 pts)
    pb = data.get("pb")
    sector_pb = data.get("sector_pb", 3.0)
    details["pb"] = pb
    if pb is None:
        missing_count += 1
        checklist.append({
            "layer": "L3",
            "metric": "Price-to-Book (P/B)",
            "value": "N/A",
            "verdict": "warn",
            "explanation": "Price to Book value unavailable."
        })
    elif pb <= sector_pb:
        score += 3.0
        checklist.append({
            "layer": "L3",
            "metric": "Price-to-Book (P/B)",
            "value": f"{pb:.2f}x",
            "verdict": "pass",
            "explanation": "Reasonable book value multiple within sector parameters."
        })
    elif pb <= sector_pb * 1.5:
        score += 1.5
        checklist.append({
            "layer": "L3",
            "metric": "Price-to-Book (P/B)",
            "value": f"{pb:.2f}x",
            "verdict": "warn",
            "explanation": "Moderate premium over typical sector book value."
        })
    else:
        checklist.append({
            "layer": "L3",
            "metric": "Price-to-Book (P/B)",
            "value": f"{pb:.2f}x",
            "verdict": "fail",
            "explanation": "Elevated book value multiple (>1.5x sector norm)."
        })

    # 4. Historical PE band position (3 pts)
    pe_band_pos = data.get("pe_band_position", "mid")
    details["pe_band_position"] = pe_band_pos
    if pe_band_pos == "bottom":
        score += 3.0
        checklist.append({
            "layer": "L3",
            "metric": "Historical P/E Band",
            "value": "Bottom Third",
            "verdict": "pass",
            "explanation": "P/E is currently near its historical 5-year valuation trough."
        })
    elif pe_band_pos == "mid":
        score += 1.5
        checklist.append({
            "layer": "L3",
            "metric": "Historical P/E Band",
            "value": "Middle Third",
            "verdict": "warn",
            "explanation": "Trading near its 5-year median valuation range."
        })
    else:
        checklist.append({
            "layer": "L3",
            "metric": "Historical P/E Band",
            "value": "Top Third",
            "verdict": "fail",
            "explanation": "Trading in the upper third of its 5-year historical valuation range."
        })

    confidence = "high" if missing_count == 0 else ("medium" if missing_count <= 1 else "low")
    return round(score, 1), checklist, details, confidence


def compute_l6_technicals(data: Dict[str, Any]) -> Tuple[float, List[Dict[str, Any]], Dict[str, Any], str]:
    """L6 Technicals (10 pts max).
    Metrics:
    - Price vs MA200 (3 pts)
    - Price vs MA50 (2 pts)
    - RSI-14 (3 pts)
    - 52-week position (2 pts)
    """
    score = 0.0
    checklist = []
    details = {}
    missing_count = 0

    above_ma200 = data.get("above_ma200")
    above_ma50 = data.get("above_ma50")
    rsi14 = data.get("rsi14")
    wk52_pos = data.get("wk52_position")

    details["above_ma200"] = above_ma200
    details["above_ma50"] = above_ma50
    details["rsi14"] = rsi14
    details["wk52_position"] = wk52_pos
    details["volume_trend"] = data.get("volume_trend", "stable")

    # 1. Price vs MA200 (3 pts)
    if above_ma200 is True:
        score += 3.0
        checklist.append({
            "layer": "L6",
            "metric": "Price vs 200-day MA",
            "value": "Above MA200",
            "verdict": "pass",
            "explanation": "Price is above the 200-day moving average, confirming long-term uptrend."
        })
    else:
        checklist.append({
            "layer": "L6",
            "metric": "Price vs 200-day MA",
            "value": "Below MA200",
            "verdict": "fail",
            "explanation": "Price is below the 200-day moving average, indicating long-term weakness."
        })

    # 2. Price vs MA50 (2 pts)
    if above_ma50 is True:
        score += 2.0
        checklist.append({
            "layer": "L6",
            "metric": "Price vs 50-day MA",
            "value": "Above MA50",
            "verdict": "pass",
            "explanation": "Price is above the 50-day moving average, showing medium-term strength."
        })
    else:
        checklist.append({
            "layer": "L6",
            "metric": "Price vs 50-day MA",
            "value": "Below MA50",
            "verdict": "fail",
            "explanation": "Price is below the 50-day moving average."
        })

    # 3. RSI-14 (3 pts)
    if rsi14 is None:
        missing_count += 1
        checklist.append({
            "layer": "L6",
            "metric": "RSI (14-period)",
            "value": "N/A",
            "verdict": "warn",
            "explanation": "RSI data unavailable."
        })
    elif 40.0 <= rsi14 <= 70.0:
        score += 3.0
        checklist.append({
            "layer": "L6",
            "metric": "RSI (14-period)",
            "value": f"{rsi14:.1f}",
            "verdict": "pass",
            "explanation": "Healthy momentum in neutral accumulation zone (40–70)."
        })
    elif (30.0 <= rsi14 < 40.0) or (70.0 < rsi14 <= 80.0):
        score += 1.5
        checklist.append({
            "layer": "L6",
            "metric": "RSI (14-period)",
            "value": f"{rsi14:.1f}",
            "verdict": "warn",
            "explanation": "Approaching boundary zones (30–40 or 70–80)."
        })
    else:
        status_note = "overbought (>80)" if rsi14 > 80 else "oversold (<30)"
        checklist.append({
            "layer": "L6",
            "metric": "RSI (14-period)",
            "value": f"{rsi14:.1f}",
            "verdict": "fail",
            "explanation": f"Extreme RSI momentum: currently {status_note}."
        })

    # 4. 52-week position (2 pts)
    if wk52_pos is None:
        missing_count += 1
        checklist.append({
            "layer": "L6",
            "metric": "52-Week Range Position",
            "value": "N/A",
            "verdict": "warn",
            "explanation": "52-week price range unavailable."
        })
    elif wk52_pos <= 0.5:
        score += 2.0
        checklist.append({
            "layer": "L6",
            "metric": "52-Week Range Position",
            "value": f"{int(wk52_pos * 100)}%",
            "verdict": "pass",
            "explanation": "Trading in the lower half of its 52-week range, offering better entry margin."
        })
    elif 0.5 < wk52_pos <= 0.8:
        score += 1.0
        checklist.append({
            "layer": "L6",
            "metric": "52-Week Range Position",
            "value": f"{int(wk52_pos * 100)}%",
            "verdict": "warn",
            "explanation": "Trading in the 50%–80% zone of its 52-week high-low span."
        })
    else:
        checklist.append({
            "layer": "L6",
            "metric": "52-Week Range Position",
            "value": f"{int(wk52_pos * 100)}%",
            "verdict": "fail",
            "explanation": "Trading in the top 20% near its 52-week peak."
        })

    confidence = "high" if missing_count == 0 else "medium"
    return round(score, 1), checklist, details, confidence


def compute_l4_governance(data: Dict[str, Any], announcement_red_flags: List[Dict[str, Any]]) -> Tuple[float, List[Dict[str, Any]], Dict[str, Any], List[Dict[str, Any]], str]:
    """L4 Governance (20 pts max).
    Metrics:
    - Promoter Pledging (6 pts)
    - Promoter Holding Trend (5 pts)
    - Promoter Holding Level (3 pts)
    - FII+DII Trend (3 pts)
    - Announcement Red-Flag Scan (3 pts)
    """
    score = 0.0
    checklist = []
    details = {}
    red_flags = []
    missing_count = 0

    pledge = data.get("promoter_pledging", 0.0)
    details["pledge_pct"] = pledge

    # 1. Promoter Pledging (6 pts)
    if pledge is None:
        missing_count += 1
        checklist.append({
            "layer": "L4",
            "metric": "Promoter Pledging",
            "value": "N/A",
            "verdict": "warn",
            "explanation": "Promoter pledging data unavailable."
        })
    elif pledge == 0.0:
        score += 6.0
        checklist.append({
            "layer": "L4",
            "metric": "Promoter Pledging",
            "value": "0.0%",
            "verdict": "pass",
            "explanation": "Zero promoter shares pledged (pristine)."
        })
    elif 0.0 < pledge <= 10.0:
        score += 4.0
        checklist.append({
            "layer": "L4",
            "metric": "Promoter Pledging",
            "value": f"{pledge:.1f}%",
            "verdict": "warn",
            "explanation": "Low pledging below 10% threshold."
        })
    elif 10.0 < pledge <= 30.0:
        score += 1.0
        checklist.append({
            "layer": "L4",
            "metric": "Promoter Pledging",
            "value": f"{pledge:.1f}%",
            "verdict": "fail",
            "explanation": "Elevated promoter pledging (10%–30%)."
        })
        red_flags.append({
            "type": "Promoter Pledging",
            "title": f"Promoter shares pledged at {pledge:.1f}%",
            "severity": "minor"
        })
    else:
        # >30% -> 0 pts + critical flag
        checklist.append({
            "layer": "L4",
            "metric": "Promoter Pledging",
            "value": f"{pledge:.1f}%",
            "verdict": "fail",
            "explanation": "Dangerous promoter pledging exceeding 30%."
        })
        red_flags.append({
            "type": "Critical Governance",
            "title": f"Critical promoter pledge level: {pledge:.1f}% of holdings pledged",
            "severity": "major"
        })

    # 2. Promoter Holding Trend (5 pts)
    prom_trend = data.get("promoter_trend", "stable/rising")
    details["promoter_trend"] = prom_trend
    if prom_trend == "stable/rising" or prom_trend == "stable":
        score += 5.0
        checklist.append({
            "layer": "L4",
            "metric": "Promoter Holding Trend (4 qtrs)",
            "value": "Stable / Rising",
            "verdict": "pass",
            "explanation": "Promoter stake has remained stable or increased over the last 4 quarters."
        })
    elif prom_trend == "falling_minor":
        score += 3.0
        checklist.append({
            "layer": "L4",
            "metric": "Promoter Holding Trend (4 qtrs)",
            "value": "Falling (<2%)",
            "verdict": "warn",
            "explanation": "Minor reduction in promoter holding (<2 percentage points)."
        })
    else:
        # Falling >= 2pp -> 0 + red flag
        checklist.append({
            "layer": "L4",
            "metric": "Promoter Holding Trend (4 qtrs)",
            "value": "Falling (≥2%)",
            "verdict": "fail",
            "explanation": "Significant promoter stake reduction of 2 percentage points or more."
        })
        red_flags.append({
            "type": "Promoter Dilution",
            "title": "Promoter stake reduced by ≥2 percentage points over 4 quarters",
            "severity": "major"
        })

    # 3. Promoter Holding Level (3 pts)
    prom_holding = data.get("promoter_holding")
    details["promoter_holding"] = prom_holding
    if prom_holding is None:
        missing_count += 1
        checklist.append({
            "layer": "L4",
            "metric": "Promoter Holding Level",
            "value": "N/A",
            "verdict": "warn",
            "explanation": "Promoter holding level unavailable."
        })
    elif prom_holding >= 50.0:
        score += 3.0
        checklist.append({
            "layer": "L4",
            "metric": "Promoter Holding Level",
            "value": f"{prom_holding:.1f}%",
            "verdict": "pass",
            "explanation": "Strong majority promoter backing (≥50%)."
        })
    elif 25.0 <= prom_holding < 50.0:
        score += 2.0
        checklist.append({
            "layer": "L4",
            "metric": "Promoter Holding Level",
            "value": f"{prom_holding:.1f}%",
            "verdict": "warn",
            "explanation": "Moderate promoter stake (25%–50%)."
        })
    else:
        score += 1.0
        checklist.append({
            "layer": "L4",
            "metric": "Promoter Holding Level",
            "value": f"{prom_holding:.1f}%",
            "verdict": "warn",
            "explanation": "Low promoter holding (<25%), broad institutional or public dispersion."
        })

    # 4. FII + DII Trend (3 pts)
    fii_dii_trend = data.get("fii_dii_trend", "rising")
    details["fii_dii_trend"] = fii_dii_trend
    if fii_dii_trend == "rising":
        score += 3.0
        checklist.append({
            "layer": "L4",
            "metric": "FII + DII Trend",
            "value": "Rising",
            "verdict": "pass",
            "explanation": "Institutional ownership is expanding."
        })
    elif fii_dii_trend == "flat":
        score += 1.5
        checklist.append({
            "layer": "L4",
            "metric": "FII + DII Trend",
            "value": "Flat",
            "verdict": "warn",
            "explanation": "Institutional holding remained unchanged."
        })
    else:
        checklist.append({
            "layer": "L4",
            "metric": "FII + DII Trend",
            "value": "Falling",
            "verdict": "fail",
            "explanation": "Domestic or foreign institutions trimmed holdings."
        })

    # 5. Announcement Red-Flag Scan (90d) (3 pts)
    if not announcement_red_flags:
        score += 3.0
        checklist.append({
            "layer": "L4",
            "metric": "90-Day Regulatory Filings Scan",
            "value": "Clean",
            "verdict": "pass",
            "explanation": "No auditor resignations, SEBI orders, or fraud flags detected in corporate announcements."
        })
    else:
        # Check severity
        has_major = any(rf.get("severity") == "major" for rf in announcement_red_flags)
        if has_major:
            score += 0.0
            checklist.append({
                "layer": "L4",
                "metric": "90-Day Regulatory Filings Scan",
                "value": f"{len(announcement_red_flags)} Flags",
                "verdict": "fail",
                "explanation": "Critical governance issues detected in recent regulatory filings."
            })
            red_flags.extend(announcement_red_flags)
        else:
            score += 1.5
            checklist.append({
                "layer": "L4",
                "metric": "90-Day Regulatory Filings Scan",
                "value": "1 Minor Flag",
                "verdict": "warn",
                "explanation": "Minor corporate disclosure noted in the last 90 days."
            })
            red_flags.extend(announcement_red_flags)

    confidence = "high" if missing_count == 0 else "medium"
    return round(score, 1), checklist, details, red_flags, confidence


def compute_l1_business_quality(moat_label: str, gross_margin_stdev: Optional[float], has_business_clarity: bool = True) -> Tuple[float, List[Dict[str, Any]], Dict[str, Any], str]:
    """L1 Business Quality (15 pts max).
    - Moat (8 pts): Strong (8) / Narrow (5) / None (2)
    - Margin Stability 5y stdev (4 pts): <3pp (4), 3-6pp (2), >6pp (0)
    - Business simplicity / clarity (3 pts): found (3) else (1)
    """
    score = 0.0
    checklist = []
    details = {
        "moat": moat_label,
        "margin_stability": "stable" if (gross_margin_stdev is not None and gross_margin_stdev < 3.0) else "moderate"
    }

    # Moat (8 pts)
    if "strong" in moat_label.lower():
        score += 8.0
        checklist.append({
            "layer": "L1",
            "metric": "Economic Moat",
            "value": "Strong Moat",
            "verdict": "pass",
            "explanation": "Substantial competitive advantage and pricing power protect business economics."
        })
    elif "narrow" in moat_label.lower():
        score += 5.0
        checklist.append({
            "layer": "L1",
            "metric": "Economic Moat",
            "value": "Narrow Moat",
            "verdict": "pass",
            "explanation": "Identifiable competitive moat with moderate defensive advantages."
        })
    else:
        score += 2.0
        checklist.append({
            "layer": "L1",
            "metric": "Economic Moat",
            "value": "No Moat",
            "verdict": "warn",
            "explanation": "Commoditized business model without clear pricing power or moat."
        })

    # Margin Stability (4 pts)
    if gross_margin_stdev is None:
        score += 2.0
        checklist.append({
            "layer": "L1",
            "metric": "Margin Stability (5-yr)",
            "value": "N/A",
            "verdict": "warn",
            "explanation": "Gross margin variance data unavailable."
        })
    elif gross_margin_stdev < 3.0:
        score += 4.0
        checklist.append({
            "layer": "L1",
            "metric": "Margin Stability (5-yr)",
            "value": f"±{gross_margin_stdev:.1f}% stdev",
            "verdict": "pass",
            "explanation": "Highly stable pricing power and consistent gross margins (<3% standard deviation)."
        })
    elif 3.0 <= gross_margin_stdev <= 6.0:
        score += 2.0
        checklist.append({
            "layer": "L1",
            "metric": "Margin Stability (5-yr)",
            "value": f"±{gross_margin_stdev:.1f}% stdev",
            "verdict": "warn",
            "explanation": "Moderate margin fluctuations (3% to 6% standard deviation)."
        })
    else:
        checklist.append({
            "layer": "L1",
            "metric": "Margin Stability (5-yr)",
            "value": f"±{gross_margin_stdev:.1f}% stdev",
            "verdict": "fail",
            "explanation": "High margin volatility (>6% standard deviation)."
        })

    # Business Clarity (3 pts)
    if has_business_clarity:
        score += 3.0
        checklist.append({
            "layer": "L1",
            "metric": "Business Model Clarity",
            "value": "Clear Revenue Drivers",
            "verdict": "pass",
            "explanation": "Transparent revenue drivers and identifiable operating segments."
        })
    else:
        score += 1.0
        checklist.append({
            "layer": "L1",
            "metric": "Business Model Clarity",
            "value": "Complex / Unclear",
            "verdict": "warn",
            "explanation": "Opaque revenue segments or conglomerates with mixed unit economics."
        })

    confidence = "high" if gross_margin_stdev is not None else "medium"
    return round(score, 1), checklist, details, confidence


def compute_l5_growth(data: Dict[str, Any], llm_outlook: str = "Positive") -> Tuple[float, List[Dict[str, Any]], Dict[str, Any], str]:
    """L5 Growth Story (15 pts max).
    - Revenue CAGR 5y (4 pts): >=15% (4), 10-15% (3), 5-10% (1.5), <5% (0)
    - Profit CAGR 5y (4 pts): >=15% (4), 10-15% (3), 5-10% (1.5), <5% (0)
    - Latest quarter YoY profit growth (3 pts): >10% (3), 0-10% (1.5), <0% (0)
    - Forward Outlook from concall/filings (4 pts): Positive (4), Neutral (2), Negative (0)
    """
    score = 0.0
    checklist = []
    details = {
        "outlook": llm_outlook,
        "outlook_confidence": "medium"
    }
    missing_count = 0

    rev_cagr = data.get("revenue_cagr_5y")
    profit_cagr = data.get("profit_cagr_5y")
    yoy_quarter = data.get("latest_quarter_yoy_profit")

    details["revenue_cagr_5y"] = rev_cagr
    details["profit_cagr_5y"] = profit_cagr

    # 1. Revenue CAGR 5y (4 pts)
    if rev_cagr is None:
        missing_count += 1
        checklist.append({
            "layer": "L5",
            "metric": "Revenue Expansion (5-yr CAGR)",
            "value": "N/A",
            "verdict": "warn",
            "explanation": "5-year revenue CAGR data unavailable."
        })
    elif rev_cagr >= 15.0:
        score += 4.0
        checklist.append({
            "layer": "L5",
            "metric": "Revenue Expansion (5-yr CAGR)",
            "value": f"{rev_cagr:.1f}%",
            "verdict": "pass",
            "explanation": "High compound sales growth exceeding 15% annually."
        })
    elif 10.0 <= rev_cagr < 15.0:
        score += 3.0
        checklist.append({
            "layer": "L5",
            "metric": "Revenue Expansion (5-yr CAGR)",
            "value": f"{rev_cagr:.1f}%",
            "verdict": "pass",
            "explanation": "Solid compound sales growth between 10% and 15%."
        })
    elif 5.0 <= rev_cagr < 10.0:
        score += 1.5
        checklist.append({
            "layer": "L5",
            "metric": "Revenue Expansion (5-yr CAGR)",
            "value": f"{rev_cagr:.1f}%",
            "verdict": "warn",
            "explanation": "Moderate compound sales growth between 5% and 10%."
        })
    else:
        checklist.append({
            "layer": "L5",
            "metric": "Revenue Expansion (5-yr CAGR)",
            "value": f"{rev_cagr:.1f}%",
            "verdict": "fail",
            "explanation": "Sub-5% sales compounding over 5 years."
        })

    # 2. Profit CAGR 5y (4 pts)
    if profit_cagr is None:
        missing_count += 1
        checklist.append({
            "layer": "L5",
            "metric": "Profit Compounding (5-yr CAGR)",
            "value": "N/A",
            "verdict": "warn",
            "explanation": "5-year profit CAGR data unavailable."
        })
    elif profit_cagr >= 15.0:
        score += 4.0
        checklist.append({
            "layer": "L5",
            "metric": "Profit Compounding (5-yr CAGR)",
            "value": f"{profit_cagr:.1f}%",
            "verdict": "pass",
            "explanation": "Accelerated net profit compounding (≥15% CAGR)."
        })
    elif 10.0 <= profit_cagr < 15.0:
        score += 3.0
        checklist.append({
            "layer": "L5",
            "metric": "Profit Compounding (5-yr CAGR)",
            "value": f"{profit_cagr:.1f}%",
            "verdict": "pass",
            "explanation": "Healthy net profit compounding between 10% and 15%."
        })
    elif 5.0 <= profit_cagr < 10.0:
        score += 1.5
        checklist.append({
            "layer": "L5",
            "metric": "Profit Compounding (5-yr CAGR)",
            "value": f"{profit_cagr:.1f}%",
            "verdict": "warn",
            "explanation": "Moderate net profit compounding between 5% and 10%."
        })
    else:
        checklist.append({
            "layer": "L5",
            "metric": "Profit Compounding (5-yr CAGR)",
            "value": f"{profit_cagr:.1f}%",
            "verdict": "fail",
            "explanation": "Sluggish net profit growth (<5% CAGR)."
        })

    # 3. Latest Quarter YoY Growth (3 pts)
    if yoy_quarter is None:
        missing_count += 1
        checklist.append({
            "layer": "L5",
            "metric": "Quarterly YoY Profit Growth",
            "value": "N/A",
            "verdict": "warn",
            "explanation": "Recent quarterly earnings data unavailable."
        })
    elif yoy_quarter > 10.0:
        score += 3.0
        checklist.append({
            "layer": "L5",
            "metric": "Quarterly YoY Profit Growth",
            "value": f"+{yoy_quarter:.1f}%",
            "verdict": "pass",
            "explanation": "Robust year-over-year quarterly earnings growth (>10%)."
        })
    elif 0.0 <= yoy_quarter <= 10.0:
        score += 1.5
        checklist.append({
            "layer": "L5",
            "metric": "Quarterly YoY Profit Growth",
            "value": f"{yoy_quarter:.1f}%",
            "verdict": "warn",
            "explanation": "Modest positive quarterly earnings growth (0%–10%)."
        })
    else:
        checklist.append({
            "layer": "L5",
            "metric": "Quarterly YoY Profit Growth",
            "value": f"{yoy_quarter:.1f}%",
            "verdict": "fail",
            "explanation": "Negative year-over-year quarterly earnings growth."
        })

    # 4. LLM Forward Outlook (4 pts)
    outlook_norm = llm_outlook.capitalize()
    if "pos" in outlook_norm.lower():
        score += 4.0
        checklist.append({
            "layer": "L5",
            "metric": "Management Guidance & Outlook",
            "value": "Positive",
            "verdict": "pass",
            "explanation": "Concall guidance points to capacity expansion, healthy order book, or demand tailwinds."
        })
    elif "neg" in outlook_norm.lower():
        checklist.append({
            "layer": "L5",
            "metric": "Management Guidance & Outlook",
            "value": "Negative",
            "verdict": "fail",
            "explanation": "Management flagged sector headwinds, margin margin compression, or demand slowdown."
        })
    else:
        score += 2.0
        checklist.append({
            "layer": "L5",
            "metric": "Management Guidance & Outlook",
            "value": "Neutral",
            "verdict": "warn",
            "explanation": "Steady-state guidance without major capacity catalysts or material headwinds."
        })

    confidence = "high" if missing_count == 0 else "medium"
    return round(score, 1), checklist, details, confidence


def get_rating_band(score_total: int) -> str:
    """Map composite 0-100 score to rating band per Golden Table."""
    if score_total >= 80:
        return "Excellent"
    elif score_total >= 65:
        return "Good"
    elif score_total >= 50:
        return "Average"
    elif score_total >= 35:
        return "Weak"
    else:
        return "Poor"
