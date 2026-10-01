"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Grid2X2, ShoppingBag, User } from "lucide-react";
import { useEffect, useState } from "react";
import { buildWhatsAppUrl } from "@/lib/whatsapp";

export default function BottomNav({ whatsappNumber }: { whatsappNumber?: string | null }) {
  const pathname = usePathname();
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    const sync = () => {
      try {
        const saved = localStorage.getItem("cart");
        if (saved) {
          const items = JSON.parse(saved);
          const count = Array.isArray(items)
            ? items.reduce((acc: number, i: any) => acc + (i.quantity || 1), 0)
            : 0;
          setCartCount(count);
        } else {
          setCartCount(0);
        }
      } catch {
        setCartCount(0);
      }
    };

    sync();
    window.addEventListener("cart:add", sync);
    window.addEventListener("cart:clear", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("cart:add", sync);
      window.removeEventListener("cart:clear", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const isHomeActive = pathname === "/";
  const isMenuActive =
    !isHomeActive && pathname.startsWith("/collections");
  const isCartActive = pathname === "/cart";
  const isAccountActive =
    pathname.startsWith("/account");

  const itemBase =
    "relative flex flex-col items-center justify-center gap-0.5 py-2 transition-colors";

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-[90] md:hidden bg-[#1a3c2e] border-t border-white/10 pb-[env(safe-area-inset-bottom)]">
      <div className="grid grid-cols-5 items-end">

        {/* 1 — Menu */}
        <Link
          href="/collections/all"
          className={`${itemBase} ${
            isMenuActive ? "text-white" : "text-white/55 hover:text-white/80"
          }`}
        >
          {isMenuActive && (
            <span className="absolute top-0 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-white" />
          )}
          <Grid2X2 size={22} strokeWidth={isMenuActive ? 2 : 1.8} />
          <span className="text-[9px] font-medium leading-none">Menu</span>
        </Link>

        {/* 2 — Cart */}
        <Link
          href="/cart"
          className={`${itemBase} ${
            isCartActive ? "text-white" : "text-white/55 hover:text-white/80"
          }`}
        >
          {isCartActive && (
            <span className="absolute top-0 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-white" />
          )}
          <div className="relative">
            <ShoppingBag size={22} strokeWidth={isCartActive ? 2 : 1.8} />
            {cartCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 flex h-[16px] w-[16px] items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white leading-none">
                {cartCount > 9 ? "9+" : cartCount}
              </span>
            )}
          </div>
          <span className="text-[9px] font-medium leading-none">Cart</span>
        </Link>

        {/* 3 — Home (centre, raised) */}
        <Link
          href="/"
          className="relative flex flex-col items-center justify-end gap-0.5 pb-1.5 transition-colors"
        >
          <div
            className={`-mt-4 flex h-[52px] w-[52px] items-center justify-center rounded-full shadow-lg border-2 transition-all ${
              isHomeActive
                ? "bg-white border-white text-[#1a3c2e]"
                : "bg-[#245238] border-white/30 text-white hover:bg-[#2d6347]"
            }`}
          >
            <Home size={22} strokeWidth={isHomeActive ? 2.2 : 1.8} />
          </div>
          <span
            className={`text-[9px] font-medium leading-none ${
              isHomeActive ? "text-white" : "text-white/55"
            }`}
          >
            Home
          </span>
        </Link>

        {/* 4 — WhatsApp */}
        <a
          href={buildWhatsAppUrl(whatsappNumber)}
          target="_blank"
          rel="noopener noreferrer"
          className={`${itemBase} text-white/55 hover:text-white/80`}
        >
          <svg
            viewBox="0 0 448 512"
            className="w-[22px] h-[22px]"
            fill="currentColor"
            aria-hidden="true"
          >
            <path d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L32 503l139.7-36.6c32.7 17.7 69.2 27 106.7 27 122.4 0 222-99.6 222-222 0-59.3-25.2-115-67.1-157zm-157 341.6c-33.2 0-65.7-8.9-94-25.7l-6.7-4-82.8 21.7 22.1-80.7-4.4-7c-18.5-29.4-28.2-63.3-28.2-98.2 0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.4 54.1 34.8 34.9 56.2 81.2 56.1 130.5 0 101.8-84.9 184.6-186.6 184.6zm101.2-138.2c-5.5-2.8-32.8-16.2-37.9-18-5.1-1.9-8.8-2.8-12.5 2.8-3.7 5.6-14.3 18-17.6 21.8-3.2 3.7-6.5 4.2-12 1.4-32.6-16.3-54-29.1-75.5-66-5.7-9.8 5.7-9.1 16.3-30.3 1.8-3.7 .9-6.9-.5-9.7-1.4-2.8-12.5-30.1-17.1-41.2-4.5-10.8-9.1-9.3-12.5-9.5-3.2-.2-6.9-.2-10.6-.2-3.7 0-9.7 1.4-14.8 6.9-5.1 5.6-19.4 19-19.4 46.3 0 27.3 19.9 53.7 22.6 57.4 2.8 3.7 39.1 59.7 94.8 83.8 35.2 15.2 49 16.5 66.6 13.9 10.7-1.6 32.8-13.4 37.4-26.4 4.6-13 4.6-24.1 3.2-26.4-1.3-2.5-5-3.9-10.5-6.6z" />
          </svg>
          <span className="text-[9px] font-medium leading-none">WhatsApp</span>
        </a>

        {/* 5 — Account */}
        <Link
          href="/account-order"
          className={`${itemBase} ${
            isAccountActive ? "text-white" : "text-white/55 hover:text-white/80"
          }`}
        >
          {isAccountActive && (
            <span className="absolute top-0 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-white" />
          )}
          <User size={22} strokeWidth={isAccountActive ? 2 : 1.8} />
          <span className="text-[9px] font-medium leading-none">Account</span>
        </Link>

      </div>
    </nav>
  );
}
