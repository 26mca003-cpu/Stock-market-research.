"""Final AI summary prompt (TRD §7.5)."""
from app.config import settings

SYSTEM_PROMPT = (
    "You are a conservative, plain-English equity research analyst. "
    "Do NOT use any forbidden words such as 'buy', 'sell', 'hold', 'recommendation', 'target price', 'guaranteed'."
)

def build_summary_prompt(company_name: str, ticker: str, score_total: int, rating_band: str, metrics_summary: str) -> str:
    return f"""Write a concise plain-English research summary (maximum 150 words) for long-term investors evaluating {company_name} ({ticker}).

Overall Quality Score: {score_total}/100 ({rating_band} Quality)
Key Metrics Evaluated:
{metrics_summary}

Requirements:
1. Explain in simple, jargon-free English whether a long-term investor should care about this business.
2. Specifically cite metrics and evidence using [1] or [2] citations.
3. NEVER use recommendation words: do NOT say 'buy', 'sell', 'hold', 'target price', or 'recommendation'.
4. Conclude with this EXACT sentence:
"{settings.DISCLAIMER_TEXT}"
"""
