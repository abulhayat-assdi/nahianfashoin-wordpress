'use client';

import { useState, useEffect, useRef } from 'react';
import { Plus, Pencil, Trash2, X, Loader2, Upload } from 'lucide-react';
import ImageUpload from '@/components/admin/ImageUpload';
import { useConfirm } from '@/contexts/ConfirmContext';

type Banner = {
  id: string;
  image_url: string;
};

export default function HeroBannerPage() {
  const confirm = useConfirm();
  const [banners, setBanners] = useState<Banner[]>([]);
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

  // Hero text fields
  const [heroText, setHeroText] = useState({
    eyebrow: '',
    title: '',
    subtitle: '',
    btn_text: '',
    btn_link: '',
  });
  const [heroTextSaving, setHeroTextSaving] = useState(false);
  const [heroTextSaved, setHeroTextSaved] = useState(false);

  const handleLogoFile = async (file: File) => {
    if (!file.type.startsWith('image/')) { setLogoError('Please select an image file.'); return; }
    if (file.size > 20 * 1024 * 1024) {
      const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
      setLogoError(`ইমেজ সাইজ অনেক বড় (${sizeMB}MB)। সর্বোচ্চ ২০MB পর্যন্ত আপলোড করা যাবে। সাইজ কমিয়ে আবার চেষ্টা করুন।`);
      return;
    }
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
        const ht = (json.data.data as any)?.hero_text;
        if (ht) setHeroText(prev => ({ ...prev, ...ht }));
      }
    } catch (err) {
      console.error('Failed to load home config', err);
    } finally {
      setLoading(false);
    }
  };

  const saveData = async (newBanners: Banner[]) => {
    setSaving(true);
    try {
      const res = await fetch('/api/home-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ banners: newBanners, data: { hero_text: heroText } }),
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

  const openNew = () => { setEditing(null); setForm({ image_url: '' }); setOpen(true); };
  const openEdit = (b: Banner) => { setEditing(b); setForm({ image_url: b.image_url }); setOpen(true); };

  const saveBannerModal = async () => {
    const newBanners = editing
      ? banners.map(b => b.id === editing.id ? { ...editing, ...form } : b)
      : [...banners, { id: Date.now().toString(), ...form }];
    setBanners(newBanners);
    setOpen(false);
    await saveData(newBanners);
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
    await saveData(newBanners);
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
          <div>
            <p className="form-label" style={{ marginBottom: 8 }}>Current Logo</p>
            <div
              style={{ width: 260, height: 100, borderRadius: 10, border: '1px solid rgba(255,255,255,0.12)', background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
              onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files?.[0]; if (f) handleLogoFile(f); }}
              onDragOver={e => e.preventDefault()}
            >
              <img
                key={logoVersion}
                src={`${window.NF_ADMIN.logo}${window.NF_ADMIN.logo.includes('?') ? '&' : '?'}v=${logoVersion}`}
                alt="Current logo"
                style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
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
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>or drag & drop an image onto the preview — PNG, SVG, WEBP, max 20 MB</span>
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

      {/* ── Hero Text ───────────────────────────────────────── */}
      <div className="page-heading" style={{ marginTop: 40 }}>
        <div>
          <h2 className="page-title" style={{ fontSize: 20 }}>Hero Banner Text</h2>
          <p className="page-subtitle">Banner-এর উপরে দেখানো text configure করুন।</p>
        </div>
        <button
          className="btn-primary-admin"
          disabled={heroTextSaving}
          style={{ background: heroTextSaved ? '#3ecf8e' : undefined, display: 'flex', alignItems: 'center', gap: 6 }}
          onClick={async () => {
            setHeroTextSaving(true);
            try {
              await fetch('/api/home-config', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ banners, data: { hero_text: heroText } }),
              });
              setHeroTextSaved(true);
              setTimeout(() => setHeroTextSaved(false), 2500);
            } finally { setHeroTextSaving(false); }
          }}
        >
          {heroTextSaving ? 'Saving...' : heroTextSaved ? '✓ Saved!' : 'Save Text'}
        </button>
      </div>
      <div className="section-card" style={{ marginBottom: 40 }}>
        <div className="form-row">
          <div className="form-group"><label className="form-label">Eyebrow (ছোট টেক্সট)</label><input className="form-input" value={heroText.eyebrow} onChange={e => setHeroText({ ...heroText, eyebrow: e.target.value })} placeholder="New Collection" /></div>
          <div className="form-group"><label className="form-label">Button Text</label><input className="form-input" value={heroText.btn_text} onChange={e => setHeroText({ ...heroText, btn_text: e.target.value })} placeholder="SHOP NOW" /></div>
        </div>
        <div className="form-group"><label className="form-label">Main Title (বড় হেডিং)</label><input className="form-input" value={heroText.title} onChange={e => setHeroText({ ...heroText, title: e.target.value })} placeholder="PREMIUM PANJABI" /></div>
        <div className="form-row">
          <div className="form-group"><label className="form-label">Subtitle</label><input className="form-input" value={heroText.subtitle} onChange={e => setHeroText({ ...heroText, subtitle: e.target.value })} placeholder="For The Modern Man" /></div>
          <div className="form-group"><label className="form-label">Button Link</label><input className="form-input" value={heroText.btn_link} onChange={e => setHeroText({ ...heroText, btn_link: e.target.value })} placeholder="/collections/all" /></div>
        </div>
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
