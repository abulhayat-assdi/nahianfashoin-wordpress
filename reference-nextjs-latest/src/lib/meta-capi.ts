import { createHash } from 'crypto';

const PIXEL_ID = process.env.FB_PIXEL_ID;
const ACCESS_TOKEN = process.env.FB_CAPI_ACCESS_TOKEN;
const TEST_EVENT_CODE = process.env.FB_CAPI_TEST_EVENT_CODE;
const API_VERSION = 'v21.0';

const sha256 = (value: string) => createHash('sha256').update(value).digest('hex');

/** Normalizes a BD phone (01XXXXXXXXX) to E.164 digits (8801XXXXXXXXX) and hashes it per Meta spec. */
function hashPhone(phone: string): string {
  let digits = phone.replace(/\D/g, '');
  if (digits.startsWith('0')) digits = '880' + digits.slice(1);
  return sha256(digits);
}

export type PurchaseEventInput = {
  orderId: string;
  total: number;
  phone: string;
  customerName: string;
  clientIp?: string;
  userAgent?: string;
  eventSourceUrl?: string;
  contents: Array<{ id: string; quantity: number; item_price: number }>;
};

/**
 * Sends a server-side Purchase event to Meta Conversions API.
 *
 * Deduplication: `event_id` is set to `orderId`. The thank-you page pushes
 * the same `event_id` into the dataLayer, and GTM forwards it to the browser
 * pixel via `fbq('track', 'Purchase', {...}, { eventID: orderId })`.
 * Meta sees matching event_name + event_id and counts the purchase only once.
 *
 * Never throws — tracking must not break order creation.
 */
export async function sendPurchaseEvent(input: PurchaseEventInput): Promise<void> {
  if (!PIXEL_ID || !ACCESS_TOKEN) return;

  const nameParts = input.customerName.trim().split(/\s+/);
  const userData: Record<string, unknown> = {
    ph: [hashPhone(input.phone)],
    fn: [sha256(nameParts[0].toLowerCase())],
    ...(nameParts.length > 1 && { ln: [sha256(nameParts[nameParts.length - 1].toLowerCase())] }),
    ...(input.clientIp && input.clientIp !== 'unknown' && { client_ip_address: input.clientIp }),
    ...(input.userAgent && { client_user_agent: input.userAgent }),
  };

  const body = {
    data: [
      {
        event_name: 'Purchase',
        event_time: Math.floor(Date.now() / 1000),
        event_id: input.orderId,
        action_source: 'website',
        event_source_url: input.eventSourceUrl || 'https://nahianfashion.com/checkout',
        user_data: userData,
        custom_data: {
          currency: 'BDT',
          value: input.total,
          content_type: 'product',
          contents: input.contents,
          num_items: input.contents.reduce((acc, c) => acc + c.quantity, 0),
        },
      },
    ],
    ...(TEST_EVENT_CODE && { test_event_code: TEST_EVENT_CODE }),
  };

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(
      `https://graph.facebook.com/${API_VERSION}/${PIXEL_ID}/events?access_token=${encodeURIComponent(ACCESS_TOKEN)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: controller.signal,
      }
    );
    clearTimeout(timer);
    if (!res.ok) {
      const text = await res.text();
      console.error(`[META-CAPI] Purchase event failed (${res.status}): ${text.slice(0, 300)}`);
    }
  } catch (err) {
    console.error('[META-CAPI] Purchase event error:', err instanceof Error ? err.message : err);
  }
}
