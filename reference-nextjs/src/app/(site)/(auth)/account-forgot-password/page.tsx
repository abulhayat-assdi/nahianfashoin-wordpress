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
      <section className="bg-white px-6 py-[105px]">
        <div className="mx-auto max-w-[440px] text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-green-50">
            <svg width="32" height="32" fill="none" stroke="#22c55e" strokeWidth="2.5" viewBox="0 0 24 24">
              <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <h1 className="font-heading text-[40px] text-brand-gold">Check your email</h1>
          <p className="mt-4 text-[16px] text-[#666] leading-relaxed">
            If an account exists for <strong>{email}</strong>, we&apos;ve sent a password reset link. Check your inbox and spam folder.
          </p>
          <p className="mt-3 text-[14px] text-[#999]">The link expires in 1 hour.</p>
          <Link
            href="/account-login"
            className="mt-8 inline-block text-[16px] font-extrabold uppercase tracking-[0.08em] underline"
          >
            Back to Login
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="bg-white px-6 py-[105px]">
      <form onSubmit={handleSubmit} className="mx-auto max-w-[440px] text-center">
        <h1 className="font-heading text-[50px] text-brand-gold">Forgot Password</h1>
        <p className="mt-4 text-[16px] text-[#666]">
          Enter your email address and we&apos;ll send you a link to reset your password.
        </p>

        {error && <p className="mt-6 text-left font-medium text-red-500">{error}</p>}

        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-8 h-[60px] w-full border border-[#d8c9ad] bg-brand-cream px-5 text-[20px] text-[#222] outline-none transition-colors placeholder:text-[#777] focus:border-brand-gold focus:ring-1 focus:ring-brand-gold"
          placeholder="E-mail"
          required
        />

        <button
          type="submit"
          disabled={loading}
          className="btn-gold mt-9 h-[63px] w-full text-[18px] uppercase disabled:opacity-70"
        >
          {loading ? "Sending..." : "Send Reset Link"}
        </button>

        <Link
          href="/account-login"
          className="mt-7 block text-[17px] font-extrabold uppercase tracking-[0.08em] underline"
        >
          Back to Login
        </Link>
      </form>
    </section>
  );
}
