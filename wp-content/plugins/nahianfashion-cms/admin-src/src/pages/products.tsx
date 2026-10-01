'use client';

import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, X, PlayCircle, Loader2 } from 'lucide-react';
import MultiMediaUpload from '@/components/admin/MultiMediaUpload';
import RichTextEditor from '@/components/admin/RichTextEditor';
import { useConfirm } from '@/contexts/ConfirmContext';

type FAQ = { q: string; a: string };
type SizeItem = { size: string; available: boolean };

type Product = {
  id: string; slug?: string; name: string; detail: string; description: string; price: string; originalPrice: string;
  discount: string; media_urls: string[]; video_url: string;
  category: string; is_available: boolean; is_featured: boolean; faqs: FAQ[];
  colors: string[]; sizes: SizeItem[]; display_order: number;
};

const normalizeSizes = (raw: any[]): SizeItem[] =>
  raw.map(s => typeof s === 'string' ? { size: s, available: true } : s);

const empty: Omit<Product, 'id' | 'slug'> = { name: '', detail: '', description: '', price: '', originalPrice: '', discount: '', media_urls: [], video_url: '', category: '', is_available: true, is_featured: false, faqs: [], colors: [], sizes: [], display_order: 1 };

export default function ProductsPage() {
  const confirm = useConfirm();
  const [items, setItems] = useState<Product[]>([]);
  const [cats, setCats] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState({ ...empty });
  const [filter, setFilter] = useState('All');
  const [sizeInput, setSizeInput] = useState('');

  useEffect(() => { fetchProducts(); fetchCategories(); }, []);

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/admin/categories');
      const data = await res.json();
      if (data.data?.length) {
        setCats(data.data.filter((c: any) => c.is_active).map((c: any) => c.name));
      }
    } catch {
      // keep fallback
    }
  };

  const fetchProducts = async () => {
    setLoading(true);
    const res = await fetch('/api/admin/products');
    const data = await res.json();
    if (data.data) setItems(data.data as Product[]);
    setLoading(false);
  };

  const openEdit = (p: Product) => {
    setEditing(p);
    setForm({ name: p.name, detail: p.detail || '', description: p.description || '', price: p.price, originalPrice: p.originalPrice || '', discount: p.discount || '', media_urls: p.media_urls || [], video_url: (p as any).video_url || '', category: p.category || cats[0] || '', is_available: p.is_available, is_featured: p.is_featured, faqs: p.faqs || [], colors: (p as any).colors || [], sizes: normalizeSizes((p as any).sizes || []), display_order: p.display_order ?? 1 });
    setSizeInput('');
    setOpen(true);
  };
  const openNew = () => { setEditing(null); setForm({ ...empty, category: cats[0] || '', display_order: items.length + 1 }); setSizeInput(''); setOpen(true); };

  const save = async () => {
    if (!form.name || !form.price || form.media_urls.length === 0) {
      alert("Name, Price, and at least one Image are required to publish this product.");
      return;
    }
    const generatedSlug = form.name
      .trim()
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9ঀ-৿-]+/g, '')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '') || form.name.trim().slice(0, 30).replace(/\s+/g, '-');
    setSaving(true);

    const dbData = {
      slug: generatedSlug,
      name: form.name,
      detail: form.detail,
      description: form.description,
      price: form.price,
      original_price: form.originalPrice,
      discount: form.discount,
      media_urls: form.media_urls,
      video_url: form.video_url || null,
      category: form.category,
      is_available: form.is_available,
      is_featured: form.is_featured,
      faqs: form.faqs,
      colors: form.colors,
      sizes: form.sizes,
      display_order: form.display_order,
    };

    if (editing) {
      const res = await fetch('/api/admin/products', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editing.id, ...dbData }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert("Failed to update product: " + data.error);
      } else {
        setItems(items.map(p => p.id === editing.id ? { ...editing, ...form, slug: generatedSlug } as Product : p));
        setOpen(false);
      }
    } else {
      const res = await fetch('/api/admin/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dbData),
      });
      const data = await res.json();
      if (!res.ok) {
        alert("Failed to add product: " + data.error);
      } else if (data.data) {
        setItems([{ ...data.data, originalPrice: data.data.original_price } as Product, ...items]);
        setOpen(false);
      }
    }
    setSaving(false);
  };

  const handleDeleteProduct = async (id: string) => {
    const ok = await confirm({
      title: "প্রোডাক্ট ডিলিট করুন",
      message: "এই প্রোডাক্টটি স্থায়ীভাবে ডিলিট হয়ে যাবে। আপনি কি নিশ্চিত?",
      confirmText: "হ্যাঁ, ডিলিট করুন",
      cancelText: "না",
    });
    if (!ok) return;
    const res = await fetch('/api/admin/products', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    const data = await res.json();
    if (!res.ok) {
      alert("Failed to delete product: " + data.error);
    } else {
      setItems(items.filter(x => x.id !== id));
    }
  };

  const filtered = filter === 'All' ? items : filter === 'Featured' ? items.filter(p => p.is_featured) : items.filter(p => p.category === filter);

  return (
    <>
      <div className="page-heading">
        <div>
          <h1 className="page-title">Products</h1>
          <p className="page-subtitle">Manage bestsellers and gift products shown on the homepage.</p>
        </div>
        <button className="btn-primary-admin" onClick={openNew}><Plus size={15} /> Add Product</button>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {['All', ...cats, 'Featured'].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            style={{ padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 500, cursor: 'pointer', border: '1px solid', transition: 'all 0.15s', background: filter === f ? '#4a9eff' : 'rgba(255,255,255,0.05)', color: filter === f ? '#fff' : 'rgba(255,255,255,0.6)', borderColor: filter === f ? '#4a9eff' : 'rgba(255,255,255,0.1)' }}>
            {f}
          </button>
        ))}
      </div>

      <div className="data-table-wrap">
        <table className="data-table">
          <thead><tr><th>#</th><th>Image</th><th>Name</th><th>Price</th><th>Category</th><th>Tags</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} className="empty-state"><Loader2 className="spin" style={{ margin: '0 auto' }} /> Loading products...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={8} className="empty-state">No products found.</td></tr>
            ) : filtered.map(p => {
              const firstMedia = p.media_urls?.[0];
              const isVideo = firstMedia?.match(/\.(mp4|webm|ogg|mov)$/i);
              return (
                <tr key={p.id}>
                  <td data-label="#" style={{ fontWeight: 600, color: 'rgba(255,255,255,0.5)' }}>#{p.display_order}</td>
                  <td data-label="Image">
                    {firstMedia ? (
                      isVideo ? (
                        <div style={{ position: 'relative', width: 44, height: 44, borderRadius: 6, overflow: 'hidden' }}>
                          <video src={firstMedia} style={{ width: '100%', height: '100%', objectFit: 'cover' }} muted />
                          <PlayCircle size={16} color="white" style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', opacity: 0.8 }} />
                        </div>
                      ) : (
                        <img
                          src={firstMedia}
                          alt=""
                          className="thumb"
                          onError={e => { (e.target as HTMLImageElement).style.opacity = '0.2'; }}
                        />
                      )
                    ) : (
                      <div className="thumb" style={{ background: 'rgba(255,255,255,0.05)' }} />
                    )}
                  </td>
                  <td data-label="Product"><div><p style={{ fontWeight: 600, fontSize: 13 }}>{p.name}</p><p style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', marginTop: 2 }}>{p.detail}</p></div></td>
                  <td data-label="Price"><div><p style={{ fontWeight: 600 }}>{p.price}</p><p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', textDecoration: 'line-through' }}>{p.originalPrice}</p></div></td>
                  <td data-label="Category"><span className="badge badge-active" style={{ fontSize: 10 }}>{p.category}</span></td>
                  <td data-label="Tags">
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                      {p.is_featured && <span style={{ background: 'rgba(245,166,35,0.15)', color: '#f5a623', border: '1px solid rgba(245,166,35,0.3)', padding: '2px 8px', borderRadius: 20, fontSize: 10, fontWeight: 600 }}>Featured</span>}
                    </div>
                  </td>
                  <td data-label="Status"><span className={`badge ${p.is_available ? 'badge-active' : 'badge-inactive'}`}>{p.is_available ? 'In Stock' : 'Out of Stock'}</span></td>
                  <td data-label="Actions">
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button className="btn-edit" onClick={() => openEdit(p)}><Pencil size={13} /></button>
                      <button className="btn-danger" onClick={() => handleDeleteProduct(p.id)}><Trash2 size={13} /></button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {open && (
        <div className="modal-overlay" onClick={() => setOpen(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()} style={{ maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="modal-title">
              {editing ? 'Edit Product' : 'Add Product'}
              <button onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer' }}><X size={18} /></button>
            </div>

            <div className="form-group"><label className="form-label">Product Name <span style={{ color: '#ff4a4a' }}>*</span></label><input className="form-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
            <div className="form-group">
              <label className="form-label">Description</label>
              <RichTextEditor
                value={form.description}
                onChange={html => setForm({ ...form, description: html })}
                placeholder="Long product description..."
              />
            </div>

            <div className="form-group"><label className="form-label">Subtitle / Detail</label><input className="form-input" value={form.detail} onChange={e => setForm({ ...form, detail: e.target.value })} placeholder="Cotton Fabric | XL Size" /></div>

            <div className="form-row">
              <div className="form-group"><label className="form-label">Price <span style={{ color: '#ff4a4a' }}>*</span></label><input className="form-input" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} placeholder="Tk 2,600.00" /></div>
              <div className="form-group"><label className="form-label">Original Price</label><input className="form-input" value={form.originalPrice} onChange={e => setForm({ ...form, originalPrice: e.target.value })} /></div>
            </div>

            <div className="form-group"><label className="form-label">Discount Label</label><input className="form-input" value={form.discount} onChange={e => setForm({ ...form, discount: e.target.value })} placeholder="30% Off" /></div>

            <div className="form-row">
              <div className="form-group"><label className="form-label">Category</label>
                <select className="form-select" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                  {cats.length === 0
                    ? <option value="">-- No categories found --</option>
                    : cats.map(c => <option key={c} value={c}>{c}</option>)
                  }
                </select>
              </div>
              <div className="form-group"><label className="form-label">Display Order</label>
                <input type="number" className="form-input" value={form.display_order} onChange={e => setForm({ ...form, display_order: Number(e.target.value) })} min={1} />
              </div>
            </div>

            <MultiMediaUpload
              label={<span>Product Media (Images/Videos) <span style={{ color: '#ff4a4a' }}>*</span></span> as any}
              values={form.media_urls}
              onChange={urls => setForm({ ...form, media_urls: urls })}
              bucket="images"
              folder="products"
            />

            <div className="form-group" style={{ marginTop: 20, paddingTop: 20, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <label className="form-label" style={{ marginBottom: 0 }}>Frequently Asked Questions (FAQ)</label>
                <button type="button" className="btn-ghost" onClick={() => setForm({ ...form, faqs: [...form.faqs, { q: '', a: '' }] })} style={{ padding: '4px 10px', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}><Plus size={12} /> Add FAQ</button>
              </div>
              {form.faqs.map((faq, i) => (
                <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 12, alignItems: 'flex-start', background: 'rgba(255,255,255,0.02)', padding: 12, borderRadius: 6 }}>
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <input className="form-input" placeholder="Question" value={faq.q} onChange={e => { const newFaqs = [...form.faqs]; newFaqs[i].q = e.target.value; setForm({ ...form, faqs: newFaqs }); }} />
                    <textarea className="form-input" placeholder="Answer" rows={2} value={faq.a} onChange={e => { const newFaqs = [...form.faqs]; newFaqs[i].a = e.target.value; setForm({ ...form, faqs: newFaqs }); }} style={{ resize: 'vertical' }} />
                  </div>
                  <button type="button" onClick={() => { const newFaqs = [...form.faqs]; newFaqs.splice(i, 1); setForm({ ...form, faqs: newFaqs }); }} style={{ background: 'none', border: 'none', color: '#ff4a4a', cursor: 'pointer', padding: 8 }}><Trash2 size={16} /></button>
                </div>
              ))}
            </div>

            {/* Color Variant Images */}
            <div style={{ marginTop: 20, paddingTop: 20, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
              <MultiMediaUpload
                label={<span>Color Variant Images <span style={{ color: 'rgba(255,255,255,0.4)', fontWeight: 400, fontSize: 11 }}>(প্রতিটি রঙের আলাদা ছবি আপলোড করুন — প্রোডাক্ট গ্যালারিতে যোগ হবে)</span></span> as any}
                values={form.colors}
                onChange={urls => setForm({ ...form, colors: urls })}
                bucket="images"
                folder="products"
              />
            </div>

            {/* Sizes */}
            <div className="form-group" style={{ marginTop: 16 }}>
              <label className="form-label">Sizes (comma দিয়ে লিখুন, Enter চাপুন)</label>
              <input
                className="form-input"
                placeholder="S, M, L, XL, XXL"
                value={sizeInput}
                onChange={e => setSizeInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    const newSizes = sizeInput.split(',').map(s => s.trim()).filter(Boolean);
                    if (newSizes.length) {
                      setForm({ ...form, sizes: [...form.sizes, ...newSizes.map(s => ({ size: s, available: true }))] });
                      setSizeInput('');
                    }
                  }
                }}
                onBlur={() => {
                  const newSizes = sizeInput.split(',').map(s => s.trim()).filter(Boolean);
                  if (newSizes.length) {
                    setForm({ ...form, sizes: [...form.sizes, ...newSizes.map(s => ({ size: s, available: true }))] });
                    setSizeInput('');
                  }
                }}
              />
              <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
                {form.sizes.map((s, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 8px', border: `1px solid ${s.available ? 'rgba(74,158,255,0.5)' : 'rgba(255,74,74,0.4)'}`, borderRadius: 4, fontSize: 12, background: s.available ? 'rgba(74,158,255,0.08)' : 'rgba(255,74,74,0.08)' }}>
                    <span style={{ fontWeight: 600, color: 'rgba(255,255,255,0.85)' }}>{s.size}</span>
                    <button
                      type="button"
                      title={s.available ? 'Unavailable করুন' : 'Available করুন'}
                      onClick={() => { const updated = [...form.sizes]; updated[i] = { ...updated[i], available: !updated[i].available }; setForm({ ...form, sizes: updated }); }}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: s.available ? '#4a9eff' : '#ff4a4a', fontSize: 10, padding: '0 2px', fontWeight: 700 }}
                    >
                      {s.available ? '✓ Available' : '✗ Unavailable'}
                    </button>
                    <button
                      type="button"
                      onClick={() => { const updated = [...form.sizes]; updated.splice(i, 1); setForm({ ...form, sizes: updated }); }}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.35)', padding: '0 2px', fontSize: 14, lineHeight: 1 }}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Video URL */}
            <div className="form-group" style={{ marginTop: 20, paddingTop: 20, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
              <label className="form-label">Product Video URL</label>
              <input
                className="form-input"
                value={form.video_url}
                onChange={e => setForm({ ...form, video_url: e.target.value })}
                placeholder="https://youtube.com/watch?v=... or Vimeo / .mp4 link"
              />
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 4 }}>
                Supports YouTube, Vimeo, or a direct .mp4 file URL. Leave blank to hide the video section.
              </p>
            </div>

            <div style={{ display: 'flex', gap: 20, margin: '20px 0' }}>
              {[['is_available', 'In Stock'], ['is_featured', 'Featured']].map(([key, label]) => (
                <label key={key} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer', color: 'rgba(255,255,255,0.7)' }}>
                  <input type="checkbox" checked={form[key as keyof typeof form] as boolean} onChange={e => setForm({ ...form, [key]: e.target.checked })} style={{ width: 15, height: 15, accentColor: '#4a9eff' }} />
                  {label}
                </label>
              ))}
            </div>
            <div className="form-actions">
              <button className="btn-ghost" onClick={() => setOpen(false)} disabled={saving}>Cancel</button>
              <button className="btn-primary-admin" onClick={save} disabled={saving}>
                {saving ? <Loader2 size={15} className="spin" /> : null}
                {saving ? 'Saving...' : 'Save Product'}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`.spin { animation: spin 1s linear infinite; } @keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </>
  );
}
