import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Page Not Found | Nahian Fashion",
  robots: { index: false, follow: true },
};

export default function NotFound() {
  return (
    <main className="min-h-screen bg-[#f5f5f5] flex flex-col items-center justify-center text-center px-6">
      <p className="text-[13px] font-bold uppercase tracking-widest text-[#1a3c2e] mb-4">404</p>
      <h1 className="font-heading text-[48px] md:text-[64px] text-[#222] leading-tight">
        Page Not Found
      </h1>
      <p className="mt-6 max-w-[480px] text-[16px] text-[#666] leading-relaxed">
        The page you are looking for doesn&apos;t exist or has been moved. Let&apos;s get
        you back to our collection.
      </p>
      <div className="mt-10 flex flex-wrap gap-4 justify-center">
        <Link
          href="/"
          className="px-8 py-4 bg-[#1a3c2e] text-white font-bold uppercase tracking-wider text-[14px] hover:bg-[#0f2a1e] transition-colors"
        >
          Back to Home
        </Link>
        <Link
          href="/collections/all"
          className="px-8 py-4 border border-[#1a3c2e] text-[#1a3c2e] font-bold uppercase tracking-wider text-[14px] hover:bg-[#1a3c2e] hover:text-white transition-colors"
        >
          Shop All Products
        </Link>
      </div>
    </main>
  );
}
