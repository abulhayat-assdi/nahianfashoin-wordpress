'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import NextImage from 'next/image';

export default function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetch('/api/auth/admin/session')
      .then((r) => r.json())
      .then((data) => {
        if (data.user) {
          router.replace('/admin');
        } else {
          setChecking(false);
        }
      })
      .catch(() => setChecking(false));
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const res = await fetch('/api/auth/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error || 'ইমেইল বা পাসওয়ার্ড ভুল। আবার চেষ্টা করুন।');
      setLoading(false);
      return;
    }

    router.push('/admin');
    router.refresh();
  };

  return (
    <div className="login-shell">
      <div className="login-box">
        <div className="login-logo" style={{ alignItems: 'center' }}>
          <NextImage
            src="/logo.png"
            alt="Nahian Fashion"
            width={180}
            height={60}
            style={{ width: 'auto', height: 'auto', objectFit: 'contain', maxHeight: 60, filter: 'brightness(0) invert(1)' }}
            priority
          />
          <p className="login-logo-sub" style={{ marginTop: 8 }}>CONTENT MANAGEMENT SYSTEM</p>
        </div>

        <h1 className="login-title">Welcome back</h1>
        <p className="login-sub">Sign in to your admin account</p>

        {error && <div className="login-error">{error}</div>}

        {checking ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '32px 0' }}>
            <div style={{
              width: 36, height: 36,
              border: '3px solid rgba(255,255,255,0.2)',
              borderTop: '3px solid #fff',
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite',
            }} />
          </div>
        ) : (
          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label className="form-label" htmlFor="email">Email Address</label>
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
            <div className="form-group">
              <label className="form-label" htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                className="form-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>
            <button type="submit" className="login-btn" disabled={loading}>
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
            <div style={{ marginTop: 16, textAlign: 'center' }}>
              <a href="/admin/forgot-password" style={{ color: '#64748b', fontSize: 13, textDecoration: 'underline' }}>
                Forgot your password?
              </a>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
