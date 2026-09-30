import { prisma } from '@/lib/db';
import { Image, Grid2X2, Package, Star, ArrowRight, Tag, DollarSign, ShoppingCart, Layers, RotateCcw, Clock } from 'lucide-react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

const sections = [
  { label: 'Hero Banner', href: '/admin/hero-banner', icon: Image, desc: 'Edit banner image, headline & CTA' },
  { label: 'Categories', href: '/admin/categories', icon: Grid2X2, desc: 'Manage the 4 shop categories' },
  { label: 'Products', href: '/admin/products', icon: Package, desc: 'Bestsellers & gift products' },
  { label: 'Testimonials', href: '/admin/testimonials', icon: Star, desc: 'Celebrity cards & customer reviews' },
  { label: 'Coupon Codes', href: '/admin/coupons', icon: Tag, desc: 'Create & manage discount coupons' },
];

export default async function AdminDashboard() {
  const [
    productsCount,
    categoriesCount,
    orderSuccessCount,
    orderPendingCount,
    returnedOrdersCount,
    completedOrders,
  ] = await Promise.all([
    prisma.product.count(),
    prisma.category.count(),
    prisma.order.count({ where: { status: { in: ['completed', 'delivered'] } } }),
    prisma.order.count({ where: { status: { notIn: ['completed', 'delivered', 'cancelled', 'returned', 'failed'] } } }),
    prisma.order.count({ where: { status: 'returned' } }),
    prisma.order.findMany({
      where: { status: { in: ['completed', 'delivered'] } },
      select: { total: true },
    }),
  ]);

  const totalRevenue = completedOrders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);
  const fmt = (n: number) => `৳${n.toLocaleString("en-BD", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white tracking-tight">Dashboard</h1>
        <p className="text-slate-400 mt-1">Welcome back — here is your site overview.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">

        <div className="bg-[#151828] rounded-2xl p-6 border border-white/10 flex flex-col items-center justify-center hover:border-white/20 transition-all shadow-xl shadow-black/20 text-center gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-500/10 text-emerald-400 rounded-xl flex items-center justify-center shrink-0">
              <DollarSign size={20} />
            </div>
            <p className="text-sm font-medium text-slate-400">Total Revenue</p>
          </div>
          <h3 className="text-3xl font-bold text-white">{fmt(totalRevenue)}</h3>
        </div>

        <div className="bg-[#151828] rounded-2xl p-6 border border-white/10 flex flex-col items-center justify-center hover:border-white/20 transition-all shadow-xl shadow-black/20 text-center gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-500/10 text-blue-400 rounded-xl flex items-center justify-center shrink-0">
              <ShoppingCart size={20} />
            </div>
            <p className="text-sm font-medium text-slate-400">Order Success</p>
          </div>
          <h3 className="text-3xl font-bold text-white">{orderSuccessCount}</h3>
        </div>

        <div className="bg-[#151828] rounded-2xl p-6 border border-white/10 flex flex-col items-center justify-center hover:border-white/20 transition-all shadow-xl shadow-black/20 text-center gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-500/10 text-amber-400 rounded-xl flex items-center justify-center shrink-0">
              <Clock size={20} />
            </div>
            <p className="text-sm font-medium text-slate-400">Order Pending</p>
          </div>
          <h3 className="text-3xl font-bold text-white">{orderPendingCount}</h3>
        </div>

        <div className="bg-[#151828] rounded-2xl p-6 border border-white/10 flex flex-col items-center justify-center hover:border-white/20 transition-all shadow-xl shadow-black/20 text-center gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-rose-500/10 text-rose-400 rounded-xl flex items-center justify-center shrink-0">
              <RotateCcw size={20} />
            </div>
            <p className="text-sm font-medium text-slate-400">Returned Orders</p>
          </div>
          <h3 className="text-3xl font-bold text-white">{returnedOrdersCount}</h3>
        </div>

        <div className="bg-[#151828] rounded-2xl p-6 border border-white/10 flex flex-col items-center justify-center hover:border-white/20 transition-all shadow-xl shadow-black/20 text-center gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-500/10 text-purple-400 rounded-xl flex items-center justify-center shrink-0">
              <Package size={20} />
            </div>
            <p className="text-sm font-medium text-slate-400">Total Products</p>
          </div>
          <h3 className="text-3xl font-bold text-white">{productsCount}</h3>
        </div>

        <div className="bg-[#151828] rounded-2xl p-6 border border-white/10 flex flex-col items-center justify-center hover:border-white/20 transition-all shadow-xl shadow-black/20 text-center gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-500/10 text-orange-400 rounded-xl flex items-center justify-center shrink-0">
              <Layers size={20} />
            </div>
            <p className="text-sm font-medium text-slate-400">Total Categories</p>
          </div>
          <h3 className="text-3xl font-bold text-white">{categoriesCount}</h3>
        </div>

      </div>

      <div>
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">
          Manage Sections
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {sections.map(({ label, href, icon: Icon, desc }) => (
            <Link key={href} href={href} className="group">
              <div className="bg-[#151828] border border-white/10 rounded-xl p-4 hover:border-blue-500/50 hover:bg-white/5 transition-all flex items-start gap-4 h-full shadow-lg shadow-black/10">
                <div className="w-10 h-10 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center flex-shrink-0 group-hover:bg-blue-500 group-hover:text-white transition-colors">
                  <Icon size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-white text-sm mb-1 truncate">{label}</p>
                  <p className="text-xs text-slate-400 line-clamp-2">{desc}</p>
                </div>
                <ArrowRight size={16} className="text-slate-600 group-hover:text-blue-400 transition-colors mt-1" />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
