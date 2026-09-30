"use client";

import { useState } from "react";
import { Star, X, MessageSquareQuote, Edit3 } from "lucide-react";
import { WriteReviewModal } from "./WriteReviewModal";

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
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isWriteModalOpen, setIsWriteModalOpen] = useState(false);

  const reviewCount = reviews.length;
  const averageRating = reviewCount > 0
    ? reviews.reduce((acc, review) => acc + review.rating, 0) / reviewCount
    : 0;

  return (
    <>
      <div 
        className="mt-4 flex items-center gap-2 text-[#ac8545] cursor-pointer hover:opacity-80 transition-opacity"
        onClick={() => setIsModalOpen(true)}
      >
        <div className="flex">
          {[...Array(5)].map((_, index) => (
            <Star
              key={index}
              size={15}
              fill={index < Math.round(averageRating) ? "currentColor" : "none"}
              className={index < Math.round(averageRating) ? "text-[#ac8545]" : "text-gray-300"}
              strokeWidth={index < Math.round(averageRating) ? 0 : 1.5}
            />
          ))}
        </div>
        <span className="text-[14px] underline underline-offset-2">{reviewCount} review{reviewCount !== 1 && 's'}</span>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-[600px] max-h-[80vh] flex flex-col bg-[#fcfaf7] shadow-2xl rounded-sm overflow-hidden">
            
            {/* Header */}
            <div className="flex items-center justify-between p-6 bg-white border-b border-[#eaeaea]">
              <div>
                <h2 className="text-[24px] font-heading font-bold text-[#222]">Customer Reviews</h2>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[20px] font-bold text-[#ac8545]">{averageRating.toFixed(1)}</span>
                  <div className="flex text-[#ac8545]">
                    {[...Array(5)].map((_, index) => (
                      <Star
                        key={index}
                        size={14}
                        fill={index < Math.round(averageRating) ? "currentColor" : "none"}
                        className={index < Math.round(averageRating) ? "text-[#ac8545]" : "text-gray-300"}
                        strokeWidth={index < Math.round(averageRating) ? 0 : 1.5}
                      />
                    ))}
                  </div>
                  <span className="text-[13px] text-gray-500 ml-1">Based on {reviewCount} reviews</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsWriteModalOpen(true)}
                  className="hidden md:flex items-center gap-2 bg-[#b18a4a] hover:bg-[#9a7841] text-white px-4 py-2 text-[12px] font-bold uppercase tracking-wide transition-colors rounded-sm"
                >
                  <Edit3 size={14} />
                  Write Review
                </button>
                <button
                  onClick={() => setIsWriteModalOpen(true)}
                  className="md:hidden flex items-center justify-center bg-[#b18a4a] text-white p-2 rounded-full hover:bg-[#9a7841] transition-colors"
                >
                  <Edit3 size={16} />
                </button>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-gray-400 hover:text-black transition-colors bg-gray-50 p-2 rounded-full"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Reviews List */}
            <div className="overflow-y-auto p-6 space-y-4">
              {reviews.length === 0 ? (
                <div className="text-center py-10 text-gray-500">
                  <MessageSquareQuote size={40} className="mx-auto mb-3 opacity-20" />
                  <p>No reviews yet. Be the first to review!</p>
                </div>
              ) : (
                reviews.map((review) => (
                  <div key={review.id} className="bg-white p-5 border border-[#eaeaea] rounded-sm shadow-sm relative">
                    <MessageSquareQuote size={60} className="absolute top-4 right-4 text-[#f0ebe1] opacity-50 pointer-events-none" />
                    
                    <div className="flex items-center gap-3 mb-3">
                      <div className="h-10 w-10 bg-[#ac8545] text-white flex items-center justify-center font-bold text-[16px] rounded-full">
                        {review.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h4 className="font-bold text-[15px] text-[#222]">{review.name}</h4>
                        <div className="flex text-[#ac8545] mt-0.5">
                          {[...Array(5)].map((_, index) => (
                            <Star
                              key={index}
                              size={12}
                              fill={index < review.rating ? "currentColor" : "none"}
                              className={index < review.rating ? "text-[#ac8545]" : "text-gray-200"}
                              strokeWidth={index < review.rating ? 0 : 1.5}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                    
                    <p className="text-[15px] text-[#444] leading-relaxed italic">
                      "{review.comment}"
                    </p>
                    <p className="text-[12px] text-gray-400 mt-4 text-right">
                      {new Date(review.created_at).toLocaleDateString("en-US", { year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      <WriteReviewModal 
        isOpen={isWriteModalOpen} 
        onClose={() => setIsWriteModalOpen(false)} 
        productId={productId} 
      />
    </>
  );
}
