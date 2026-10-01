'use client';

import { useState, useRef } from 'react';
import { X, FileVideo, ImageIcon, Loader2, Check } from 'lucide-react';

interface MultiMediaUploadProps {
  /** Currently saved media URLs */
  values: string[];
  /** Called with the new array of public URLs when upload succeeds or item deleted */
  onChange: (urls: string[]) => void;
  /** Supabase Storage bucket name — defaults to 'images' */
  bucket?: string;
  /** Folder inside the bucket — e.g. 'products' */
  folder?: string;
  /** Label shown above the uploader */
  label?: string;
}

export default function MultiMediaUpload({
  values = [],
  onChange,
  bucket = 'images',
  folder = 'uploads',
  label = 'Media (Images & Videos)',
}: MultiMediaUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleFiles = async (files: FileList | File[]) => {
    setLoading(true);
    setError('');

    const newUrls: string[] = [];

    for (const file of Array.from(files)) {
      const ext = file.name.split('.').pop()?.toLowerCase() || '';
      const validImages = ['jpg', 'jpeg', 'png', 'webp'];
      const validVideos = ['mp4', 'webm'];

      if (!validImages.includes(ext) && !validVideos.includes(ext)) {
        setError(`Invalid format (${ext}). Allowed: JPG, PNG, WEBP, MP4, WEBM.`);
        continue;
      }

      const isVideoFile = validVideos.includes(ext);
      const maxSize = isVideoFile ? 200 * 1024 * 1024 : 20 * 1024 * 1024;

      if (file.size > maxSize) {
        const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
        if (isVideoFile) {
          setError(`"${file.name}" ভিডিও সাইজ অনেক বড় (${sizeMB}MB)। সর্বোচ্চ ২০০MB পর্যন্ত আপলোড করা যাবে। সাইজ কমিয়ে আবার চেষ্টা করুন।`);
        } else {
          setError(`"${file.name}" ইমেজ সাইজ অনেক বড় (${sizeMB}MB)। সর্বোচ্চ ২০MB পর্যন্ত আপলোড করা যাবে। সাইজ কমিয়ে আবার চেষ্টা করুন।`);
        }
        continue;
      }

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
        newUrls.push(data.url);
      } catch (err) {
        setError(`Upload failed for ${file.name}`);
      }
    }

    if (newUrls.length > 0) {
      onChange([...values, ...newUrls]);
    }

    setLoading(false);
  };

  const handleDelete = async (urlToRemove: string) => {
    setLoading(true);
    setError('');

    if (urlToRemove.startsWith('/uploads/')) {
      try {
        await fetch('/api/upload', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: urlToRemove }),
        });
      } catch {
        // Non-critical — remove reference anyway
      }
    }

    onChange(values.filter(url => url !== urlToRemove));
    setLoading(false);
  };

  const handleSetDefault = (url: string) => {
    const others = values.filter(v => v !== url);
    onChange([url, ...others]);
  };

  const onInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) {
      await handleFiles(e.target.files);
    }
    if (inputRef.current) inputRef.current.value = '';
  };

  const onDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files?.length) {
      await handleFiles(e.dataTransfer.files);
    }
  };

  const isVideo = (url: string) => url.match(/\.(mp4|webm|ogg|mov)$/i);

  return (
    <div className="form-group">
      {label && <label className="form-label">{label}</label>}

      {/* Existing Media Grid */}
      {values.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 12, marginBottom: 16 }}>
          {values.map((url, i) => (
            <div key={url} style={{ position: 'relative', borderRadius: 8, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.12)', aspectRatio: '1/1', background: 'rgba(0,0,0,0.2)' }}>
              {isVideo(url) ? (
                <video src={url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} muted playsInline />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={url} alt={`Media ${i}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              )}
              <button
                type="button"
                onClick={() => handleSetDefault(url)}
                title={i === 0 ? "Default Image" : "Set as Default"}
                style={{
                  position: 'absolute',
                  top: 6,
                  left: 6,
                  background: i === 0 ? '#22c55e' : 'rgba(0, 0, 0, 0.4)',
                  color: 'white',
                  border: i === 0 ? 'none' : '2px solid rgba(255,255,255,0.6)',
                  borderRadius: '50%',
                  width: 28,
                  height: 28,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  zIndex: 10,
                  transition: 'all 0.2s'
                }}
              >
                {i === 0 ? <Check size={16} strokeWidth={3} /> : null}
              </button>
              {i === 0 && (
                <div style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  background: 'rgba(34, 197, 94, 0.9)',
                  color: 'white',
                  fontSize: '9px',
                  fontWeight: 'bold',
                  textAlign: 'center',
                  padding: '2px 0',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  Main Image
                </div>
              )}
              <button
                type="button"
                onClick={() => handleDelete(url)}
                disabled={loading}
                style={{ position: 'absolute', top: 4, right: 4, background: 'rgba(220, 38, 38, 0.9)', color: 'white', border: 'none', borderRadius: '50%', width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 10 }}
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Drop zone for adding new media */}
      <div
        onDrop={onDrop}
        onDragOver={e => e.preventDefault()}
        onClick={() => inputRef.current?.click()}
        style={{
          border: '2px dashed rgba(255,255,255,0.15)',
          borderRadius: 10,
          padding: '24px 20px',
          textAlign: 'center',
          cursor: 'pointer',
          transition: 'border-color 0.15s',
          background: 'rgba(255,255,255,0.03)',
        }}
        onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(74,158,255,0.5)')}
        onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)')}
      >
        {loading ? (
          <Loader2 size={24} style={{ opacity: 0.5, margin: '0 auto 8px', display: 'block' }} className="spin" />
        ) : (
          <div style={{ display: 'flex', justifyContent: 'center', gap: 8, opacity: 0.3, margin: '0 auto 8px' }}>
            <ImageIcon size={24} />
            <FileVideo size={24} />
          </div>
        )}
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginBottom: 4 }}>
          {loading ? 'Uploading media…' : 'Click or drag & drop files here'}
        </p>
        <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)' }}>Images max 20MB (JPG, PNG, WEBP) · Videos max 200MB (MP4, WEBM)</p>
      </div>

      {error && <p style={{ fontSize: 12, color: '#ff6b6b', marginTop: 6 }}>{error}</p>}

      <input
        ref={inputRef}
        type="file"
        accept=".jpg,.jpeg,.png,.webp,.mp4,.webm"
        multiple
        style={{ display: 'none' }}
        onChange={onInputChange}
      />

      <style>{`.spin { animation: spin 1s linear infinite; } @keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
