'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Image,
  Grid2X2,
  Package,
  Star,
  AlignLeft,
  Settings,
  LogOut,
  MessageSquare,
  ShieldCheck,
  Layers,
  Ban,
} from 'lucide-react';

const menuItems = [
  { label: 'Overview', href: '/admin', icon: LayoutDashboard },
  { label: 'Orders', href: '/admin/orders', icon: Package },
  { label: 'Products', href: '/admin/products', icon: Package },
  { label: 'Categories', href: '/admin/categories', icon: Grid2X2 },
  { label: 'Hero Banner', href: '/admin/hero-banner', icon: Image },
  { label: 'Combo Offers', href: '/admin/combo-offers', icon: Layers },
  { label: 'Testimonials', href: '/admin/testimonials', icon: Star },
  { label: 'Reviews', href: '/admin/reviews', icon: MessageSquare },
  { label: 'Support', href: '/admin/support', icon: Settings },
  { label: 'Footer', href: '/admin/footer', icon: AlignLeft },
  { label: 'Blocked List', href: '/admin/blocked', icon: Ban },
  { label: 'Settings', href: '/admin/settings', icon: Settings },
];

export default function AdminSidebar({ currentUserRole: initialRole }: { currentUserRole?: string }) {
  const pathname = usePathname();
    const [role, setRole] = useState<string | undefined>(initialRole);
  const [logoSrc, setLogoSrc] = useState<string>(window.NF_ADMIN.logo);

  useEffect(() => {
    if (!role) {
      fetch('/api/auth/admin/session')
        .then((r) => r.json())
        .then((data) => {
          if (data.user?.role) setRole(data.user.role);
        })
        .catch(() => {});
    }
  }, [role]);

  useEffect(() => {
    fetch('/api/logo-version')
      .then(r => r.json())
      .then(d => { if (d.v) setLogoSrc(`${window.NF_ADMIN.logo}${window.NF_ADMIN.logo.includes('?') ? '&' : '?'}v=${d.v}`); })
      .catch(() => {});
  }, []);

  const handleSignOut = async () => {
    window.location.href = window.NF_ADMIN.logoutUrl;
  };

  return (
    <>
      <div
        className="sidebar-overlay"
        onClick={() => document.body.classList.remove('sidebar-open')}
      />
      <aside className="admin-sidebar hidden md:flex flex-col w-[260px] h-screen bg-[#0f111a] border-r border-white/5 p-6 fixed top-0 left-0 z-[100] transition-transform">
        <div className="flex items-center gap-3 mb-8 px-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={logoSrc}
            alt="Nahian Fashion"
            style={{ width: 'auto', height: 'auto', objectFit: 'contain', maxHeight: 40 }}
          />
          <div className="flex flex-col">
            <p className="text-[10px] text-gray-400 font-medium tracking-wider uppercase mt-1">CMS</p>
          </div>
        </div>

        <p className="text-[11px] font-semibold tracking-widest text-gray-400 px-3 pb-3 uppercase">MAIN ENGINE</p>

        <nav className="flex flex-col gap-1 flex-1 overflow-y-auto no-scrollbar">
          {menuItems.map(({ label, href, icon: Icon }) => {
            const isActive =
              href === '/admin' ? pathname === '/admin' : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-[15px] transition-all duration-200 ${
                  isActive
                    ? 'bg-white/10 text-white font-semibold shadow-sm'
                    : 'text-gray-400 hover:bg-white/5 hover:text-white font-medium'
                }`}
                onClick={() => document.body.classList.remove('sidebar-open')}
              >
                <Icon size={20} strokeWidth={1.8} className={isActive ? 'text-white' : 'text-gray-500'} />
                <span>{label}</span>
                {isActive && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[#ac8545]" />}
              </Link>
            );
          })}

          {role === 'super_admin' && (
            <>
              <p className="text-[11px] font-semibold tracking-widest text-gray-500 px-3 pt-5 pb-2 uppercase">Super Admin</p>
              {[{ label: 'Manage Admins', href: '/admin/manage-admins', icon: ShieldCheck }].map(({ label, href, icon: Icon }) => {
                const isActive = pathname.startsWith(href);
                return (
                  <Link
                    key={href}
                    href={href}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-[15px] transition-all duration-200 ${
                      isActive
                        ? 'bg-amber-500/20 text-amber-400 font-semibold shadow-sm'
                        : 'text-amber-500/60 hover:bg-amber-500/10 hover:text-amber-400 font-medium'
                    }`}
                    onClick={() => document.body.classList.remove('sidebar-open')}
                  >
                    <Icon size={20} strokeWidth={1.8} className={isActive ? 'text-amber-400' : 'text-amber-500/60'} />
                    <span>{label}</span>
                    {isActive && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-amber-500" />}
                  </Link>
                );
              })}
            </>
          )}
        </nav>

        <div className="pt-4 mt-5 border-t border-white/5">
          <button
            onClick={handleSignOut}
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-[15px] font-medium text-gray-400 hover:bg-red-500/10 hover:text-red-500 w-full transition-all duration-200"
            type="button"
          >
            <LogOut size={18} strokeWidth={1.8} />
            <span>Sign Out</span>
          </button>

          <p className="text-[10px] text-gray-500 text-center mt-4 tracking-wider">© 2025 NAHIAN FASHION</p>
        </div>
      </aside>
    </>
  );
}
