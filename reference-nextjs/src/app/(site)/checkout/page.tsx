"use client";

import { useState, useEffect, Suspense, useRef } from "react";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Trash2, ShoppingCart, Truck, ArrowLeft, Loader2, CheckCircle2 } from "lucide-react";
import SiteConfirmModal from "@/components/ui/SiteConfirmModal";

const DISTRICTS = [
  "Bagerhat", "Bandarban", "Barguna", "Barishal", "Bhola", "Bogra", "Brahmanbaria", "Chandpur", "Chapainawabganj", "Chattogram", "Chuadanga", "Cumilla", "Cox's Bazar", "Dhaka", "Dinajpur", "Faridpur", "Feni", "Gaibandha", "Gazipur", "Gopalganj", "Habiganj", "Jamalpur", "Jashore", "Jhalokati", "Jhenaidah", "Joypurhat", "Khagrachari", "Khulna", "Kishoreganj", "Kurigram", "Kushtia", "Lakshmipur", "Lalmonirhat", "Madaripur", "Magura", "Manikganj", "Meherpur", "Moulvibazar", "Munshiganj", "Mymensingh", "Naogaon", "Narail", "Narayanganj", "Narsingdi", "Natore", "Netrokona", "Nilphamari", "Noakhali", "Pabna", "Panchagarh", "Patuakhali", "Pirojpur", "Rajbari", "Rajshahi", "Rangamati", "Rangpur", "Satkhira", "Shariatpur", "Sherpur", "Sirajganj", "Sunamganj", "Sylhet", "Tangail", "Thakurgaon"
];

