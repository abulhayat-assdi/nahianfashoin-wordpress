'use client';

import { useState, useEffect } from 'react';
import { Plus, Trash2, GripVertical, Loader2 } from 'lucide-react';

type FooterLink = { label: string; href?: string };
type FooterColumn = { id: string; heading: string; links: FooterLink[] };

const INIT_COLS: FooterColumn[] = [
  { id: '1', heading: 'Learn', links: [] },
  { id: '2', heading: 'Shop', links: [] },
  { id: '3', heading: 'Support', links: [] },
  { id: '4', heading: 'My Account', links: [] },
];

function toSlug(label: string) {
  return label.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

export default function FooterPage() {
  const [cols, setCols] = useState<FooterColumn[]>(INIT_COLS);
  const [privacy, setPrivacy] = useState('Privacy Policy');
  const [terms, setTerms] = useState('Terms & Conditions');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Load from DB on mount
  useEffect(() => {
    fetch('/api/footer')
      .then(r => r.json())
      .then(({ data }) => {
        if (data) {
          if (data.columns) setCols(data.columns);
          if (data.privacy) setPrivacy(data.privacy);
          if (data.terms) setTerms(data.terms);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const updateHeading = (id: string, val: string) =>
    setCols(cols.map(c => c.id === id ? { ...c, heading: val } : c));

  const updateLink = (id: string, i: number, val: string) =>
    setCols(cols.map(c => c.id === id
      ? { ...c, links: c.links.map((l, j) => j === i ? { ...l, label: val } : l) }
      : c));

  const addLink = (id: string) =>
    setCols(cols.map(c => c.id === id ? { ...c, links: [...c.links, { label: '' }] } : c));

  const removeLink = (id: string, i: number) =>
    setCols(cols.map(c => c.id === id ? { ...c, links: c.links.filter((_, j) => j !== i) } : c));

  const handleSave = async () => {
    setSaving(true);
    const res = await fetch('/api/footer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ columns: cols, privacy, terms }),
    });
    setSaving(false);
    if (res.ok) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } else {
      const d = await res.json();
      alert('Error saving: ' + d.error);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200, gap: 10, color: 'rgba(255,255,255,0.5)' }}>
        <Loader2 size={20} className="spin" /> Loading footer config...
        <style>{`.spin { animation: spin 1s linear infinite; } @keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <>
      <div className="page-heading">
        <div>
          <h1 className="page-title">Footer</h1>
          <p className="page-subtitle">Manage footer navigation columns, labels, and bottom bar text.</p>
        </div>
        <button
          className="btn-primary-admin"
          onClick={handleSave}
          disabled={saving}
          style={{ background: saved ? '#3ecf8e' : undefined, display: 'flex', alignItems: 'center', gap: 6 }}
        >
          {saving ? <Loader2 size={14} className="spin" /> : null}
          {saving ? 'Saving...' : saved ? '✓ Saved!' : 'Save Changes'}
        </button>
      </div>

      {/* Columns */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 16, marginBottom: 20 }}>
        {cols.map(col => (
          <div key={col.id} className="section-card">
            <p className="section-card-title">Column</p>
            <div className="form-group">
              <label className="form-label">Heading</label>
              <input className="form-input" value={col.heading} onChange={e => updateHeading(col.id, e.target.value)} />
            </div>
            <div>
              <label className="form-label">Links</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {col.links.map((link, i) => (
                  <div key={i} style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    <GripVertical size={14} color="rgba(255,255,255,0.2)" />
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <input
                        className="form-input"
                        value={link.label}
                        onChange={e => updateLink(col.id, i, e.target.value)}
                        style={{ padding: '7px 10px' }}
                        placeholder="Link label"
                      />
                      {link.label && (
                        <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', paddingLeft: 4 }}>
                          → /pages/{toSlug(link.label)}
                        </span>
                      )}
                    </div>
                    <button className="btn-danger" style={{ padding: '6px 8px' }} onClick={() => removeLink(col.id, i)}>
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
              </div>
              <button className="btn-ghost" onClick={() => addLink(col.id)} style={{ marginTop: 8, fontSize: 12, padding: '5px 12px' }}>
                <Plus size={13} /> Add Link
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Bottom bar */}
      <div className="section-card">
        <p className="section-card-title">Bottom Bar & Social Strip</p>
        <div className="form-row">
          <div className="form-group"><label className="form-label">Privacy Policy Label</label><input className="form-input" value={privacy} onChange={e => setPrivacy(e.target.value)} /></div>
          <div className="form-group"><label className="form-label">Terms & Conditions Label</label><input className="form-input" value={terms} onChange={e => setTerms(e.target.value)} /></div>
        </div>
      </div>

      <style>{`.spin { animation: spin 1s linear infinite; } @keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </>
  );
}
