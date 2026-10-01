"use client";

import { useState } from "react";
import { Star } from "lucide-react";

interface Review {
  id: string;
  name: string;
  rating: number;
  comment: string;
  created_at: string;
}

interface ProductReviewSummaryProps {
  reviews: Review[];
  productId: string;
}

export function ProductReviewSummary({ reviews, productId }: ProductReviewSummaryProps) {
  const [name, setName] = useState("");
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const reviewCount = reviews.length;
  const averageRating =
    reviewCount > 0
      ? reviews.reduce((acc, r) => acc + r.rating, 0) / reviewCount
      : 0;

  const recommendedCount = reviews.filter((r) => r.rating >= 4).length;
  const recommendedPct =
    reviewCount > 0 ? (recommendedCount / reviewCount) * 100 : 0;

  const distribution = [5, 4, 3, 2, 1].map((star) => {
    const count = reviews.filter((r) => r.rating === star).length;
    return { star, count, pct: reviewCount > 0 ? (count / reviewCount) * 100 : 0 };
  });

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (rating === 0) { setError("Please select a rating."); return; }
    if (!name.trim() || !comment.trim()) { setError("Please fill in all fields."); return; }
    setSubmitting(true);
    setError("");
    const res = await fetch("/api/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        product_id: productId,
        name: name.trim(),
        rating,
        comment: comment.trim(),
      }),
    });
    const data = await res.json();
    setSubmitting(false);
    if (!res.ok) {
      setError(data.error || "Failed to submit. Please try again.");
    } else {
      setSuccess(true);
      setTimeout(() => window.location.reload(), 2200);
    }
  };

  return (
    <section className="bg-[#f9f9f9] py-10 md:py-16">
      <div className="mx-auto max-w-[1280px] px-4 md:px-10">
        <h2 className="text-[18px] md:text-[26px] font-bold text-[#1a1a1a] mb-6 pb-4 border-b border-[#e5e5e5]">
          Customer Reviews
        </h2>

        <div className="grid gap-6 md:grid-cols-[260px_1fr] md:gap-10">

          {/* Left: rating summary + distribution */}
          <div className="space-y-3">
            <div className="bg-white border border-[#e5e5e5] p-5 text-center">
              <p className="text-[52px] font-bold text-[#1a1a1a] leading-none mb-1">
                {averageRating.toFixed(1)}
              </p>
              <p className="text-[12px] uppercase tracking-wide text-[#999] mb-2">Average Rating</p>
              <div className="flex justify-center gap-0.5 mb-2">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    size={17}
                    fill={i < Math.round(averageRating) ? "#f59e0b" : "none"}
                    className={i < Math.round(averageRating) ? "text-amber-400" : "text-gray-300"}
                    strokeWidth={1.5}
                  />
                ))}
              </div>
              <p className="text-[13px] text-[#555]">
                {reviewCount} review{reviewCount !== 1 ? "s" : ""}
              </p>
              <p className="text-[13px] text-[#555]">
                {recommendedPct.toFixed(2)}% Recommended
              </p>
            </div>

            <div className="bg-white border border-[#e5e5e5] p-4 space-y-2.5">
              {distribution.map(({ star, count, pct }) => (
                <div key={star} className="flex items-center gap-2">
                  <span className="text-[12px] text-[#666] w-12 shrink-0 text-right">
                    {star} stars
                  </span>
                  <div className="flex-1 h-[6px] bg-[#f0f0f0] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-amber-400 rounded-full transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="text-[12px] text-[#aaa] w-5 text-right shrink-0">
                    {count}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Right: review list + submit form */}
          <div className="space-y-4">

            {/* Individual reviews */}
            <div className="space-y-3">
              {reviews.length === 0 ? (
                <div className="bg-white border border-[#e5e5e5] p-8 text-center">
                  <p className="text-[14px] text-[#aaa]">
                    No reviews yet. Be the first to share your experience!
                  </p>
                </div>
              ) : (
                reviews.map((review) => (
                  <div key={review.id} className="bg-white border border-[#e5e5e5] p-4">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2.5">
                        <div className="h-8 w-8 bg-[#1a3c2e] text-white flex items-center justify-center font-bold text-[13px] rounded-sm shrink-0">
                          {review.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-[13px] font-semibold text-[#1a1a1a]">
                            {review.name}
                          </p>
                          <div className="flex gap-0.5 mt-0.5">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                size={10}
                                fill={i < review.rating ? "#f59e0b" : "none"}
                                className={
                                  i < review.rating ? "text-amber-400" : "text-gray-200"
                                }
                                strokeWidth={1.5}
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                      <span className="text-[11px] text-[#bbb] shrink-0 mt-0.5">
                        {new Date(review.created_at).toLocaleDateString("en-GB", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                    <p className="text-[13px] text-[#555] leading-relaxed">
                      {review.comment}
                    </p>
                  </div>
                ))
              )}
            </div>

            {/* Submit review form */}
            <div className="bg-white border border-[#e5e5e5] p-5">
              <h3 className="text-[15px] font-bold text-[#1a1a1a] mb-4 pb-3 border-b border-[#f0f0f0]">
                Submit Your Review
              </h3>

              {success ? (
                <div className="py-8 text-center">
                  <div className="inline-flex h-12 w-12 items-center justify-center bg-green-50 rounded-sm mb-3">
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      className="h-6 w-6 text-green-600"
                    >
                      <path
                        d="M20 6L9 17l-5-5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                  <p className="text-[14px] font-semibold text-[#1a1a1a]">
                    Thank you for your review!
                  </p>
                  <p className="text-[12px] text-[#999] mt-1">Refreshing page...</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-3">
                  {error && (
                    <p className="text-[13px] text-red-600 bg-red-50 px-3 py-2 border border-red-100 rounded-sm">
                      {error}
                    </p>
                  )}

                  <div>
                    <label className="block text-[11px] font-bold text-[#888] uppercase tracking-widest mb-1.5">
                      Rating *
                    </label>
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setRating(star)}
                          onMouseEnter={() => setHoverRating(star)}
                          onMouseLeave={() => setHoverRating(0)}
                          className="focus:outline-none p-0.5"
                        >
                          <Star
                            size={26}
                            fill={(hoverRating || rating) >= star ? "#f59e0b" : "none"}
                            className={
                              (hoverRating || rating) >= star
                                ? "text-amber-400"
                                : "text-gray-300"
                            }
                            strokeWidth={1.5}
                          />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-[#888] uppercase tracking-widest mb-1.5">
                      Your Name *
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Enter your name"
                      className="w-full border border-[#ddd] px-3 py-2.5 text-[14px] focus:border-[#1a3c2e] focus:outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-[#888] uppercase tracking-widest mb-1.5">
                      Your Review *
                    </label>
                    <textarea
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder="Share your experience with this product..."
                      rows={3}
                      className="w-full resize-y border border-[#ddd] px-3 py-2.5 text-[14px] focus:border-[#1a3c2e] focus:outline-none"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className={`w-full py-3 bg-[#1a3c2e] text-white text-[12px] font-bold uppercase tracking-widest hover:bg-[#0f2a1e] transition-colors ${
                      submitting ? "opacity-70 cursor-wait" : ""
                    }`}
                  >
                    {submitting ? "Submitting..." : "Submit Review"}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