function CheckoutContent() {
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  
  // Confirm Modal state
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    itemId: "",
    title: "",
    message: ""
  });
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [orderId, setOrderId] = useState("");
  const [shippingCharge, setShippingCharge] = useState(130);
  const [user, setUser] = useState<any>(null);
  const [suggestion, setSuggestion] = useState<any>(null);
  const [phoneError, setPhoneError] = useState(false);
  const phoneRef = useRef<HTMLInputElement>(null);
  
  const [form, setForm] = useState({
    name: "",
    phone: "",
    address: "",
    district: "",
    shipping_method: "Cash on Delivery",
  });

  const router = useRouter();
  const searchParams = useSearchParams();
  const buyNowId = searchParams.get("buyNow");

  useEffect(() => {
    const checkUser = async () => {
      // 1. Try to load from localStorage first (for repeat guests/users)
      const savedInfo = localStorage.getItem("sv_checkout_info");
      if (savedInfo) {
        try {
          const parsed = JSON.parse(savedInfo);
          setForm(prev => ({
            ...prev,
            name: parsed.name || prev.name,
            phone: parsed.phone || prev.phone,
            address: parsed.address || prev.address,
            district: parsed.district || prev.district,
          }));
        } catch (e) {}
      }

      // 2. If logged in, profile from DB takes priority
      const sessionRes = await fetch('/api/auth/session');
      const sessionData = await sessionRes.json();
      if (sessionData.user) {
        setUser(sessionData.user);
        const profileRes = await fetch('/api/customer/profile');
        const profileData = await profileRes.json();
        if (profileData.customer) {
          setForm(prev => ({
            ...prev,
            name: profileData.customer.name || prev.name,
            phone: profileData.customer.phone || prev.phone,
            address: profileData.customer.address || prev.address,
          }));
        }
      }
    };
    checkUser();
  }, []);

  // Removed applySuggestion as we now auto-fill or use native autocomplete

  useEffect(() => {
    const saved = localStorage.getItem("cart");
    const buyNowRaw = localStorage.getItem("sv_buy_now_item");
    
    if (buyNowId) {
      // Priority 1: Check if the buyNow item is already in the main cart
      let items = [];
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          items = parsed.filter((item: any) => item.id === buyNowId);
        } catch (e) {}
      }

      // Priority 2: If not in cart, check the temporary buy_now_item storage
      if (items.length === 0 && buyNowRaw) {
        try {
          const buyNowItem = JSON.parse(buyNowRaw);
          if (buyNowItem.id === buyNowId) {
            items = [buyNowItem];
          }
        } catch (e) {}
      }
      
      setCartItems(items);
    } else if (saved) {
      // Normal cart flow
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) setCartItems(parsed);
      } catch (e) {}
    }
    
    setLoading(false);
  }, [buyNowId]);

  // Update shipping charge when district changes
  useEffect(() => {
    if (form.district === "Dhaka") {
      setShippingCharge(70);
    } else if (form.district) {
      setShippingCharge(130);
    }
  }, [form.district]);

  const updateQuantity = (id: string, delta: number) => {
    const updated = cartItems.map(item => {
      if (item.id === id) {
        return { ...item, quantity: Math.max(1, item.quantity + delta) };
      }
      return item;
    });
    setCartItems(updated);
    
    if (!buyNowId) {
      localStorage.setItem("cart", JSON.stringify(updated));
    }
  };

  const removeItem = (id: string) => {
    const item = cartItems.find(i => i.id === id);
    if (!item) return;

    setConfirmModal({
      isOpen: true,
      itemId: id,
      title: "Remove Item?",
      message: `Are you sure you want to remove "${item.name}" from your order?`
    });
  };

  const confirmRemove = () => {
    const id = confirmModal.itemId;
    const updated = cartItems.filter(item => item.id !== id);
    setCartItems(updated);
    
    if (!buyNowId) {
      localStorage.setItem("cart", JSON.stringify(updated));
    }
    window.dispatchEvent(new CustomEvent("cart:add"));
    setConfirmModal({ ...confirmModal, isOpen: false });
  };

  const subtotal = cartItems.reduce((acc, item) => {
    const price = parseFloat(item.price.replace(/[^0-9.]/g, ""));
    return acc + price * item.quantity;
  }, 0);

  const grandTotal = subtotal + shippingCharge;

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cartItems.length === 0) return alert("Your cart is empty!");
    const phoneRegex = /^[0-9]{11}$/;
    if (!form.phone || !phoneRegex.test(form.phone)) {
      setPhoneError(true);
      phoneRef.current?.focus();
      return;
    }

    if (!form.name || !form.address || !form.district) {
      return alert("Please fill in all required fields.");
    }

    setIsPlacingOrder(true);
    
    try {
      // 1. Call the server-side API to create the order
      // The server will generate the sequential Order ID (e.g. CTA-0001)
      const response = await fetch('/api/orders/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: user?.id || null,
          name: form.name,
          phone: form.phone,
          address: `${form.address}, ${form.district}`,
          items: cartItems.map(item => ({
            productId: item.id,
            quantity: item.quantity
          })),
          paymentMethod: 'cash',
          selectedDistrictId: form.district === "Dhaka" ? "47" : "0" 
        })
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || result.message || 'Failed to create order');
      }

      const finalOrderId = result.orderId; // This is the server-generated CTA-XXXX ID

      // 2. Save to localStorage fallback for Thank You page
      const lastOrderData = {
        orderId: finalOrderId,
        name: form.name,
        phone: form.phone,
        address: `${form.address}, ${form.district}`,
        items: cartItems.map(item => ({
          id: item.id,
          name: item.name,
          price: item.price,
          image: item.image || '',
          quantity: item.quantity
        })),
        subtotal: subtotal,
        shipping: shippingCharge,
        discount: 0,
        total: grandTotal,
        paymentMethod: 'cash',
        amountPaid: 0,
        placedAt: new Date().toISOString()
      };
      localStorage.setItem("sv_last_order", JSON.stringify(lastOrderData));

      // 4. Success - Remove ONLY ordered items from global cart
      const savedCartRaw = localStorage.getItem("cart");
      const savedCart = savedCartRaw ? JSON.parse(savedCartRaw) : [];
      const orderedIds = cartItems.map(i => i.id);
      const remainingCart = savedCart.filter((item: any) => !orderedIds.includes(item.id));
      
      localStorage.setItem("cart", JSON.stringify(remainingCart));
      localStorage.removeItem("sv_buy_now_item"); // Always clean up temporary storage
      
      // Save info for next time
      localStorage.setItem("sv_checkout_info", JSON.stringify({
        name: form.name,
        phone: form.phone,
        address: form.address,
        district: form.district
      }));

      window.dispatchEvent(new CustomEvent("cart:add")); // notify header to refresh count
      
      router.push(`/thank-you/${finalOrderId}`);
      
    } catch (err: any) {
      console.error("Order error:", err);
      alert(`Order failed: ${err.message}`);
    } finally {
      setIsPlacingOrder(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-brand-gold" />
        <p className="text-[#666]">Preparing your checkout...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f5f0] py-10 md:py-16">
      <div className="mx-auto max-w-[1280px] px-6">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_450px] gap-8 items-start">
          
          {/* Left: Your Order */}
          <div className="bg-white rounded-[12px] shadow-sm overflow-hidden border border-[#eee]">
            <div className="bg-[#e1f5ea] px-6 py-4 flex items-center gap-3">
              <ShoppingCart className="w-6 h-6 text-brand-green" />
              <h2 className="text-[20px] font-bold text-brand-green">Your Order</h2>
            </div>
            <div className="p-6 md:p-8">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#e1f5ea]/50 text-[14px] text-brand-green font-bold uppercase tracking-wider">
                      <th className="px-4 py-3 border-b border-[#eee]">#</th>
                      <th className="px-4 py-3 border-b border-[#eee]">Image</th>
                      <th className="px-4 py-3 border-b border-[#eee]">Name</th>
                      <th className="px-4 py-3 border-b border-[#eee]">Unit Price</th>
                      <th className="px-4 py-3 border-b border-[#eee]">Qty</th>
                      <th className="px-4 py-3 border-b border-[#eee]">Total</th>
                      <th className="px-4 py-3 border-b border-[#eee]">Remove</th>
                    </tr>
                  </thead>
                  <tbody className="text-[15px]">
                    {cartItems.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-4 py-20 text-center text-[#999]">
                          Your cart is empty. <Link href="/" className="text-brand-gold underline ml-2">Continue Shopping</Link>
                        </td>
                      </tr>
                    ) : (
                      cartItems.map((item, idx) => {
                        const price = parseFloat(item.price.replace(/[^0-9.]/g, ""));
                        return (
                          <tr key={item.id} className="border-b border-[#f5f5f5] hover:bg-gray-50 transition-colors">
                            <td className="px-4 py-4">{idx + 1}</td>
                            <td className="px-4 py-4">
                              <div className="w-16 h-16 bg-[#f8f5f0] rounded-lg overflow-hidden border border-[#eee]">
                                {item.image ? (
                                  <img src={item.image} alt={item.name} className="w-full h-full object-cover" loading="lazy" decoding="async" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-gray-300">
                                    <ShoppingCart size={24} />
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-4 font-medium text-[#222] min-w-[150px]">{item.name}</td>
                            <td className="px-4 py-4 text-brand-green font-bold whitespace-nowrap">{price} Tk</td>
                            <td className="px-4 py-4">
                              <div className="flex items-center border border-[#ddd] rounded-full w-fit px-1 h-9">
                                <button 
                                  onClick={() => updateQuantity(item.id, -1)}
                                  className="w-8 h-full flex items-center justify-center text-[#999] hover:text-black transition-colors"
                                >-</button>
                                <span className="w-8 text-center font-bold text-[#222]">{item.quantity}</span>
                                <button 
                                  onClick={() => updateQuantity(item.id, 1)}
                                  className="w-8 h-full flex items-center justify-center text-[#999] hover:text-black transition-colors"
                                >+</button>
                              </div>
                            </td>
                            <td className="px-4 py-4 text-brand-green font-bold whitespace-nowrap">{price * item.quantity} Tk</td>
                            <td className="px-4 py-4 text-center">
                              <button 
                                onClick={() => removeItem(item.id)}
                                className="flex flex-col items-center gap-1 text-red-500 hover:text-red-700 transition-colors"
                              >
                                <Trash2 size={18} />
                                <span className="text-[10px] font-bold uppercase">Remove</span>
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              <div className="mt-8 space-y-3 max-w-[400px] ml-auto">
                <div className="flex justify-between text-[16px] text-[#555]">
                  <span>Subtotal:</span>
                  <span className="font-bold text-[#222]">৳{subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-[16px] text-[#555]">
                  <span>Shipping Charge:</span>
                  <span className="font-bold text-[#222]">৳{shippingCharge.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-[22px] font-bold text-[#222] pt-3 border-t border-[#eee]">
                  <span>Grand Total:</span>
                  <span className="text-brand-green">৳{grandTotal.toLocaleString()}</span>
                </div>
              </div>

              <div className="mt-8">
                <Link href="/" className="inline-flex items-center gap-2 px-6 py-2.5 bg-black text-white rounded-[6px] text-[14px] font-bold uppercase tracking-wider hover:opacity-80 transition-opacity">
                  <ArrowLeft size={16} /> Back To Shopping
                </Link>
              </div>
            </div>
          </div>

          {/* Right: Delivery Info */}
          <div className="bg-white rounded-[12px] shadow-sm overflow-hidden border border-[#eee]">
            <div className="bg-white px-6 py-4 flex items-center gap-3 border-b border-[#f0f0f0]">
              <Truck className="w-6 h-6 text-[#b48f52]" />
              <h2 className="text-[20px] font-bold text-[#222]">Delivery Information</h2>
            </div>
            <div className="p-6 md:p-8">
              <form onSubmit={handlePlaceOrder} className="space-y-6">
              <div>
                <label className="block text-[14px] font-bold text-[#555] mb-2">Your Name*</label>
                <input 
                  required
                  type="text"
                  placeholder="Write Your Name"
                  autoComplete="name"
                  className="w-full h-[50px] px-4 rounded-[8px] border border-[#ddd] outline-none focus:border-brand-green transition-colors text-[15px]"
                  value={form.name}
                  onChange={e => setForm({...form, name: e.target.value})}
                />
              </div>
              
              <div>
                <label className="block text-[14px] font-bold text-[#555] mb-2">Your Mobile Number*</label>
                <input 
                  required
                  type="tel"
                  ref={phoneRef}
                  placeholder="Your Phone Number"
                  autoComplete="tel"
                  className={`w-full h-[50px] px-4 rounded-[8px] border ${phoneError ? 'border-red-500' : 'border-[#ddd]'} outline-none focus:border-brand-green transition-colors text-[15px]`}
                  value={form.phone}
                  onChange={e => {
                    setForm({...form, phone: e.target.value.replace(/[^0-9]/g, '').slice(0, 11)});
                    if (phoneError) setPhoneError(false);
                  }}
                />
                {phoneError && (
                  <p className="text-red-500 text-[12px] font-bold mt-1">Required - Number is wrong</p>
                )}
              </div>

              <div>
                <label className="block text-[14px] font-bold text-[#555] mb-2">Your Address*</label>
                <textarea 
                  required
                  placeholder="Street address, Apartment, etc."
                  autoComplete="street-address"
                  className="w-full h-[100px] p-4 rounded-[8px] border border-[#ddd] outline-none focus:border-brand-green transition-colors text-[15px] resize-none"
                  value={form.address}
                  onChange={e => setForm({...form, address: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-[14px] font-bold text-red-500 mb-2">Districts *</label>
                <select 
                  required
                  className="w-full h-[50px] px-4 rounded-[8px] border border-[#ddd] outline-none focus:border-brand-green transition-colors text-[15px] bg-white appearance-none"
                  style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23666'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 16px center', backgroundSize: '16px' }}
                  value={form.district}
                  onChange={e => setForm({...form, district: e.target.value})}
                >
                  <option value="">Select district</option>
                  {DISTRICTS.map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[14px] font-bold text-[#555] mb-2">Shipping Method*</label>
                <select 
                  required
                  className="w-full h-[50px] px-4 rounded-[8px] border border-[#ddd] outline-none focus:border-brand-green transition-colors text-[15px] bg-white appearance-none"
                  style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23666'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 16px center', backgroundSize: '16px' }}
                  value={form.shipping_method}
                  onChange={e => setForm({...form, shipping_method: e.target.value})}
                >
                  <option value="Cash on Delivery">Cash on Delivery</option>
                </select>
              </div>

              <button 
                type="submit"
                disabled={isPlacingOrder || cartItems.length === 0}
                className="w-full h-[60px] bg-[#008a45] text-white rounded-[8px] text-[18px] font-bold uppercase tracking-wider hover:bg-black transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
              >
                {isPlacingOrder ? (
                  <>
                    <Loader2 className="animate-spin" />
                    Placing Order...
                  </>
                ) : (
                  "Place Order"
                )}
              </button>
            </form>
          </div>

          </div>
        </div>
      </div>
      <SiteConfirmModal 
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        onConfirm={confirmRemove}
        onCancel={() => setConfirmModal({ ...confirmModal, isOpen: false })}
      />
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading checkout...</div>}>
      <CheckoutContent />
    </Suspense>
  );
}
