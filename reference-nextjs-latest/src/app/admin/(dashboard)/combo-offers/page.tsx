"use client";

import { useState, useEffect } from "react";
import { Plus, Pencil, Trash2, ToggleLeft, ToggleRight, GripVertical } from "lucide-react";
import ImageUpload from "@/components/admin/ImageUpload";

interface ComboOffer {
  id: string;
  title: string;
  subtitle?: string;
  price: string;
  original_price?: string;
  image_url?: string;
  video_url?: string;
  badge?: string;
  is_active: boolean;
  display_order: number;
}

const EMPTY: Omit<ComboOffer, "id" | "is_active" | "display_order"> = {
  title: "",
  subtitle: "",
  price: "",
  original_price: "",
  image_url: "",
  video_url: "",
  badge: "",
};

export default function ComboOffersPage() {
  const [offers, setOffers] = useState<ComboOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<ComboOffer | null>(null);
  const [form, setForm] = useState<typeof EMPTY>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/admin/combo-offers");
    const json = await res.json();
    setOffers(json.data || []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  function openNew() {
    setEditing(null);
    setForm(EMPTY);
    setShowForm(true);
  }

  function openEdit(offer: ComboOffer) {
    setEditing(offer);
    setForm({
      title: offer.title,
      subtitle: offer.subtitle || "",
      price: offer.price,
      original_price: offer.original_price || "",
      image_url: offer.image_url || "",
      video_url: offer.video_url || "",
      badge: offer.badge || "",
    });
    setShowForm(true);
  }

  async function handleSave() {
    if (!form.title.trim() || !form.price.trim()) return;
    setSaving(true);
    try {
      if (editing) {
        await fetch("/api/admin/combo-offers", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: editing.id, ...form }),
        });
      } else {
        await fetch("/api/admin/combo-offers", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...form, is_active: true, display_order: offers.length }),
        });
      }
      setShowForm(false);
      await load();
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this Combo Offer?")) return;
    setDeleting(id);
    await fetch(`/api/admin/combo-offers?id=${id}`, { method: "DELETE" });
    setDeleting(null);
    await load();
  }

  async function handleToggle(offer: ComboOffer) {
    await fetch("/api/admin/combo-offers", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: offer.id, is_active: !offer.is_active }),
    });
    await load();
  }

  return (
    <div className="p-6 md:p-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Combo Offers</h1>
          <p className="text-gray-400 text-sm mt-1">Manage combo offers displayed on the homepage</p>
        </div>
        <button
          onClick={openNew}
          className="flex items-center gap-2 bg-green-600 hover:bg-green-500 text-white px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors"
        >
          <Plus size={18} /> New Offer
        </button>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-[#1a1d2e] rounded-xl w-full max-w-lg p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold text-white mb-6">
              {editing ? "Edit Combo Offer" : "New Combo Offer"}
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-300 mb-1">Title *</label>
                <input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g. 3 Panjabi Combo"
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm outline-none focus:border-green-500"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1">Subtitle</label>
                <input
                  value={form.subtitle}
                  onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
                  placeholder="e.g. Premium combo at best price"
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm outline-none focus:border-green-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-300 mb-1">Price *</label>
                  <input
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                    placeholder="৳2,499"
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm outline-none focus:border-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-300 mb-1">Original Price</label>
                  <input
                    value={form.original_price}
                    onChange={(e) => setForm({ ...form, original_price: e.target.value })}
                    placeholder="৳3,150"
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm outline-none focus:border-green-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1">Badge (e.g. -20%)</label>
                <input
                  value={form.badge}
                  onChange={(e) => setForm({ ...form, badge: e.target.value })}
                  placeholder="-20%"
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm outline-none focus:border-green-500"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-2">Image</label>
                <ImageUpload
                  value={form.image_url || ""}
                  onChange={(url) => setForm({ ...form, image_url: url })}
                />
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1">Video URL (optional)</label>
                <input
                  value={form.video_url}
                  onChange={(e) => setForm({ ...form, video_url: e.target.value })}
                  placeholder="https://youtube.com/..."
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm outline-none focus:border-green-500"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleSave}
                disabled={saving || !form.title.trim() || !form.price.trim()}
                className="flex-1 bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white py-2.5 rounded-lg font-semibold text-sm transition-colors"
              >
                {saving ? "সংরক্ষণ হচ্ছে..." : "সংরক্ষণ করুন"}
              </button>
              <button
                onClick={() => setShowForm(false)}
                className="px-5 bg-white/10 hover:bg-white/20 text-white py-2.5 rounded-lg font-semibold text-sm transition-colors"
              >
                বাতিল
              </button>
            </div>
          </div>
        </div>
      )}

      {/* List */}
      {loading ? (
        <div className="text-gray-400 text-center py-20">লোড হচ্ছে...</div>
      ) : offers.length === 0 ? (
        <div className="text-center py-20 bg-white/5 rounded-xl border border-white/10">
          <p className="text-gray-400">কোনো Combo Offer নেই। নতুন যোগ করুন।</p>
        </div>
      ) : (
        <div className="space-y-3">
          {offers.map((offer) => (
            <div
              key={offer.id}
              className="flex items-center gap-4 bg-white/5 border border-white/10 rounded-xl p-4"
            >
              <GripVertical size={18} className="text-gray-600 shrink-0" />
              {offer.image_url && (
                <img
                  src={offer.image_url}
                  alt={offer.title}
                  className="w-16 h-16 object-cover rounded-lg shrink-0"
                />
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-white font-semibold text-sm truncate">{offer.title}</p>
                  {offer.badge && (
                    <span className="bg-red-500/20 text-red-400 text-xs px-2 py-0.5 rounded-full">{offer.badge}</span>
                  )}
                </div>
                {offer.subtitle && <p className="text-gray-400 text-xs mt-0.5 truncate">{offer.subtitle}</p>}
                <p className="text-green-400 text-sm font-bold mt-1">{offer.price}
                  {offer.original_price && <span className="text-gray-500 line-through text-xs ml-2">{offer.original_price}</span>}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => handleToggle(offer)}
                  className={`transition-colors ${offer.is_active ? "text-green-400" : "text-gray-600"}`}
                  title={offer.is_active ? "Active — click to deactivate" : "Inactive — click to activate"}
                >
                  {offer.is_active ? <ToggleRight size={28} /> : <ToggleLeft size={28} />}
                </button>
                <button
                  onClick={() => openEdit(offer)}
                  className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                >
                  <Pencil size={16} />
                </button>
                <button
                  onClick={() => handleDelete(offer.id)}
                  disabled={deleting === offer.id}
                  className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
