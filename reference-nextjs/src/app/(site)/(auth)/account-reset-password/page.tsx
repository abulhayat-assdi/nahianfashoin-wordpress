"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

function ResetPasswordForm() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  useEffect(() => {
    if (!token) setError("Invalid or missing reset token.");
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong.");
      setSuccess(true);
      setTimeout(() => router.push("/account-login"), 2500);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-green-50">
          <svg width="32" height="32" fill="none" stroke="#22c55e" strokeWidth="2.5" viewBox="0 0 24 24">
            <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <h1 className="font-heading text-[40px] text-brand-gold">Password Updated</h1>
        <p className="mt-4 text-[16px] text-[#666]">
          Your password has been reset successfully. Redirecting to login...
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="text-center">
      <h1 className="font-heading text-[50px] text-brand-gold">New Password</h1>
      <p className="mt-4 text-[16px] text-[#666]">Enter and confirm your new password.</p>

      {error && <p className="mt-6 text-left font-medium text-red-500">{error}</p>}

      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="mt-8 h-[60px] w-full border border-[#d8c9ad] bg-brand-cream px-5 text-[20px] text-[#222] outline-none transition-colors placeholder:text-[#777] focus:border-brand-gold focus:ring-1 focus:ring-brand-gold"
        placeholder="New Password"
        minLength={8}
        required
      />
      <input
        type="password"
        value={confirm}
        onChange={(e) => setConfirm(e.target.value)}
        className="mt-4 h-[60px] w-full border border-[#d8c9ad] bg-brand-cream px-5 text-[20px] text-[#222] outline-none transition-colors placeholder:text-[#777] focus:border-brand-gold focus:ring-1 focus:ring-brand-gold"
        placeholder="Confirm Password"
        minLength={8}
        required
      />

      <button
        type="submit"
        disabled={loading || !token}
        className="btn-gold mt-9 h-[63px] w-full text-[18px] uppercase disabled:opacity-70"
      >
        {loading ? "Updating..." : "Set New Password"}
      </button>

      <Link
        href="/account-login"
        className="mt-7 block text-[17px] font-extrabold uppercase tracking-[0.08em] underline"
      >
        Back to Login
      </Link>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <section className="bg-white px-6 py-[105px]">
      <div className="mx-auto max-w-[440px]">
        <Suspense fallback={<p className="text-center text-[#999]">Loading...</p>}>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </section>
  );
}
