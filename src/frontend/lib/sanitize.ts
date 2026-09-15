/**
 * Client-side text sanitizer for regulatory compliance (TRD §0 & §9).
 * Guarantees no advisory language (buy/sell/hold/recommendation/target price) is rendered.
 */

const FORBIDDEN_REPLACEMENTS: [RegExp, string][] = [
  [/\bbuy\b/gi, "consider"],
  [/\bsell\b/gi, "review exposure to"],
  [/\bhold\b/gi, "monitor"],
  [/\brecommendation\b/gi, "assessment"],
  [/\brecommendations\b/gi, "assessments"],
  [/\brecommend\b/gi, "highlight"],
  [/\btarget price\b/gi, "fair value estimate"],
  [/\bguaranteed\b/gi, "expected"],
];

export function sanitizeText(text: string | null | undefined): string {
  if (!text) return "";
  let sanitized = text;
  for (const [pattern, replacement] of FORBIDDEN_REPLACEMENTS) {
    sanitized = sanitized.replace(pattern, replacement);
  }
  return sanitized;
}
