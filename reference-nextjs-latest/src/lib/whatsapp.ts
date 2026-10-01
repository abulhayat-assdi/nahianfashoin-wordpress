/**
 * Converts a raw WhatsApp number/URL stored in siteSettings into a valid wa.me link.
 * Accepts: full https://wa.me/... URLs, local numbers (01XXXXXXXXX), or international digits.
 * Returns "#" when the value is empty so links remain safe/inert.
 */
export function buildWhatsAppUrl(value: string | null | undefined): string {
  if (!value || !value.trim()) return "#";
  const t = value.trim();
  if (t.startsWith("http://") || t.startsWith("https://")) return t;
  const digits = t.replace(/[^\d]/g, "");
  return digits ? `https://wa.me/${digits}` : "#";
}
