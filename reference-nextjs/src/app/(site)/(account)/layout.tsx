"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { Package, MapPin, LogOut } from "lucide-react";

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    const res = await fetch('/api/auth/session');
    const data = await res.json();
    if (!data.user) {
      router.replace("/account-register");
      return;
    }
    setUser(data.user);
    setLoading(false);
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push("/account-register");
  };

  if (loading) {
    return <div className="min-h-[50vh] flex items-center justify-center">Loading...</div>;
  }

  const tabs = [
    { id: "order", label: "Orders", path: "/account-order", icon: <Package size={18} /> },
    { id: "address", label: "Addresses", path: "/account-address", icon: <MapPin size={18} /> },
  ];

  return (
    <section className="bg-[#faf9f6] min-h-screen pb-20">
      <div className="bg-white border-b border-[#e3d8c7] pt-[40px] pb-[20px] px-6">
        <div className="max-w-[1000px] mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <h1 className="font-heading text-[32px] text-brand-gold">My Account</h1>
          
          <div className="flex items-center gap-8">
            {tabs.map(tab => (
              <Link 
                key={tab.id}
                href={tab.path}
                className={`flex items-center gap-2 text-[14px] font-bold uppercase tracking-wider pb-1 border-b-2 transition-all ${
                  pathname === tab.path ? "text-brand-gold border-brand-gold" : "text-[#999] border-transparent hover:text-brand-gold"
                }`}
              >
                {tab.label}
              </Link>
            ))}
            <button 
              onClick={handleLogout}
              className="flex items-center gap-2 text-[14px] font-bold uppercase tracking-wider text-[#999] hover:text-red-500 transition-all pb-1 border-b-2 border-transparent"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-[1000px] mx-auto px-6 mt-10">
        {children}
      </div>
    </section>
  );
}
