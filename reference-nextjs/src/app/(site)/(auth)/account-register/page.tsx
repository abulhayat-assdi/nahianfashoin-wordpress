"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
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

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (!name || !email || !phone || !password) {
      setError("Name, Email, Phone Number, and Password are required.");
      setLoading(false);
      return;
    }

    if (phone.length < 11) {
      setError("Please enter a valid phone number.");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, phone, password }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create account.");

      router.push("/account-order");
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create account.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="bg-white px-6 py-[105px]">
      <form onSubmit={handleRegister} className="mx-auto max-w-[440px] text-center">
        <h1 className="font-heading text-[50px] text-brand-gold">Register</h1>
        <p className="mt-4 text-[16px] text-[#666]">Create an account for faster checkout and to track your orders.</p>

        {error && <p className="mt-6 text-red-500 font-medium text-left">{error}</p>}

        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mt-8 h-[60px] w-full border border-[#d8c9ad] bg-brand-cream px-5 text-[20px] text-[#222] outline-none transition-colors placeholder:text-[#777] focus:border-brand-gold focus:ring-1 focus:ring-brand-gold"
          placeholder="Full Name *"
          required
        />
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-4 h-[60px] w-full border border-[#d8c9ad] bg-brand-cream px-5 text-[20px] text-[#222] outline-none transition-colors placeholder:text-[#777] focus:border-brand-gold focus:ring-1 focus:ring-brand-gold"
          placeholder="E-mail *"
          required
        />
        <input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="mt-4 h-[60px] w-full border border-[#d8c9ad] bg-brand-cream px-5 text-[20px] text-[#222] outline-none transition-colors placeholder:text-[#777] focus:border-brand-gold focus:ring-1 focus:ring-brand-gold"
          placeholder="Phone Number *"
          required
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mt-4 h-[60px] w-full border border-[#d8c9ad] bg-brand-cream px-5 text-[20px] text-[#222] outline-none transition-colors placeholder:text-[#777] focus:border-brand-gold focus:ring-1 focus:ring-brand-gold"
          placeholder="Password *"
          required
          minLength={6}
        />

        <button type="submit" disabled={loading} className="btn-gold mt-9 h-[63px] w-full text-[18px] uppercase disabled:opacity-70">
          {loading ? "Creating Account..." : "Create Account"}
        </button>

        <Link href="/account-login" className="mt-7 block text-[17px] font-extrabold uppercase tracking-[0.08em] underline">
          Already have an account? Login
        </Link>
      </form>
    </section>
  );
}
