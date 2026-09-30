"use client";

import { useState, useEffect } from "react";
import { User, Loader2, MessageSquare, Send } from "lucide-react";

interface Comment {
  id: string;
  author_name: string;
  content: string;
  admin_reply?: string;
  created_at: string;
}

export default function CommentSection({ slug }: { slug: string }) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  // Form state
  const [name, setName] = useState("");
  const [content, setContent] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetchComments();
  }, [slug]);

  const fetchComments = async () => {
    try {
      const res = await fetch(`/api/comments?slug=${slug}`);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !content.trim()) {
      setError("Please provide both name and comment.");
      return;
    }

    setSubmitting(true);
    setError("");
    setSuccess(false);

    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          blog_slug: slug,
          author_name: name.trim(),
          content: content.trim(),
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.comment) {
          setComments([data.comment, ...comments]);
        } else {
          fetchComments();
        }
        setName("");
        setContent("");
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      } else {
        const errData = await res.json();
        setError(errData.error || "Failed to submit comment.");
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mt-16 pt-16 border-t border-gray-100 max-w-[800px] mx-auto">
      <div className="flex items-center gap-3 mb-10">
        <MessageSquare className="text-[#ac8545]" size={28} />
        <h3 className="text-2xl font-heading text-[#1e293b]">Comments ({comments.length})</h3>
      </div>

      {/* Comment Form */}
      <div className="bg-gray-50 p-6 md:p-8 rounded-[24px] mb-12">
        <h4 className="text-lg font-bold text-[#1e293b] mb-6">Leave a Reply</h4>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-bold text-gray-700 mb-1.5 uppercase tracking-wider text-[11px]">
              Your Name
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. John Doe"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#ac8545]/20 focus:border-[#ac8545] outline-none transition-all bg-white"
              disabled={submitting}
              required
            />
          </div>
          <div>
            <label htmlFor="content" className="block text-sm font-bold text-gray-700 mb-1.5 uppercase tracking-wider text-[11px]">
              Comment
            </label>
            <textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="What are your thoughts?"
              rows={4}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#ac8545]/20 focus:border-[#ac8545] outline-none transition-all resize-none bg-white"
              disabled={submitting}
              required
            />
          </div>
          
          {error && <p className="text-red-500 text-sm font-medium">{error}</p>}
          {success && <p className="text-green-600 text-sm font-medium">Comment submitted successfully!</p>}

          <div className="pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2 bg-[#ac8545] hover:bg-[#8e6d38] text-white px-8 py-3.5 rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
              {submitting ? "Posting..." : "Post Comment"}
            </button>
          </div>
        </form>
      </div>

      {/* Comments List */}
      <div className="space-y-8">
        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="animate-spin text-gray-400" />
          </div>
        ) : comments.length === 0 ? (
          <p className="text-gray-500 text-center py-10 italic">No comments yet. Be the first to share your thoughts!</p>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="flex gap-4 group">
              <div className="w-12 h-12 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-400 flex-shrink-0">
                <User size={20} />
              </div>
              <div className="flex-1 bg-white p-5 rounded-2xl border border-gray-100 shadow-sm group-hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-2">
                  <h5 className="font-bold text-[#1e293b]">{comment.author_name}</h5>
                  <span className="text-xs text-gray-400 whitespace-nowrap ml-4">
                    {new Date(comment.created_at).toLocaleDateString('en-US', { 
                      month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' 
                    })}
                  </span>
                </div>
                <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">{comment.content}</p>
                {comment.admin_reply && (
                  <div className="mt-4 p-4 bg-[#f8fafc] border border-gray-100 rounded-xl relative">
                    <div className="absolute top-0 left-6 -mt-[1px] w-4 h-4 bg-[#f8fafc] border-t border-l border-gray-100 transform -translate-y-1/2 rotate-45" />
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-6 h-6 rounded-full bg-[#ac8545] text-white flex items-center justify-center">
                        <span className="text-[10px] font-bold">SV</span>
                      </div>
                      <span className="text-xs font-bold text-[#ac8545] uppercase tracking-wider">Nahian Fashionm</span>
                    </div>
                    <p className="text-gray-600 text-[15px] leading-relaxed whitespace-pre-wrap ml-8">{comment.admin_reply}</p>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
