'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { User, MoreVertical } from 'lucide-react';

const tabs = [
  { label: 'Dashboard', href: '/admin' },
  { label: 'System Overview', href: '/admin/settings' },
];

export default function AdminHeader() {
  const pathname = usePathname();
  const [userInfo, setUserInfo] = useState({ name: 'Loading...', role: 'Admin' });

  useEffect(() => {
    fetch('/api/auth/admin/session')
      .then((r) => r.json())
      .then((data) => {
        if (data.user) {
          setUserInfo({
            name: data.user.name || 'Admin User',
            role: data.user.role || 'admin',
          });
        }
      })
      .catch(() => {});
  }, []);

  return (
    <header className="admin-header">
      <div className="header-left">
        <button
          className="mobile-toggle"
          onClick={() => document.body.classList.toggle('sidebar-open')}
          type="button"
        >
          <MoreVertical size={24} />
        </button>

        <div className="header-tabs">
          {tabs.map(({ label, href }) => {
            const isActive =
              href === '/admin' ? pathname === '/admin' : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={`header-tab ${isActive ? 'active' : ''}`}
              >
                {label}
              </Link>
            );
          })}
        </div>
      </div>

      <div className="header-user">
        <div className="user-avatar">
          <User size={18} strokeWidth={1.5} />
        </div>
        <div className="user-info">
          <p className="user-name">{userInfo.name.toUpperCase()}</p>
          <p className="user-role">{userInfo.role.replace('_', ' ').toUpperCase()}</p>
        </div>
      </div>
    </header>
  );
}
