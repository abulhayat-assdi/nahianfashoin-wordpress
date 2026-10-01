'use client';

import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, X, Loader2 } from 'lucide-react';
import ImageUpload from '@/components/admin/ImageUpload';
import { useConfirm } from '@/contexts/ConfirmContext';

type Testimonial = {
  id: string;
  type: string;
  name: string;
  image_url: string;
  video_url?: string;
  quote: string;
  title?: string;
  rating?: number;
  display_order: number;
};

const empty = { type: 'review', name: '', image_url: '', video_url: '', quote: '', title: '', rating: 5, display_order: 1 };

export default function TestimonialsPage() {
  const confirm = useConfirm();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<Testimonial[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Testimonial | null>(null);
  const [form, setForm] = useState({ ...empty });

  useEffect(() => {
    fetchTestimonials();
  }, []);

  async function fetchTestimonials() {
    setLoading(true);
    const res = await fetch('/api/admin/testimonials');
    const data = await res.json();
    if (data.data) setItems(data.data.filter((t: Testimonial) => t.type === 'review'));
    setLoading(false);
  }

  const openEdit = (t: Testimonial) => {
    setEditing(t);
    setForm({ type: 'review', name: t.name, image_url: t.image_url, video_url: t.video_url || '', quote: t.quote, title: t.title || '', rating: t.rating ?? 5, display_order: t.display_order });
    setOpen(true);
  };

  const openNew = () => {
    setEditing(null);
    setForm({ ...empty, display_order: items.length + 1 });
    setOpen(true);
  };

  const save = async () => {
    if (editing) {
      const res = await fetch('/api/admin/testimonials', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editing.id, ...form }),
      });
      const data = await res.json();
      if (!res.ok) alert(data.error);
    } else {
      const res = await fetch('/api/admin/testimonials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) alert(data.error);
    }
    setOpen(false);
    fetchTestimonials();
  };

  const remove = async (id: string) => {
    const ok = await confirm({
      title: "টেস্টিমোনিয়াল ডিলিট করুন",
      message: "এই টেস্টিমোনিয়ালটি স্থায়ীভাবে ডিলিট হয়ে যাবে। আপনি কি নিশ্চিত?",
      confirmText: "হ্যাঁ, ডিলিট করুন",
      cancelText: "না",
    });
    if (!ok) return;
    const res = await fetch('/api/admin/testimonials', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    const data = await res.json();
    if (!res.ok) alert(data.error);
    fetchTestimonials();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="animate-spin text-brand-gold" size={32} />
      </div>
    );
  }

  return (
    <>
      <div className="page-heading">
        <div>
          <h1 className="page-title">Testimonials</h1>
          <p className="page-subtitle">Manage customer reviews.</p>
        </div>
        <button className="btn-primary-admin" onClick={openNew}><Plus size={15} /> Add</button>
      </div>

      <div className="data-table-wrap">
        <table className="data-table">
          <thead><tr><th>Image</th><th>Name</th><th>Title</th><th>Quote</th><th>Order</th><th>Actions</th></tr></thead>
          <tbody>
            {items.length === 0 ? (
              <tr><td colSpan={6} className="empty-state">No customer reviews found.</td></tr>
            ) : items.sort((a, b) => a.display_order - b.display_order).map(t => (
              <tr key={t.id}>
                <td data-label="Image">{t.image_url ? <img src={t.image_url} alt="" className="thumb" /> : <div className="thumb bg-white/5" />}</td>
                <td data-label="Name" style={{ fontWeight: 600 }}>{t.name}</td>
                <td data-label="Title" style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)' }}>{t.title}</td>
                <td data-label="Quote" style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)' }}>&quot;{t.quote}&quot;</td>
                <td data-label="Order" style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>#{t.display_order}</td>
                <td data-label="Actions">
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className="btn-edit" onClick={() => openEdit(t)}><Pencil size={13} /></button>
                    <button className="btn-danger" onClick={() => remove(t.id)}><Trash2 size={13} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {open && (
        <div className="modal-overlay" onClick={() => setOpen(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-title">
              {editing ? 'Edit Customer Review' : 'Add Customer Review'}
              <button onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer' }}><X size={18} /></button>
            </div>
            <div className="form-group"><label className="form-label">Name</label><input className="form-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
            <div className="form-group"><label className="form-label">Review Title</label><input className="form-input" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} /></div>
            <ImageUpload
              label="Reviewer Image"
              value={form.image_url}
              onChange={url => setForm({ ...form, image_url: url })}
              bucket="images"
              folder="testimonials"
            />
            <div className="form-group">
              <label className="form-label">Rating (1-5 তারা)</label>
              <select className="form-select" value={form.rating} onChange={e => setForm({ ...form, rating: Number(e.target.value) })}>
                {[5,4,3,2,1].map(r => <option key={r} value={r}>{r} ★</option>)}
              </select>
            </div>
            <div className="form-group"><label className="form-label">Review Text</label><textarea className="form-textarea" value={form.quote} onChange={e => setForm({ ...form, quote: e.target.value })} /></div>
            <div className="form-group"><label className="form-label">Display Order</label><input type="number" className="form-input" value={form.display_order} onChange={e => setForm({ ...form, display_order: Number(e.target.value) })} min={1} /></div>
            <div className="form-actions">
              <button className="btn-ghost" onClick={() => setOpen(false)}>Cancel</button>
              <button className="btn-primary-admin" onClick={save}>Save</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
