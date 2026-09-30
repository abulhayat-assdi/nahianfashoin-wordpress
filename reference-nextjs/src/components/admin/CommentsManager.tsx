"use client";

import { useState, useEffect } from "react";
import { Loader2, Edit3, Trash2, Search, CheckCircle, X, ExternalLink } from "lucide-react";
import { useConfirm } from "@/contexts/ConfirmContext";

interface Comment {
  id: string;
  blog_slug: string;
  author_name: string;
  content: string;
  admin_reply?: string;
  created_at: string;
}

export default function CommentsManager() {
  const confirm = useConfirm();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingComment, setEditingComment] = useState<Comment | null>(null);
  const [editContent, setEditContent] = useState("");
  const [adminReply, setAdminReply] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchComments();
  }, []);

  const fetchComments = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/comments");
      if (res.ok) {
        const data = await res.json();
        setComments(data.comments || []);
      }
    } catch (err) {
      console.error("Failed to fetch comments", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    const ok = await confirm({
      title: "কমেন্ট ডিলিট করুন",
      message: "এই কমেন্টটি স্থায়ীভাবে ডিলিট হয়ে যাবে। আপনি কি নিশ্চিত?",
      confirmText: "হ্যাঁ, ডিলিট করুন",
      cancelText: "না",
    });
    if (!ok) return;
    
    try {
      const res = await fetch(`/api/admin/comments?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        setComments((prev) => prev.filter((c) => c.id !== id));
      } else {
        alert("Failed to delete comment");
      }
    } catch (err) {
      alert("Error deleting comment");
    }
  };

  const openEditModal = (comment: Comment) => {
    setEditingComment(comment);
    setEditContent(comment.content);
    setAdminReply(comment.admin_reply || "");
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingComment) return;

    setSaving(true);
    try {
      const res = await fetch("/api/admin/comments", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingComment.id,
          content: editContent,
          admin_reply: adminReply,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setComments((prev) => prev.map((c) => c.id === editingComment.id ? data.comment : c));
        setIsModalOpen(false);
      } else {
        alert("Failed to save comment");
      }
    } catch (err) {
      alert("Error saving comment");
    } finally {
      setSaving(false);
    }
  };

  const filteredComments = comments.filter((c) => 
    c.author_name.toLowerCase().includes(search.toLowerCase()) || 
    c.content.toLowerCase().includes(search.toLowerCase()) ||
    c.blog_slug.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-8">
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-heading text-white">Comments Manager</h1>
          <p className="text-gray-400 mt-1">Manage, moderate, and reply to blog comments.</p>
        </div>
      </div>

      {/* Search */}
      <div className="mb-6 flex gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search by name, content, or blog slug..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-gold transition-all"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-300">
            <thead className="bg-white/5 text-xs uppercase text-gray-400 font-semibold tracking-wider">
              <tr>
                <th className="px-6 py-4">Author & Date</th>
                <th className="px-6 py-4">Blog Article</th>
                <th className="px-6 py-4">Comment & Reply</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                    <Loader2 className="animate-spin mx-auto mb-2" size={24} />
                    Loading comments...
                  </td>
                </tr>
              ) : filteredComments.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                    No comments found.
                  </td>
                </tr>
              ) : (
                filteredComments.map((comment) => (
                  <tr key={comment.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <p className="font-bold text-white text-[15px]">{comment.author_name}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(comment.created_at).toLocaleDateString()}
                      </p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <a 
                        href={`/pages/${comment.blog_slug}`} 
                        target="_blank" 
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 text-brand-gold hover:underline font-medium"
                      >
                        {comment.blog_slug} <ExternalLink size={12} />
                      </a>
                    </td>
                    <td className="px-6 py-4 max-w-[300px]">
                      <p className="text-gray-300 line-clamp-2" title={comment.content}>{comment.content}</p>
                      {comment.admin_reply && (
                        <div className="mt-2 pl-3 border-l-2 border-brand-gold">
                          <span className="text-[10px] font-bold uppercase text-brand-gold mb-0.5 block">Your Reply</span>
                          <p className="text-gray-400 text-xs line-clamp-1" title={comment.admin_reply}>{comment.admin_reply}</p>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right whitespace-nowrap">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => openEditModal(comment)}
                          className="p-2 rounded-lg bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                          title="Edit / Reply"
                        >
                          <Edit3 size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(comment.id)}
                          className="p-2 rounded-lg bg-white/5 text-gray-400 hover:text-red-500 hover:bg-red-500/10 transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit/Reply Modal */}
      {isModalOpen && editingComment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[#1e1e1e] border border-white/10 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b border-white/10">
              <h2 className="text-xl font-bold text-white">Moderate Comment</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:text-white transition-colors">
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleSave} className="p-6 space-y-6">
              <div>
                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">
                  Visitor Comment (Editable)
                </label>
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="w-full px-4 py-3 bg-black/30 border border-white/10 rounded-xl text-white outline-none focus:border-brand-gold transition-colors resize-y min-h-[100px]"
                  required
                />
                <p className="text-xs text-gray-500 mt-1.5">You can edit this to remove inappropriate content.</p>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-brand-gold uppercase tracking-wider mb-2">
                  Admin Reply (Public)
                </label>
                <textarea
                  value={adminReply}
                  onChange={(e) => setAdminReply(e.target.value)}
                  placeholder="Type your official response here..."
                  className="w-full px-4 py-3 bg-brand-gold/5 border border-brand-gold/20 rounded-xl text-white outline-none focus:border-brand-gold transition-colors resize-y min-h-[100px]"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-6 py-2.5 rounded-xl font-bold text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-2 bg-brand-gold hover:bg-[#8e6d38] text-white px-8 py-2.5 rounded-xl font-bold transition-all disabled:opacity-50"
                >
                  {saving ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />}
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
