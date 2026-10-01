// The original admin called Next.js route handlers under /api/...; those calls are served by the plugin's REST
// API (nf/v1). This wrapper rewrites the URL and adds the WordPress REST nonce, leaving the page code untouched.
const ADMIN = window.NF_ADMIN;

const ALIASES: Array<[RegExp, string]> = [
  [/^auth\/admin\/session/, 'admin/session'],
  [/^logo-version/, 'admin/logo-version'],
  [/^blog\/upload/, 'admin/blog-upload'],
  [/^orders\/send-to-courier/, 'admin/orders/send-to-courier'],
  [/^upload/, 'admin/upload'],
  [/^(pages|footer|home-config)(\?|$)/, 'public/$1$2'],
];

export function restUrl(path: string): string {
  const base: string = ADMIN.rest; // ends with "nf/v1/" or "...rest_route=/nf/v1/"
  const [p, q] = path.split('?');
  let url = base + p;
  if (q) url += (url.includes('?') ? '&' : '?') + q;
  return url;
}

const nativeFetch = window.fetch.bind(window);
window.fetch = (input: RequestInfo | URL, init: RequestInit = {}) => {
  const raw = typeof input === 'string' ? input : input instanceof URL ? input.pathname + input.search : input.url;
  if (typeof raw === 'string' && raw.startsWith('/api/')) {
    let path = raw.slice(5);
    for (const [re, to] of ALIASES) if (re.test(path)) { path = path.replace(re, to); break; }
    const headers = new Headers(init.headers || {});
    headers.set('X-WP-Nonce', ADMIN.nonce);
    return nativeFetch(restUrl(path), { ...init, headers, credentials: 'same-origin', cache: 'no-store' });
  }
  return nativeFetch(input as any, init);
};
