"use client";

import { useState, useEffect } from "react";
import { MapPin } from "lucide-react";

export default function AddressPage() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState({ name: "", phone: "", address: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await fetch('/api/customer/profile');
      const data = await res.json();
      if (data.customer) {
        setUser(data.customer);
        setProfile({
          name: data.customer.name || "",
          phone: data.customer.phone || "",
          address: data.customer.address || "",
        });
      }
    } catch (err) {
      console.error("fetchData error:", err);
    }
    setLoading(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ type: "", text: "" });

    try {
      const res = await fetch('/api/customer/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: profile.name, phone: profile.phone, address: profile.address }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save address.");
      setMessage({ type: "success", text: "Address saved successfully!" });
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "Failed to save address." });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="py-10 text-center text-[#999]">Loading address...</div>;

  return (
    <div className="max-w-[600px] mx-auto">
      <form onSubmit={handleSave} className="bg-white p-8 rounded border border-[#e3d8c7] shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <MapPin className="text-brand-gold" size={24} />
          <h2 className="text-[20px] font-heading text-brand-gold">Default Delivery Info</h2>
        </div>
        
        <p className="text-[#666] text-[14px] mb-8">
          This information will be automatically filled when you checkout.
        </p>

        <div className="space-y-6">
          <div>
            <label className="block text-[#333] text-[12px] font-bold uppercase mb-2">Full Name</label>
            <input 
              type="text"
              required
              value={profile.name}
              onChange={e => setProfile({...profile, name: e.target.value})}
              className="w-full h-[50px] px-4 border border-[#e3d8c7] rounded outline-none focus:border-brand-gold transition-all"
            />
          </div>
          <div>
            <label className="block text-[#333] text-[12px] font-bold uppercase mb-2">Phone Number</label>
            <input 
              type="tel"
              required
              value={profile.phone}
              onChange={e => setProfile({...profile, phone: e.target.value})}
              className="w-full h-[50px] px-4 border border-[#e3d8c7] rounded outline-none focus:border-brand-gold transition-all"
            />
          </div>
          <div>
            <label className="block text-[#333] text-[12px] font-bold uppercase mb-2">Full Delivery Address</label>
            <textarea 
              required
              value={profile.address}
              onChange={e => setProfile({...profile, address: e.target.value})}
              className="w-full min-h-[120px] p-4 border border-[#e3d8c7] rounded outline-none focus:border-brand-gold transition-all resize-vertical"
            />
          </div>

          {message.text && (
            <div className={`p-4 rounded text-[14px] ${message.type === 'success' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'}`}>
              {message.text}
            </div>
          )}

          <button 
            type="submit"
            disabled={saving}
            className={`w-full h-[55px] bg-[#b58e45] text-white font-bold uppercase tracking-widest rounded hover:bg-[#a37d34] transition-all ${saving ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            {saving ? "Saving..." : "Save Delivery Info"}
          </button>
        </div>
      </form>
    </div>
  );
}
