"use client";

import { useState } from "react";
import { Star, Trash2, Edit2, Check, X } from "lucide-react";
import { useConfirm } from "@/contexts/ConfirmContext";

interface Review {
  id: string;
  product_id: string;
  name: string;
  rating: number;
  comment: string;
  created_at: string;
}

interface GroupedReviews {
  [key: string]: Review[];
}

interface ReviewsManagerProps {
  initialReviews: GroupedReviews;
}

export default function ReviewsManager({ initialReviews }: ReviewsManagerProps) {
  const confirm = useConfirm();
  const [reviewsState, setReviewsState] = useState<GroupedReviews>(initialReviews);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState<string>("");
  const [editRating, setEditRating] = useState<number>(5);
  const [editComment, setEditComment] = useState<string>("");



  const handleDelete = async (productName: string, reviewId: string) => {
    const ok = await confirm({
      title: "রিভিউ ডিলিট করুন",
      message: "এই রিভিউটি স্থায়ীভাবে ডিলিট হয়ে যাবে। আপনি কি নিশ্চিত?",
      confirmText: "হ্যাঁ, ডিলিট করুন",
      cancelText: "না",
    });
    if (!ok) return;

    const res = await fetch('/api/reviews', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reviewId }),
    });

    if (!res.ok) {
      const data = await res.json();
      alert("Error deleting review: " + data.error);
    } else {
      setReviewsState((prev) => {
        const productReviews = prev[productName].filter((r) => r.id !== reviewId);
        if (productReviews.length === 0) {
          const newState = { ...prev };
          delete newState[productName];
          return newState;
        }
        return { ...prev, [productName]: productReviews };
      });
    }
  };

  const startEdit = (review: Review) => {
    setEditingId(review.id);
    setEditName(review.name);
    setEditRating(review.rating);
    setEditComment(review.comment);
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  const saveEdit = async (productName: string, reviewId: string) => {
    if (!editComment.trim() || !editName.trim()) {
      alert("Name and comment cannot be empty");
      return;
    }

    const res = await fetch('/api/reviews', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reviewId, name: editName.trim(), rating: editRating, comment: editComment.trim() }),
    });

    if (!res.ok) {
      const data = await res.json();
      alert("Error updating review: " + data.error);
    } else {
      setReviewsState((prev) => ({
        ...prev,
        [productName]: prev[productName].map((r) =>
          r.id === reviewId ? { ...r, name: editName.trim(), rating: editRating, comment: editComment.trim() } : r
        ),
      }));
      setEditingId(null);
    }
  };

  if (Object.keys(reviewsState).length === 0) {
    return (
      <div className="bg-[#151828] p-12 text-center border border-white/10 rounded-lg">
        <p className="text-gray-400 text-lg">No reviews have been submitted yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-12">
      {Object.entries(reviewsState).map(([productName, reviews]) => (
        <section key={productName} className="bg-[#151828] p-6 border border-white/10 rounded-lg shadow-sm">
          <div className="mb-6 border-b border-white/10 pb-4">
            <h2 className="text-2xl font-bold text-white">{productName}</h2>
            <p className="text-sm text-gray-400 mt-1">{reviews.length} review(s)</p>
          </div>

          <div className="flex flex-col gap-4">
            {reviews.map((review) => {
              const isEditing = editingId === review.id;

              return (
                <div key={review.id} className="border border-white/5 p-4 rounded-lg flex flex-col md:flex-row md:items-center justify-between bg-white/5 hover:bg-white/10 transition-colors gap-4">
                  {isEditing ? (
                    <div className="flex-1 flex flex-col gap-4 w-full">
                      {/* Name + Stars row */}
                      <div className="flex flex-col sm:flex-row gap-3">
                        <div className="flex flex-col gap-1 flex-1">
                          <label className="text-xs text-gray-400 font-medium">Reviewer Name</label>
                          <input
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="bg-[#0f111a] text-white border border-white/20 px-3 py-2 text-sm rounded focus:border-[#ac8545] focus:outline-none"
                            placeholder="Reviewer name"
                          />
                        </div>
                        <div className="flex flex-col gap-1 shrink-0">
                          <label className="text-xs text-gray-400 font-medium">Rating</label>
                          <div className="flex gap-1 mt-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <button
                                key={star}
                                onClick={() => setEditRating(star)}
                                className="focus:outline-none"
                              >
                                <Star
                                  size={20}
                                  fill={star <= editRating ? "currentColor" : "none"}
                                  className={star <= editRating ? "text-[#ac8545]" : "text-gray-600"}
                                  strokeWidth={star <= editRating ? 0 : 1.5}
                                />
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                      {/* Comment */}
                      <div className="flex flex-col gap-1">
                        <label className="text-xs text-gray-400 font-medium">Comment</label>
                        <textarea
                          value={editComment}
                          onChange={(e) => setEditComment(e.target.value)}
                          className="bg-[#0f111a] text-white border border-white/20 p-3 text-sm rounded focus:border-[#ac8545] focus:outline-none"
                          rows={2}
                        />
                      </div>
                      {/* Actions */}
                      <div className="flex items-center gap-2 justify-end">
                        <button
                          onClick={cancelEdit}
                          className="flex items-center gap-1 px-3 py-2 text-xs font-medium text-gray-300 bg-white/5 hover:bg-white/10 rounded transition-colors"
                        >
                          <X size={14} /> Cancel
                        </button>
                        <button
                          onClick={() => saveEdit(productName, review.id)}
                          className="flex items-center gap-1 px-3 py-2 text-xs font-medium text-white bg-green-600/80 hover:bg-green-600 rounded transition-colors"
                        >
                          <Check size={14} /> Save
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-4 flex-1 overflow-hidden min-w-0">
                        <div className="h-10 w-10 shrink-0 bg-[#ac8545] text-white rounded-full flex items-center justify-center font-bold text-[15px]">
                          {review.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex flex-col w-[140px] shrink-0">
                          <span className="font-semibold text-white truncate">{review.name}</span>
                          <span className="text-xs text-gray-400">
                            {new Date(review.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="flex shrink-0 text-[#ac8545]">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              size={14}
                              fill={i < review.rating ? "currentColor" : "none"}
                              className={i < review.rating ? "text-[#ac8545]" : "text-gray-600"}
                              strokeWidth={i < review.rating ? 0 : 1.5}
                            />
                          ))}
                        </div>
                        <p className="text-gray-300 text-sm italic truncate ml-2 md:ml-4 flex-1">
                          "{review.comment}"
                        </p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => startEdit(review)}
                          className="flex items-center gap-1 px-3 py-2 text-xs font-medium text-blue-400 hover:bg-blue-500/10 rounded transition-colors"
                        >
                          <Edit2 size={14} /> Edit
                        </button>
                        <button
                          onClick={() => handleDelete(productName, review.id)}
                          className="flex items-center gap-1 px-3 py-2 text-xs font-medium text-red-400 hover:bg-red-500/10 rounded transition-colors"
                        >
                          <Trash2 size={14} /> Delete
                        </button>
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
