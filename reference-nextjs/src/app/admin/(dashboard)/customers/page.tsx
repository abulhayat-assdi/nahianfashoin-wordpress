"use client";

import { useState, useEffect } from "react";
import { Search, MapPin, Phone, Mail, Calendar } from "lucide-react";

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    setLoading(true);
    const res = await fetch('/api/admin/customers');
    const data = await res.json();
    if (data.data) setCustomers(data.data);
    setLoading(false);
  };

  const filteredCustomers = customers.filter(c => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      (c.name && c.name.toLowerCase().includes(q)) ||
      (c.email && c.email.toLowerCase().includes(q)) ||
      (c.phone && c.phone.toLowerCase().includes(q))
    );
  });

  return (
    <>
      <div className="page-heading" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
          <div>
            <h1 className="page-title">Customers</h1>
            <p className="page-subtitle">Manage registered users and their details.</p>
          </div>
          <div style={{ position: 'relative', width: 280 }}>
            <Search size={16} color="rgba(255,255,255,0.4)" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              placeholder="Search Name, Email or Phone..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                padding: '10px 14px 10px 38px', borderRadius: 8, color: '#fff', fontSize: 13, outline: 'none'
              }}
            />
          </div>
        </div>
      </div>

      <div style={{ padding: '0 24px', marginTop: 24 }}>
        {loading ? (
          <div style={{ color: 'rgba(255,255,255,0.5)', textAlign: 'center', padding: '40px 0' }}>
            Loading customers...
          </div>
        ) : filteredCustomers.length === 0 ? (
          <div style={{ color: 'rgba(255,255,255,0.5)', textAlign: 'center', padding: '40px 0', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: 12 }}>
            No customers found matching your search.
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 24 }}>
            {filteredCustomers.map(customer => (
              <div key={customer.id} style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 16,
                padding: 24,
                position: 'relative',
                overflow: 'hidden'
              }}>
                <div style={{ position: 'absolute', top: 0, left: 0, width: 4, height: '100%', background: 'linear-gradient(to bottom, #d4af37, #f5a623)' }} />
                <h3 style={{ fontSize: 18, fontWeight: 700, color: '#fff', marginBottom: 4 }}>
                  {customer.name || "Unnamed User"}
                </h3>
                <p style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'rgba(255,255,255,0.6)', marginBottom: 16 }}>
                  <Calendar size={12} /> Joined {new Date(customer.created_at).toLocaleDateString()}
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                    <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Mail size={14} color="#a0aec0" />
                    </div>
                    <div style={{ flex: 1, wordBreak: 'break-all' }}>
                      <p style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', marginBottom: 2 }}>Email</p>
                      <p style={{ fontSize: 14, color: '#fff' }}>{customer.email || 'N/A'}</p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                    <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Phone size={14} color="#a0aec0" />
                    </div>
                    <div>
                      <p style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', marginBottom: 2 }}>Phone</p>
                      <p style={{ fontSize: 14, color: '#fff' }}>{customer.phone || 'N/A'}</p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                    <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <MapPin size={14} color="#a0aec0" />
                    </div>
                    <div>
                      <p style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', marginBottom: 2 }}>Delivery Address</p>
                      <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', lineHeight: 1.5 }}>
                        {customer.address || <span style={{ color: 'rgba(255,255,255,0.3)', fontStyle: 'italic' }}>Not provided yet</span>}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
