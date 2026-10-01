'use client';

import { useState, useEffect } from 'react';
import { Plus, X, Loader2, Trash2, ShieldAlert, Phone, Globe, Search } from 'lucide-react';
import { useConfirm } from '@/contexts/ConfirmContext';

type BlockedItem = {
  id: string;
  type: 'phone' | 'ip';
  value: string;
  reason: string;
  created_at: string;
};

export default function BlockedListPage() {
  const confirm = useConfirm();
  const [items, setItems] = useState<BlockedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'phone' | 'ip'>('phone');
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ value: '', reason: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchBlockedItems();
  }, []);

  async function fetchBlockedItems() {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/blocked');
      const data = await res.json();
      if (data.data) {
        setItems(data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const handleOpenModal = () => {
    setForm({ value: '', reason: '' });
    setError('');
    setOpen(true);
  };

  const handleSave = async () => {
    if (!form.value) {
      setError('Value is required');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch('/api/admin/blocked', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: activeTab,
          value: form.value,
          reason: form.reason,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Something went wrong');
      } else {
        setOpen(false);
        fetchBlockedItems();
      }
    } catch (err: any) {
      setError(err.message || 'Error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUnblock = async (id: string, value: string) => {
    const ok = await confirm({
      title: `${activeTab === 'phone' ? 'মোবাইল নম্বর' : 'আইপি এড্রেস'} আনব্লক করুন`,
      message: `আপনি কি নিশ্চিত যে "${value}" কে আনব্লক করতে চান? এর পর এই ${activeTab === 'phone' ? 'মোবাইল নম্বর' : 'আইপি'}-টি আবার অর্ডার করতে পারবে।`,
      confirmText: 'হ্যাঁ, আনব্লক করুন',
      cancelText: 'না',
    });
    if (!ok) return;

    try {
      const res = await fetch(`/api/admin/blocked?id=${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        fetchBlockedItems();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to unblock');
      }
    } catch (err: any) {
      alert(err.message || 'Failed to unblock');
    }
  };

  const filteredItems = items.filter(
    (item) =>
      item.type === activeTab &&
      (item.value.toLowerCase().includes(search.toLowerCase()) ||
        (item.reason || '').toLowerCase().includes(search.toLowerCase()))
  );

  const phoneCount = items.filter((item) => item.type === 'phone').length;
  const ipCount = items.filter((item) => item.type === 'ip').length;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="animate-spin text-[#ac8545]" size={32} />
      </div>
    );
  }

  return (
    <>
      <div className="page-heading">
        <div>
          <h1 className="page-title">Blocked List</h1>
          <p className="page-subtitle">Manage phone numbers and IP addresses that are restricted from ordering.</p>
        </div>
        <button className="btn-primary-admin" onClick={handleOpenModal}>
          <Plus size={15} /> {activeTab === 'phone' ? 'Block Phone' : 'Block IP'}
        </button>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        {/* Tabs */}
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={() => {
              setActiveTab('phone');
              setSearch('');
            }}
            style={{
              padding: '8px 16px', borderRadius: 20, fontSize: 13, fontWeight: 500,
              cursor: 'pointer', border: '1px solid', transition: 'all 0.15s', whiteSpace: 'nowrap',
              background: activeTab === 'phone' ? '#4a9eff' : 'rgba(255,255,255,0.05)',
              color: activeTab === 'phone' ? '#fff' : 'rgba(255,255,255,0.6)',
              borderColor: activeTab === 'phone' ? '#4a9eff' : 'rgba(255,255,255,0.1)',
            }}
          >
            Blocked Phones ({phoneCount})
          </button>
          <button
            onClick={() => {
              setActiveTab('ip');
              setSearch('');
            }}
            style={{
              padding: '8px 16px', borderRadius: 20, fontSize: 13, fontWeight: 500,
              cursor: 'pointer', border: '1px solid', transition: 'all 0.15s', whiteSpace: 'nowrap',
              background: activeTab === 'ip' ? '#4a9eff' : 'rgba(255,255,255,0.05)',
              color: activeTab === 'ip' ? '#fff' : 'rgba(255,255,255,0.6)',
              borderColor: activeTab === 'ip' ? '#4a9eff' : 'rgba(255,255,255,0.1)',
            }}
          >
            Blocked IPs ({ipCount})
          </button>
        </div>

        {/* Search */}
        <div style={{ position: 'relative', width: 260 }}>
          <Search size={16} color="rgba(255,255,255,0.4)" style={{ position: 'absolute', top: 12, left: 12 }} />
          <input
            className="form-input"
            style={{ paddingLeft: 36, width: '100%', margin: 0, height: 40 }}
            placeholder={`Search by ${activeTab === 'phone' ? 'phone' : 'IP'} or reason...`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="data-table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>{activeTab === 'phone' ? 'Phone Number' : 'IP Address'}</th>
              <th>Block Reason</th>
              <th>Blocked At</th>
              <th style={{ width: 100 }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredItems.length === 0 ? (
              <tr>
                <td colSpan={4} className="empty-state">
                  No blocked {activeTab === 'phone' ? 'phones' : 'IPs'} found.
                </td>
              </tr>
            ) : (
              filteredItems.map((item) => (
                <tr key={item.id}>
                  <td data-label={activeTab === 'phone' ? 'Phone Number' : 'IP Address'} style={{ fontWeight: 600 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      {item.type === 'phone' ? (
                        <Phone size={14} color="#ff4a4a" />
                      ) : (
                        <Globe size={14} color="#ff4a4a" />
                      )}
                      <span>{item.value}</span>
                    </div>
                  </td>
                  <td data-label="Block Reason" style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13 }}>
                    {item.reason}
                  </td>
                  <td data-label="Blocked At" style={{ color: 'rgba(255,255,255,0.45)', fontSize: 12 }}>
                    {new Date(item.created_at).toLocaleString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit',
                      hour12: true,
                    })}
                  </td>
                  <td data-label="Action">
                    <button
                      style={{
                        background: 'rgba(255,74,74,0.1)',
                        color: '#ff4a4a',
                        border: '1px solid rgba(255,74,74,0.2)',
                        padding: '6px 12px',
                        borderRadius: 6,
                        fontSize: 12,
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        cursor: 'pointer',
                        transition: 'all 0.15s',
                      }}
                      onClick={() => handleUnblock(item.id, item.value)}
                    >
                      <ShieldAlert size={13} /> Unblock
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {open && (
        <div className="modal-overlay" onClick={() => setOpen(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 450 }}>
            <div className="modal-title">
              {activeTab === 'phone' ? 'Block Phone Number' : 'Block IP Address'}
              <button
                onClick={() => setOpen(false)}
                style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>
            
            {error && (
              <div style={{ background: 'rgba(255,74,74,0.1)', border: '1px solid rgba(255,74,74,0.2)', padding: '10px 14px', borderRadius: 6, color: '#ff4a4a', fontSize: 13, marginBottom: 16 }}>
                {error}
              </div>
            )}

            <div className="form-group" style={{ marginBottom: 16 }}>
              <label className="form-label">{activeTab === 'phone' ? 'Phone Number' : 'IP Address'}</label>
              <input
                className="form-input"
                value={form.value}
                onChange={(e) => setForm({ ...form, value: e.target.value })}
                placeholder={activeTab === 'phone' ? 'e.g. 01712345678' : 'e.g. 192.168.1.1'}
                disabled={submitting}
              />
            </div>

            <div className="form-group" style={{ marginBottom: 20 }}>
              <label className="form-label">Reason for blocking</label>
              <input
                className="form-input"
                value={form.reason}
                onChange={(e) => setForm({ ...form, reason: e.target.value })}
                placeholder="e.g. Spam order / fake customer"
                disabled={submitting}
              />
            </div>

            <div className="form-actions">
              <button className="btn-ghost" onClick={() => setOpen(false)} disabled={submitting}>
                Cancel
              </button>
              <button className="btn-primary-admin" onClick={handleSave} disabled={submitting}>
                {submitting ? 'Blocking...' : 'Block Now'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
