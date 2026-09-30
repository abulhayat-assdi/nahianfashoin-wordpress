'use client';

import { useState, useEffect, useRef } from 'react';
import { Plus, Pencil, Trash2, X, Loader2, Upload, ImageIcon } from 'lucide-react';
import ImageUpload from '@/components/admin/ImageUpload';
import { useConfirm } from '@/contexts/ConfirmContext';

type Banner = {
  id: string;
  image_url: string;
};

export default function HeroBannerPage() {
  const confirm = useConfirm();
  const [banners, setBanners] = useState<Banner[]>([]);
  const [tickerItems, setTickerItems] = useState<string[]>([]);
  const [shopMenuImage, setShopMenuImage] = useState('');
  const [shopMenuImageSaving, setShopMenuImageSaving] = useState(false);
  const [shopMenuImageSaved, setShopMenuImageSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Logo management
  const [logoVersion, setLogoVersion] = useState(Date.now());
  const [logoUploading, setLogoUploading] = useState(false);
  const [logoError, setLogoError] = useState('');
  const [logoSaved, setLogoSaved] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Banner | null>(null);
  const [form, setForm] = useState({ image_url: '' });
  const [tickerInput, setTickerInput] = useState('');
  const [editingTickerIndex, setEditingTickerIndex] = useState<number | null>(null);

  const handleLogoFile = async (file: File) => {
    if (!file.type.startsWith('image/')) { setLogoError('Please select an image file.'); return; }
    if (file.size > 5 * 1024 * 1024) { setLogoError('Image must be under 5 MB.'); return; }
    setLogoUploading(true);
    setLogoError('');
    const fd = new FormData();
    fd.append('file', file);
    try {
      const res = await fetch('/api/admin/logo', { method: 'POST', body: fd });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || 'Upload failed');
      setLogoVersion(Date.now());
      setLogoSaved(true);
      setTimeout(() => setLogoSaved(false), 2500);
    } catch (err: any) {
      setLogoError(err.message || 'Upload failed. Please try again.');
    } finally {
      setLogoUploading(false);
      if (logoInputRef.current) logoInputRef.current.value = '';
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/home-config');
      const json = await res.json();
      if (json.data) {
        setBanners(json.data.banners || []);
        setTickerItems(json.data.ticker_items || []);
        setShopMenuImage((json.data.data as any)?.shop_menu_image || '');
      }
    } catch (err) {
      console.error('Failed to load home config', err);
    } finally {
      setLoading(false);
    }
  };

  const saveData = async (newBanners: Banner[], newTickers: string[], menuImg?: string) => {
    setSaving(true);
    try {
      const res = await fetch('/api/home-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          banners: newBanners,
          ticker_items: newTickers,
          data: { shop_menu_image: menuImg ?? shopMenuImage },
        })
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || 'Failed to save');
      }
    } catch (err: any) {
      console.error(err);
      alert('Error saving data: ' + (err.message || 'Unknown error'));
    } finally {
      setSaving(false);
    }
  };

  const saveShopMenuImage = async () => {
    setShopMenuImageSaving(true);
    try {
      const res = await fetch('/api/home-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          banners,
          ticker_items: tickerItems,
          data: { shop_menu_image: shopMenuImage },
        })
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || 'Failed to save');
      }
      setShopMenuImageSaved(true);
      setTimeout(() => setShopMenuImageSaved(false), 2500);
    } catch (err: any) {
      alert('Error saving image: ' + (err.message || 'Unknown error'));
    } finally {
      setShopMenuImageSaving(false);
    }
  };

  const openNew = () => { setEditing(null); setForm({ image_url: '' }); setOpen(true); };
  const openEdit = (b: Banner) => { setEditing(b); setForm({ image_url: b.image_url }); setOpen(true); };

  const saveBannerModal = async () => {
    let newBanners;
    if (editing) {
      newBanners = banners.map(b => b.id === editing.id ? { ...editing, ...form } : b);
    } else {
      newBanners = [...banners, { id: Date.now().toString(), ...form }];
    }
    setBanners(newBanners);
    setOpen(false);
    await saveData(newBanners, tickerItems);
  };

  const removeBanner = async (id: string) => {
    const ok = await confirm({
      title: "ব্যানার ডিলিট করুন",
      message: "এই ব্যানারটি স্থায়ীভাবে ডিলিট হয়ে যাবে। আপনি কি নিশ্চিত?",
      confirmText: "হ্যাঁ, ডিলিট করুন",
      cancelText: "না",
    });
    if (!ok) return;
    const newBanners = banners.filter(b => b.id !== id);
    setBanners(newBanners);
    await saveData(newBanners, tickerItems);
  };

  const addTickerItem = async () => {
    if (tickerInput.trim()) {
      let newTickers;
      if (editingTickerIndex !== null) {
        newTickers = tickerItems.map((item, i) => i === editingTickerIndex ? tickerInput.trim() : item);
        setEditingTickerIndex(null);
      } else {
        newTickers = [...tickerItems, tickerInput.trim()];
      }
      setTickerItems(newTickers);
      setTickerInput('');
      await saveData(banners, newTickers);
    }
  };

  const startEditTicker = (index: number) => {
    setEditingTickerIndex(index);
    setTickerInput(tickerItems[index]);
  };

  const cancelEditTicker = () => {
    setEditingTickerIndex(null);
    setTickerInput('');
  };

  const removeTickerItem = async (index: number) => {
    const ok = await confirm({
      title: "টিকার আইটেম সরান",
      message: "এই টিকার আইটেমটি সরিয়ে দেওয়া হবে। আপনি কি নিশ্চিত?",
      confirmText: "হ্যাঁ, সরান",
      cancelText: "না",
    });
    if (!ok) return;
    const newTickers = tickerItems.filter((_, i) => i !== index);
    setTickerItems(newTickers);
    await saveData(banners, newTickers);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400">
        <Loader2 className="animate-spin mr-2" /> Loading home configuration...
      </div>
    );
  }

  return (
    <>
      {/* ── Site Logo Manager ─────────────────────────────────── */}
      <div className="page-heading">
        <div>
          <h1 className="page-title">Site Logo</h1>
          <p className="page-subtitle">Upload or replace the logo shown in the header, admin sidebar, and favicon.</p>
        </div>
        <button
          className="btn-primary-admin"
          onClick={() => logoInputRef.current?.click()}
          disabled={logoUploading}
          style={{ background: logoSaved ? '#3ecf8e' : undefined, display: 'flex', alignItems: 'center', gap: 6 }}
        >
          {logoUploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
          {logoUploading ? 'Uploading…' : logoSaved ? '✓ Logo Updated!' : 'Upload New Logo'}
        </button>
      </div>

      <div className="section-card" style={{ marginBottom: 40 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 32, flexWrap: 'wrap' }}>
          {/* Light background preview */}
          <div>
            <p className="form-label" style={{ marginBottom: 8 }}>Preview — Light Background</p>
            <div
              style={{ width: 260, height: 100, borderRadius: 10, border: '1px solid rgba(255,255,255,0.12)', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
              onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files?.[0]; if (f) handleLogoFile(f); }}
              onDragOver={e => e.preventDefault()}
            >
              <img
                key={logoVersion}
                src={`/logo.png?v=${logoVersion}`}
                alt="Current logo"
                style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
              />
            </div>
          </div>
          {/* Dark background preview */}
          <div>
            <p className="form-label" style={{ marginBottom: 8 }}>Preview — Dark Background</p>
            <div
              style={{ width: 260, height: 100, borderRadius: 10, border: '1px solid rgba(255,255,255,0.12)', background: '#0f111a', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
              onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files?.[0]; if (f) handleLogoFile(f); }}
              onDragOver={e => e.preventDefault()}
            >
              <img
                key={logoVersion + 'd'}
                src={`/logo.png?v=${logoVersion}`}
                alt="Current logo dark"
                style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', filter: 'brightness(0) invert(1)' }}
                onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
              />
            </div>
          </div>
        </div>

        <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            className="btn-ghost"
            style={{ fontSize: 12, padding: '6px 14px', display: 'flex', alignItems: 'center', gap: 6 }}
            onClick={() => logoInputRef.current?.click()}
            disabled={logoUploading}
          >
            {logoUploading ? <Loader2 size={13} className="animate-spin" /> : <Upload size={13} />}
            {logoUploading ? 'Uploading…' : 'Choose File'}
          </button>
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>or drag & drop an image onto the preview — PNG, SVG, WEBP, max 5 MB</span>
        </div>
        {logoError && <p style={{ fontSize: 12, color: '#ff6b6b', marginTop: 8 }}>{logoError}</p>}
        {logoSaved && <p style={{ fontSize: 12, color: '#3ecf8e', marginTop: 8 }}>✓ Logo updated successfully! Reload the page to see it in the sidebar and header.</p>}

        <input
          ref={logoInputRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={e => { const f = e.target.files?.[0]; if (f) handleLogoFile(f); }}
        />
      </div>

      {/* ── Hero Banner ──────────────────────────────────────── */}
      <div className="page-heading">
        <div>
          <h1 className="page-title">Hero Banner</h1>
          <p className="page-subtitle">Manage the homepage hero banner image.</p>
        </div>
        <div className="flex items-center gap-3">
          {saving && <span className="text-xs text-gray-400 flex items-center gap-1"><Loader2 size={12} className="animate-spin"/> Saving...</span>}
          <button className="btn-primary-admin" onClick={openNew}><Plus size={15} /> Add Banner</button>
        </div>
      </div>

      <div className="data-table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>Image</th><th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {banners.length === 0 ? (
              <tr><td colSpan={2} className="empty-state">No banners found.</td></tr>
            ) : banners.map(b => (
              <tr key={b.id}>
                <td><img src={b.image_url} alt="" className="thumb" onError={e => (e.currentTarget.style.display='none')} /></td>
                <td>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className="btn-edit" onClick={() => openEdit(b)}><Pencil size={13} /> Edit</button>
                    <button className="btn-danger" onClick={() => removeBanner(b.id)}><Trash2 size={13} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="page-heading" style={{ marginTop: 40 }}>
        <div>
          <h2 className="page-title" style={{ fontSize: 20 }}>Announcement Ticker</h2>
          <p className="page-subtitle">Manage the scrolling text items shown below the hero banner.</p>
        </div>
      </div>

      <div className="section-card">
        <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
          <input
            className="form-input"
            placeholder="E.g. Free Shipping on orders over Tk 2,000"
            value={tickerInput}
            onChange={e => setTickerInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addTickerItem()}
            style={{ flex: 1 }}
          />
          <button className="btn-primary-admin" onClick={addTickerItem} disabled={!tickerInput.trim()}>
            {editingTickerIndex !== null ? 'Update Item' : <><Plus size={15} /> Add Item</>}
          </button>
          {editingTickerIndex !== null && (
            <button className="btn-ghost" onClick={cancelEditTicker}>Cancel</button>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {tickerItems.length === 0 ? (
            <p className="empty-state" style={{ padding: '20px' }}>No ticker items added.</p>
          ) : tickerItems.map((item, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8 }}>
              <span style={{ fontSize: 13, fontWeight: 500 }}>{item}</span>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn-edit" onClick={() => startEditTicker(i)}><Pencil size={13} /> Edit</button>
                <button className="btn-danger" onClick={() => removeTickerItem(i)}><Trash2 size={13} /></button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Shop Menu Featured Image */}
      <div className="page-heading" style={{ marginTop: 40 }}>
        <div>
          <h2 className="page-title" style={{ fontSize: 20 }}>Shop Menu Featured Image</h2>
          <p className="page-subtitle">The image shown on the right side of the Shop navigation menu.</p>
        </div>
        <button
          className="btn-primary-admin"
          onClick={saveShopMenuImage}
          disabled={shopMenuImageSaving}
          style={{ background: shopMenuImageSaved ? '#3ecf8e' : undefined, display: 'flex', alignItems: 'center', gap: 6 }}
        >
          {shopMenuImageSaving ? <Loader2 size={14} className="animate-spin" /> : null}
          {shopMenuImageSaving ? 'Saving...' : shopMenuImageSaved ? '✓ Saved!' : 'Save Image'}
        </button>
      </div>

      <div className="section-card">
        <ImageUpload
          label="Menu Featured Image"
          value={shopMenuImage}
          onChange={url => setShopMenuImage(url)}
          bucket="images"
          folder="menu"
        />
        {shopMenuImage && (
          <div style={{ marginTop: 16 }}>
            <p className="form-label" style={{ marginBottom: 8 }}>Preview</p>
            <img
              src={shopMenuImage}
              alt="Shop menu featured"
              style={{ width: '100%', maxWidth: 360, height: 220, objectFit: 'cover', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)' }}
              onError={e => (e.currentTarget.style.display = 'none')}
            />
          </div>
        )}
      </div>

      {open && (
        <div className="modal-overlay" onClick={() => setOpen(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-title">
              {editing ? 'Edit Banner' : 'Add Banner'}
              <button onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer' }}><X size={18} /></button>
            </div>
            <ImageUpload
              label="Banner Image"
              value={form.image_url}
              onChange={url => setForm({ ...form, image_url: url })}
              bucket="images"
              folder="hero"
            />
            <div className="form-actions">
              <button className="btn-ghost" onClick={() => setOpen(false)}>Cancel</button>
              <button className="btn-primary-admin" onClick={saveBannerModal}>Save Banner</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}


