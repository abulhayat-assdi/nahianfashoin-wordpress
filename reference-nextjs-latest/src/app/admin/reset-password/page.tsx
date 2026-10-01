'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

function AdminResetForm() {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  useEffect(() => {
    if (!token) setError('Invalid or missing reset token.');
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) { setError('Passwords do not match.'); return; }
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return; }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/admin/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Something went wrong.');
      setSuccess(true);
      setTimeout(() => router.push('/admin/login'), 2500);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div style={{ textAlign: 'center' }}>
        <div style={{
          width: 56, height: 56, borderRadius: '50%',
          background: 'rgba(34,197,94,0.12)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 20px',
        }}>
          <svg width="28" height="28" fill="none" stroke="#22c55e" strokeWidth="2.5" viewBox="0 0 24 24">
            <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <h1 className="login-title">Password Updated</h1>
        <p className="login-sub">Your admin password has been reset. Redirecting to login...</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <h1 className="login-title">Set New Password</h1>
      <p className="login-sub">Enter and confirm your new admin password.</p>

      {error && <div className="login-error">{error}</div>}

      <div className="form-group">
        <label className="form-label" htmlFor="password">New Password</label>
        <input
          id="password"
          type="password"
          className="form-input"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Min. 8 characters"
          minLength={8}
          required
        />
      </div>
      <div className="form-group">
        <label className="form-label" htmlFor="confirm">Confirm Password</label>
        <input
          id="confirm"
          type="password"
          className="form-input"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          placeholder="Repeat new password"
          minLength={8}
          required
        />
      </div>
      <button type="submit" className="login-btn" disabled={loading || !token}>
        {loading ? 'Updating...' : 'Set New Password'}
      </button>

      <div style={{ marginTop: 20, textAlign: 'center' }}>
        <Link href="/admin/login" style={{ color: '#64748b', fontSize: 14, textDecoration: 'underline' }}>
          Back to Admin Login
        </Link>
      </div>
    </form>
  );
}

export default function AdminResetPasswordPage() {
  return (
    <div className="login-shell">
      <div className="login-box">
        <Suspense fallback={<p style={{ color: '#64748b', textAlign: 'center' }}>Loading...</p>}>
          <AdminResetForm />
        </Suspense>
      </div>
    </div>
  );
}
