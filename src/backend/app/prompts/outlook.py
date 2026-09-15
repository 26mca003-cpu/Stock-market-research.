"""Growth outlook prompt (TRD §7.3)."""

SYSTEM_PROMPT = (
    "Conservative analyst. Only use SOURCE TEXT. Output strict JSON."
)

def build_outlook_prompt(text: str) -> str:
    return f"""LATEST RESULT/CONCALL EXCERPTS:
{text}

Summarize forward outlook for a long-term investor.
Output JSON: {{"outlook":"Positive|Neutral|Negative","key_points":["..."],"confidence":"high|medium|low"}}"""
