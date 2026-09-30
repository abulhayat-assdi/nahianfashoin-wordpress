"use client";

import { useState, useEffect } from "react";
import { Trash2, Edit2, Loader2, Check, X, Eye, AlertCircle, Plus, Image as ImageIcon, Copy, Search, ExternalLink, FilePlus, Upload, Code, Type } from "lucide-react";
import Link from "next/link";
import { useConfirm } from "@/contexts/ConfirmContext";
import RichTextEditor from "@/components/admin/RichTextEditor";

interface PageData {
  id?: string;
  slug: string;
  title: string;
  section: string;
  content: string;
  is_published: boolean;
  header_image?: string;
}

interface PagesManagerProps {
  section: "blog" | "support";
  title: string;
}

export default function PagesManager({ section, title }: PagesManagerProps) {
  const confirm = useConfirm();
  const [pages, setPages] = useState<PageData[]>([]);
  const [footerLinks, setFooterLinks] = useState<{label: string, slug: string}[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingPage, setEditingPage] = useState<PageData | null>(null);
  const [saving, setSaving] = useState(false);
  
  const [editorMode, setEditorMode] = useState<'rich' | 'html'>('rich');

  // Image states
  const [uploading, setUploading] = useState(false);
  const [blogImages, setBlogImages] = useState<{name: string, url: string}[]>([]);
  const [newImageName, setNewImageName] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [showGallery, setShowGallery] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const toSlug = (text: string) => {
    return text
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/[^\p{L}\p{N}\-]+/gu, '') // Keep letters (any language), numbers, and hyphens
      .replace(/-+/g, '-') // Remove consecutive hyphens
      .replace(/(^-|-$)/g, ''); // Remove leading/trailing hyphens
  };

  useEffect(() => {
    fetchData();
    fetchImages();
  }, [section]);

  const fetchImages = async () => {
    try {
      const res = await fetch('/api/blog/upload');
      const { files } = await res.json();
      setBlogImages(files || []);
    } catch (err) {
      console.error("Error fetching images:", err);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !newImageName) {
      alert("Please select a file and enter a name");
      return;
    }
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('name', newImageName);

      const res = await fetch('/api/blog/upload', {
        method: 'POST',
        body: formData
      });
      if (res.ok) {
        setNewImageName("");
        setSelectedFile(null);
        fetchImages();
        alert("Image uploaded successfully!");
      }
    } catch (err) {
      console.error("Upload error:", err);
    } finally {
      setUploading(false);
    }
  };

  const handleImageDelete = async (name: string) => {
    const ok = await confirm({
      title: "ছবি ডিলিট করুন",
      message: `"${name}" ছবিটি স্থায়ীভাবে ডিলিট হয়ে যাবে। আপনি কি নিশ্চিত?`,
      confirmText: "হ্যাঁ, ডিলিট করুন",
      cancelText: "না",
    });
    if (!ok) return;
    try {
      const res = await fetch('/api/blog/upload', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name })
      });
      if (res.ok) fetchImages();
    } catch (err) {
      console.error("Delete error:", err);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Fetch existing pages from DB
      const pagesRes = await fetch(`/api/pages?section=${section}`);
      const pagesData = await pagesRes.json();
      const existingPages: PageData[] = pagesData.data || [];
      setPages(existingPages);

      // 2. Fetch footer config to see what *should* be there
      const footerRes = await fetch('/api/footer');
      const footerData = await footerRes.json();
      const columns = footerData.data?.columns || [];
      
      const column = columns.find((c: any) => {
        const h = c.heading?.toLowerCase();
        if (section === 'blog') return h === 'blog' || h === 'learn';
        return h === section.toLowerCase();
      });
      
      let links: { label: string, slug: string }[] = (column?.links || [])
        .filter((l: any) => l.label && toSlug(l.label) !== 'blog')
        .map((l: any) => ({ label: l.label, slug: toSlug(l.label) }));
      
      if (section === 'support') {
        if (!links.find((l) => l.slug === 'privacy-policy')) links.push({ label: 'Privacy Policy', slug: 'privacy-policy' });
        if (!links.find((l) => l.slug === 'terms-and-conditions')) links.push({ label: 'Terms & Conditions', slug: 'terms-and-conditions' });
      }

      // if (section === 'blog' && !links.find(l => l.slug === 'blog')) {
      //   links.unshift({ label: 'Blog Home', slug: 'blog' });
      // }
      
      setFooterLinks(links);
    } catch (err) {
      console.error("Error fetching data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!editingPage?.title || !editingPage?.slug) {
      alert("Title and Slug are required");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/pages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingPage),
      });
      if (res.ok) {
        setEditingPage(null);
        fetchData();
      } else {
        const d = await res.json();
        alert("Error saving: " + d.error);
      }
    } catch (err) {
      console.error("Error saving page:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleDeletePage = async (slug: string) => {
    const ok = await confirm({
      title: "পেজ ডিলিট করুন",
      message: "এই পেজটি স্থায়ীভাবে ডিলিট হয়ে যাবে। আপনি কি নিশ্চিত?",
      confirmText: "হ্যাঁ, ডিলিট করুন",
      cancelText: "না",
    });
    if (!ok) return;
    try {
      const res = await fetch("/api/pages", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug }),
      });
      if (res.ok) fetchData();
    } catch (err) {
      console.error("Error deleting page:", err);
    }
  };

  const createNewArticle = () => {
    setEditingPage({
      title: "",
      slug: "",
      section,
      content: "",
      is_published: false,
      header_image: ""
    });
  };

  const copyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    alert("URL Copied!");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400">
        <Loader2 className="animate-spin mr-2" /> Loading management data...
      </div>
    );
  }

  // Merged List: Priority to DB pages, but also show footer placeholders if they don't exist in DB
  const mergedPages = [...pages];
  footerLinks.forEach(link => {
    if (!mergedPages.find(p => p.slug === link.slug)) {
      mergedPages.push({
        slug: link.slug,
        title: link.label,
        section,
        content: "",
        is_published: false
      });
    }
  });

  const filteredImages = blogImages.filter(img => 
    img.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-white/10 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">{title}</h1>
          <p className="text-sm text-gray-400 mt-1">Manage articles for your website.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setShowGallery(!showGallery)} 
            className="btn-ghost flex items-center gap-2 border border-white/10 px-4 py-2 rounded-xl text-white hover:bg-white/5 transition-all text-sm"
          >
            <ImageIcon size={18} /> {showGallery ? 'Hide Gallery' : 'Images'}
          </button>
          {section === 'blog' && !editingPage && (
            <button 
              onClick={createNewArticle}
              className="btn-primary-admin flex items-center gap-2 px-6 py-2 rounded-xl text-sm"
            >
              <FilePlus size={18} /> Create New Blog
            </button>
          )}
        </div>
      </div>

      {/* Shared Image Manager Section */}
      {showGallery && !editingPage && (
        <div className="section-card space-y-4 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <ImageIcon size={18} className="text-brand-gold" /> Image Manager
            </h2>
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input 
                type="text" 
                placeholder="Search images..." 
                className="form-input !py-2 !pl-10 !w-64 text-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          
          <div className="grid md:grid-cols-3 gap-4 bg-[#0f111a] p-4 rounded-xl border border-white/5">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] uppercase font-bold text-gray-500">File</label>
              <label className="flex items-center gap-2 px-3 py-1.5 bg-[#1a1d2d] border border-white/10 rounded-lg cursor-pointer hover:bg-white/5 hover:border-brand-gold/30 transition-all text-xs font-medium text-gray-300">
                <Upload size={14} className="text-brand-gold flex-shrink-0" />
                <span className="truncate max-w-[120px]">{selectedFile ? selectedFile.name : 'Browse...'}</span>
                <input type="file" className="hidden" onChange={(e) => setSelectedFile(e.target.files?.[0] || null)} />
              </label>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] uppercase font-bold text-gray-500">Name</label>
              <input type="text" placeholder="image-name" className="form-input !py-1" value={newImageName} onChange={(e) => setNewImageName(e.target.value)} />
            </div>
            <div className="flex items-end">
              <button onClick={handleUpload} disabled={uploading} className="btn-primary-admin w-full flex items-center justify-center gap-2 h-[38px]">
                {uploading ? <Loader2 className="animate-spin" size={16} /> : <Plus size={16} />} Upload
              </button>
            </div>
          </div>
          
          <div className="mt-4 grid grid-cols-2 md:grid-cols-6 gap-4 max-h-[300px] overflow-y-auto p-4 bg-[#0f111a] rounded-xl border border-white/5 no-scrollbar">
            {filteredImages.map(img => (
              <div key={img.name} className="relative group aspect-square bg-[#1a1d2d] rounded-lg overflow-hidden border border-white/5 hover:border-brand-gold/50 transition-all">
                <img src={img.url} className="h-full w-full object-cover opacity-70 group-hover:opacity-100 transition-opacity" alt={img.name} />
                <div className="absolute inset-0 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/80 p-2 text-center">
                  <p className="text-[8px] text-white font-mono break-all mb-2 line-clamp-1">{img.name}</p>
                  <div className="flex items-center gap-1.5">
                    <button onClick={() => copyUrl(img.url)} className="bg-brand-gold p-1.5 rounded text-white hover:scale-110 transition-transform" title="Copy URL"><Copy size={12} /></button>
                    <a href={img.url} target="_blank" className="bg-white/10 p-1.5 rounded text-white hover:bg-white/20 hover:scale-110 transition-transform"><ExternalLink size={12} /></a>
                    <button onClick={() => handleImageDelete(img.name)} className="bg-red-500/20 p-1.5 rounded text-red-500 hover:bg-red-500 hover:text-white hover:scale-110 transition-transform"><Trash2 size={12} /></button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {editingPage ? (
        <div className="section-card space-y-6 animate-in zoom-in-95 duration-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white flex items-center gap-3">
              <div className="w-1 h-6 bg-brand-gold rounded-full" />
              {editingPage.id ? 'Edit' : 'New'} Article: {editingPage.title}
            </h2>
            <div className="flex gap-3">
              <button onClick={() => setEditingPage(null)} className="btn-ghost flex items-center gap-2 px-4 py-2 text-gray-400 hover:text-white transition-colors">
                <X size={18} /> Cancel
              </button>
              <button onClick={handleSave} disabled={saving} className="btn-primary-admin flex items-center gap-2 px-6 py-2">
                {saving ? <Loader2 className="animate-spin" size={18} /> : <Check size={18} />}
                {saving ? 'Saving...' : (editingPage.is_published ? 'Save & Publish' : 'Save Draft')}
              </button>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-4 bg-[#0f111a] p-4 rounded-xl border border-white/5">
            <div className="form-group mb-0">
              <label className="text-[10px] uppercase font-bold text-gray-500 mb-1 block">Title (Blog Name)</label>
              <input 
                type="text" 
                className="form-input" 
                value={editingPage.title} 
                placeholder="e.g. Benefits of Green Tea"
                onChange={(e) => setEditingPage({ ...editingPage, title: e.target.value, slug: toSlug(e.target.value) })} 
              />
            </div>
            <div className="form-group mb-0">
              <label className="text-[10px] uppercase font-bold text-gray-500 mb-1 block">Slug (URL)</label>
              <input 
                type="text" 
                className="form-input text-brand-gold/70 font-mono bg-[#0f111a] cursor-not-allowed border-white/5" 
                value={editingPage.slug} 
                readOnly
                title="Slug is automatically generated from the title"
              />
            </div>
            <div className="form-group mb-0">
              <label className="text-[10px] uppercase font-bold text-gray-500 mb-1 block">Header Image URL</label>
              <input 
                type="text" 
                className="form-input text-[#ac8545] font-mono" 
                placeholder="Paste image link here"
                value={editingPage.header_image || ""} 
                onChange={(e) => setEditingPage({ ...editingPage, header_image: e.target.value })} 
              />
            </div>
          </div>

          <div className="form-group">
            <div className="flex items-center justify-between mb-3">
              <label className="form-label mb-0 text-white font-bold">Content</label>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowGallery(true)}
                  className="text-[10px] text-brand-gold hover:underline flex items-center gap-1 mr-2"
                >
                  <ImageIcon size={12} /> Image Gallery
                </button>
                {/* Mode Toggle */}
                <div style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: 3, gap: 3 }}>
                  <button
                    type="button"
                    onClick={() => setEditorMode('rich')}
                    title="Rich Text Editor"
                    style={{
                      display: 'flex', alignItems: 'center', gap: 5, padding: '5px 12px', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer', border: 'none', transition: 'all 0.15s',
                      background: editorMode === 'rich' ? 'rgba(74,158,255,0.2)' : 'transparent',
                      color: editorMode === 'rich' ? '#4a9eff' : 'rgba(255,255,255,0.45)',
                    }}
                  >
                    <Type size={13} /> Rich Text
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditorMode('html')}
                    title="HTML Editor"
                    style={{
                      display: 'flex', alignItems: 'center', gap: 5, padding: '5px 12px', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer', border: 'none', transition: 'all 0.15s',
                      background: editorMode === 'html' ? 'rgba(74,158,255,0.2)' : 'transparent',
                      color: editorMode === 'html' ? '#4a9eff' : 'rgba(255,255,255,0.45)',
                    }}
                  >
                    <Code size={13} /> HTML
                  </button>
                </div>
              </div>
            </div>

            {editorMode === 'rich' ? (
              <RichTextEditor
                value={editingPage.content}
                onChange={(html) => setEditingPage({ ...editingPage, content: html })}
                placeholder="লিখতে শুরু করুন..."
                minHeight={500}
              />
            ) : (
              <textarea
                className="form-input font-mono text-[13px]"
                style={{ minHeight: '550px' }}
                value={editingPage.content}
                onChange={(e) => setEditingPage({ ...editingPage, content: e.target.value })}
                placeholder="<div class='blog-post'>...</div>"
              />
            )}
          </div>

          <div className="flex items-center gap-4 bg-[#0f111a] p-4 rounded-xl border border-white/5">
             <input type="checkbox" id="is_published" checked={editingPage.is_published} onChange={(e) => setEditingPage({ ...editingPage, is_published: e.target.checked })} className="w-5 h-5 accent-brand-gold" />
             <label htmlFor="is_published" className="text-white font-bold uppercase tracking-widest text-xs cursor-pointer">Published / Live</label>
          </div>
        </div>
      ) : (
        /* List Mode */
        <div className="grid gap-4">
          {mergedPages.length === 0 ? (
            <div className="bg-[#151828] p-16 text-center border border-white/10 rounded-2xl flex flex-col items-center gap-4">
              <AlertCircle size={48} className="text-gray-600" />
              <p className="text-gray-400">No articles found.</p>
            </div>
          ) : (
            mergedPages.map((page) => (
              <div key={page.slug} className="section-card flex items-center justify-between hover:border-white/20 transition-all group">
                <div className="flex items-center gap-4">
                  <div className={`w-2 h-10 rounded-full ${page.id ? (page.is_published ? 'bg-green-500' : 'bg-amber-500') : 'bg-gray-700'}`} />
                  <div>
                    <h3 className="text-lg font-bold text-white">{page.title || "Untitled Blog"}</h3>
                    <p className="text-xs font-mono text-gray-500 mt-1">{section === 'blog' ? `/blog/${page.slug}` : `/pages/${page.slug}`}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {page.id && (
                    <>
                      <Link href={section === 'blog' ? `/blog/${page.slug}` : `/pages/${page.slug}`} target="_blank" className="p-2 text-gray-500 hover:text-white" title="View">
                        <Eye size={18} />
                      </Link>
                      <button onClick={() => handleDeletePage(page.slug)} className="p-2 text-gray-500 hover:text-red-500" title="Delete">
                        <Trash2 size={18} />
                      </button>
                    </>
                  )}
                  <button onClick={() => setEditingPage(page)} className="bg-white/5 hover:bg-brand-gold text-white px-5 py-2 rounded-xl text-xs font-bold transition-all border border-white/10">
                    {page.id ? 'Edit Article' : 'Create Article'}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
