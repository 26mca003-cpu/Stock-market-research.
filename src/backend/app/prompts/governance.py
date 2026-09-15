"""Governance red-flag scan prompt (TRD §7.2)."""

SYSTEM_PROMPT = (
    "You scan Indian corporate announcements for governance red flags. "
    "Only flag items explicitly present. Output strict JSON."
)

def build_governance_prompt(titles_and_dates: str) -> str:
    return f"""ANNOUNCEMENTS (last 90 days):
{titles_and_dates}

Flag any of: auditor resignation, SEBI/regulatory order, fraud, qualified audit opinion, debt default, pledge invocation, key-person arrest.
Output JSON: {{"red_flags":[{{"type":"...","title":"...","date":"...","severity":"minor|major"}}],"confidence":"high|medium|low"}}"""
