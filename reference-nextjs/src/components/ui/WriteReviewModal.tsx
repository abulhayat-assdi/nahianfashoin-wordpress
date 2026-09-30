"use client";

import { useState } from "react";
import { Star, X } from "lucide-react";

interface WriteReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  productId: string;
}

export function WriteReviewModal({ isOpen, onClose, productId }: WriteReviewModalProps) {
  const [name, setName] = useState("");
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) {
      setError("Please select a rating.");
      return;
    }
    if (!name.trim() || !comment.trim()) {
      setError("Please fill out all fields.");
      return;
    }

    setSubmitting(true);
    setError("");

    const res = await fetch('/api/reviews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ product_id: productId, name: name.trim(), rating, comment: comment.trim() }),
    });
    const data = await res.json();

    setSubmitting(false);

    if (!res.ok) {
      setError(`Failed to submit review. Details: ${data.error || 'Unknown error'}`);
    } else {
      setSuccess(true);
      // Automatically close after showing success for 2 seconds
      setTimeout(() => {
        setSuccess(false);
        setName("");
        setRating(0);
        setComment("");
        onClose();
        // Option to reload page to show new review
        window.location.reload();
      }, 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-[500px] bg-white p-6 md:p-8 shadow-2xl rounded-sm">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-gray-500 hover:text-black transition-colors"
        >
          <X size={24} />
        </button>

        <h2 className="text-[24px] font-heading font-bold text-[#222] mb-6">Write a Review</h2>

        {success ? (
          <div className="text-center py-10">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-green-100 mb-4">
              <Star size={32} className="text-green-600" fill="currentColor" />
            </div>
            <h3 className="text-[20px] font-bold text-gray-900 mb-2">Thank you!</h3>
            <p className="text-gray-500">Your review has been successfully submitted.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            {error && <div className="bg-red-50 text-red-500 p-3 text-[14px] rounded-sm border border-red-100">{error}</div>}

            <div>
              <label className="block text-[14px] font-bold text-gray-700 mb-2">Overall Rating *</label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="focus:outline-none"
                  >
                    <Star
                      size={28}
                      className={`transition-colors ${(hoverRating || rating) >= star ? "text-[#b18a4a]" : "text-gray-300"}`}
                      fill={(hoverRating || rating) >= star ? "currentColor" : "none"}
                      strokeWidth={1.5}
                    />
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label htmlFor="name" className="block text-[14px] font-bold text-gray-700 mb-2">
                Your Name *
              </label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name"
                className="w-full border border-gray-300 px-4 py-3 text-[15px] focus:border-[#b18a4a] focus:outline-none transition-colors"
                required
              />
            </div>

            <div>
              <label htmlFor="comment" className="block text-[14px] font-bold text-gray-700 mb-2">
                Your Review *
              </label>
              <textarea
                id="comment"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="What did you like or dislike?"
                rows={4}
                className="w-full resize-y border border-gray-300 px-4 py-3 text-[15px] focus:border-[#b18a4a] focus:outline-none transition-colors"
                required
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className={`mt-2 w-full bg-[#222] py-4 text-[14px] font-bold uppercase tracking-widest text-white transition-colors hover:bg-black ${submitting ? "opacity-70 cursor-wait" : ""}`}
            >
              {submitting ? "Submitting..." : "Submit Review"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
