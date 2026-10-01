"use client";

import { useState, useEffect } from "react";

export default function OrdersPage() {
  const [user, setUser] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const sessionRes = await fetch('/api/auth/session');
      const sessionData = await sessionRes.json();
      if (sessionData.user) {
        setUser(sessionData.user);
        const ordersRes = await fetch('/api/customer/orders');
        const ordersData = await ordersRes.json();
        if (ordersData.orders) {
          setOrders(ordersData.orders);
        }
      }
    } catch (err) {
      console.error("fetchData error:", err);
    }
    setLoading(false);
  };

  const fmt = (n: number) => `৳${n.toLocaleString("en-US", { minimumFractionDigits: 2 })}`;

  if (loading) return <div className="py-10 text-center text-[#999]">Loading orders...</div>;

  const totalOrders = orders.length;
  const totalSpent = orders.filter(o => o.status === 'delivered').reduce((sum, o) => sum + o.total, 0);
  const successCount = orders.filter(o => o.status === 'delivered').length;
  const cancelledCount = orders.filter(o => o.status === 'cancelled' || o.status === 'payment_failed' || o.status === 'returned').length;

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        <div className="bg-white p-6 rounded border border-[#e3d8c7] text-center">
          <p className="text-[#999] text-[12px] uppercase font-bold mb-1">Total Orders</p>
          <p className="text-[24px] font-bold text-[#333]">{totalOrders}</p>
        </div>
        <div className="bg-white p-6 rounded border border-[#e3d8c7] text-center">
          <p className="text-[#999] text-[12px] uppercase font-bold mb-1">Total Spent</p>
          <p className="text-[24px] font-bold text-brand-gold">{fmt(totalSpent)}</p>
        </div>
        <div className="bg-white p-6 rounded border border-[#e3d8c7] text-center">
          <p className="text-[#999] text-[12px] uppercase font-bold mb-1">Completed</p>
          <p className="text-[24px] font-bold text-green-600">{successCount}</p>
        </div>
        <div className="bg-white p-6 rounded border border-[#e3d8c7] text-center">
          <p className="text-[#999] text-[12px] uppercase font-bold mb-1">Cancelled</p>
          <p className="text-[24px] font-bold text-red-400">{cancelledCount}</p>
        </div>
      </div>

      {orders.length === 0 ? (
        <div className="bg-white p-20 rounded border border-[#e3d8c7] text-center">
          <p className="text-[#999]">You haven't placed any orders yet.</p>
        </div>
      ) : (
        orders.map(order => {
          const productNames = (order.items && order.items.length > 0)
            ? order.items.map((i: any) => i.product_name + (i.quantity > 1 ? ` (x${i.quantity})` : "")).join(", ")
            : "No products listed";
          
          return (
            <div key={order.id} className="bg-white border border-[#e3d8c7] p-6 rounded shadow-sm">
              <div className="flex flex-col md:flex-row justify-between md:items-center pb-4 border-b border-[#e3d8c7] mb-4 gap-4">
                <div>
                  <p className="text-brand-gold font-bold text-[14px] mb-1 uppercase tracking-wide">{productNames}</p>
                  <p className="font-bold text-[18px]">Order #{order.order_id}</p>
                  <p className="text-[#666] text-[14px] mt-1">Placed on {new Date(order.placed_at).toLocaleDateString()}</p>
                </div>
                <div className="flex items-center gap-4">
                  <span className={`px-4 py-1 rounded-full text-[12px] font-bold uppercase tracking-wider ${
                    order.status === 'delivered' ? 'bg-green-100 text-green-600' :
                    (order.status === 'cancelled' || order.status === 'returned') ? 'bg-red-100 text-red-500' :
                    'bg-blue-100 text-blue-600'
                  }`}>
                    {order.status.replace('_', ' ')}
                  </span>
                  <p className="font-bold text-[20px] text-[#333]">{fmt(order.total)}</p>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-x-12 gap-y-4">
                <div>
                  <p className="text-[#999] text-[12px] uppercase font-bold mb-1">Customer</p>
                  <p className="text-[14px] font-medium">{order.customer_name}</p>
                  <p className="text-[14px] text-[#666]">{order.phone}</p>
                </div>
                <div className="max-w-[300px]">
                  <p className="text-[#999] text-[12px] uppercase font-bold mb-1">Shipping Address</p>
                  <p className="text-[14px] leading-relaxed text-[#666]">{order.address}</p>
                </div>
                <div>
                  <p className="text-[#999] text-[12px] uppercase font-bold mb-1">Payment</p>
                  <p className="text-[14px] font-medium uppercase">{order.payment_method === 'cash' ? 'Cash on Delivery' : order.payment_method}</p>
                </div>
              </div>

              {/* Items Table for more detail */}
              {order.items && order.items.length > 0 && (
                <div className="mt-6 pt-6 border-t border-[#f0f0f0]">
                   <p className="text-[#999] text-[12px] uppercase font-bold mb-3">Order Items</p>
                   <div className="space-y-3">
                     {order.items.map((item: any, idx: number) => (
                       <div key={idx} className="flex justify-between items-center bg-[#faf9f6] p-3 rounded">
                         <div className="flex items-center gap-3">
                           <div className="w-10 h-10 bg-white border border-[#e3d8c7] rounded flex items-center justify-center overflow-hidden">
                             {item.image_url ? (
                               <img src={item.image_url} alt={item.product_name} className="w-full h-full object-cover" loading="lazy" decoding="async" />
                             ) : (
                               <Package size={20} className="text-[#ccc]" />
                             )}
                           </div>
                           <div>
                             <p className="text-[14px] font-medium">{item.product_name}</p>
                             <p className="text-[12px] text-[#999]">{fmt(item.price)} × {item.quantity}</p>
                           </div>
                         </div>
                         <p className="font-bold text-[14px]">{fmt(item.price * item.quantity)}</p>
                       </div>
                     ))}
                   </div>
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}

function Package({ size, className }: { size: number, className?: string }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <path d="M7.5 13L12 8L16.5 13"/><path d="M12 16V8"/><rect width="18" height="18" x="3" y="3" rx="2"/>
    </svg>
  );
}
