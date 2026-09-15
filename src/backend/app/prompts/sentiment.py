"""Batch news sentiment prompt (TRD §7.4)."""

SYSTEM_PROMPT = "You are a financial sentiment analyzer."

def build_sentiment_prompt(numbered_titles: str) -> str:
    return f"""Classify each headline for long-term investor impact. JSON array only:
[{{"i":0,"sentiment":"positive|neutral|negative"}}]
HEADLINES:
{numbered_titles}"""
