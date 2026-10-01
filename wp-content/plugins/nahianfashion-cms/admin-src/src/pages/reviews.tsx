import { useEffect, useState } from 'react';
import ReviewsManager from '@/components/admin/ReviewsManager';
import { MessageSquare } from 'lucide-react';

export default function AdminReviewsPage() {
  const [grouped, setGrouped] = useState<{ [key: string]: any[] } | null>(null);

  useEffect(() => {
    fetch('/api/admin/reviews').then((r) => r.json()).then((d) => {
      const names: { [id: string]: string } = d.product_names || {};
      const out: { [key: string]: any[] } = {};
      for (const review of d.data || []) {
        const name = names[review.product_id] || 'Unknown Product';
        (out[name] = out[name] || []).push(review);
      }
      setGrouped(out);
    }).catch(() => setGrouped({}));
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 border-b border-white/10 pb-5">
        <div className="bg-[#151828] p-3 rounded-xl border border-white/10">
          <MessageSquare className="text-[#ac8545]" size={24} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Customer Reviews</h1>
          <p className="text-sm text-gray-400 mt-1">Manage and moderate product reviews</p>
        </div>
      </div>
      {grouped && <ReviewsManager initialReviews={grouped} />}
    </div>
  );
}
