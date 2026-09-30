import { prisma } from '@/lib/db';
import ReviewsManager from "@/components/admin/ReviewsManager";
import { MessageSquare } from "lucide-react";

export const revalidate = 0;

export default async function AdminReviewsPage() {
  const [reviews, products] = await Promise.all([
    prisma.productReview.findMany({ orderBy: { created_at: 'desc' } }),
    prisma.product.findMany({ select: { id: true, name: true } }),
  ]);

  const productNameMap: { [id: string]: string } = {};
  for (const p of products) {
    productNameMap[p.id] = p.name;
  }

  const groupedReviews: { [key: string]: any[] } = {};
  for (const review of reviews) {
    const productName = productNameMap[review.product_id] || "Unknown Product";
    if (!groupedReviews[productName]) groupedReviews[productName] = [];
    groupedReviews[productName].push(review);
  }

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
      <ReviewsManager initialReviews={groupedReviews} />
    </div>
  );
}
