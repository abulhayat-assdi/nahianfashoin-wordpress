'use client';

import { useState, useEffect, useRef } from 'react';
import { Search, ShoppingBag, X, CheckCircle2, Package, ChevronDown, Send } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

type OrderItem = {
  id: string;
  product_id: string;
  product_name: string;
  price: number;
  quantity: number;
  image_url: string;
  size?: string | null;
  color?: string | null;
};

type Order = {
  id: string;
  order_id: string;
  customer_name: string;
  phone: string;
  address: string;
  subtotal: number;
  shipping: number;
  discount: number;
  total: number;
  payment_method: string;
  amount_paid: number;
  status: 'pending' | 'received' | 'preparing' | 'on_way' | 'delivered' | 'cancelled' | 'payment_failed' | 'returned' | 'incomplete';
  consignment_id?: string | null;
  placed_at: string;
  ip_address?: string | null;
  local_stats?: {
    total: number;
    success: number;
    cancel: number;
  };
  items?: OrderItem[];
};

// Simplified tabs — intermediate statuses removed
const TABS = [
  { id: 'pending', label: 'New Orders' },
  { id: 'on_way', label: 'Courier-এ আছে' },
  { id: 'delivered', label: 'Completed Orders' },
  { id: 'returned', label: 'Returned' },
  { id: 'cancelled', label: 'Failed / Cancelled' },
];

type RatioLocal = { total: number; success: number; cancel: number; pending: number };
type RatioSteadfast = {
  total?: number;
  success?: number;
  cancel?: number;
  success_rate?: number;
  fraud_reports?: any[];
  error?: string;
};
type RatioMeta = {
  cached?: boolean;
  stale?: boolean;
  fetched_at?: string | null;
  next_retry_at?: string | null;
};
type RatioPayload = {
  local: RatioLocal | null;
  steadfast: RatioSteadfast | null;
  meta: RatioMeta | null;
};

/**
 * Client-side report cache. The server already keeps a long-lived DB cache of the
 * Steadfast response (so its search quota is never spent twice on one number);
 * this just avoids repeating the round-trip while the admin browses orders.
 */
const RATIO_CACHE_TTL = 5 * 60 * 1000;
const ratioCache = new Map<string, { at: number; payload: RatioPayload }>();
const ratioInflight = new Map<string, Promise<RatioPayload>>();

function readRatioCache(phone: string): RatioPayload | null {
  const hit = ratioCache.get(phone);
  if (!hit) return null;
  if (Date.now() - hit.at > RATIO_CACHE_TTL) {
    ratioCache.delete(phone);
    return null;
  }
  return hit.payload;
}

async function fetchRatioReport(phone: string, force = false): Promise<RatioPayload> {
  if (!force) {
    const cached = readRatioCache(phone);
    if (cached) return cached;
    const running = ratioInflight.get(phone);
    if (running) return running;
  }

  const request = (async () => {
    const res = await fetch('/api/admin/orders/check-ratio', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, force }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || `HTTP ${res.status} Error`);
    if (!data.success) throw new Error(data.error || 'Failed to fetch ratio');

    const payload: RatioPayload = {
      local: data.local ?? null,
      steadfast: data.steadfast ?? null,
      meta: data.steadfast_meta ?? null,
    };
    ratioCache.set(phone, { at: Date.now(), payload });
    return payload;
  })();

  ratioInflight.set(phone, request);
  try {
    return await request;
  } finally {
    ratioInflight.delete(phone);
  }
}

function formatFetchedAt(iso?: string | null): string {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString('bn-BD', { dateStyle: 'medium', timeStyle: 'short' });
}

