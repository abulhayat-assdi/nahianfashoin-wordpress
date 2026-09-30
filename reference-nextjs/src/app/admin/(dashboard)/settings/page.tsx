'use client';

import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';

export default function SettingsPage() {
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    site_name: '',
    site_tagline: '',
    meta_description: '',
    contact_email: '',
    whatsapp_number: '',
    phone_number: '',
    instagram_url: '',
    facebook_url: '',
    currency_code: 'BDT',
    currency_symbol: 'Tk',
    footer_social_heading: 'Contact Us in any way',
    blog_hero_image: '',
  });

  const fetchSettings = async () => {
    setLoading(true);
    const res = await fetch('/api/admin/settings');
    const data = await res.json();
    if (data.data) {
      setForm({
        site_name: data.data.site_name || '',
        site_tagline: data.data.site_tagline || '',
        meta_description: data.data.meta_description || '',
        contact_email: data.data.contact_email || '',
        whatsapp_number: data.data.whatsapp_number || '',
        phone_number: data.data.phone_number || '',
        instagram_url: data.data.instagram_url || '',
        facebook_url: data.data.facebook_url || '',
        currency_code: data.data.currency_code || 'BDT',
        currency_symbol: data.data.currency_symbol || 'Tk',
        footer_social_heading: data.data.footer_social_heading || 'Contact Us in any way',
        blog_hero_image: data.data.blog_hero_image || '',
      });
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handle = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm({ ...form, [k]: e.target.value });

  const handleSave = async () => {
    setSaving(true);
    const res = await fetch('/api/admin/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (!res.ok) {
      alert('Failed to save settings: ' + data.error);
    } else {
      setSaved(true);
      setTimeout(() => setSaved(false), 2200);
    }
    setSaving(false);
  };

  return (
    <>
      <div className="page-heading">
        <div>
          <h1 className="page-title">Settings</h1>
          <p className="page-subtitle">Global site configuration.</p>
        </div>
        <button className="btn-primary-admin" onClick={handleSave} style={{ background: saved ? '#3ecf8e' : undefined }} disabled={saving}>
          {saving ? 'Saving...' : saved ? '✓ Saved!' : 'Save Settings'}
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center min-h-[200px]">
          <Loader2 className="animate-spin text-brand-gold" size={32} />
        </div>
      ) : (
        <>
          <div className="section-card" style={{ marginBottom: 20 }}>
            <p className="section-card-title">Site Information</p>
            <div className="form-row">
              <div className="form-group"><label className="form-label">Site Name</label><input className="form-input" value={form.site_name} onChange={handle('site_name')} /></div>
              <div className="form-group"><label className="form-label">Tagline</label><input className="form-input" value={form.site_tagline} onChange={handle('site_tagline')} /></div>
            </div>
            <div className="form-group"><label className="form-label">Meta Description (SEO)</label><input className="form-input" value={form.meta_description} onChange={handle('meta_description')} /></div>
            <div className="form-group"><label className="form-label">Blog Page Hero Image URL</label><input className="form-input" value={form.blog_hero_image} onChange={handle('blog_hero_image')} placeholder="Paste image link here" /></div>
          </div>

          <div className="section-card">
            <p className="section-card-title">Contact & Social Media</p>
            <div className="form-group">
              <label className="form-label">Footer Social Heading</label>
              <input className="form-input" value={form.footer_social_heading} onChange={handle('footer_social_heading')} placeholder="Contact Us in any way" />
            </div>
            <div className="form-row">
              <div className="form-group"><label className="form-label">Contact Email</label><input className="form-input" type="email" value={form.contact_email} onChange={handle('contact_email')} /></div>
              <div className="form-group"><label className="form-label">WhatsApp Link</label><input className="form-input" value={form.whatsapp_number} onChange={handle('whatsapp_number')} placeholder="https://wa.me/8801XXXXXXXXX" /></div>
            </div>
            <div className="form-row">
              <div className="form-group"><label className="form-label">Phone Number (Direct Call)</label><input className="form-input" value={form.phone_number} onChange={handle('phone_number')} placeholder="+8801XXXXXXXXX" /></div>
              <div className="form-group"><label className="form-label">Instagram URL</label><input className="form-input" value={form.instagram_url} onChange={handle('instagram_url')} placeholder="https://instagram.com/yourprofile" /></div>
            </div>
            <div className="form-row">
              <div className="form-group"><label className="form-label">Facebook URL</label><input className="form-input" value={form.facebook_url} onChange={handle('facebook_url')} placeholder="https://facebook.com/yourpage" /></div>
              <div className="form-group"></div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
