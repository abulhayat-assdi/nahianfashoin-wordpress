"use client";

import { useState } from "react";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong.");
      setSent(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <section className="min-h-[70vh] bg-[#f5f5f5] flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-[420px] bg-white border border-[#eee] p-8 md:p-10 text-center">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-[#e8f5ef]">
            <svg width="28" height="28" fill="none" stroke="#1a3c2e" strokeWidth="2.5" viewBox="0 0 24 24">
              <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <h1 className="text-[24px] font-bold text-[#1a1a1a]">Check your email</h1>
          <p className="mt-3 text-[14px] text-[#777] leading-relaxed">
            If an account exists for <strong className="text-[#1a1a1a]">{email}</strong>, we&apos;ve sent a password reset link. Check your inbox and spam folder.
          </p>
          <p className="mt-2 text-[12px] text-[#aaa]">The link expires in 1 hour.</p>
          <Link
            href="/account-login"
            className="mt-7 inline-block text-[14px] font-semibold text-[#1a3c2e] hover:underline"
          >
            Back to Login
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="min-h-[70vh] bg-[#f5f5f5] flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-[420px] bg-white border border-[#eee] p-8 md:p-10">
        <div className="text-center mb-8">
          <h1 className="text-[28px] font-bold text-[#1a1a1a]">Forgot Password</h1>
          <p className="mt-2 text-[14px] text-[#777]">
            Enter your email and we&apos;ll send a reset link.
          </p>
        </div>

        {error && (
          <p className="mb-4 text-[13px] text-red-500 font-medium bg-red-50 border border-red-200 px-3 py-2">
            {error}
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-[50px] w-full border border-[#ddd] bg-white px-4 text-[15px] text-[#1a1a1a] outline-none transition-colors placeholder:text-[#aaa] focus:border-[#1a3c2e]"
            placeholder="Email address"
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full h-[50px] bg-[#1a3c2e] text-white text-[15px] font-bold uppercase tracking-widest hover:bg-[#0f2a1e] transition-colors disabled:opacity-60"
          >
            {loading ? "Sending..." : "Send Reset Link"}
          </button>
        </form>

        <p className="mt-6 text-center text-[14px] text-[#777]">
          Remember your password?{" "}
          <Link href="/account-login" className="text-[#1a3c2e] font-semibold hover:underline">
            Login
          </Link>
        </p>
      </div>
    </section>
  );
}
