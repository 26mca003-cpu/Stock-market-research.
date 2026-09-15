"""Moat classification prompt (TRD §7.1)."""

SYSTEM_PROMPT = (
    "You are a conservative equity research assistant. Answer ONLY from the SOURCE TEXT. "
    "Cite evidence. Output strict JSON."
)

def build_moat_prompt(business_description: str, mdna_excerpt: str) -> str:
    return f"""SOURCE TEXT:
{business_description}
{mdna_excerpt}

Classify the company's economic moat.
Output JSON: {{"moat":"Strong Moat|Narrow Moat|No Moat","evidence":["..."],"business_one_liner":"...","confidence":"high|medium|low"}}"""
