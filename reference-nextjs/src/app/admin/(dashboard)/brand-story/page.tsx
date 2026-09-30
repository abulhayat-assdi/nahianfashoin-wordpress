'use client';

import { useState, useEffect } from 'react';
import ImageUpload from '@/components/admin/ImageUpload';
import { Loader2, UploadCloud } from 'lucide-react';

function SignatureUpload({ value, onChange }: { value: string; onChange: (url: string) => void }) {
  const [uploading, setUploading] = useState(false);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('name', `signature-${Date.now()}`);
      const res = await fetch('/api/blog/upload', { method: 'POST', body: formData });
      if (res.ok) {
        const data = await res.json();
        onChange(data.url || '');
      } else {
        alert('Upload failed. Please try again.');
      }
    } catch {
      alert('Upload error.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <label className="flex items-center gap-3 cursor-pointer">
      <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-gold/10 border border-brand-gold/30 text-brand-gold text-sm font-medium hover:bg-brand-gold/20 transition-all">
        {uploading ? <Loader2 size={16} className="animate-spin" /> : <UploadCloud size={16} />}
        {uploading ? 'Uploading...' : 'Upload Signature Image'}
      </div>
      <input type="file" accept="image/*" className="hidden" onChange={handleFile} disabled={uploading} />
      {value && <span className="text-xs text-green-400">✓ Uploaded</span>}
    </label>
  );
}

export default function BrandStoryPage() {
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({
    eyebrow: '',
    title: '',
    body: '',
    body2: '',
    cta_text: '',
    founder_name: '',
    founder_title: '',
    founder_signature: '',
    founder_image: '',
    care_eyebrow: '',
    care_title: '',
    impact1_title: '',
    impact1_body: '',
    impact2_title: '',
    impact2_body: '',
    impact3_title: '',
    impact3_body: '',
    farmers_image: '',
  });

  useEffect(() => {
    fetch('/api/admin/brand-story')
      .then(r => r.json())
      .then(data => {
        if (data.data) setForm(data.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handle = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm({ ...form, [key]: e.target.value });

  const handleSave = async () => {
    setSaved(false);
    const res = await fetch('/api/admin/brand-story', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (!res.ok) {
      alert('Error saving: ' + data.error);
    } else {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
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
          <h1 className="page-title">Brand Story</h1>
          <p className="page-subtitle">Edit the &quot;Our Story&quot; and &quot;We Care For&quot; sections on the homepage.</p>
        </div>
        <button className="btn-primary-admin" onClick={handleSave} style={{ background: saved ? '#3ecf8e' : undefined }}>
          {saved ? '✓ Saved!' : 'Save Changes'}
        </button>
      </div>

      <div className="section-card">
        <p className="section-card-title">Our Story Section</p>
        <div className="form-row">
          <div className="form-group"><label className="form-label">Eyebrow Text</label><input className="form-input" value={form.eyebrow} onChange={handle('eyebrow')} /></div>
          <div className="form-group"><label className="form-label">Section Title</label><input className="form-input" value={form.title} onChange={handle('title')} /></div>
        </div>
        <div className="form-group"><label className="form-label">Main Paragraph</label><textarea className="form-textarea" style={{ minHeight: 90 }} value={form.body} onChange={handle('body')} /></div>
        <div className="form-group"><label className="form-label">Gold Highlight Text</label><input className="form-input" value={form.body2} onChange={handle('body2')} /></div>
        <div className="form-group"><label className="form-label">CTA Button Text</label><input className="form-input" value={form.cta_text} onChange={handle('cta_text')} /></div>
      </div>

      <div className="section-card">
        <p className="section-card-title">Founder Info</p>
        <div className="form-row">
          <div className="form-group"><label className="form-label">Founder Name</label><input className="form-input" value={form.founder_name} onChange={handle('founder_name')} /></div>
        </div>
        <div className="form-group"><label className="form-label">Founder Title / Role</label><textarea className="form-textarea" style={{ minHeight: 60 }} value={form.founder_title} onChange={handle('founder_title')} /></div>

        <div className="form-group">
          <label className="form-label">Founder Signature (Image)</label>
          <div className="flex items-center gap-4 bg-[#0f111a] p-4 rounded-xl border border-white/5">
            {form.founder_signature && (
              <img src={form.founder_signature} alt="signature" className="h-16 object-contain bg-white rounded p-1" />
            )}
            <div className="flex-1">
              <SignatureUpload
                value={form.founder_signature}
                onChange={(url) => setForm({ ...form, founder_signature: url })}
              />
            </div>
          </div>
        </div>
        <ImageUpload
          label="Founder Photo"
          value={form.founder_image}
          onChange={url => setForm({ ...form, founder_image: url })}
          bucket="images"
          folder="brand"
        />
      </div>
    </>
  );
}
