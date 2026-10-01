"use client";

import { useState, useEffect } from "react";
import { Star, Play, X } from "lucide-react";

interface Review {
  id: string;
  name: string;
  image_url?: string;
  video_url?: string;
  quote?: string;
  rating?: number;
  title?: string;
}

function getEmbedUrl(url: string): string {
  const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([A-Za-z0-9_-]{11})/);
  if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}?autoplay=1`;
  return url;
}

export default function CustomerReviews() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [activeVideo, setActiveVideo] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/testimonials")
      .then(r => r.json())
      .then(json => {
        const all = json.data || [];
        const customerReviews = all.filter((t: any) => t.type === "review");
        setReviews(customerReviews);
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, []);

  if (loaded && reviews.length === 0) return null;

  const rating = (r: Review) => r.rating ?? 5;

  return (
    <section className="bg-white py-12 md:py-16">
      <div className="mx-auto max-w-[1280px] px-6 md:px-10">
        {/* Header */}
        <div className="text-center mb-8">
          <p className="section-eyebrow mb-2">What Our Customers Say</p>
          <h2 className="text-[24px] md:text-[32px] font-bold text-[#1a1a1a]">Customer Reviews</h2>
        </div>

        {/* Review Cards */}
        {!loaded ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-[240px] bg-[#f5f5f5] animate-pulse rounded-lg" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-5">
            {reviews.slice(0, 4).map(review => (
              <div key={review.id} className="flex flex-col">
                {/* Photo / Video card */}
                <div className="relative aspect-square overflow-hidden rounded-lg bg-[#f5f5f5] group">
                  {review.image_url ? (
                    <img
                      src={review.image_url}
                      alt={review.name}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center bg-[#1a3c2e]/10">
                      <span className="text-[40px] font-bold text-[#1a3c2e]/30">{review.name?.[0] || "R"}</span>
                    </div>
                  )}

                  {/* Play button for video reviews — opens inline modal */}
                  {review.video_url && (
                    <button
                      onClick={() => setActiveVideo(review.video_url!)}
                      className="absolute inset-0 flex items-center justify-center bg-black/20 hover:bg-black/30 transition-colors"
                    >
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/90 hover:bg-white transition-colors shadow-lg">
                        <Play size={16} className="text-[#1a3c2e] ml-0.5" fill="currentColor" />
                      </div>
                    </button>
                  )}
                </div>

                {/* Stars + Name */}
                <div className="mt-3">
                  <div className="flex items-center gap-0.5 mb-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        size={13}
                        className={i < rating(review) ? "text-amber-400 fill-amber-400" : "text-[#ddd] fill-[#ddd]"}
                      />
                    ))}
                  </div>
                  <p className="text-[13px] font-semibold text-[#1a1a1a]">{review.name}</p>
                  {review.quote && (
                    <p className="text-[12px] text-[#777] mt-1 line-clamp-2 leading-relaxed">{review.quote}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Video Lightbox Modal */}
      {activeVideo && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setActiveVideo(null)}
        >
          <div
            className="relative w-full max-w-3xl aspect-video bg-black rounded-lg overflow-hidden shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={() => setActiveVideo(null)}
              className="absolute top-3 right-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black transition-colors"
            >
              <X size={16} />
            </button>
            {activeVideo.match(/\.(mp4|webm|ogg)$/i) ? (
              <video
                src={activeVideo}
                autoPlay
                controls
                className="h-full w-full"
              />
            ) : (
              <iframe
                src={getEmbedUrl(activeVideo)}
                allow="autoplay; encrypted-media"
                allowFullScreen
                className="h-full w-full border-0"
              />
            )}
          </div>
        </div>
      )}
    </section>
  );
}
