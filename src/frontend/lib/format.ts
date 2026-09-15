/**
 * Formatting utilities for VRIDDHI frontend.
 * Handles Indian number system (lakhs/crores), price, percentage, and date formatting.
 */

/** Format a number in Indian currency format (₹) with lakhs/crores abbreviation */
export function formatPrice(value: number | null | undefined, decimals = 2): string {
  if (value === null || value === undefined || isNaN(value)) return "—";
  return `₹${value.toLocaleString("en-IN", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}`;
}

/** Abbreviate large numbers to lakhs/crores for compact display */
export function formatCompact(value: number | null | undefined): string {
  if (value === null || value === undefined || isNaN(value)) return "—";
  const abs = Math.abs(value);
  if (abs >= 1_00_00_000) return `₹${(value / 1_00_00_000).toFixed(2)} Cr`;
  if (abs >= 1_00_000) return `₹${(value / 1_00_000).toFixed(2)} L`;
  return formatPrice(value);
}

/** Format a percentage value with sign */
export function formatPct(value: number | null | undefined, decimals = 1): string {
  if (value === null || value === undefined || isNaN(value)) return "—";
  const sign = value >= 0 ? "+" : "";
  return `${sign}${value.toFixed(decimals)}%`;
}

/** Format a ratio (e.g. D/E, interest coverage) */
export function formatRatio(value: number | null | undefined, decimals = 2): string {
  if (value === null || value === undefined || isNaN(value)) return "—";
  return `${value.toFixed(decimals)}x`;
}

/** Format a date to IST-aware human-readable string */
export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("en-IN", {
      timeZone: "Asia/Kolkata",
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  } catch {
    return iso;
  }
}

/** Format time-ago string (e.g. "2 hours ago") */
export function timeAgo(iso: string | null | undefined): string {
  if (!iso) return "—";
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

/** Clamp a number to [0, max] and round to nearest integer */
export function clamp(value: number, min = 0, max = 100): number {
  return Math.min(max, Math.max(min, Math.round(value)));
}
