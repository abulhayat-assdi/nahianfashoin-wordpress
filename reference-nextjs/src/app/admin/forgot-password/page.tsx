'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function AdminForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/admin/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Something went wrong.');
      setSent(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="login-shell">
        <div className="login-box" style={{ textAlign: 'center' }}>
          <div style={{
            width: 56, height: 56,
            borderRadius: '50%',
            background: 'rgba(34,197,94,0.12)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 20px',
          }}>
            <svg width="28" height="28" fill="none" stroke="#22c55e" strokeWidth="2.5" viewBox="0 0 24 24">
              <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <h1 className="login-title">Check your email</h1>
          <p className="login-sub" style={{ marginBottom: 24 }}>
            If an admin account exists for <strong style={{ color: '#fff' }}>{email}</strong>, a reset link has been sent. Check your inbox and spam folder.
          </p>
          <p style={{ fontSize: 13, color: '#64748b', marginBottom: 28 }}>The link expires in 1 hour.</p>
          <Link href="/admin/login" style={{ color: '#3b82f6', fontSize: 14, textDecoration: 'underline' }}>
            Back to Admin Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="login-shell">
      <div className="login-box">
        <h1 className="login-title">Forgot Password</h1>
        <p className="login-sub">Enter your admin email to receive a reset link.</p>

        {error && <div className="login-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="email">Admin Email Address</label>
            <input
              id="email"
              type="email"
              className="form-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@nahianfashion.com"
              required
            />
          </div>
          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? 'Sending...' : 'Send Reset Link'}
          </button>
        </form>

        <div style={{ marginTop: 20, textAlign: 'center' }}>
          <Link href="/admin/login" style={{ color: '#64748b', fontSize: 14, textDecoration: 'underline' }}>
            Back to Admin Login
          </Link>
        </div>
      </div>
    </div>
  );
}
