'use client';

import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, X, PlayCircle, Loader2 } from 'lucide-react';
import MultiMediaUpload from '@/components/admin/MultiMediaUpload';
import RichTextEditor from '@/components/admin/RichTextEditor';
import { useConfirm } from '@/contexts/ConfirmContext';

function IconPreview({ type }: { type: string }) {
  const commonClasses = "h-[22px] w-[22px] stroke-[1.2]";
  switch (type) {
    case 'cup-spoon': return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className={commonClasses}><path d="M5 14a6 6 0 0 0 12 0V7H5v7z" /><path d="M17 9h2a2 2 0 0 1 2 2v0a2 2 0 0 1-2 2h-2" /><path d="M3 19h18" /><path d="M13 2l3 3" /></svg>;
    case 'pour': return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className={commonClasses}><path d="M12 2v6" strokeDasharray="2 2" /><path d="M8 8h8v9a4 4 0 0 1-8 0V8z" /><path d="M16 10l3-3" /></svg>;
    case 'thermo': return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className={commonClasses}><path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z" /><path d="M11.5 8v6" /><circle cx="11.5" cy="16.5" r="1.5" fill="currentColor" /></svg>;
    case 'teapot': return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className={commonClasses}><path d="M8 10h8a4 4 0 0 1 4 4v0a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4v0a4 4 0 0 1 4-4z" /><path d="M12 10V6" /><path d="M10 6h4" /><path d="M4 14c-1.5-1-3-1-3-3s2-2 3-2" /><path d="M20 14h2" /></svg>;
    case 'milk': return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className={commonClasses}><path d="M7 6h10v14H7z" /><path d="M7 6l5-4 5 4" /><path d="M10 11h4" /></svg>;
    case 'iced-spoon': return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className={commonClasses}><path d="M8 4h8l-1 16H9L8 4z" /><path d="M16 4l3-3" /></svg>;
    case 'iced-drink': return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className={commonClasses}><path d="M8 6h8l-1 14H9L8 6z" /><path d="M12 6V2" /><path d="M10 12l2-2" /><path d="M12 16l2-2" /></svg>;
    default: return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className={commonClasses}><path d="M5 14a6 6 0 0 0 12 0V7H5v7z" /></svg>;
  }
}

type FAQ = { q: string; a: string };
type SteepingStep = { id: string; iconType: string; step: string; text: string };
type SteepingData = { enabled: boolean; image_url: string; hot_brew: SteepingStep[]; iced_brew: SteepingStep[] };

type Product = {
  id: string; slug?: string; name: string; detail: string; description: string; price: string; originalPrice: string;
  discount: string; perCupPrice: string; packaging: string; media_urls: string[];
  category: string; is_available: boolean; is_featured: boolean; is_gift: boolean; faqs: FAQ[];
  steeping: SteepingData;
};

const DEFAULT_STEEPING: SteepingData = {
  enabled: false,
  image_url: 'https://images.unsplash.com/photo-1576092762791-dd9e2220abd1?q=80&w=1200&auto=format&fit=crop',
  hot_brew: [
    { id: '1', iconType: 'cup-spoon', step: 'Step 1', text: 'Place 1 Tea Spoon Leaves in a Cup or Tea Pot' },
    { id: '2', iconType: 'pour', step: 'Step 2', text: '200 ml Freshly Boiled Water over the Leaves' },
    { id: '3', iconType: 'thermo', step: 'Step 3', text: 'Water Temperature - 194°F-212°F | 90°C-100°C' },
    { id: '4', iconType: 'teapot', step: 'Step 4', text: 'Brew for 3-5 mins & Strain the Leaves' },
    { id: '5', iconType: 'milk', step: 'Step 5', text: 'Can be served with or without milk & sugar' },
  ],
  iced_brew: [
    { id: '1', iconType: 'iced-spoon', step: 'Step 1', text: 'For Iced Tea, use 2 Tea Spoons & Brew for 5 mins' },
    { id: '2', iconType: 'iced-drink', step: 'Step 2', text: 'Refrigerate for 3-4 hours. Add ice cubes & sweetener' },
  ]
};

