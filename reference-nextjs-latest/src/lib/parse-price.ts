/**
 * Parses price strings like "Tk 1,200.00", "৳1,200", "1200.50" into a number.
 * Handles multiple dots by keeping only the last one as decimal separator.
 */
export function parsePrice(value: string | number): number {
  if (typeof value === "number") return isFinite(value) ? value : 0;
  // Strip all non-numeric characters except dots
  const stripped = value.replace(/[^0-9.]/g, "");
  // If there are multiple dots, keep only the last one as decimal separator
  const parts = stripped.split(".");
  const cleaned = parts.length > 1
    ? parts.slice(0, -1).join("") + "." + parts[parts.length - 1]
    : stripped;
  const result = parseFloat(cleaned);
  return isFinite(result) ? result : 0;
}
