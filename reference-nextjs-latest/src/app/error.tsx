"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="min-h-screen bg-[#f5f5f5] flex flex-col items-center justify-center text-center px-6">
      <p className="text-[13px] font-bold uppercase tracking-widest text-[#1a3c2e] mb-4">
        Something went wrong
      </p>
      <h1 className="font-heading text-[48px] md:text-[56px] text-[#222] leading-tight">
        We hit a snag
      </h1>
      <p className="mt-6 max-w-[480px] text-[16px] text-[#666] leading-relaxed">
        An unexpected error occurred. Please try again or return to the homepage.
      </p>
      <div className="mt-10 flex flex-wrap gap-4 justify-center">
        <button
          onClick={reset}
          className="px-8 py-4 bg-[#1a3c2e] text-white font-bold uppercase tracking-wider text-[14px] hover:bg-[#0f2a1e] transition-colors"
        >
          Try Again
        </button>
        <Link
          href="/"
          className="px-8 py-4 border border-[#1a3c2e] text-[#1a3c2e] font-bold uppercase tracking-wider text-[14px] hover:bg-[#1a3c2e] hover:text-white transition-colors"
        >
          Back to Home
        </Link>
      </div>
    </main>
  );
}
