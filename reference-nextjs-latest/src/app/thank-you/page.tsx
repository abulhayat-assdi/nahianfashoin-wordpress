"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ThankYouRedirect() {
  const router = useRouter();

  useEffect(() => {
    const stored = localStorage.getItem("sv_last_order");
    if (stored) {
      try {
        const order = JSON.parse(stored);
        if (order?.orderId) {
          router.replace(`/thank-you/${order.orderId}`);
          return;
        }
      } catch {}
    }
    // No order found, go home
    router.replace("/");
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f0fdf4]">
      <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}