const FALLBACK_CATS = ['Flower Tea', 'Green Tea', 'Black Tea', 'Matcha'];
const empty: Omit<Product, 'id' | 'slug'> = { name: '', detail: '', description: '', price: '', originalPrice: '', discount: '', perCupPrice: '', packaging: '', media_urls: [], category: 'Green Tea', is_available: true, is_featured: false, is_gift: false, faqs: [], steeping: DEFAULT_STEEPING };

export default function ProductsPage() {
  const confirm = useConfirm();
  const [items, setItems] = useState<Product[]>([]);
  const [cats, setCats] = useState<string[]>(FALLBACK_CATS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState({ ...empty });
  const [filter, setFilter] = useState('All');

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
    setForm({ name: p.name, detail: p.detail || '', description: p.description || '', price: p.price, originalPrice: p.originalPrice || '', discount: p.discount || '', perCupPrice: p.perCupPrice || '', packaging: p.packaging || '', media_urls: p.media_urls || [], category: p.category || 'Green Tea', is_available: p.is_available, is_featured: p.is_featured, is_gift: p.is_gift, faqs: p.faqs || [], steeping: p.steeping || DEFAULT_STEEPING });
    setOpen(true);
  };
  const openNew = () => { setEditing(null); setForm({ ...empty }); setOpen(true); };

  const save = async () => {
    if (!form.name || !form.price || form.media_urls.length === 0) {
      alert("Name, Price, and at least one Image are required to publish this product.");
      return;
    }
    const generatedSlug = form.name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    setSaving(true);

    const dbData = {
      slug: generatedSlug,
      name: form.name,
      detail: form.detail,
      description: form.description,
      price: form.price,
      original_price: form.originalPrice,
      discount: form.discount,
      per_cup_price: form.perCupPrice,
      packaging: form.packaging,
      media_urls: form.media_urls,
      category: form.category,
      is_available: form.is_available,
      is_featured: form.is_featured,
      is_gift: form.is_gift,
      faqs: form.faqs,
      steeping: form.steeping,
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
        setItems([{ ...data.data, originalPrice: data.data.original_price, perCupPrice: data.data.per_cup_price } as Product, ...items]);
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

  const filtered = filter === 'All' ? items : filter === 'Featured' ? items.filter(p => p.is_gift) : items.filter(p => p.category === filter);

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
          <thead><tr><th>Image</th><th>Name</th><th>Price</th><th>Category</th><th>Tags</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="empty-state"><Loader2 className="spin" style={{ margin: '0 auto' }} /> Loading products...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={7} className="empty-state">No products found.</td></tr>
            ) : filtered.map(p => {
              const firstMedia = p.media_urls?.[0];
              const isVideo = firstMedia?.match(/\.(mp4|webm|ogg|mov)$/i);
              return (
                <tr key={p.id}>
                  <td>
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
                  <td><p style={{ fontWeight: 600, fontSize: 13 }}>{p.name}</p><p style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', marginTop: 2 }}>{p.detail}</p></td>
                  <td><p style={{ fontWeight: 600 }}>{p.price}</p><p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', textDecoration: 'line-through' }}>{p.originalPrice}</p></td>
                  <td><span className="badge badge-active" style={{ fontSize: 10 }}>{p.category}</span></td>
                  <td>
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                      {p.is_gift && <span style={{ background: 'rgba(245,166,35,0.15)', color: '#f5a623', border: '1px solid rgba(245,166,35,0.3)', padding: '2px 8px', borderRadius: 20, fontSize: 10, fontWeight: 600 }}>Featured</span>}
                    </div>
                  </td>
                  <td><span className={`badge ${p.is_available ? 'badge-active' : 'badge-inactive'}`}>{p.is_available ? 'In Stock' : 'Out of Stock'}</span></td>
                  <td>
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

            <div className="form-row">
              <div className="form-group"><label className="form-label">Subtitle / Detail</label><input className="form-input" value={form.detail} onChange={e => setForm({ ...form, detail: e.target.value })} placeholder="Loose Leaf | 170 Cups" /></div>
              <div className="form-group"><label className="form-label">Packaging</label><input className="form-input" value={form.packaging} onChange={e => setForm({ ...form, packaging: e.target.value })} placeholder="Vacuum Packaged" /></div>
            </div>

            <div className="form-row">
              <div className="form-group"><label className="form-label">Price <span style={{ color: '#ff4a4a' }}>*</span></label><input className="form-input" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} placeholder="Tk 2,600.00" /></div>
              <div className="form-group"><label className="form-label">Original Price</label><input className="form-input" value={form.originalPrice} onChange={e => setForm({ ...form, originalPrice: e.target.value })} /></div>
            </div>

            <div className="form-row">
              <div className="form-group"><label className="form-label">Discount Label</label><input className="form-input" value={form.discount} onChange={e => setForm({ ...form, discount: e.target.value })} placeholder="30% Off" /></div>
              <div className="form-group"><label className="form-label">Per Cup Price</label><input className="form-input" value={form.perCupPrice} onChange={e => setForm({ ...form, perCupPrice: e.target.value })} placeholder="$50.00 Per Cup" /></div>
            </div>

            <div className="form-group"><label className="form-label">Category</label>
              <select className="form-select" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                {cats.map(c => <option key={c}>{c}</option>)}
              </select>
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

            <div className="form-group" style={{ marginTop: 20, paddingTop: 20, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <label className="form-label" style={{ marginBottom: 0 }}>Steeping Instructions (How to Brew)</label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer', color: 'rgba(255,255,255,0.7)' }}>
                  <input type="checkbox" checked={form.steeping.enabled} onChange={e => setForm({ ...form, steeping: { ...form.steeping, enabled: e.target.checked } })} style={{ width: 15, height: 15, accentColor: '#4a9eff' }} />
                  Enable Steeping Section
                </label>
              </div>

              {form.steeping.enabled && (
                <div style={{ background: 'rgba(0,0,0,0.15)', padding: 16, borderRadius: 8, marginTop: 10, border: '1px solid rgba(255,255,255,0.05)' }}>
                  <MultiMediaUpload
                    label="Side Image"
                    values={form.steeping.image_url ? [form.steeping.image_url] : []}
                    onChange={urls => setForm({ ...form, steeping: { ...form.steeping, image_url: urls[0] || '' } })}
                    bucket="images"
                    folder="products/steeping"
                  />

                  <div style={{ marginTop: 20 }}>
                    <h4 style={{ fontSize: 13, fontWeight: 600, color: '#b48f52', marginBottom: 10, textTransform: 'uppercase' }}>Hot Brew Steps</h4>
                    {form.steeping.hot_brew.map((step, i) => (
                      <div key={step.id} style={{ display: 'flex', gap: 10, marginBottom: 12, alignItems: 'flex-start', background: 'rgba(255,255,255,0.03)', padding: 12, borderRadius: 6 }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                          <div style={{ background: 'rgba(255,255,255,0.05)', width: 44, height: 44, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#b48f52' }}>
                            <IconPreview type={step.iconType} />
                          </div>
                          <select className="form-input" style={{ padding: '4px', fontSize: 11, width: 80, height: 'auto' }} value={step.iconType} onChange={e => { const newArr = [...form.steeping.hot_brew]; newArr[i].iconType = e.target.value; setForm({ ...form, steeping: { ...form.steeping, hot_brew: newArr } }); }}>
                            <option value="cup-spoon">Cup</option><option value="pour">Pour</option><option value="thermo">Thermo</option><option value="teapot">Teapot</option><option value="milk">Milk</option><option value="iced-spoon">Iced Spoon</option><option value="iced-drink">Iced Drink</option>
                          </select>
                        </div>
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                          <input className="form-input" placeholder="Step Label (e.g. Step 1)" value={step.step} onChange={e => { const newArr = [...form.steeping.hot_brew]; newArr[i].step = e.target.value; setForm({ ...form, steeping: { ...form.steeping, hot_brew: newArr } }); }} />
                          <textarea className="form-input" placeholder="Instruction Text" rows={2} value={step.text} onChange={e => { const newArr = [...form.steeping.hot_brew]; newArr[i].text = e.target.value; setForm({ ...form, steeping: { ...form.steeping, hot_brew: newArr } }); }} style={{ resize: 'vertical' }} />
                        </div>
                        <button type="button" onClick={() => { const newArr = [...form.steeping.hot_brew]; newArr.splice(i, 1); setForm({ ...form, steeping: { ...form.steeping, hot_brew: newArr } }); }} style={{ background: 'none', border: 'none', color: '#ff4a4a', cursor: 'pointer', padding: 8 }}><Trash2 size={16} /></button>
                      </div>
                    ))}
                    <button type="button" className="btn-ghost" onClick={() => setForm({ ...form, steeping: { ...form.steeping, hot_brew: [...form.steeping.hot_brew, { id: Date.now().toString(), iconType: 'cup-spoon', step: 'New Step', text: '' }] } })} style={{ padding: '4px 10px', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}><Plus size={12} /> Add Hot Brew Step</button>
                  </div>

                  <div style={{ marginTop: 24, paddingTop: 20, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                    <h4 style={{ fontSize: 13, fontWeight: 600, color: '#b48f52', marginBottom: 10, textTransform: 'uppercase' }}>Iced Brew Steps</h4>
                    {form.steeping.iced_brew.map((step, i) => (
                      <div key={step.id} style={{ display: 'flex', gap: 10, marginBottom: 12, alignItems: 'flex-start', background: 'rgba(255,255,255,0.03)', padding: 12, borderRadius: 6 }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                          <div style={{ background: 'rgba(255,255,255,0.05)', width: 44, height: 44, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#b48f52' }}>
                            <IconPreview type={step.iconType} />
                          </div>
                          <select className="form-input" style={{ padding: '4px', fontSize: 11, width: 80, height: 'auto' }} value={step.iconType} onChange={e => { const newArr = [...form.steeping.iced_brew]; newArr[i].iconType = e.target.value; setForm({ ...form, steeping: { ...form.steeping, iced_brew: newArr } }); }}>
                            <option value="cup-spoon">Cup</option><option value="pour">Pour</option><option value="thermo">Thermo</option><option value="teapot">Teapot</option><option value="milk">Milk</option><option value="iced-spoon">Iced Spoon</option><option value="iced-drink">Iced Drink</option>
                          </select>
                        </div>
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                          <input className="form-input" placeholder="Step Label (e.g. Step 1)" value={step.step} onChange={e => { const newArr = [...form.steeping.iced_brew]; newArr[i].step = e.target.value; setForm({ ...form, steeping: { ...form.steeping, iced_brew: newArr } }); }} />
                          <textarea className="form-input" placeholder="Instruction Text" rows={2} value={step.text} onChange={e => { const newArr = [...form.steeping.iced_brew]; newArr[i].text = e.target.value; setForm({ ...form, steeping: { ...form.steeping, iced_brew: newArr } }); }} style={{ resize: 'vertical' }} />
                        </div>
                        <button type="button" onClick={() => { const newArr = [...form.steeping.iced_brew]; newArr.splice(i, 1); setForm({ ...form, steeping: { ...form.steeping, iced_brew: newArr } }); }} style={{ background: 'none', border: 'none', color: '#ff4a4a', cursor: 'pointer', padding: 8 }}><Trash2 size={16} /></button>
                      </div>
                    ))}
                    <button type="button" className="btn-ghost" onClick={() => setForm({ ...form, steeping: { ...form.steeping, iced_brew: [...form.steeping.iced_brew, { id: Date.now().toString(), iconType: 'iced-spoon', step: 'New Step', text: '' }] } })} style={{ padding: '4px 10px', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}><Plus size={12} /> Add Iced Brew Step</button>
                  </div>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: 20, margin: '20px 0' }}>
              {[['is_available', 'In Stock'], ['is_gift', 'Featured']].map(([key, label]) => (
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
