// Minimal client-side router standing in for next/navigation. Components keep using "/admin/..." paths;
// the real URL prefix (WordPress may live in a sub-directory) comes from window.NF_ADMIN.base.
import { useSyncExternalStore } from 'react';

declare global { interface Window { NF_ADMIN: { base: string; [k: string]: any } } }

const BASE: string = window.NF_ADMIN.base.replace(/\/$/, '');           // e.g. "/admin" or "/shop/admin"
const PREFIX = BASE.slice(0, BASE.length - '/admin'.length);            // "" or "/shop"

export function toUrl(href: string): string {
  return href.startsWith('/admin') ? PREFIX + href : href;
}

function currentPath(): string {
  let p = window.location.pathname;
  if (PREFIX && p.startsWith(PREFIX)) p = p.slice(PREFIX.length);
  if (p.length > 1 && p.endsWith('/')) p = p.slice(0, -1);
  return p || '/';
}

let version = 0;
const listeners = new Set<() => void>();
const notify = () => { version++; listeners.forEach((l) => l()); };
window.addEventListener('popstate', notify);
function subscribe(l: () => void) { listeners.add(l); return () => { listeners.delete(l); }; }

export function usePathname(): string {
  return useSyncExternalStore(subscribe, currentPath, currentPath);
}

export function useSearchParams(): URLSearchParams {
  useSyncExternalStore(subscribe, () => version, () => version);
  return new URLSearchParams(window.location.search);
}

const router = {
  push(href: string) { window.history.pushState({}, '', toUrl(href)); window.scrollTo(0, 0); notify(); },
  replace(href: string) { window.history.replaceState({}, '', toUrl(href)); notify(); },
  back() { window.history.back(); },
  forward() { window.history.forward(); },
  refresh() { notify(); },
  prefetch() { /* no-op */ },
};

export function useRouter() {
  return router;
}
