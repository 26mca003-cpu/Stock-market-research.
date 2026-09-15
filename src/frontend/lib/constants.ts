/** Golden Constants for VRIDDHI Frontend (TRD §0 & PRD §6.3) */

export const APP_NAME = "VRIDDHI";
export const TAGLINE = "Research like the top 1%";

export const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

export const DISCLAIMER_TEXT =
  "Educational tool, not investment advice. Data may be delayed or inaccurate — consult a SEBI-registered advisor before investing.";

export const RATING_BANDS = {
  EXCELLENT: { label: "Excellent Quality", min: 80, color: "#10B981", bg: "#ECFDF5" },
  GOOD: { label: "Good Quality", min: 65, color: "#059669", bg: "#F0FDF4" },
  AVERAGE: { label: "Average Quality", min: 50, color: "#F59E0B", bg: "#FFFBEB" },
  WEAK: { label: "Weak Quality", min: 35, color: "#EA580C", bg: "#FFF7ED" },
  POOR: { label: "Poor Quality", min: 0, color: "#EF4444", bg: "#FEF2F2" }
};

export function getBandDetails(score: number) {
  if (score >= 80) return RATING_BANDS.EXCELLENT;
  if (score >= 65) return RATING_BANDS.GOOD;
  if (score >= 50) return RATING_BANDS.AVERAGE;
  if (score >= 35) return RATING_BANDS.WEAK;
  return RATING_BANDS.POOR;
}
