'use client';

import { useState, useRef } from 'react';
import { Upload, X, ImageIcon, Loader2 } from 'lucide-react';

interface ImageUploadProps {
  /** Currently saved image URL (passed in from parent form state) */
  value: string;
  /** Called with the new public URL when upload succeeds, or '' when deleted */
  onChange: (url: string) => void;
  /** Supabase Storage bucket name — defaults to 'images' */
  bucket?: string;
  /** Folder inside the bucket — e.g. 'hero', 'categories' */
  folder?: string;
  /** Label shown above the uploader */
  label?: string;
}

export default function ImageUpload({
  value,
  onChange,
  bucket = 'images',
  folder = 'uploads',
  label = 'Image',
}: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleFile = async (file: File) => {
    if (!file.type.startsWith('image/')) { setError('Please select an image file.'); return; }
    if (file.size > 20 * 1024 * 1024) {
      const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
      setError(`ইমেজ সাইজ অনেক বড় (${sizeMB}MB)। সর্বোচ্চ ২০MB পর্যন্ত আপলোড করা যাবে। সাইজ কমিয়ে আবার চেষ্টা করুন।`);
      return;
    }

    setLoading(true);
    setError('');

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Upload failed");
      }

      const data = await response.json();
      onChange(data.url);
    } catch (err) {
      setError(`Upload failed. Please try again.`);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!value) return;
    setLoading(true);
    setError('');

    if (value.startsWith('/uploads/')) {
      try {
        await fetch('/api/upload', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: value }),
        });
      } catch {
        // Non-critical — remove reference anyway
      }
    }

    onChange('');
    setLoading(false);
  };

  const onInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) await handleFile(file);
    // Reset so same file can be re-selected
    if (inputRef.current) inputRef.current.value = '';
  };

  const onDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) await handleFile(file);
  };

  return (
    <div className="form-group">
      {label && <label className="form-label">{label}</label>}

      {value ? (
        /* Preview */
        <div style={{ position: 'relative', display: 'inline-block' }}>
          <div style={{ width: '100%', maxWidth: 320, height: 180, borderRadius: 10, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.12)' }}>
            <img src={value} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <button
              type="button"
              className="btn-ghost"
              style={{ fontSize: 12, padding: '5px 12px' }}
              onClick={() => inputRef.current?.click()}
              disabled={loading}
            >
              {loading ? <Loader2 size={13} className="spin" /> : <Upload size={13} />}
              {loading ? 'Uploading…' : 'Replace'}
            </button>
            <button
              type="button"
              className="btn-danger"
              style={{ fontSize: 12, padding: '5px 12px' }}
              onClick={handleDelete}
              disabled={loading}
            >
              <X size={13} /> Remove
            </button>
          </div>
        </div>
      ) : (
        /* Drop zone */
        <div
          onDrop={onDrop}
          onDragOver={e => e.preventDefault()}
          onClick={() => inputRef.current?.click()}
          style={{
            border: '2px dashed rgba(255,255,255,0.15)',
            borderRadius: 10,
            padding: '32px 20px',
            textAlign: 'center',
            cursor: 'pointer',
            transition: 'border-color 0.15s',
            background: 'rgba(255,255,255,0.03)',
          }}
          onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(74,158,255,0.5)')}
          onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)')}
        >
          {loading ? (
            <Loader2 size={28} style={{ opacity: 0.5, margin: '0 auto 8px', display: 'block' }} className="spin" />
          ) : (
            <ImageIcon size={28} style={{ opacity: 0.3, margin: '0 auto 8px', display: 'block' }} />
          )}
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginBottom: 4 }}>
            {loading ? 'Uploading image…' : 'Click or drag & drop an image here'}
          </p>
          <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)' }}>PNG, JPG, WEBP — max 20 MB</p>
        </div>
      )}

      {error && <p style={{ fontSize: 12, color: '#ff6b6b', marginTop: 6 }}>{error}</p>}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={onInputChange}
      />

      <style>{`.spin { animation: spin 1s linear infinite; } @keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
