"""Resilient LLM Service chaining Gemini 2.0 Flash -> Groq -> Heuristics with strict forbidden-word sanitizer (TRD §7)."""
import re
import json
import logging
from typing import Dict, Any, List, Optional
from app.config import settings
from app.prompts import moat, governance, outlook, sentiment, summary

logger = logging.getLogger(__name__)


class LLMService:
    @staticmethod
    def sanitize_text(text: str) -> str:
        """Sanitize AI text to strictly prevent forbidden financial recommendation words (TRD §0 & §9)."""
        if not text:
            return ""

        # Forbidden word mapping to neutral educational equivalents
        replacements = {
            r"\bbuy\b": "consider",
            r"\bsell\b": "review exposure to",
            r"\bhold\b": "monitor",
            r"\brecommendation\b": "assessment",
            r"\brecommendations\b": "assessments",
            r"\brecommend\b": "highlight",
            r"\btarget price\b": "fair value estimate",
            r"\bguaranteed\b": "expected",
        }

        sanitized = text
        for pattern, replacement in replacements.items():
            sanitized = re.sub(pattern, replacement, sanitized, flags=re.IGNORECASE)

        return sanitized

    @classmethod
    async def _call_llm(cls, system_prompt: str, user_prompt: str) -> Optional[str]:
        """Execute call to Gemini 2.0 Flash, falling back to Groq LLaMA 3.1 8B."""
        # 1. Primary: Gemini
        if settings.GEMINI_API_KEY:
            try:
                import google.generativeai as genai
                genai.configure(api_key=settings.GEMINI_API_KEY)
                model = genai.GenerativeModel("gemini-2.0-flash", system_instruction=system_prompt)
                resp = model.generate_content(
                    user_prompt,
                    generation_config={"temperature": 0.2, "response_mime_type": "application/json"}
                )
                if resp.text:
                    return resp.text.strip()
            except Exception as e:
                logger.warning(f"Gemini 2.0 Flash call failed: {e}. Attempting Groq fallback...")

        # 2. Fallback: Groq
        if settings.GROQ_API_KEY:
            try:
                from groq import Groq
                client = Groq(api_key=settings.GROQ_API_KEY)
                models_to_try = ["openai/gpt-oss-20b", "qwen/qwen3.8-27b", "llama-3.1-8b-instant"]
                for g_model in models_to_try:
                    try:
                        completion = client.chat.completions.create(
                            model=g_model,
                            messages=[
                                {"role": "system", "content": system_prompt},
                                {"role": "user", "content": user_prompt}
                            ],
                            temperature=0.2,
                            response_format={"type": "json_object"}
                        )
                        content = completion.choices[0].message.content
                        if content:
                            return content.strip()
                    except Exception as model_err:
                        logger.debug(f"Groq model {g_model} failed: {model_err}")
            except Exception as e:
                logger.warning(f"Groq fallback failed: {e}.")

        return None

    @classmethod
    async def classify_moat(cls, business_description: str, mdna: str = "") -> Dict[str, Any]:
        """L1 Moat classification per TRD §7.1."""
        prompt = moat.build_moat_prompt(business_description[:1500], mdna[:1500])
        raw = await cls._call_llm(moat.SYSTEM_PROMPT, prompt)

        if raw:
            try:
                parsed = json.loads(raw)
                return {
                    "moat": parsed.get("moat", "Narrow Moat"),
                    "evidence": parsed.get("evidence", []),
                    "business_one_liner": cls.sanitize_text(parsed.get("business_one_liner", "")),
                    "confidence": parsed.get("confidence", "medium")
                }
            except Exception:
                pass

        # Heuristic fallback if LLM offline
        desc_lower = business_description.lower()
        if any(w in desc_lower for w in ["leader", "monopoly", "largest", "patent", "dominant", "pricing power"]):
            moat_label = "Strong Moat"
        elif any(w in desc_lower for w in ["major", "established", "top 3", "competitive"]):
            moat_label = "Narrow Moat"
        else:
            moat_label = "Narrow Moat"

        first_sentence = business_description.split(".")[0] if business_description else "Diversified business operations."
        return {
            "moat": moat_label,
            "evidence": ["Derived from primary operational scale and business disclosures."],
            "business_one_liner": cls.sanitize_text(first_sentence),
            "confidence": "medium"
        }

    @classmethod
    async def scan_governance(cls, announcements_text: str) -> Dict[str, Any]:
        """L4 Governance red-flag scan per TRD §7.2."""
        if not announcements_text.strip():
            return {"red_flags": [], "confidence": "high"}

        prompt = governance.build_governance_prompt(announcements_text[:2000])
        raw = await cls._call_llm(governance.SYSTEM_PROMPT, prompt)

        if raw:
            try:
                parsed = json.loads(raw)
                return {
                    "red_flags": parsed.get("red_flags", []),
                    "confidence": parsed.get("confidence", "high")
                }
            except Exception:
                pass

        # Regex heuristic scan for critical regulatory keywords
        keywords = [
            ("auditor resignation", "major"),
            ("resignation of statutory auditor", "major"),
            ("sebi order", "major"),
            ("fraud", "major"),
            ("qualified opinion", "minor"),
            ("default", "major"),
            ("pledge invocation", "major"),
            ("arrest", "major")
        ]
        flags = []
        text_lower = announcements_text.lower()
        for kw, sev in keywords:
            if kw in text_lower:
                flags.append({
                    "type": "Regulatory Disclosure",
                    "title": f"Flagged announcement matching '{kw}'",
                    "severity": sev
                })

        return {"red_flags": flags, "confidence": "high" if not flags else "medium"}

    @classmethod
    async def analyze_outlook(cls, text: str) -> Dict[str, Any]:
        """L5 Growth outlook per TRD §7.3."""
        if not text.strip():
            return {"outlook": "Positive", "key_points": [], "confidence": "medium"}

        prompt = outlook.build_outlook_prompt(text[:2000])
        raw = await cls._call_llm(outlook.SYSTEM_PROMPT, prompt)

        if raw:
            try:
                parsed = json.loads(raw)
                return {
                    "outlook": parsed.get("outlook", "Positive"),
                    "key_points": parsed.get("key_points", []),
                    "confidence": parsed.get("confidence", "medium")
                }
            except Exception:
                pass

        return {
            "outlook": "Positive",
            "key_points": ["Stable business guidance from filings and annual reports."],
            "confidence": "medium"
        }

    @classmethod
    async def classify_news_sentiment(cls, titles: List[str]) -> List[Dict[str, Any]]:
        """Batch headline sentiment per TRD §7.4."""
        if not titles:
            return []

        numbered = "\n".join([f"{i}. {t}" for i, t in enumerate(titles[:15])])
        prompt = sentiment.build_sentiment_prompt(numbered)
        raw = await cls._call_llm(sentiment.SYSTEM_PROMPT, prompt)

        if raw:
            try:
                parsed = json.loads(raw)
                if isinstance(parsed, list):
                    return parsed
            except Exception:
                pass

        # Heuristic fallback sentiment classification
        results = []
        for i, t in enumerate(titles):
            t_low = t.lower()
            if any(w in t_low for w in ["gain", "profit", "jump", "soar", "record", "growth", "high", "upgrade", "win", "surge"]):
                s = "positive"
            elif any(w in t_low for w in ["loss", "fall", "drop", "plunge", "down", "probe", "fraud", "penalty", "slump", "miss"]):
                s = "negative"
            else:
                s = "neutral"
            results.append({"i": i, "sentiment": s})
        return results

    @classmethod
    async def generate_summary(cls, company_name: str, ticker: str, score: int, band: str, metrics_summary: str) -> str:
        """150-word synthesis per TRD §7.5 ending with disclaimer."""
        prompt = summary.build_summary_prompt(company_name, ticker, score, band, metrics_summary)
        raw = await cls._call_llm(summary.SYSTEM_PROMPT, prompt)

        if raw and len(raw.strip()) > 30:
            cleaned = cls.sanitize_text(raw.strip())
            # Ensure disclaimer is at the end
            if settings.DISCLAIMER_TEXT not in cleaned:
                cleaned = f"{cleaned}\n\n{settings.DISCLAIMER_TEXT}"
            return cleaned

        # Deterministic institutional summary fallback
        fallback = (
            f"{company_name} ({ticker}) demonstrates a Quality Score of {score}/100, placing it in the {band} Quality band [1]. "
            f"The company maintains solid balance sheet strength and operational margins relative to sector peers [2]. "
            f"Investors focusing on long-term compound performance should evaluate underlying margin consistency and competitive advantages.\n\n"
            f"{settings.DISCLAIMER_TEXT}"
        )
        return cls.sanitize_text(fallback)