// Rendered with key={phone} so an edited number starts from a clean state.
function SteadfastRatioBadge({ phone }: { phone: string }) {
  // Reuse an already-cached report on mount; a lookup only ever runs on click.
  const [data, setData] = useState<{
    loading: boolean;
    steadfast?: RatioSteadfast | null;
    error?: string;
    clicked?: boolean;
  }>(() => {
    const cached = phone && phone !== '—' ? readRatioCache(phone) : null;
    return cached
      ? { loading: false, clicked: true, steadfast: cached.steadfast }
      : { loading: false, clicked: false };
  });

  const runCheck = async () => {
    if (!phone || phone === '—') {
      setData({ loading: false, clicked: true, error: 'No record' });
      return;
    }
    setData({ loading: true, clicked: true });
    try {
      const payload = await fetchRatioReport(phone);
      setData({ loading: false, clicked: true, steadfast: payload.steadfast });
    } catch (err: any) {
      setData({ loading: false, clicked: true, error: err?.message || 'Error' });
    }
  };

  const errorMessage = data.error || data.steadfast?.error;
  const successRate = data.steadfast && !data.steadfast.error ? data.steadfast.success_rate : undefined;

  if (data.loading) {
    return <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>লোড হচ্ছে...</span>;
  }

  if (!data.clicked) {
    return (
      <button
        onClick={(e) => {
          e.stopPropagation();
          runCheck();
        }}
        style={{
          background: 'rgba(74,158,255,0.1)',
          color: '#4a9eff',
          border: '1px solid rgba(74,158,255,0.25)',
          padding: '4px 8px',
          borderRadius: 6,
          fontSize: 11,
          fontWeight: 600,
          cursor: 'pointer',
          transition: 'all 0.2s',
        }}
        onMouseEnter={e => (e.currentTarget.style.background = 'rgba(74,158,255,0.2)')}
        onMouseLeave={e => (e.currentTarget.style.background = 'rgba(74,158,255,0.1)')}
      >
        Check Steadfast
      </button>
    );
  }

  if (errorMessage && errorMessage.toLowerCase().includes('rate limit')) {
    return (
      <span
        title={errorMessage}
        style={{
          fontSize: 11,
          fontWeight: 600,
          color: '#ff4a4a',
          background: 'rgba(255,74,74,0.1)',
          border: '1px solid rgba(255,74,74,0.2)',
          padding: '3px 8px',
          borderRadius: 6,
          display: 'inline-block',
          cursor: 'help'
        }}
      >
        এপিআই লিমিট শেষ
      </span>
    );
  }

  if (successRate !== undefined) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 3, fontSize: 11, minWidth: 120 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: successRate >= 80 ? '#44d375' : successRate >= 50 ? '#f5a623' : '#ff4a4a'
          }}></span>
          <span style={{
            color: successRate >= 80 ? '#44d375' : successRate >= 50 ? '#f5a623' : '#ff4a4a',
            fontWeight: 800
          }}>
            রেশিও: {successRate}%
          </span>
        </div>
        <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, marginTop: 1 }}>
          মোট পার্সেল: {data.steadfast?.total}টি (পূর্বে)
        </div>
      </div>
    );
  }

  if (errorMessage) {
    return (
      <span
        title={errorMessage}
        style={{
          fontSize: 11,
          fontWeight: 600,
          color: '#ff4a4a',
          background: 'rgba(255,74,74,0.1)',
          border: '1px solid rgba(255,74,74,0.2)',
          padding: '3px 8px',
          borderRadius: 6,
          display: 'inline-block',
          cursor: 'help'
        }}
      >
        চেক করা যায়নি
      </span>
    );
  }

  return (
    <span style={{
      fontSize: 11,
      fontWeight: 600,
      color: '#f5a623',
      background: 'rgba(245,166,35,0.1)',
      border: '1px solid rgba(245,166,35,0.2)',
      padding: '3px 8px',
      borderRadius: 6,
      display: 'inline-block'
    }}>
      নতুন কাস্টমার (১ম অর্ডার)
    </span>
  );
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pending');
  const [search, setSearch] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const [ratioData, setRatioData] = useState<{
    loading: boolean;
    local: RatioLocal | null;
    steadfast: RatioSteadfast | null;
    meta: RatioMeta | null;
    error: string | null;
  }>({ loading: false, local: null, steadfast: null, meta: null, error: null });

  const fetchRatioData = async (phone: string, force = false) => {
    if (!phone || phone === '—') return;

    // Re-opening the same order reuses the cached report instead of re-querying.
    if (!force) {
      const cached = readRatioCache(phone);
      if (cached) {
        setRatioData({ loading: false, local: cached.local, steadfast: cached.steadfast, meta: cached.meta, error: null });
        return;
      }
    }

    setRatioData(prev => ({ ...prev, loading: true, error: null }));
    try {
      const payload = await fetchRatioReport(phone, force);
      setRatioData({ loading: false, local: payload.local, steadfast: payload.steadfast, meta: payload.meta, error: null });
    } catch (err: any) {
      setRatioData(prev => ({ ...prev, loading: false, error: err?.message || 'Network Error' }));
    }
  };

  // Keyed on the phone number, not the order object — re-selecting the same
  // customer (e.g. after an edit refresh) must not trigger another lookup.
  const selectedPhone = selectedOrder?.phone ?? null;
  useEffect(() => {
    if (selectedPhone) {
      fetchRatioData(selectedPhone);
    } else {
      setRatioData({ loading: false, local: null, steadfast: null, meta: null, error: null });
    }
  }, [selectedPhone]);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<{
    name: string;
    phone: string;
    address: string;
    shipping: number;
    discount: number;
    items: Array<{ id: string; product_name: string; size: string; price: number; quantity: number }>;
  }>({ name: '', phone: '', address: '', shipping: 0, discount: 0, items: [] });
  const [isSendingToCourier, setIsSendingToCourier] = useState<string | null>(null);
  const [zoomedColor, setZoomedColor] = useState<string | null>(null);
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean; title: string; message: string; onConfirm: () => void; confirmText?: string; isDanger?: boolean;
  }>({ isOpen: false, title: '', message: '', onConfirm: () => {} });
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const askConfirm = (title: string, message: string, onConfirm: () => void, confirmText = 'Confirm', isDanger = false) => {
    setConfirmModal({ isOpen: true, title, message, onConfirm, confirmText, isDanger });
  };

  const fetchOrders = async (showLoader = true) => {
    if (showLoader) setLoading(true);
    try {
      const res = await fetch('/api/admin/orders');
      const data = await res.json();
      if (data.data) setOrders(data.data as Order[]);
    } catch (error) {
      console.error('Error fetching orders:', error);
      if (showLoader) toast.error('Failed to load orders');
    }
    if (showLoader) setLoading(false);
  };

  useEffect(() => {
    setTimeout(() => {
      fetchOrders(true);
    }, 0);
    pollingRef.current = setInterval(() => fetchOrders(false), 10000);
    return () => { if (pollingRef.current) clearInterval(pollingRef.current); };
  }, []);

  const updateStatus = async (id: string, newStatus: Order['status']) => {
    try {
      const res = await fetch('/api/admin/orders', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: newStatus }),
      });
      if (!res.ok) {
        const data = await res.json();
        alert(`Failed to update status: ${data.error}`);
      } else {
        if (selectedOrder && selectedOrder.id === id) {
          setSelectedOrder(prev => prev ? { ...prev, status: newStatus } : null);
        }
        fetchOrders(false);
      }
    } catch (err: unknown) {
      alert(`System error: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  const deleteOrder = async (id: string) => {
    askConfirm(
      'Delete Order Permanently?',
      'Are you sure you want to PERMANENTLY DELETE this order? This cannot be undone.',
      async () => {
        try {
          const res = await fetch('/api/admin/orders', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id }),
          });
          if (!res.ok) {
            const data = await res.json();
            toast.error(`Delete failed: ${data.error}`);
          } else {
            toast.success('Order deleted permanently');
            setSelectedOrder(null);
            fetchOrders(false);
          }
        } catch (err: unknown) {
          toast.error(`System error: ${err instanceof Error ? err.message : String(err)}`);
        }
      },
      'Delete Permanently',
      true
    );
  };

  const calculateEditTotals = (form: typeof editForm) => {
    const subtotal = form.items.reduce((acc, item) => acc + (Number(item.price) * Number(item.quantity)), 0);
    const total = subtotal + Number(form.shipping) - Number(form.discount);
    return { subtotal, total };
  };

  const handleItemChange = (index: number, field: string, value: string | number) => {
    setEditForm(prev => {
      const updatedItems = [...prev.items];
      updatedItems[index] = {
        ...updatedItems[index],
        [field]: value
      };
      return {
        ...prev,
        items: updatedItems
      };
    });
  };

  const saveCustomerInfo = async () => {
    if (!selectedOrder) return;
    
    const { subtotal, total } = calculateEditTotals(editForm);
    
    const payload = {
      id: selectedOrder.id,
      customer_name: editForm.name,
      phone: editForm.phone,
      address: editForm.address,
      shipping: editForm.shipping,
      discount: editForm.discount,
      subtotal,
      total,
      items: editForm.items.map(item => ({
        id: item.id,
        size: item.size || null,
        price: item.price,
        quantity: item.quantity
      }))
    };

    const res = await fetch('/api/admin/orders', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      alert('Failed to save order info');
    } else {
      const result = await res.json();
      if (result.data) {
        setSelectedOrder(result.data);
      } else {
        setSelectedOrder({
          ...selectedOrder,
          customer_name: editForm.name,
          phone: editForm.phone,
          address: editForm.address,
          shipping: editForm.shipping,
          discount: editForm.discount,
          subtotal,
          total,
          items: selectedOrder.items?.map(it => {
            const edited = editForm.items.find(e => e.id === it.id);
            return edited ? { ...it, size: edited.size || null, price: edited.price, quantity: edited.quantity } : it;
          })
        });
      }
      setIsEditing(false);
      fetchOrders(false);
    }
  };

  const sendToCourier = async (order: Order) => {
    setIsSendingToCourier(order.id);
    try {
      const payload = {
        order_id: order.id,
        invoice: order.order_id,
        customer_name: order.customer_name,
        customer_phone: order.phone,
        customer_address: order.address,
        amount_to_collect: order.payment_method === 'cash' ? order.total : 0,
        note: 'Order ID: ' + order.order_id,
      };
      const res = await fetch('/api/orders/send-to-courier', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        const cid: string | null = data.consignment_id || null;
        if (cid) {
          toast.success(`✅ Courier-এ পাঠানো হয়েছে!\nConsignment ID: ${cid}`, { duration: 7000 });
        } else {
          toast.success('Parcel sent to Steadfast successfully!');
        }
        if (selectedOrder && selectedOrder.id === order.id) {
          setSelectedOrder(prev => prev ? { ...prev, consignment_id: cid } : null);
        }
        fetchOrders(false);
      } else {
        toast.error(data.error || 'Failed to send to Steadfast');
      }
    } catch (error: unknown) {
      toast.error('System error: ' + (error instanceof Error ? error.message : String(error)));
    } finally {
      setIsSendingToCourier(null);
    }
  };

  // "pending" tab shows pending + received + preparing (all not-yet-couriered)
  const tabCount = (tabId: string) => orders.filter(o => {
    if (tabId === 'pending') return o.status === 'pending' || o.status === 'received' || o.status === 'preparing';
    if (tabId === 'cancelled') return o.status === 'cancelled' || o.status === 'payment_failed' || o.status === 'incomplete';
    return o.status === tabId;
  }).length;

  const filteredOrders = orders.filter(o => {
    const matchesTab =
      activeTab === 'pending'
        ? (o.status === 'pending' || o.status === 'received' || o.status === 'preparing')
        : activeTab === 'cancelled'
          ? (o.status === 'cancelled' || o.status === 'payment_failed' || o.status === 'incomplete')
          : o.status === activeTab;
    if (!matchesTab) return false;
    if (search) {
      const q = search.toLowerCase();
      return o.order_id.toLowerCase().includes(q) || o.customer_name.toLowerCase().includes(q) || o.phone.includes(q);
    }
    return true;
  });

  const fmt = (n: number) => `৳${n.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;

  const fmtDateTime = (iso: string) => {
    const d = new Date(iso);
    const date = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    const time = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    return { date, time };
  };

  const renderSendToCourierBtn = (order: Order, fullWidth = false) => (
    <button
      onClick={(e) => { e.stopPropagation(); sendToCourier(order); }}
      disabled={isSendingToCourier === order.id}
      style={{
        background: isSendingToCourier === order.id
          ? 'rgba(74,158,255,0.5)'
          : 'linear-gradient(135deg, #4a9eff 0%, #2563eb 100%)',
        color: 'white',
        border: 'none',
        padding: fullWidth ? '12px 16px' : '6px 12px',
        borderRadius: 8,
        fontSize: fullWidth ? 15 : 12,
        fontWeight: 700,
        cursor: isSendingToCourier === order.id ? 'not-allowed' : 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        width: fullWidth ? '100%' : 'auto',
        opacity: isSendingToCourier === order.id ? 0.7 : 1,
        transition: 'all 0.2s',
        boxShadow: isSendingToCourier === order.id ? 'none' : '0 2px 10px rgba(74,158,255,0.35)',
      }}
    >
      <Send size={fullWidth ? 16 : 13} />
      {isSendingToCourier === order.id ? 'Sending...' : 'Send to Courier'}
    </button>
  );

  const renderConsignmentIdBadge = (order: Order, large = false) => (
    large ? (
      <div style={{ background: 'rgba(68,211,117,0.1)', border: '1px solid rgba(68,211,117,0.35)', borderRadius: 10, padding: '14px 16px', textAlign: 'center' }}>
        <p style={{ fontSize: 11, color: '#44d375', fontWeight: 700, letterSpacing: 1.5, marginBottom: 6 }}>📦 STEADFAST CONSIGNMENT ID</p>
        <p style={{ fontSize: 24, fontWeight: 900, color: '#44d375', letterSpacing: 2 }}>#{order.consignment_id}</p>
      </div>
    ) : (
      <span style={{
        fontWeight: 800, color: '#44d375', fontSize: 12,
        background: 'rgba(68,211,117,0.12)', padding: '5px 10px',
        borderRadius: 6, border: '1px solid rgba(68,211,117,0.3)',
        whiteSpace: 'nowrap',
      }}>
        #{order.consignment_id}
      </span>
    )
  );

  const renderCompleteOrderBtn = (order: Order, fullWidth = false) => (
    <button
      onClick={(e) => { e.stopPropagation(); updateStatus(order.id, 'delivered'); }}
      style={{
        background: 'linear-gradient(135deg, #44d375 0%, #1fa855 100%)',
        color: 'white',
        border: 'none',
        padding: fullWidth ? '12px 16px' : '6px 12px',
        borderRadius: 8,
        fontSize: fullWidth ? 15 : 12,
        fontWeight: 700,
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        width: fullWidth ? '100%' : 'auto',
        transition: 'all 0.2s',
        boxShadow: '0 2px 10px rgba(68,211,117,0.35)',
      }}
    >
      <CheckCircle2 size={fullWidth ? 16 : 13} />
      Complete Order
    </button>
  );

  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#1a1a2e',
            color: '#fff',
            border: '1px solid rgba(255,255,255,0.12)',
            whiteSpace: 'pre-line',
            fontSize: 14,
          },
        }}
      />

      <div className="page-heading" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 20 }}>
        <div className="order-header-row" style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
          <div>
            <h1 className="page-title">Order Management</h1>
            <p className="page-subtitle">Track, update and manage customer orders.</p>
          </div>
          <div className="order-search-wrap" style={{ position: 'relative', width: 280 }}>
            <Search size={16} color="rgba(255,255,255,0.4)" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              placeholder="Search ID, Name or Phone..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', padding: '10px 14px 10px 38px', borderRadius: 8, color: '#fff', fontSize: 13, outline: 'none' }}
            />
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 5, width: '100%' }}>
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '8px 16px', borderRadius: 20, fontSize: 13, fontWeight: 500,
                cursor: 'pointer', border: '1px solid', transition: 'all 0.15s', whiteSpace: 'nowrap',
                background: activeTab === tab.id ? '#4a9eff' : 'rgba(255,255,255,0.05)',
                color: activeTab === tab.id ? '#fff' : 'rgba(255,255,255,0.6)',
                borderColor: activeTab === tab.id ? '#4a9eff' : 'rgba(255,255,255,0.1)',
              }}
            >
              {tab.label}
              <span style={{ background: activeTab === tab.id ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.1)', padding: '2px 8px', borderRadius: 10, marginLeft: 8, fontSize: 11 }}>
                {tabCount(tab.id)}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="data-table-wrap" style={{ marginTop: 20 }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Customer</th>
              <th>Order Date</th>
              <th>Product Image</th>
              <th>Product Size</th>
              <th>Address</th>
              <th>Total</th>
              <th>Ratio</th>
              {activeTab === 'on_way' && <th>Consignment ID</th>}
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={activeTab === 'on_way' ? 9 : 8} className="empty-state">Loading orders...</td></tr>
            ) : filteredOrders.length === 0 ? (
              <tr><td colSpan={activeTab === 'on_way' ? 9 : 8} className="empty-state">No orders found in this status.</td></tr>
            ) : (
              filteredOrders.map(order => (
                <tr key={order.id} style={{ cursor: 'pointer' }} onClick={() => setSelectedOrder(order)}>
                  {/* Customer */}
                  <td data-label="Customer">
                    <div>
                      <p style={{ fontWeight: 600, fontSize: 13 }}>{order.customer_name}</p>
                      <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', marginTop: 2 }}>{order.phone}</p>
                    </div>
                  </td>

                  {/* Order Date & Time */}
                  <td data-label="Order Date">
                    <div>
                      <p style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.75)' }}>{fmtDateTime(order.placed_at).date}</p>
                      <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', marginTop: 2 }}>{fmtDateTime(order.placed_at).time}</p>
                    </div>
                  </td>

                  {/* Product Image */}
                  <td data-label="Product Image">
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {order.items?.map((item, idx) => (
                        <div key={idx} style={{ width: 44, height: 44, borderRadius: 6, overflow: 'hidden', background: 'rgba(255,255,255,0.1)', position: 'relative', border: '1px solid rgba(255,255,255,0.1)' }} title={item.product_name}>
                          {item.image_url ? (
                            <img src={item.image_url} alt={item.product_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          ) : (
                            <ShoppingBag size={16} color="rgba(255,255,255,0.3)" style={{ position: 'absolute', top: 14, left: 14 }} />
                          )}
                          {item.quantity > 1 && (
                            <span style={{
                              position: 'absolute',
                              bottom: 2,
                              right: 2,
                              background: 'rgba(0,0,0,0.75)',
                              color: '#fff',
                              fontSize: 9,
                              fontWeight: 700,
                              padding: '1px 3px',
                              borderRadius: 3,
                              lineHeight: 1
                            }}>
                              x{item.quantity}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </td>

                  {/* Product Size */}
                  <td data-label="Product Size">
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                      {order.items?.map((item, idx) => {
                        const sizeVal = item.size || '—';
                        return (
                          <span key={idx} style={{
                            fontSize: 11,
                            fontWeight: 700,
                            color: item.size ? '#4a9eff' : 'rgba(255,255,255,0.3)',
                            background: item.size ? 'rgba(74,158,255,0.1)' : 'transparent',
                            border: item.size ? '1px solid rgba(74,158,255,0.25)' : 'none',
                            borderRadius: 4,
                            padding: item.size ? '2px 6px' : '0',
                            display: 'inline-block'
                          }}>
                            {sizeVal}
                          </span>
                        );
                      })}
                    </div>
                  </td>

                  {/* Address */}
                  <td data-label="Address">
                    <div style={{
                      maxWidth: 200,
                      fontSize: 12,
                      color: 'rgba(255,255,255,0.7)',
                      lineHeight: 1.4,
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }} title={order.address}>
                      {order.address}
                    </div>
                  </td>

                  {/* Total */}
                  <td data-label="Total"><span style={{ fontWeight: 600 }}>{fmt(order.total)}</span></td>

                  {/* Steadfast Ratio */}
                  <td data-label="Ratio">
                    <SteadfastRatioBadge key={order.phone} phone={order.phone} />
                  </td>

                  {/* Consignment ID — shown only in Courier tab */}
                  {activeTab === 'on_way' && (
                    <td data-label="Consignment ID" onClick={e => e.stopPropagation()}>
                      {order.consignment_id ? (
                        <span style={{
                          fontWeight: 800, color: '#44d375', fontSize: 13,
                          background: 'rgba(68,211,117,0.12)', padding: '3px 10px',
                          borderRadius: 6, border: '1px solid rgba(68,211,117,0.3)',
                        }}>
                          #{order.consignment_id}
                        </span>
                      ) : (
                        <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>—</span>
                      )}
                    </td>
                  )}

                  <td data-label="Action" onClick={e => e.stopPropagation()}>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                      {/* View button removed from here */}

                      {/* New / Pending → Send to Courier, or (once sent) Consignment ID + Complete Order */}
                      {(order.status === 'pending' || order.status === 'received' || order.status === 'preparing') && (
                        order.consignment_id ? (
                          <>
                            {renderConsignmentIdBadge(order)}
                            {renderCompleteOrderBtn(order)}
                          </>
                        ) : (
                          renderSendToCourierBtn(order)
                        )
                      )}

                      {/* On the Way → mark delivered/returned/cancelled */}
                      {order.status === 'on_way' && (
                        <div style={{ position: 'relative' }}>
                          <select
                            onChange={(e) => {
                              if (e.target.value === 'DELETE_ORDER') { deleteOrder(order.id); }
                              else if (e.target.value) { updateStatus(order.id, e.target.value as Order['status']); }
                              e.target.value = '';
                            }}
                            onClick={(e) => e.stopPropagation()}
                            style={{ background: '#4a9eff', color: 'white', border: 'none', padding: '6px 26px 6px 12px', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer', appearance: 'none', outline: 'none' }}
                            defaultValue=""
                          >
                            <option value="" disabled>Action...</option>
                            <option value="delivered">✅ Mark Delivered</option>
                            <option value="returned">📦 Not Received (Return)</option>
                            <option value="cancelled">❌ Cancel Order</option>
                            <option value="DELETE_ORDER">🗑 Permanent Delete</option>
                          </select>
                          <ChevronDown size={14} color="white" style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                        </div>
                      )}

                      {/* Incomplete / Abandoned checkout → confirm or delete */}
                      {order.status === 'incomplete' && (
                        <div style={{ position: 'relative' }}>
                          <select
                            onChange={(e) => {
                              if (e.target.value === 'DELETE_ORDER') { deleteOrder(order.id); }
                              else if (e.target.value) { updateStatus(order.id, e.target.value as Order['status']); }
                              e.target.value = '';
                            }}
                            onClick={(e) => e.stopPropagation()}
                            style={{ background: '#f5a623', color: '#000', border: 'none', padding: '6px 26px 6px 12px', borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: 'pointer', appearance: 'none', outline: 'none' }}
                            defaultValue=""
                          >
                            <option value="" disabled>Action...</option>
                            <option value="pending">✅ Move to New Orders</option>
                            <option value="cancelled">❌ Mark as Cancelled</option>
                            <option value="DELETE_ORDER">🗑 Delete Entry</option>
                          </select>
                          <ChevronDown size={14} color="#000" style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                        </div>
                      )}

                      {/* Delivered → edit */}
                      {order.status === 'delivered' && (
                        <div style={{ position: 'relative' }}>
                          <select
                            onChange={(e) => {
                              if (e.target.value === 'DELETE_ORDER') { deleteOrder(order.id); }
                              else if (e.target.value) {
                                askConfirm('Change Order Status?', 'এই completed অর্ডারটি পরিবর্তন করতে চান?', () => updateStatus(order.id, e.target.value as Order['status']));
                              }
                              e.target.value = '';
                            }}
                            onClick={(e) => e.stopPropagation()}
                            style={{ background: 'transparent', color: '#44d375', border: '1px solid rgba(68,211,117,0.5)', padding: '6px 26px 6px 12px', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer', appearance: 'none', outline: 'none' }}
                            defaultValue=""
                          >
                            <option value="" disabled>Edit Status...</option>
                            <option value="pending">Move to New Orders</option>
                            <option value="on_way">Move to Courier-এ আছে</option>
                            <option value="cancelled">Cancel Order</option>
                            <option value="DELETE_ORDER">Permanent Delete</option>
                          </select>
                          <ChevronDown size={14} color="#44d375" style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="modal-overlay" onClick={() => { setSelectedOrder(null); setIsEditing(false); }}>
          <div className="modal-box" style={{ maxWidth: 800, padding: 0 }} onClick={e => e.stopPropagation()}>
            {/* Modal Header */}
            <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.2)' }}>
              <div>
                <h2 style={{ fontSize: 18, fontWeight: 600, color: '#fff', marginBottom: 4 }}>Order: {selectedOrder.order_id}</h2>
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>Placed on {new Date(selectedOrder.placed_at).toLocaleString()}</p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                {/* Steadfast ID badge in header */}
                {selectedOrder.consignment_id && (
                  <div style={{ background: 'rgba(68,211,117,0.15)', border: '1px solid rgba(68,211,117,0.4)', borderRadius: 8, padding: '6px 14px', textAlign: 'center' }}>
                    <p style={{ fontSize: 10, color: '#44d375', fontWeight: 700, letterSpacing: 1, marginBottom: 2 }}>STEADFAST ID</p>
                    <p style={{ fontSize: 16, fontWeight: 900, color: '#44d375' }}>#{selectedOrder.consignment_id}</p>
                  </div>
                )}
                <span className="badge badge-active" style={{ fontSize: 12, textTransform: 'uppercase', background: 'rgba(255,255,255,0.1)' }}>
                  {selectedOrder.status.replace('_', ' ')}
                </span>
                <button onClick={() => { setSelectedOrder(null); setIsEditing(false); }} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer' }}>
                  <X size={20} />
                </button>
              </div>
            </div>

            <div style={{ padding: 24, display: 'grid', gridTemplateColumns: '1fr 300px', gap: 24 }}>
              {/* Left: Items + Delivery */}
              <div>
                <h3 style={{ fontSize: 14, fontWeight: 600, color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 16 }}>Items Ordered</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
                  {!isEditing ? (
                    selectedOrder.items?.map((item, i) => (
                      <div key={i} style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 10, border: '1px solid rgba(255,255,255,0.07)', overflow: 'hidden' }}>
                        {/* ── Product row ── */}
                        <div style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '12px 14px' }}>
                          <div style={{ width: 52, height: 52, borderRadius: 7, background: 'rgba(255,255,255,0.1)', overflow: 'hidden', position: 'relative', flexShrink: 0 }}>
                            {item.image_url
                              ? <img src={item.image_url} alt={item.product_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              : <ShoppingBag size={20} color="rgba(255,255,255,0.3)" style={{ position: 'absolute', top: 16, left: 16 }} />
                            }
                          </div>
                          <div style={{ flex: 1 }}>
                            <p style={{ fontWeight: 600, fontSize: 14, color: '#fff', marginBottom: 3 }}>{item.product_name}</p>
                            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)' }}>{fmt(item.price)} × {item.quantity}</p>
                          </div>
                          <p style={{ fontWeight: 700, fontSize: 15, color: '#fff', flexShrink: 0 }}>{fmt(item.price * item.quantity)}</p>
                        </div>

                        {/* ── Size & Color section ── */}
                        {(item.size || item.color) && (
                          <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: '10px 14px', background: 'rgba(0,0,0,0.15)', display: 'flex', gap: 20, alignItems: 'center', flexWrap: 'wrap' }}>
                            {item.size && (
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <span style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: 1 }}>SIZE</span>
                                <span style={{ fontSize: 15, fontWeight: 800, color: '#4a9eff', background: 'rgba(74,158,255,0.12)', border: '1.5px solid rgba(74,158,255,0.35)', borderRadius: 6, padding: '3px 12px', letterSpacing: 0.5 }}>
                                  {item.size}
                                </span>
                              </div>
                            )}
                            {item.color && (
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <span style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: 1 }}>COLOR</span>
                                {item.color.startsWith('http') || item.color.startsWith('/')
                                  ? (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                      <img
                                        src={item.color}
                                        alt="selected color"
                                        onClick={() => setZoomedColor(item.color!)}
                                        style={{ width: 40, height: 40, borderRadius: 6, objectFit: 'cover', border: '2px solid rgba(255,255,255,0.25)', flexShrink: 0, cursor: 'zoom-in', transition: 'transform 0.15s', }}
                                        onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.08)')}
                                        onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
                                      />
                                      <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>ক্লিক করে বড় দেখুন</span>
                                    </div>
                                  )
                                  : (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                      <div style={{ width: 28, height: 28, borderRadius: 6, background: item.color, border: '2px solid rgba(255,255,255,0.2)', flexShrink: 0 }} />
                                      <span style={{ fontSize: 12, fontWeight: 600, color: '#fff' }}>{item.color}</span>
                                    </div>
                                  )
                                }
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    editForm.items?.map((item, index) => (
                      <div key={index} style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 10, border: '1px solid rgba(255,255,255,0.07)', padding: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
                        <p style={{ fontWeight: 600, fontSize: 14, color: '#fff' }}>{item.product_name}</p>
                        
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                          <div>
                            <label style={{ display: 'block', fontSize: 11, color: 'rgba(255,255,255,0.5)', marginBottom: 4 }}>Size</label>
                            <input
                              type="text"
                              value={item.size}
                              onChange={e => handleItemChange(index, 'size', e.target.value)}
                              style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', padding: '6px 8px', borderRadius: 4, color: '#fff', fontSize: 12 }}
                              placeholder="e.g. M, XL"
                            />
                          </div>
                          <div>
                            <label style={{ display: 'block', fontSize: 11, color: 'rgba(255,255,255,0.5)', marginBottom: 4 }}>Price (৳)</label>
                            <input
                              type="number"
                              value={item.price}
                              onChange={e => handleItemChange(index, 'price', parseFloat(e.target.value) || 0)}
                              style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', padding: '6px 8px', borderRadius: 4, color: '#fff', fontSize: 12 }}
                            />
                          </div>
                          <div>
                            <label style={{ display: 'block', fontSize: 11, color: 'rgba(255,255,255,0.5)', marginBottom: 4 }}>Quantity</label>
                            <input
                              type="number"
                              value={item.quantity}
                              onChange={e => handleItemChange(index, 'quantity', parseInt(e.target.value) || 1)}
                              style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', padding: '6px 8px', borderRadius: 4, color: '#fff', fontSize: 12 }}
                              min="1"
                            />
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <h3 style={{ fontSize: 14, fontWeight: 600, color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: 1, margin: 0 }}>Delivery Information</h3>
                  {!isEditing ? (
                    <button
                      onClick={() => {
                        setEditForm({
                          name: selectedOrder.customer_name,
                          phone: selectedOrder.phone,
                          address: selectedOrder.address,
                          shipping: Number(selectedOrder.shipping),
                          discount: Number(selectedOrder.discount),
                          items: (selectedOrder.items || []).map(item => ({
                            id: item.id,
                            product_name: item.product_name,
                            size: item.size || '',
                            price: Number(item.price),
                            quantity: Number(item.quantity)
                          }))
                        });
                        setIsEditing(true);
                      }}
                      style={{ background: 'none', border: 'none', color: '#4a9eff', fontSize: 12, cursor: 'pointer' }}
                    >
                      Edit Info
                    </button>
                  ) : (
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={() => setIsEditing(false)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', fontSize: 12, cursor: 'pointer' }}>Cancel</button>
                      <button onClick={saveCustomerInfo} style={{ background: '#4a9eff', border: 'none', color: '#fff', fontSize: 12, padding: '4px 8px', borderRadius: 4, cursor: 'pointer' }}>Save</button>
                    </div>
                  )}
                </div>
                <div style={{ background: 'rgba(255,255,255,0.03)', padding: 16, borderRadius: 8, border: '1px solid rgba(255,255,255,0.05)', marginBottom: 20 }}>
                  {!isEditing ? (
                    <>
                      <p style={{ fontSize: 15, fontWeight: 600, color: '#fff', marginBottom: 4 }}>{selectedOrder.customer_name}</p>
                      <p style={{ fontSize: 14, color: '#4a9eff', marginBottom: 8 }}>{selectedOrder.phone}</p>
                      <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', lineHeight: 1.5 }}>{selectedOrder.address}</p>
                      {selectedOrder.ip_address && (
                        <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                          <span style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: 1 }}>Client IP</span>
                          <p style={{ fontSize: 13, fontFamily: 'monospace', color: 'rgba(255,255,255,0.6)', marginTop: 4 }}>
                            {selectedOrder.ip_address}
                          </p>
                        </div>
                      )}
                    </>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      <input value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', padding: '8px', borderRadius: 4, color: '#fff', fontSize: 13 }} placeholder="Customer Name" />
                      <input value={editForm.phone} onChange={e => setEditForm({ ...editForm, phone: e.target.value })} style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', padding: '8px', borderRadius: 4, color: '#fff', fontSize: 13 }} placeholder="Phone Number" />
                      <textarea value={editForm.address} onChange={e => setEditForm({ ...editForm, address: e.target.value })} style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', padding: '8px', borderRadius: 4, color: '#fff', fontSize: 13, resize: 'vertical', minHeight: 60 }} placeholder="Full Delivery Address" />
                    </div>
                  )}
                </div>

                {/* Courier & Fraud Assessment */}
                {!isEditing && (
                  <div style={{ marginTop: 24 }}>
                    <h3 style={{ fontSize: 14, fontWeight: 600, color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 16 }}>কুরিয়ার ও ফ্রড চেক রিপোর্ট</h3>
                    <div style={{ background: 'rgba(255,255,255,0.03)', padding: 16, borderRadius: 8, border: '1px solid rgba(255,255,255,0.05)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 10, color: ratioData.meta?.stale ? '#f5a623' : 'rgba(255,255,255,0.35)' }}>
                          {ratioData.meta?.fetched_at
                            ? `${ratioData.meta.stale ? '⚠️ পুরোনো (সেভ করা) ডেটা দেখানো হচ্ছে — সর্বশেষ' : 'সর্বশেষ আপডেট'}: ${formatFetchedAt(ratioData.meta.fetched_at)}`
                            : ''}
                          {ratioData.meta?.next_retry_at
                            ? ` · পরবর্তী চেষ্টা: ${formatFetchedAt(ratioData.meta.next_retry_at)}`
                            : ''}
                        </span>
                        <button
                          onClick={() => fetchRatioData(selectedOrder.phone, true)}
                          disabled={ratioData.loading}
                          title="স্টেডফাস্ট থেকে নতুন করে ডেটা আনুন (এপিআই সার্চ লিমিট খরচ হবে)"
                          style={{
                            background: 'rgba(74,158,255,0.1)',
                            color: '#4a9eff',
                            border: '1px solid rgba(74,158,255,0.25)',
                            padding: '4px 10px',
                            borderRadius: 6,
                            fontSize: 11,
                            fontWeight: 600,
                            cursor: ratioData.loading ? 'not-allowed' : 'pointer',
                            opacity: ratioData.loading ? 0.5 : 1,
                          }}
                        >
                          রিফ্রেশ
                        </button>
                      </div>
                      {ratioData.loading ? (
                        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>স্টেডফাস্ট ডেলিভারি হিস্ট্রি ও কাস্টমার রিপোর্ট লোড হচ্ছে...</p>
                      ) : ratioData.error ? (
                        <p style={{ fontSize: 13, color: '#ff4a4a' }}>রিপোর্ট লোড করতে ব্যর্থ হয়েছে: {ratioData.error}</p>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                          {/* Local Stats */}
                          <div>
                            <span style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: 1 }}>এই শপের অতীত অর্ডার হিস্ট্রি (Local Store History)</span>
                            <div style={{ display: 'flex', gap: 10, marginTop: 8, flexWrap: 'wrap' }}>
                              <div style={{ background: 'rgba(255,255,255,0.02)', padding: '8px 12px', borderRadius: 6, flex: 1, minWidth: 80, border: '1px solid rgba(255,255,255,0.04)' }}>
                                <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', margin: 0 }}>মোট অর্ডার</p>
                                <p style={{ fontSize: 15, fontWeight: 700, color: '#fff', margin: '4px 0 0' }}>{ratioData.local?.total ?? 0}</p>
                              </div>
                              <div style={{ background: 'rgba(68,211,117,0.05)', padding: '8px 12px', borderRadius: 6, flex: 1, minWidth: 80, border: '1px solid rgba(68,211,117,0.1)' }}>
                                <p style={{ fontSize: 10, color: 'rgba(68,211,117,0.6)', margin: 0 }}>সফল ডেলিভারি</p>
                                <p style={{ fontSize: 15, fontWeight: 700, color: '#44d375', margin: '4px 0 0' }}>{ratioData.local?.success ?? 0}</p>
                              </div>
                              <div style={{ background: 'rgba(255,74,74,0.05)', padding: '8px 12px', borderRadius: 6, flex: 1, minWidth: 80, border: '1px solid rgba(255,74,74,0.1)' }}>
                                <p style={{ fontSize: 10, color: 'rgba(255,74,74,0.6)', margin: 0 }}>রিটার্ন/ক্যানসেল</p>
                                <p style={{ fontSize: 15, fontWeight: 700, color: '#ff4a4a', margin: '4px 0 0' }}>{ratioData.local?.cancel ?? 0}</p>
                              </div>
                              <div style={{ background: 'rgba(74,158,255,0.05)', padding: '8px 12px', borderRadius: 6, flex: 1, minWidth: 80, border: '1px solid rgba(74,158,255,0.1)' }}>
                                <p style={{ fontSize: 10, color: 'rgba(74,158,255,0.6)', margin: 0 }}>চলতি অর্ডার</p>
                                <p style={{ fontSize: 15, fontWeight: 700, color: '#4a9eff', margin: '4px 0 0' }}>{ratioData.local?.pending ?? 0}</p>
                              </div>
                            </div>
                          </div>

                          {/* Steadfast Stats */}
                          <div>
                            <span style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: 1 }}>স্টেডফাস্ট কুরিয়ার রিপোর্ট (গ্লোবাল ডেটা)</span>
                            {ratioData.steadfast ? (
                              ratioData.steadfast.error ? (
                                <div style={{
                                  marginTop: 8,
                                  padding: 12,
                                  borderRadius: 8,
                                  background: 'rgba(255,74,74,0.06)',
                                  border: '1px solid rgba(255,74,74,0.2)',
                                  fontSize: 12,
                                  color: '#ff4a4a',
                                  fontWeight: 600,
                                  lineHeight: 1.5
                                }}>
                                  {ratioData.steadfast.error.toLowerCase().includes('rate limit')
                                    ? '⚠️ স্টেডফাস্ট এপিআই সার্চ লিমিট শেষ হয়েছে (Rate Limit Exceeded)। অনুগ্রহ করে আপনার মার্চেন্ট পোর্টালে লিমিট চেক করুন বা পরবর্তীতে চেষ্টা করুন।'
                                    : `⚠️ ত্রুটি: ${ratioData.steadfast.error}`}
                                </div>
                              ) : (
                                <div style={{ marginTop: 8 }}>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                                    <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)' }}>ডেলিভারি সাকসেস রেট:</span>
                                    <span style={{
                                      fontWeight: 800,
                                      fontSize: 16,
                                      color: (ratioData.steadfast.success_rate ?? 0) >= 80 ? '#44d375' : (ratioData.steadfast.success_rate ?? 0) >= 50 ? '#f5a623' : '#ff4a4a'
                                    }}>
                                      {ratioData.steadfast.success_rate}%
                                    </span>
                                  </div>
                                  <div style={{ height: 6, width: '100%', background: 'rgba(255,255,255,0.08)', borderRadius: 3, overflow: 'hidden', marginBottom: 12 }}>
                                    <div style={{
                                      height: '100%',
                                      width: `${ratioData.steadfast.success_rate ?? 0}%`,
                                      background: (ratioData.steadfast.success_rate ?? 0) >= 80 ? '#44d375' : (ratioData.steadfast.success_rate ?? 0) >= 50 ? '#f5a623' : '#ff4a4a',
                                      borderRadius: 3
                                    }} />
                                  </div>
                                  <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                                    <div style={{ background: 'rgba(255,255,255,0.02)', padding: '6px 10px', borderRadius: 6, flex: 1, minWidth: 70, border: '1px solid rgba(255,255,255,0.04)' }}>
                                      <p style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', margin: 0 }}>মোট পার্সেল</p>
                                      <p style={{ fontSize: 14, fontWeight: 700, color: '#fff', margin: '2px 0 0' }}>{ratioData.steadfast.total}</p>
                                    </div>
                                    <div style={{ background: 'rgba(68,211,117,0.05)', padding: '6px 10px', borderRadius: 6, flex: 1, minWidth: 70, border: '1px solid rgba(68,211,117,0.1)' }}>
                                      <p style={{ fontSize: 9, color: 'rgba(68,211,117,0.6)', margin: 0 }}>সফল ডেলিভারি</p>
                                      <p style={{ fontSize: 14, fontWeight: 700, color: '#44d375', margin: '2px 0 0' }}>{ratioData.steadfast.success}</p>
                                    </div>
                                    <div style={{ background: 'rgba(255,74,74,0.05)', padding: '6px 10px', borderRadius: 6, flex: 1, minWidth: 70, border: '1px solid rgba(255,74,74,0.1)' }}>
                                      <p style={{ fontSize: 9, color: 'rgba(255,74,74,0.6)', margin: 0 }}>ফেরত/ক্যানসেল</p>
                                      <p style={{ fontSize: 14, fontWeight: 700, color: '#ff4a4a', margin: '2px 0 0' }}>{ratioData.steadfast.cancel}</p>
                                    </div>
                                  </div>

                                  {/* Fraud Warning / Recommendations */}
                                  <div style={{
                                    marginTop: 14,
                                    padding: 10,
                                    borderRadius: 6,
                                    background: (ratioData.steadfast.success_rate ?? 0) >= 80 ? 'rgba(68,211,117,0.05)' : (ratioData.steadfast.success_rate ?? 0) >= 50 ? 'rgba(245,166,35,0.05)' : 'rgba(255,74,74,0.05)',
                                    border: `1px solid ${(ratioData.steadfast.success_rate ?? 0) >= 80 ? 'rgba(68,211,117,0.15)' : (ratioData.steadfast.success_rate ?? 0) >= 50 ? 'rgba(245,166,35,0.15)' : 'rgba(255,74,74,0.15)'}`,
                                    fontSize: 12,
                                    color: (ratioData.steadfast.success_rate ?? 0) >= 80 ? '#44d375' : (ratioData.steadfast.success_rate ?? 0) >= 50 ? '#f5a623' : '#ff4a4a',
                                    fontWeight: 600,
                                    textAlign: 'center'
                                  }}>
                                    {(ratioData.steadfast.success_rate ?? 0) >= 80 ? (
                                      <span>✅ নিরাপদ কাস্টমার — অর্ডার কনফার্ম করতে পারেন।</span>
                                    ) : (ratioData.steadfast.success_rate ?? 0) >= 50 ? (
                                      <span>⚠️ মাঝারি রিস্ক — কাস্টমারের সাথে কথা বলে নিশ্চিত হয়ে নিন।</span>
                                    ) : (
                                      <span>🚨 উচ্চ রিস্ক / ফেইক কাস্টমার — এডভান্স পেমেন্ট ছাড়া অর্ডার পাঠাবেন না!</span>
                                    )}
                                  </div>

                                  {/* Fraud Reports/Comments from other merchants */}
                                  {ratioData.steadfast.fraud_reports && ratioData.steadfast.fraud_reports.length > 0 && (
                                    <div style={{ marginTop: 16 }}>
                                      <span style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: 1 }}>মার্চেন্ট ফিডব্যাক / কমেন্ট সমূহ ({ratioData.steadfast.fraud_reports.length})</span>
                                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 8 }}>
                                        {ratioData.steadfast.fraud_reports.map((report: any, idx: number) => {
                                          const commentText = typeof report === 'string'
                                            ? report
                                            : (report.comment || report.comments || report.reason || report.report || report.details || report.msg || report.message || '');
                                          const reporterName = typeof report === 'object'
                                            ? (report.name || report.customer_name || report.reported_name || report.merchant || report.shop || report.reported_by || '')
                                            : '';
                                          const reportDate = typeof report === 'object'
                                            ? (report.date || report.created_at || report.reported_at || report.time || report.timestamp || '')
                                            : '';
                                          const reportPhone = typeof report === 'object'
                                            ? (report.phone || report.number || '')
                                            : '';

                                          if (!commentText) return null;

                                          return (
                                            <div key={idx} style={{ background: 'rgba(255,74,74,0.04)', border: '1px solid rgba(255,74,74,0.15)', borderRadius: 8, padding: '10px 12px' }}>
                                              {(reportPhone || reporterName) && (
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                                                  <span style={{ fontSize: 11, fontWeight: 600, color: '#ff4a4a' }}>
                                                    {reporterName || reportPhone}
                                                  </span>
                                                </div>
                                              )}
                                              <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.85)', lineHeight: 1.4, margin: 0 }}>
                                                {commentText}
                                              </p>
                                              {reportDate && (
                                                <p style={{ fontSize: 9, color: 'rgba(255,255,255,0.35)', marginTop: 6, marginBottom: 0 }}>
                                                  {reportDate}
                                                </p>
                                              )}
                                            </div>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )
                            ) : (
                              <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', margin: '8px 0 0' }}>এই নাম্বারে কুরিয়ারে ইতিপূর্বে কোনো পার্সেল পাঠানোর গ্লোবাল রেকর্ড পাওয়া যায়নি।</p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Right: Summary + Actions */}
              <div>
                <h3 style={{ fontSize: 14, fontWeight: 600, color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 16 }}>Order Summary</h3>
                <div style={{ background: 'rgba(255,255,255,0.03)', padding: 16, borderRadius: 8, border: '1px solid rgba(255,255,255,0.05)', marginBottom: 24 }}>
                  {!isEditing ? (
                    <>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10, fontSize: 13, color: 'rgba(255,255,255,0.7)' }}><span>Subtotal</span><span>{fmt(selectedOrder.subtotal)}</span></div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10, fontSize: 13, color: 'rgba(255,255,255,0.7)' }}><span>Shipping</span><span>{fmt(selectedOrder.shipping)}</span></div>
                      {selectedOrder.discount > 0 && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10, fontSize: 13, color: '#f5a623' }}><span>Discount</span><span>-{fmt(selectedOrder.discount)}</span></div>
                      )}
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12, paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.1)', fontSize: 16, fontWeight: 700, color: '#fff' }}>
                        <span>Total</span><span style={{ color: '#4a9eff' }}>{fmt(selectedOrder.total)}</span>
                      </div>
                    </>
                  ) : (() => {
                    const { subtotal, total } = calculateEditTotals(editForm);
                    return (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'rgba(255,255,255,0.7)' }}>
                          <span>Subtotal</span>
                          <span>{fmt(subtotal)}</span>
                        </div>
                        
                        <div>
                          <label style={{ display: 'block', fontSize: 11, color: 'rgba(255,255,255,0.5)', marginBottom: 4 }}>Shipping (৳)</label>
                          <input
                            type="number"
                            value={editForm.shipping}
                            onChange={e => setEditForm({ ...editForm, shipping: parseFloat(e.target.value) || 0 })}
                            style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', padding: '6px 8px', borderRadius: 4, color: '#fff', fontSize: 13 }}
                          />
                        </div>
                        
                        <div>
                          <label style={{ display: 'block', fontSize: 11, color: 'rgba(255,255,255,0.5)', marginBottom: 4 }}>Discount (৳)</label>
                          <input
                            type="number"
                            value={editForm.discount}
                            onChange={e => setEditForm({ ...editForm, discount: parseFloat(e.target.value) || 0 })}
                            style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', padding: '6px 8px', borderRadius: 4, color: '#fff', fontSize: 13 }}
                          />
                        </div>
                        
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12, paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.1)', fontSize: 16, fontWeight: 700, color: '#fff' }}>
                          <span>Total</span>
                          <span style={{ color: '#4a9eff' }}>{fmt(total)}</span>
                        </div>
                      </div>
                    );
                  })()}
                </div>

                <h3 style={{ fontSize: 14, fontWeight: 600, color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 16 }}>Payment</h3>
                <div style={{ background: 'rgba(255,255,255,0.03)', padding: 16, borderRadius: 8, border: '1px solid rgba(255,255,255,0.05)', marginBottom: 24 }}>
                  <span className={`badge ${selectedOrder.payment_method === 'cash' ? 'badge-inactive' : 'badge-active'}`} style={{ fontSize: 13, display: 'block', textAlign: 'center', padding: '8px' }}>
                    {selectedOrder.payment_method === 'cash' ? 'Cash on Delivery' : 'Online Payment (' + selectedOrder.payment_method + ')'}
                  </span>
                  {selectedOrder.payment_method !== 'cash' && (
                    <p style={{ textAlign: 'center', fontSize: 12, color: '#44d375', marginTop: 8 }}>Paid: {fmt(selectedOrder.amount_paid)}</p>
                  )}
                </div>

                <h3 style={{ fontSize: 14, fontWeight: 600, color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 16 }}>Actions</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

                  {/* Pending → Send to Courier, or (once sent) Consignment ID + Complete Order */}
                  {(selectedOrder.status === 'pending' || selectedOrder.status === 'received' || selectedOrder.status === 'preparing') && (
                    selectedOrder.consignment_id ? (
                      <>
                        {renderConsignmentIdBadge(selectedOrder, true)}
                        {renderCompleteOrderBtn(selectedOrder, true)}
                      </>
                    ) : (
                      renderSendToCourierBtn(selectedOrder, true)
                    )
                  )}

                  {/* On the Way → show consignment ID + delivery outcome */}
                  {selectedOrder.status === 'on_way' && (
                    <>
                      {selectedOrder.consignment_id && (
                        <div style={{ background: 'rgba(68,211,117,0.1)', border: '1px solid rgba(68,211,117,0.35)', borderRadius: 10, padding: '14px 16px', textAlign: 'center' }}>
                          <p style={{ fontSize: 11, color: '#44d375', fontWeight: 700, letterSpacing: 1.5, marginBottom: 6 }}>📦 STEADFAST CONSIGNMENT ID</p>
                          <p style={{ fontSize: 24, fontWeight: 900, color: '#44d375', letterSpacing: 2 }}>#{selectedOrder.consignment_id}</p>
                        </div>
                      )}
                      <div style={{ position: 'relative', width: '100%' }}>
                        <select
                          onChange={(e) => { if (e.target.value) updateStatus(selectedOrder.id, e.target.value as Order['status']); e.target.value = ''; }}
                          style={{ width: '100%', background: '#4a9eff', color: 'white', border: 'none', padding: '12px', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer', appearance: 'none', outline: 'none' }}
                          defaultValue=""
                        >
                          <option value="" disabled>Select Delivery Action...</option>
                          <option value="delivered">✅ Mark as Delivered</option>
                          <option value="returned">📦 Not Received (Returned)</option>
                          <option value="cancelled">❌ Cancel Order</option>
                        </select>
                        <ChevronDown size={18} color="white" style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                      </div>
                    </>
                  )}

                  {/* Returned */}
                  {selectedOrder.status === 'returned' && (
                    <div style={{ background: 'rgba(245,166,35,0.1)', border: '1px solid rgba(245,166,35,0.2)', padding: 16, borderRadius: 8, textAlign: 'center', color: '#f5a623', fontSize: 13, fontWeight: 600 }}>
                      <Package size={24} style={{ margin: '0 auto 8px' }} />
                      Order Returned (Not Received)
                    </div>
                  )}

                  {/* Cancelled / Payment Failed */}
                  {(selectedOrder.status === 'cancelled' || selectedOrder.status === 'payment_failed') && (
                    <div style={{ background: 'rgba(255,74,74,0.1)', border: '1px solid rgba(255,74,74,0.2)', padding: 16, borderRadius: 8, textAlign: 'center', color: '#ff4a4a', fontSize: 13, fontWeight: 600 }}>
                      <X size={24} style={{ margin: '0 auto 8px' }} />
                      Order Cancelled / Failed
                    </div>
                  )}

                  {/* Incomplete / Abandoned Checkout */}
                  {selectedOrder.status === 'incomplete' && (
                    <>
                      <div style={{ background: 'rgba(245,166,35,0.12)', border: '1px solid rgba(245,166,35,0.35)', padding: 16, borderRadius: 8, textAlign: 'center', color: '#f5a623', fontSize: 13, fontWeight: 600 }}>
                        <Package size={24} style={{ margin: '0 auto 8px' }} />
                        Incomplete Order — Customer abandoned checkout.<br />
                        <span style={{ fontSize: 11, fontWeight: 400, opacity: 0.8 }}>Call the customer and use the button below if they agree to buy.</span>
                      </div>
                      <button
                        onClick={() => {
                          askConfirm(
                            'Confirm this Order?',
                            'এই incomplete অর্ডারটি নিশ্চিত করে New Orders-এ নিয়ে যাবেন?',
                            () => updateStatus(selectedOrder.id, 'pending'),
                            'হ্যাঁ, Confirm করুন'
                          );
                        }}
                        style={{ width: '100%', background: '#f5a623', color: '#000', border: 'none', padding: '12px', borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}
                      >
                        ✅ Confirm & Move to New Orders
                      </button>
                      <button
                        onClick={() => updateStatus(selectedOrder.id, 'cancelled')}
                        style={{ width: '100%', background: 'transparent', color: '#ff4a4a', border: '1px dashed #ff4a4a', padding: '10px', borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: 'pointer' }}
                      >
                        ❌ Mark as Cancelled
                      </button>
                    </>
                  )}

                  {/* Delivered */}
                  {selectedOrder.status === 'delivered' && (
                    <>
                      <div style={{ background: 'rgba(68,211,117,0.1)', border: '1px solid rgba(68,211,117,0.2)', padding: 16, borderRadius: 8, textAlign: 'center', color: '#44d375', fontSize: 13, fontWeight: 600 }}>
                        <CheckCircle2 size={24} style={{ margin: '0 auto 8px' }} />
                        Order Completed
                      </div>
                      <div style={{ position: 'relative', width: '100%', marginTop: 4 }}>
                        <select
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val) { askConfirm('অর্ডার পরিবর্তন করুন', 'এই কমপ্লিটেড অর্ডারটি পরিবর্তন করতে চান?', () => updateStatus(selectedOrder.id, val as Order['status']), 'হ্যাঁ, পরিবর্তন করুন', true); }
                            e.target.value = '';
                          }}
                          style={{ width: '100%', background: 'transparent', color: '#44d375', border: '1px dashed rgba(68,211,117,0.5)', padding: '10px 12px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', appearance: 'none', outline: 'none' }}
                          defaultValue=""
                        >
                          <option value="" disabled>Revert / Edit...</option>
                          <option value="pending">Move to New Orders</option>
                          <option value="on_way">Move to Courier-এ আছে</option>
                          <option value="cancelled">Cancel Order</option>
                        </select>
                        <ChevronDown size={18} color="#44d375" style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                      </div>
                    </>
                  )}

                  {/* Bottom danger actions */}
                  <div style={{ marginTop: 8, paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.1)', display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {(selectedOrder.status === 'cancelled' || selectedOrder.status === 'payment_failed' || selectedOrder.status === 'returned') && (
                      <button
                        onClick={() => { askConfirm('Reactivate Order?', 'Are you sure you want to reactivate this order and move it to New Orders?', () => updateStatus(selectedOrder.id, 'pending')); }}
                        style={{ width: '100%', background: 'transparent', color: '#f5a623', border: '1px solid #f5a623', padding: '10px', borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: 'pointer' }}
                      >
                        Reactivate Order (Move to Pending)
                      </button>
                    )}
                    {/* incomplete has its own confirm/cancel buttons in the section above */}
                    <button
                      onClick={() => deleteOrder(selectedOrder.id)}
                      style={{ width: '100%', background: 'rgba(255,74,74,0.1)', color: '#ff4a4a', border: '1px dashed #ff4a4a', padding: '10px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
                    >
                      Permanently Delete Order
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal({ ...confirmModal, isOpen: false })}
        confirmText={confirmModal.confirmText}
        isDanger={confirmModal.isDanger}
      />

      {/* ── Color Image Lightbox ── */}
      {zoomedColor && (
        <div
          onClick={() => setZoomedColor(null)}
          style={{
            position: 'fixed', inset: 0, zIndex: 99999,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(0,0,0,0.82)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            cursor: 'zoom-out',
            animation: 'fadeIn 0.18s ease',
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              position: 'relative',
              borderRadius: 16,
              overflow: 'hidden',
              boxShadow: '0 32px 80px rgba(0,0,0,0.7)',
              maxWidth: 'min(88vw, 480px)',
              maxHeight: 'min(88vh, 480px)',
              animation: 'scaleIn 0.18s ease',
            }}
          >
            <img
              src={zoomedColor}
              alt="Selected color"
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            />
            {/* Close button */}
            <button
              onClick={() => setZoomedColor(null)}
              style={{
                position: 'absolute', top: 10, right: 10,
                width: 32, height: 32, borderRadius: '50%',
                background: 'rgba(0,0,0,0.6)', border: 'none',
                color: '#fff', fontSize: 18, lineHeight: '32px', textAlign: 'center',
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                backdropFilter: 'blur(4px)',
              }}
            >
              <X size={16} />
            </button>
            {/* Label */}
            <div style={{
              position: 'absolute', bottom: 0, left: 0, right: 0,
              background: 'linear-gradient(transparent, rgba(0,0,0,0.7))',
              padding: '20px 16px 14px',
              color: '#fff', fontSize: 13, fontWeight: 600, textAlign: 'center',
              letterSpacing: 0.5,
            }}>
              Selected Color
            </div>
          </div>
          {/* Click outside hint */}
          <p style={{
            position: 'fixed', bottom: 24, left: 0, right: 0,
            textAlign: 'center', color: 'rgba(255,255,255,0.4)',
            fontSize: 12, pointerEvents: 'none',
          }}>
            যেকোনো জায়গায় ক্লিক করে বন্ধ করুন
          </p>
        </div>
      )}
      <style>{`
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes scaleIn { from { transform: scale(0.88); opacity: 0 } to { transform: scale(1); opacity: 1 } }
      `}</style>
    </>
  );
}

function ConfirmModal({ isOpen, title, message, onConfirm, onCancel, confirmText, isDanger }: {
  isOpen: boolean; title: string; message: string;
  onConfirm: () => void; onCancel: () => void;
  confirmText?: string; isDanger?: boolean;
}) {
  if (!isOpen) return null;
  return (
    <div className="modal-overlay" style={{ zIndex: 9999 }}>
      <div className="modal-box" style={{ maxWidth: 450, padding: 30, textAlign: 'center' }}>
        <div style={{ width: 60, height: 60, borderRadius: 30, background: isDanger ? 'rgba(255,74,74,0.1)' : 'rgba(74,158,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
          {isDanger ? <X size={30} color="#ff4a4a" /> : <ShoppingBag size={30} color="#4a9eff" />}
        </div>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: '#fff', marginBottom: 12 }}>{title}</h2>
        <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)', lineHeight: 1.6, marginBottom: 30 }}>{message}</p>
        <div style={{ display: 'flex', gap: 12 }}>
          <button onClick={onCancel} style={{ flex: 1, padding: '12px', borderRadius: 8, background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
          <button onClick={() => { onConfirm(); onCancel(); }} style={{ flex: 1, padding: '12px', borderRadius: 8, background: isDanger ? '#ff4a4a' : '#4a9eff', color: '#fff', border: 'none', fontWeight: 700, cursor: 'pointer' }}>{confirmText || 'Confirm'}</button>
        </div>
      </div>
    </div>
  );
}
