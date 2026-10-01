"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  useEffect(() => {
    fetch("/api/auth/session")
      .then((r) => r.json())
      .then((data) => {
        if (data.user) router.replace("/account-order");
      })
      .catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Invalid email or password.");
      router.push("/account-order");
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Invalid email or password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="min-h-[70vh] bg-[#f5f5f5] flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-[420px] bg-white border border-[#eee] p-8 md:p-10">
        <div className="text-center mb-8">
          <h1 className="text-[28px] font-bold text-[#1a1a1a]">Login</h1>
          <p className="mt-2 text-[14px] text-[#777]">Sign in to your account</p>
        </div>

        {error && (
          <p className="mb-4 text-[13px] text-red-500 font-medium bg-red-50 border border-red-200 px-3 py-2">
            {error}
          </p>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-[50px] w-full border border-[#ddd] bg-white px-4 text-[15px] text-[#1a1a1a] outline-none transition-colors placeholder:text-[#aaa] focus:border-[#1a3c2e]"
            placeholder="Email address"
            required
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="h-[50px] w-full border border-[#ddd] bg-white px-4 text-[15px] text-[#1a1a1a] outline-none transition-colors placeholder:text-[#aaa] focus:border-[#1a3c2e]"
            placeholder="Password"
            required
          />
          <div className="text-right">
            <Link href="/account-forgot-password" className="text-[13px] text-[#1a3c2e] hover:underline">
              Forgot your password?
            </Link>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full h-[50px] bg-[#1a3c2e] text-white text-[15px] font-bold uppercase tracking-widest hover:bg-[#0f2a1e] transition-colors disabled:opacity-60"
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        <p className="mt-6 text-center text-[14px] text-[#777]">
          Don&apos;t have an account?{" "}
          <Link href="/account-register" className="text-[#1a3c2e] font-semibold hover:underline">
            Sign Up
          </Link>
        </p>
      </div>
    </section>
  );
}
