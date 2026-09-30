"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, Tag, Percent, DollarSign, Calendar, ToggleLeft, ToggleRight } from "lucide-react";
import { useConfirm } from "@/contexts/ConfirmContext";

type CouponType = "percent" | "fixed";

type Coupon = {
  id: string;
  code: string;
  type: CouponType;
  value: number;
  minOrder: number;
  maxUses: number;
  usedCount: number;
  expiresAt: string;
  isActive: boolean;
  createdAt: string;
};

const emptyForm = (): Omit<Coupon, "id" | "usedCount" | "createdAt"> => ({
  code: "",
  type: "percent",
  value: 10,
  minOrder: 0,
  maxUses: 100,
  expiresAt: "",
  isActive: true,
});

export default function AdminCouponsPage() {
  const confirm = useConfirm();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm());
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState(false);

  // Load from localStorage (swap for Firebase when ready)
  useEffect(() => {
    const stored = localStorage.getItem("sv_coupons");
    if (stored) {
      try { setCoupons(JSON.parse(stored)); } catch {}
    }
  }, []);

  const persist = (list: Coupon[]) => {
    setCoupons(list);
    localStorage.setItem("sv_coupons", JSON.stringify(list));
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.code.trim()) e.code = "Coupon code is required";
    if (!/^[A-Z0-9_-]+$/.test(form.code.trim())) e.code = "Only uppercase letters, digits, _ and - allowed";
    if (coupons.some(c => c.code === form.code.trim())) e.code = "Code already exists";
    if (form.value <= 0) e.value = "Value must be greater than 0";
    if (form.type === "percent" && form.value > 100) e.value = "Percent discount cannot exceed 100%";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleAdd = () => {
    if (!validate()) return;
    const newCoupon: Coupon = {
      ...form,
      code: form.code.trim().toUpperCase(),
      id: `cpn_${Date.now()}`,
      usedCount: 0,
      createdAt: new Date().toISOString(),
    };
    persist([...coupons, newCoupon]);
    setForm(emptyForm());
    setShowForm(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const toggleActive = (id: string) => {
    persist(coupons.map(c => c.id === id ? { ...c, isActive: !c.isActive } : c));
  };

  const deleteCoupon = async (id: string) => {
    const ok = await confirm({
      title: "কুপন ডিলিট করুন",
      message: "এই কুপনটি স্থায়ীভাবে ডিলিট হয়ে যাবে। আপনি কি নিশ্চিত?",
      confirmText: "হ্যাঁ, ডিলিট করুন",
      cancelText: "না",
    });
    if (ok) {
      persist(coupons.filter(c => c.id !== id));
    }
  };

  return (
    <>
      <div className="page-heading">
        <div>
          <h1 className="page-title">Coupon Codes</h1>
          <p className="page-subtitle">Create and manage discount coupons for your customers.</p>
        </div>
        <button
          className="btn-primary"
          onClick={() => setShowForm(true)}
          style={{ display: "flex", alignItems: "center", gap: 8 }}
        >
          <Plus size={16} /> Add Coupon
        </button>
      </div>

      {saved && (
        <div style={{ background: "rgba(74,222,128,0.12)", border: "1px solid rgba(74,222,128,0.3)", borderRadius: 10, padding: "12px 16px", marginBottom: 20, color: "#4ade80", fontSize: 14 }}>
          ✓ Coupon saved successfully!
        </div>
      )}

      {/* Add Coupon Modal */}
      {showForm && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <div style={{ background: "#1a1f2e", borderRadius: 16, padding: 28, width: "100%", maxWidth: 520, border: "1px solid rgba(255,255,255,0.1)", maxHeight: "90vh", overflowY: "auto" }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: "#fff", marginBottom: 24 }}>New Coupon Code</h2>

            <div className="form-group">
              <label className="form-label">Coupon Code *</label>
              <input
                className="form-input"
                placeholder="e.g. SUMMER20"
                value={form.code}
                onChange={e => setForm({ ...form, code: e.target.value.toUpperCase() })}
              />
              {errors.code && <p style={{ color: "#f87171", fontSize: 12, marginTop: 4 }}>{errors.code}</p>}
              <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, marginTop: 4 }}>Uppercase letters, digits, _ and - only.</p>
            </div>

            <div className="form-group">
              <label className="form-label">Discount Type *</label>
              <div style={{ display: "flex", gap: 10 }}>
                {(["percent", "fixed"] as CouponType[]).map(t => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setForm({ ...form, type: t })}
                    style={{
                      flex: 1, padding: "10px 0", borderRadius: 8, border: "1px solid",
                      borderColor: form.type === t ? "#4a9eff" : "rgba(255,255,255,0.1)",
                      background: form.type === t ? "rgba(74,158,255,0.15)" : "transparent",
                      color: form.type === t ? "#4a9eff" : "rgba(255,255,255,0.5)",
                      fontWeight: 600, fontSize: 13, cursor: "pointer",
                      display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                    }}
                  >
                    {t === "percent" ? <Percent size={14} /> : <DollarSign size={14} />}
                    {t === "percent" ? "Percentage (%)" : "Fixed Amount (৳)"}
                  </button>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Discount Value * {form.type === "percent" ? "(%)" : "(৳)"}</label>
              <input
                type="number"
                min={1}
                max={form.type === "percent" ? 100 : undefined}
                className="form-input"
                placeholder={form.type === "percent" ? "e.g. 15" : "e.g. 100"}
                value={form.value}
                onChange={e => setForm({ ...form, value: parseFloat(e.target.value) || 0 })}
              />
              {errors.value && <p style={{ color: "#f87171", fontSize: 12, marginTop: 4 }}>{errors.value}</p>}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <div className="form-group">
                <label className="form-label">Minimum Order (৳)</label>
                <input
                  type="number"
                  min={0}
                  className="form-input"
                  placeholder="0 = no minimum"
                  value={form.minOrder}
                  onChange={e => setForm({ ...form, minOrder: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Max Uses</label>
                <input
                  type="number"
                  min={1}
                  className="form-input"
                  placeholder="e.g. 100"
                  value={form.maxUses}
                  onChange={e => setForm({ ...form, maxUses: parseInt(e.target.value) || 1 })}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Expiry Date (Optional)</label>
              <input
                type="date"
                className="form-input"
                value={form.expiresAt}
                min={new Date().toISOString().split("T")[0]}
                onChange={e => setForm({ ...form, expiresAt: e.target.value })}
              />
            </div>

            <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
              <button className="btn-primary" onClick={handleAdd} style={{ flex: 1 }}>
                Save Coupon
              </button>
              <button
                type="button"
                onClick={() => { setShowForm(false); setErrors({}); setForm(emptyForm()); }}
                style={{ padding: "10px 20px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.15)", background: "transparent", color: "rgba(255,255,255,0.6)", cursor: "pointer", fontSize: 14 }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Coupons Table */}
      {coupons.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 0", color: "rgba(255,255,255,0.35)" }}>
          <Tag size={40} style={{ margin: "0 auto 12px", opacity: 0.4 }} />
          <p style={{ fontSize: 16, fontWeight: 600 }}>No coupons yet</p>
          <p style={{ fontSize: 13, marginTop: 4 }}>Create your first coupon to offer discounts to customers.</p>
        </div>
      ) : (
        <div className="section-card" style={{ overflow: "hidden", padding: 0 }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                {["Code", "Type", "Value", "Min Order", "Uses", "Expires", "Status", "Actions"].map(h => (
                  <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.06em" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {coupons.map((c, i) => {
                const isExpired = c.expiresAt && new Date(c.expiresAt) < new Date();
                const isExhausted = c.usedCount >= c.maxUses;
                return (
                  <tr key={c.id} style={{ borderBottom: i < coupons.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none", background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.02)" }}>
                    <td style={{ padding: "12px 16px" }}>
                      <span style={{ fontFamily: "monospace", fontWeight: 700, color: "#4a9eff", fontSize: 14, background: "rgba(74,158,255,0.1)", padding: "2px 8px", borderRadius: 6 }}>{c.code}</span>
                    </td>
                    <td style={{ padding: "12px 16px", color: "rgba(255,255,255,0.6)", fontSize: 13 }}>
                      {c.type === "percent" ? <Percent size={13} style={{ display: "inline", marginRight: 4 }} /> : <DollarSign size={13} style={{ display: "inline", marginRight: 4 }} />}
                      {c.type === "percent" ? "Percent" : "Fixed"}
                    </td>
                    <td style={{ padding: "12px 16px", color: "#4ade80", fontWeight: 700, fontSize: 14 }}>
                      {c.type === "percent" ? `${c.value}%` : `৳${c.value}`}
                    </td>
                    <td style={{ padding: "12px 16px", color: "rgba(255,255,255,0.6)", fontSize: 13 }}>{c.minOrder > 0 ? `৳${c.minOrder}` : "None"}</td>
                    <td style={{ padding: "12px 16px", fontSize: 13 }}>
                      <span style={{ color: isExhausted ? "#f87171" : "rgba(255,255,255,0.6)" }}>{c.usedCount}/{c.maxUses}</span>
                    </td>
                    <td style={{ padding: "12px 16px", fontSize: 13, color: isExpired ? "#f87171" : "rgba(255,255,255,0.6)" }}>
                      {c.expiresAt ? new Date(c.expiresAt).toLocaleDateString("en-BD") : "No expiry"}
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <button onClick={() => toggleActive(c.id)} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
                        {c.isActive && !isExpired && !isExhausted
                          ? <><ToggleRight size={22} color="#4ade80" /><span style={{ fontSize: 12, color: "#4ade80" }}>Active</span></>
                          : <><ToggleLeft size={22} color="#f87171" /><span style={{ fontSize: 12, color: "#f87171" }}>{isExpired ? "Expired" : isExhausted ? "Exhausted" : "Inactive"}</span></>
                        }
                      </button>
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <button onClick={() => deleteCoupon(c.id)} style={{ background: "rgba(239,68,68,0.1)", border: "none", borderRadius: 6, padding: "6px 8px", cursor: "pointer", color: "#f87171" }}>
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
