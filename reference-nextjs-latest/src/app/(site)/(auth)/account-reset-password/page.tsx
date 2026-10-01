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
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-[#e8f5ef]">
          <svg width="28" height="28" fill="none" stroke="#1a3c2e" strokeWidth="2.5" viewBox="0 0 24 24">
            <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <h1 className="text-[24px] font-bold text-[#1a1a1a]">Password Updated</h1>
        <p className="mt-3 text-[14px] text-[#777]">
          Your password has been reset successfully. Redirecting to login...
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="text-center mb-8">
        <h1 className="text-[28px] font-bold text-[#1a1a1a]">New Password</h1>
        <p className="mt-2 text-[14px] text-[#777]">Enter and confirm your new password.</p>
      </div>

      {error && (
        <p className="text-[13px] text-red-500 font-medium bg-red-50 border border-red-200 px-3 py-2">
          {error}
        </p>
      )}

      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="h-[50px] w-full border border-[#ddd] bg-white px-4 text-[15px] text-[#1a1a1a] outline-none transition-colors placeholder:text-[#aaa] focus:border-[#1a3c2e]"
        placeholder="New Password"
        minLength={8}
        required
      />
      <input
        type="password"
        value={confirm}
        onChange={(e) => setConfirm(e.target.value)}
        className="h-[50px] w-full border border-[#ddd] bg-white px-4 text-[15px] text-[#1a1a1a] outline-none transition-colors placeholder:text-[#aaa] focus:border-[#1a3c2e]"
        placeholder="Confirm Password"
        minLength={8}
        required
      />
      <button
        type="submit"
        disabled={loading || !token}
        className="w-full h-[50px] bg-[#1a3c2e] text-white text-[15px] font-bold uppercase tracking-widest hover:bg-[#0f2a1e] transition-colors disabled:opacity-60"
      >
        {loading ? "Updating..." : "Set New Password"}
      </button>

      <p className="text-center text-[14px] text-[#777] pt-2">
        <Link href="/account-login" className="text-[#1a3c2e] font-semibold hover:underline">
          Back to Login
        </Link>
      </p>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <section className="min-h-[70vh] bg-[#f5f5f5] flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-[420px] bg-white border border-[#eee] p-8 md:p-10">
        <Suspense fallback={<p className="text-center text-[14px] text-[#999]">Loading...</p>}>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </section>
  );
}
