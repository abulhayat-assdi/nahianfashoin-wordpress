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
    fetch('/api/auth/session')
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
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
    <section className="bg-white px-6 py-[105px]">
      <form onSubmit={handleLogin} className="mx-auto max-w-[440px] text-center">
        <h1 className="font-heading text-[50px] text-brand-gold">Login</h1>
        <p className="mt-4 text-[16px] text-[#666]">Sign in to your account.</p>

        {error && <p className="mt-6 text-red-500 font-medium text-left">{error}</p>}

        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-8 h-[60px] w-full border border-[#d8c9ad] bg-brand-cream px-5 text-[20px] text-[#222] outline-none transition-colors placeholder:text-[#777] focus:border-brand-gold focus:ring-1 focus:ring-brand-gold"
          placeholder="E-mail"
          required
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mt-4 h-[60px] w-full border border-[#d8c9ad] bg-brand-cream px-5 text-[20px] text-[#222] outline-none transition-colors placeholder:text-[#777] focus:border-brand-gold focus:ring-1 focus:ring-brand-gold"
          placeholder="Password"
          required
        />
        <Link href="/account-forgot-password" className="mt-5 block text-left text-[17px] font-extrabold uppercase tracking-[0.08em] underline">
          Forgot your password?
        </Link>
        <button type="submit" disabled={loading} className="btn-gold mt-9 h-[63px] w-full text-[18px] uppercase disabled:opacity-70">
          {loading ? "Logging in..." : "Login"}
        </button>
        <Link href="/account-register" className="mt-7 block text-[20px] font-extrabold uppercase tracking-[0.08em] underline">
          Sign Up
        </Link>
      </form>
    </section>
  );
}
