'use client';

import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, X, Loader2 } from 'lucide-react';
import ImageUpload from '@/components/admin/ImageUpload';
import { useConfirm } from '@/contexts/ConfirmContext';

type Category = {
  id: string;
  name: string;
  slug: string;
  image_url: string;
  is_active: boolean;
  show_in_header: boolean;
  show_in_footer: boolean;
  display_order: number;
};

const empty = { name: '', slug: '', image_url: '', is_active: true, show_in_header: false, show_in_footer: false, display_order: 1 };

export default function CategoriesPage() {
  const confirm = useConfirm();
  const [items, setItems] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [form, setForm] = useState({ ...empty });

  useEffect(() => {
    fetchCategories();
  }, []);

  async function fetchCategories() {
    setLoading(true);
    const res = await fetch('/api/admin/categories');
    const data = await res.json();
    if (data.data) setItems(data.data);
    setLoading(false);
  }

  const openNew = () => {
    setEditing(null);
    setForm({ ...empty, display_order: items.length + 1 });
    setOpen(true);
  };

  const openEdit = (c: Category) => {
    setEditing(c);
    setForm({ name: c.name, slug: c.slug, image_url: c.image_url, is_active: c.is_active, show_in_header: c.show_in_header ?? false, show_in_footer: c.show_in_footer ?? false, display_order: c.display_order });
    setOpen(true);
  };

  const save = async () => {
    if (editing) {
      const res = await fetch('/api/admin/categories', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editing.id, ...form }),
      });
      const data = await res.json();
      if (!res.ok) alert(data.error);
    } else {
      const res = await fetch('/api/admin/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) alert(data.error);
    }
    setOpen(false);
    fetchCategories();
  };

  const remove = async (id: string) => {
    const ok = await confirm({
      title: "ক্যাটাগরি ডিলিট করুন",
      message: "এই ক্যাটাগরিটি স্থায়ীভাবে ডিলিট হয়ে যাবে। আপনি কি নিশ্চিত?",
      confirmText: "হ্যাঁ, ডিলিট করুন",
      cancelText: "না",
    });
    if (!ok) return;
    const res = await fetch('/api/admin/categories', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    const data = await res.json();
    if (!res.ok) alert(data.error);
    fetchCategories();
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
          <h1 className="page-title">Categories</h1>
          <p className="page-subtitle">Manage the 4 shop categories shown in the homepage grid.</p>
        </div>
        <button className="btn-primary-admin" onClick={openNew}><Plus size={15} /> Add Category</button>
      </div>

      <div className="data-table-wrap">
        <table className="data-table">
          <thead><tr><th>Order</th><th>Image</th><th>Name</th><th>Slug</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>
            {items.length === 0 ? (
              <tr><td colSpan={6} className="empty-state">No categories found.</td></tr>
            ) : items.map(c => (
              <tr key={c.id}>
                <td data-label="Order" style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>#{c.display_order}</td>
                <td data-label="Image"><img src={c.image_url} alt="" className="thumb" /></td>
                <td data-label="Name" style={{ fontWeight: 600 }}>{c.name}</td>
                <td data-label="Slug"><code style={{ background: 'rgba(255,255,255,0.07)', padding: '2px 8px', borderRadius: 4, fontSize: 12 }}>{c.slug}</code></td>
                <td data-label="Status">
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <span className={`badge ${c.is_active ? 'badge-active' : 'badge-inactive'}`}>{c.is_active ? 'Active' : 'Inactive'}</span>
                    {c.show_in_header && <span className="badge" style={{ background: 'rgba(26,60,46,0.4)', color: '#4ade80', fontSize: 10 }}>Header Nav</span>}
                    {c.show_in_footer && <span className="badge" style={{ background: 'rgba(201,162,39,0.15)', color: '#c9a227', fontSize: 10 }}>Footer</span>}
                  </div>
                </td>
                <td data-label="Actions">
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className="btn-edit" onClick={() => openEdit(c)}><Pencil size={13} /> Edit</button>
                    <button className="btn-danger" onClick={() => remove(c.id)}><Trash2 size={13} /></button>
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
              {editing ? 'Edit Category' : 'Add Category'}
              <button onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer' }}><X size={18} /></button>
            </div>
            <div className="form-row">
              <div className="form-group"><label className="form-label">Name</label><input className="form-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
              <div className="form-group"><label className="form-label">Slug</label><input className="form-input" value={form.slug} onChange={e => setForm({ ...form, slug: e.target.value })} placeholder="flower-tea" /></div>
            </div>
            <ImageUpload
              label="Category Image"
              value={form.image_url}
              onChange={url => setForm({ ...form, image_url: url })}
              bucket="images"
              folder="categories"
            />
            <div className="form-row">
              <div className="form-group"><label className="form-label">Display Order</label><input type="number" className="form-input" value={form.display_order} onChange={e => setForm({ ...form, display_order: Number(e.target.value) })} min={1} /></div>
              <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: 12, paddingBottom: 2 }}>
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                  <input type="checkbox" checked={form.is_active} onChange={e => setForm({ ...form, is_active: e.target.checked })} style={{ width: 16, height: 16, accentColor: '#4a9eff' }} />
                  Active
                </label>
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                  <input type="checkbox" checked={form.show_in_header} onChange={e => setForm({ ...form, show_in_header: e.target.checked })} style={{ width: 16, height: 16, accentColor: '#4ade80' }} />
                  <span>Header Navigation-এ দেখাও</span>
                </label>
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                  <input type="checkbox" checked={form.show_in_footer} onChange={e => setForm({ ...form, show_in_footer: e.target.checked })} style={{ width: 16, height: 16, accentColor: '#c9a227' }} />
                  <span>Footer Shop-এ দেখাও</span>
                </label>
              </div>
            </div>
            <div className="form-actions">
              <button className="btn-ghost" onClick={() => setOpen(false)}>Cancel</button>
              <button className="btn-primary-admin" onClick={save}>Save Category</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
