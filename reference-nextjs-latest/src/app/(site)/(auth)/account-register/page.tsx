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
    fetch("/api/auth/session")
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
      setError("All fields are required.");
      setLoading(false);
      return;
    }
    if (phone.length < 11) {
      setError("Please enter a valid phone number.");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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

  const inputClass =
    "h-[50px] w-full border border-[#ddd] bg-white px-4 text-[15px] text-[#1a1a1a] outline-none transition-colors placeholder:text-[#aaa] focus:border-[#1a3c2e]";

  return (
    <section className="min-h-[70vh] bg-[#f5f5f5] flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-[420px] bg-white border border-[#eee] p-8 md:p-10">
        <div className="text-center mb-8">
          <h1 className="text-[28px] font-bold text-[#1a1a1a]">Create Account</h1>
          <p className="mt-2 text-[14px] text-[#777]">Sign up for faster checkout and order tracking</p>
        </div>

        {error && (
          <p className="mb-4 text-[13px] text-red-500 font-medium bg-red-50 border border-red-200 px-3 py-2">
            {error}
          </p>
        )}

        <form onSubmit={handleRegister} className="space-y-4">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={inputClass}
            placeholder="Full Name *"
            required
          />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputClass}
            placeholder="Email address *"
            required
          />
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className={inputClass}
            placeholder="Phone Number *"
            required
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={inputClass}
            placeholder="Password *"
            required
            minLength={6}
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full h-[50px] bg-[#1a3c2e] text-white text-[15px] font-bold uppercase tracking-widest hover:bg-[#0f2a1e] transition-colors disabled:opacity-60"
          >
            {loading ? "Creating Account..." : "Create Account"}
          </button>
        </form>

        <p className="mt-6 text-center text-[14px] text-[#777]">
          Already have an account?{" "}
          <Link href="/account-login" className="text-[#1a3c2e] font-semibold hover:underline">
            Login
          </Link>
        </p>
      </div>
    </section>
  );
}
