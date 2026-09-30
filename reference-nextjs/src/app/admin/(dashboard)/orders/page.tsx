'use client';

import { useState, useEffect, useRef } from 'react';
import { Search, ShoppingBag, Eye, X, Check, Truck, CheckCircle2, Package, ChevronDown } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

type OrderItem = {
  id: string;
  product_id: string;
  product_name: string;
  price: number;
  quantity: number;
  image_url: string;
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
  status: 'pending' | 'received' | 'preparing' | 'on_way' | 'delivered' | 'cancelled' | 'payment_failed' | 'returned';
  placed_at: string;
  items?: OrderItem[];
};

const TABS = [
  { id: 'pending', label: 'New Orders' },
  { id: 'received', label: 'Order Received' },
  { id: 'preparing', label: 'Preparing for Delivery' },
  { id: 'on_way', label: 'On the Way' },
  { id: 'delivered', label: 'Completed Orders' },
  { id: 'returned', label: 'Returned' },
  { id: 'cancelled', label: 'Failed / Cancelled' },
];

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pending');
  const [search, setSearch] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', phone: '', address: '' });
  const [isSendingToCourier, setIsSendingToCourier] = useState<string | null>(null);
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean; title: string; message: string; onConfirm: () => void; confirmText?: string; isDanger?: boolean;
  }>({ isOpen: false, title: '', message: '', onConfirm: () => {} });
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const askConfirm = (title: string, message: string, onConfirm: () => void, confirmText = 'Confirm', isDanger = false) => {
    setConfirmModal({ isOpen: true, title, message, onConfirm, confirmText, isDanger });
  };

  useEffect(() => {
    fetchOrders(true);
    pollingRef.current = setInterval(() => fetchOrders(false), 10000);
    return () => { if (pollingRef.current) clearInterval(pollingRef.current); };
  }, []);

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
          setSelectedOrder({ ...selectedOrder, status: newStatus });
          if (newStatus !== activeTab) setSelectedOrder(null);
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
      "Are you sure you want to PERMANENTLY DELETE this order? This cannot be undone.",
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

  const saveCustomerInfo = async () => {
    if (!selectedOrder) return;
    const res = await fetch('/api/admin/orders', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: selectedOrder.id, customer_name: editForm.name, phone: editForm.phone, address: editForm.address }),
    });
    if (!res.ok) {
      alert('Failed to save customer info');
    } else {
      setSelectedOrder({ ...selectedOrder, customer_name: editForm.name, phone: editForm.phone, address: editForm.address });
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
        toast.success('Parcel sent to Steadfast successfully!');
        if (selectedOrder && selectedOrder.id === order.id) {
          setSelectedOrder({ ...selectedOrder, status: 'on_way' });
          if ('on_way' !== activeTab) setSelectedOrder(null);
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

  const filteredOrders = orders.filter(o => {
    if (activeTab === 'cancelled') {
      if (o.status !== 'cancelled' && o.status !== ('payment_failed' as any)) return false;
    } else {
      if (o.status !== activeTab) return false;
    }
    if (search) {
      const q = search.toLowerCase();
      return o.order_id.toLowerCase().includes(q) || o.customer_name.toLowerCase().includes(q) || o.phone.includes(q);
    }
    return true;
  });

  const getStatusAction = (status: string) => {
    switch (status) {
      case 'pending': return { label: 'Mark as Received', next: 'received', icon: <Check size={14} /> };
      case 'received': return { label: 'Start Preparing', next: 'preparing', icon: <Package size={14} /> };
      case 'preparing': return { label: 'Send on the Way', next: 'on_way', icon: <Truck size={14} /> };
      case 'on_way': return { label: 'Mark as Delivered', next: 'delivered', icon: <CheckCircle2 size={14} /> };
      default: return null;
    }
  };

  const fmt = (n: number) => `৳${n.toLocaleString("en-US", { minimumFractionDigits: 2 })}`;

  return (
    <>
      <Toaster position="top-right" />
      <div className="page-heading" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
          <div>
            <h1 className="page-title">Order Management</h1>
            <p className="page-subtitle">Track, update and manage customer orders.</p>
          </div>
          <div style={{ position: 'relative', width: 280 }}>
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
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{ padding: '8px 16px', borderRadius: 20, fontSize: 13, fontWeight: 500, cursor: 'pointer', border: '1px solid', transition: 'all 0.15s', whiteSpace: 'nowrap', background: activeTab === tab.id ? '#4a9eff' : 'rgba(255,255,255,0.05)', color: activeTab === tab.id ? '#fff' : 'rgba(255,255,255,0.6)', borderColor: activeTab === tab.id ? '#4a9eff' : 'rgba(255,255,255,0.1)' }}>
              {tab.label}
              <span style={{ background: activeTab === tab.id ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.1)', padding: '2px 8px', borderRadius: 10, marginLeft: 8, fontSize: 11 }}>
                {orders.filter(o => { if (tab.id === 'cancelled') return o.status === 'cancelled' || o.status === ('payment_failed' as any); return o.status === tab.id; }).length}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="data-table-wrap" style={{ marginTop: 20 }}>
        <table className="data-table">
          <thead><tr><th>Order ID</th><th>Date & Time</th><th>Customer</th><th>Total</th><th>Payment</th><th>Action</th></tr></thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="empty-state">Loading orders...</td></tr>
            ) : filteredOrders.length === 0 ? (
              <tr><td colSpan={6} className="empty-state">No orders found in this status.</td></tr>
            ) : (
              filteredOrders.map(order => {
                const action = getStatusAction(order.status);
                return (
                  <tr key={order.id} style={{ cursor: 'pointer' }} onClick={() => setSelectedOrder(order)}>
                    <td><span style={{ fontWeight: 700, color: '#4a9eff' }}>{order.order_id}</span></td>
                    <td>{new Date(order.placed_at).toLocaleString('en-BD', { dateStyle: 'medium', timeStyle: 'short' })}</td>
                    <td><p style={{ fontWeight: 600, fontSize: 13 }}>{order.customer_name}</p><p style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', marginTop: 2 }}>{order.phone}</p></td>
                    <td><span style={{ fontWeight: 600 }}>{fmt(order.total)}</span></td>
                    <td><span className={`badge ${order.payment_method === 'cash' ? 'badge-inactive' : 'badge-active'}`}>{order.payment_method === 'cash' ? 'COD' : order.payment_method}</span></td>
                    <td onClick={e => e.stopPropagation()}>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button className="btn-ghost" onClick={() => setSelectedOrder(order)} style={{ padding: '6px 10px', fontSize: 12 }}><Eye size={14} /> View</button>
                        {order.status === 'on_way' ? (
                          <div style={{ position: 'relative' }}>
                            <select onChange={(e) => { if (e.target.value === 'DELETE_ORDER') { deleteOrder(order.id); } else if (e.target.value) { updateStatus(order.id, e.target.value as any); } e.target.value = ''; }} onClick={(e) => e.stopPropagation()} style={{ background: '#4a9eff', color: 'white', border: 'none', padding: '6px 26px 6px 12px', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer', appearance: 'none', outline: 'none' }} defaultValue="">
                              <option value="" disabled>Action...</option>
                              <option value="delivered">Mark as Delivered</option>
                              <option value="returned">Not Received (Return)</option>
                              <option value="cancelled">Cancel Order (Keep Record)</option>
                              <option value="DELETE_ORDER">PERMANENT DELETE</option>
                            </select>
                            <ChevronDown size={14} color="white" style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                          </div>
                        ) : order.status === 'delivered' ? (
                          <div style={{ position: 'relative' }}>
                            <select onChange={(e) => { if (e.target.value === 'DELETE_ORDER') { deleteOrder(order.id); } else if (e.target.value) { askConfirm('Change Order Status?', 'Are you sure you want to revert or change this completed order?', () => updateStatus(order.id, e.target.value as any)); } e.target.value = ''; }} onClick={(e) => e.stopPropagation()} style={{ background: 'transparent', color: '#44d375', border: '1px solid rgba(68, 211, 117, 0.5)', padding: '6px 26px 6px 12px', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer', appearance: 'none', outline: 'none' }} defaultValue="">
                              <option value="" disabled>Edit Status...</option>
                              <option value="pending">Move to New Orders</option>
                              <option value="received">Move to Received</option>
                              <option value="preparing">Move to Preparing</option>
                              <option value="on_way">Move to On the Way</option>
                              <option value="cancelled">Cancel Order (Keep Record)</option>
                              <option value="DELETE_ORDER">PERMANENT DELETE</option>
                            </select>
                            <ChevronDown size={14} color="#44d375" style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                          </div>
                        ) : action && (
                          <button onClick={(e) => { e.stopPropagation(); if (action.next === 'on_way') { sendToCourier(order); } else { updateStatus(order.id, action.next as any); } }} disabled={isSendingToCourier === order.id} style={{ background: '#4a9eff', color: 'white', border: 'none', padding: '6px 12px', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: isSendingToCourier === order.id ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 6, opacity: isSendingToCourier === order.id ? 0.7 : 1 }}>
                            {action.icon} {isSendingToCourier === order.id ? 'Sending...' : action.label}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {selectedOrder && (
        <div className="modal-overlay" onClick={() => setSelectedOrder(null)}>
          <div className="modal-box" style={{ maxWidth: 800, padding: 0 }} onClick={e => e.stopPropagation()}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.2)' }}>
              <div>
                <h2 style={{ fontSize: 18, fontWeight: 600, color: '#fff', marginBottom: 4 }}>Order Details: {selectedOrder.order_id}</h2>
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>Placed on {new Date(selectedOrder.placed_at).toLocaleString()}</p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span className="badge badge-active" style={{ fontSize: 12, textTransform: 'uppercase', background: 'rgba(255,255,255,0.1)' }}>{selectedOrder.status.replace('_', ' ')}</span>
                <button onClick={() => setSelectedOrder(null)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer' }}><X size={20} /></button>
              </div>
            </div>

            <div style={{ padding: 24, display: 'grid', gridTemplateColumns: '1fr 300px', gap: 24 }}>
              <div>
                <h3 style={{ fontSize: 14, fontWeight: 600, color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 16 }}>Items Ordered</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
                  {selectedOrder.items?.map((item, i) => (
                    <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'center', background: 'rgba(255,255,255,0.03)', padding: 12, borderRadius: 8, border: '1px solid rgba(255,255,255,0.05)' }}>
                      <div style={{ width: 48, height: 48, borderRadius: 6, background: 'rgba(255,255,255,0.1)', overflow: 'hidden', position: 'relative' }}>
                        {item.image_url ? <img src={item.image_url} alt={item.product_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <ShoppingBag size={20} color="rgba(255,255,255,0.3)" style={{ position: 'absolute', top: 14, left: 14 }} />}
                      </div>
                      <div style={{ flex: 1 }}>
                        <p style={{ fontWeight: 500, fontSize: 14, color: '#fff' }}>{item.product_name}</p>
                        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>{fmt(item.price)} × {item.quantity}</p>
                      </div>
                      <p style={{ fontWeight: 600, fontSize: 14, color: '#fff' }}>{fmt(item.price * item.quantity)}</p>
                    </div>
                  ))}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <h3 style={{ fontSize: 14, fontWeight: 600, color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: 1, margin: 0 }}>Delivery Information</h3>
                  {!isEditing ? (
                    <button onClick={() => { setEditForm({ name: selectedOrder.customer_name, phone: selectedOrder.phone, address: selectedOrder.address }); setIsEditing(true); }} style={{ background: 'none', border: 'none', color: '#4a9eff', fontSize: 12, cursor: 'pointer' }}>Edit Info</button>
                  ) : (
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={() => setIsEditing(false)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', fontSize: 12, cursor: 'pointer' }}>Cancel</button>
                      <button onClick={saveCustomerInfo} style={{ background: '#4a9eff', border: 'none', color: '#fff', fontSize: 12, padding: '4px 8px', borderRadius: 4, cursor: 'pointer' }}>Save</button>
                    </div>
                  )}
                </div>
                <div style={{ background: 'rgba(255,255,255,0.03)', padding: 16, borderRadius: 8, border: '1px solid rgba(255,255,255,0.05)' }}>
                  {!isEditing ? (
                    <>
                      <p style={{ fontSize: 15, fontWeight: 600, color: '#fff', marginBottom: 4 }}>{selectedOrder.customer_name}</p>
                      <p style={{ fontSize: 14, color: '#4a9eff', marginBottom: 8 }}>{selectedOrder.phone}</p>
                      <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', lineHeight: 1.5 }}>{selectedOrder.address}</p>
                    </>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      <input value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', padding: '8px', borderRadius: 4, color: '#fff', fontSize: 13 }} placeholder="Customer Name" />
                      <input value={editForm.phone} onChange={e => setEditForm({ ...editForm, phone: e.target.value })} style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', padding: '8px', borderRadius: 4, color: '#fff', fontSize: 13 }} placeholder="Phone Number" />
                      <textarea value={editForm.address} onChange={e => setEditForm({ ...editForm, address: e.target.value })} style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', padding: '8px', borderRadius: 4, color: '#fff', fontSize: 13, resize: 'vertical', minHeight: 60 }} placeholder="Full Delivery Address" />
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h3 style={{ fontSize: 14, fontWeight: 600, color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 16 }}>Order Summary</h3>
                <div style={{ background: 'rgba(255,255,255,0.03)', padding: 16, borderRadius: 8, border: '1px solid rgba(255,255,255,0.05)', marginBottom: 24 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10, fontSize: 13, color: 'rgba(255,255,255,0.7)' }}><span>Subtotal</span><span>{fmt(selectedOrder.subtotal)}</span></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10, fontSize: 13, color: 'rgba(255,255,255,0.7)' }}><span>Shipping</span><span>{fmt(selectedOrder.shipping)}</span></div>
                  {selectedOrder.discount > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10, fontSize: 13, color: '#f5a623' }}><span>Discount</span><span>-{fmt(selectedOrder.discount)}</span></div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12, paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.1)', fontSize: 16, fontWeight: 700, color: '#fff' }}><span>Total</span><span style={{ color: '#4a9eff' }}>{fmt(selectedOrder.total)}</span></div>
                </div>

                <h3 style={{ fontSize: 14, fontWeight: 600, color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 16 }}>Payment Method</h3>
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
                  {selectedOrder.status === 'on_way' ? (
                    <div style={{ position: 'relative', width: '100%' }}>
                      <select onChange={(e) => { if (e.target.value) updateStatus(selectedOrder.id, e.target.value as any); }} style={{ width: '100%', background: '#4a9eff', color: 'white', border: 'none', padding: '12px', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer', appearance: 'none', outline: 'none' }} defaultValue="">
                        <option value="" disabled>Select Delivery Action...</option>
                        <option value="delivered">Mark as Delivered</option>
                        <option value="returned">Not Received (Returned)</option>
                        <option value="cancelled">Cancel Order</option>
                      </select>
                      <ChevronDown size={18} color="white" style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                    </div>
                  ) : getStatusAction(selectedOrder.status) ? (
                    <>
                      <button onClick={() => { if (getStatusAction(selectedOrder.status)!.next === 'on_way') { sendToCourier(selectedOrder); } else { updateStatus(selectedOrder.id, getStatusAction(selectedOrder.status)!.next as any); } }} disabled={isSendingToCourier === selectedOrder.id} style={{ width: '100%', background: '#4a9eff', color: 'white', border: 'none', padding: '12px', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: isSendingToCourier === selectedOrder.id ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: isSendingToCourier === selectedOrder.id ? 0.7 : 1 }}>
                        {getStatusAction(selectedOrder.status)?.icon}
                        {isSendingToCourier === selectedOrder.id ? 'Sending to Courier...' : getStatusAction(selectedOrder.status)?.label}
                      </button>
                      <button onClick={() => { askConfirm('Complete Order?', 'Are you sure you want to mark this order as completed right now?', () => updateStatus(selectedOrder.id, 'delivered')); }} style={{ width: '100%', background: 'rgba(68, 211, 117, 0.1)', color: '#44d375', border: '1px solid rgba(68, 211, 117, 0.3)', padding: '10px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                        <CheckCircle2 size={14} /> Mark as Complete
                      </button>
                    </>
                  ) : selectedOrder.status === 'returned' ? (
                    <div style={{ background: 'rgba(245, 166, 35, 0.1)', border: '1px solid rgba(245, 166, 35, 0.2)', padding: 16, borderRadius: 8, textAlign: 'center', color: '#f5a623', fontSize: 13, fontWeight: 600 }}>
                      <Package size={24} style={{ margin: '0 auto 8px' }} />
                      Order Returned (Not Received)
                    </div>
                  ) : (selectedOrder.status === 'cancelled' || selectedOrder.status === 'payment_failed') ? (
                    <div style={{ background: 'rgba(255, 74, 74, 0.1)', border: '1px solid rgba(255, 74, 74, 0.2)', padding: 16, borderRadius: 8, textAlign: 'center', color: '#ff4a4a', fontSize: 13, fontWeight: 600 }}>
                      <X size={24} style={{ margin: '0 auto 8px' }} />
                      Order Cancelled / Failed
                    </div>
                  ) : (
                    <>
                      <div style={{ background: 'rgba(68, 211, 117, 0.1)', border: '1px solid rgba(68, 211, 117, 0.2)', padding: 16, borderRadius: 8, textAlign: 'center', color: '#44d375', fontSize: 13, fontWeight: 600 }}>
                        <CheckCircle2 size={24} style={{ margin: '0 auto 8px' }} />
                        Order Completed
                      </div>
                      <div style={{ position: 'relative', width: '100%', marginTop: 8 }}>
                        <select onChange={(e) => { const val = e.target.value; if (val) { askConfirm('অর্ডার পরিবর্তন করুন', 'এই কমপ্লিটেড অর্ডারটি পরিবর্তন করতে চান?', () => updateStatus(selectedOrder.id, val as any), 'হ্যাঁ, পরিবর্তন করুন', true); } e.target.value = ''; }} style={{ width: '100%', background: 'transparent', color: '#44d375', border: '1px dashed rgba(68, 211, 117, 0.5)', padding: '10px 12px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', appearance: 'none', outline: 'none' }} defaultValue="">
                          <option value="" disabled>Revert / Edit Completed Order...</option>
                          <option value="pending">Move to New Orders</option>
                          <option value="received">Move to Received</option>
                          <option value="preparing">Move to Preparing</option>
                          <option value="on_way">Move to On the Way</option>
                          <option value="cancelled">Delete / Cancel Order</option>
                        </select>
                        <ChevronDown size={18} color="#44d375" style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                      </div>
                    </>
                  )}

                  <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.1)', display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {(selectedOrder.status === 'cancelled' || selectedOrder.status === 'payment_failed' || selectedOrder.status === 'returned') && (
                      <button onClick={() => { askConfirm('Reactivate Order?', 'Are you sure you want to reactivate this order and move it to New Orders?', () => updateStatus(selectedOrder.id, 'pending')); }} style={{ width: '100%', background: 'transparent', color: '#f5a623', border: '1px solid #f5a623', padding: '10px', borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>
                        Reactivate Order (Move to Pending)
                      </button>
                    )}
                    <button onClick={() => deleteOrder(selectedOrder.id)} style={{ width: '100%', background: 'rgba(255, 74, 74, 0.1)', color: '#ff4a4a', border: '1px dashed #ff4a4a', padding: '10px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                      Permanently Delete Order (Global)
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
    </>
  );
}

function ConfirmModal({ isOpen, title, message, onConfirm, onCancel, confirmText, isDanger }: any) {
  if (!isOpen) return null;
  return (
    <div className="modal-overlay" style={{ zIndex: 9999 }}>
      <div className="modal-box" style={{ maxWidth: 450, padding: 30, textAlign: 'center' }}>
        <div style={{ width: 60, height: 60, borderRadius: 30, background: isDanger ? 'rgba(255, 74, 74, 0.1)' : 'rgba(74, 158, 255, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
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
