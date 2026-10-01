"use client";

import { useState } from "react";
import { ShieldCheck, UserPlus, Trash2, Crown } from "lucide-react";
import { setAdminRole } from "@/shims/adminActions";
import { useConfirm } from "@/contexts/ConfirmContext";

interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
  created_at: string;
}

interface ManageAdminsClientProps {
  admins: AdminUser[];
}

export default function ManageAdminsClient({ admins: initialAdmins }: ManageAdminsClientProps) {
  const confirm = useConfirm();
  const [admins, setAdmins] = useState<AdminUser[]>(initialAdmins);
  const [searchEmail, setSearchEmail] = useState("");
  const [searching, setSearching] = useState(false);
  const [foundUser, setFoundUser] = useState<AdminUser | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(""), 3000);
  };

  const showError = (msg: string) => {
    setErrorMsg(msg);
    setTimeout(() => setErrorMsg(""), 4000);
  };

  const handleSearch = async () => {
    if (!searchEmail.trim()) return;
    setSearching(true);
    setFoundUser(null);
    setNotFound(false);
    setErrorMsg("");

    const res = await fetch(`/api/admin/customers?email=${encodeURIComponent(searchEmail.trim().toLowerCase())}`);
    const json = await res.json();
    const data = json.data;

    setSearching(false);

    if (!res.ok || !data) {
      setNotFound(true);
      return;
    }

    if (data.role === "admin" || data.role === "super_admin") {
      showError("এই ইউজার ইতিমধ্যে অ্যাডমিন।");
      return;
    }

    setFoundUser(data);
  };

  const handleMakeAdmin = async () => {
    if (!foundUser) return;
    setActionLoading("make");

    const result = await setAdminRole(foundUser.id, "admin");

    setActionLoading(null);

    if (result.error) {
      showError(result.error);
      return;
    }

    setAdmins((prev) => [...prev, { ...foundUser, role: "admin" }]);
    setFoundUser(null);
    setSearchEmail("");
    showSuccess(`${foundUser.name || foundUser.email} কে সফলভাবে অ্যাডমিন করা হয়েছে।`);
  };

  const handleToggleSuperAdmin = async (adminId: string, currentRole: string, adminName: string) => {
    const newRole = currentRole === 'super_admin' ? 'admin' : 'super_admin';
    const actionText = newRole === 'super_admin' ? 'Super Admin করতে' : 'Admin এ পরিবর্তন করতে';
    
    const ok = await confirm({
      title: "রোল পরিবর্তন",
      message: `"${adminName}" কে কি ${newRole === 'super_admin' ? 'Super Admin' : 'Admin'} বানাতে চান?`,
      confirmText: "হ্যাঁ, পরিবর্তন করুন",
      cancelText: "না",
      variant: "warning",
    });
    if (!ok) return;
    
    setActionLoading(adminId + '-role');

    const result = await setAdminRole(adminId, newRole as "admin" | "super_admin");

    setActionLoading(null);

    if (result.error) {
      showError(result.error);
      return;
    }

    setAdmins((prev) => prev.map(a => a.id === adminId ? { ...a, role: newRole } : a));
    showSuccess(`${adminName} কে ${newRole === 'super_admin' ? 'Super Admin' : 'Admin'} করা হয়েছে।`);
  };

  const handleRemoveAdmin = async (adminId: string, adminName: string, adminRole: string) => {
    const ok = await confirm({
      title: "অ্যাডমিন সরান",
      message: `"${adminName}" কে অ্যাডমিন থেকে সরাতে চান?`,
      confirmText: "হ্যাঁ, সরান",
      cancelText: "না",
    });
    if (!ok) return;
    setActionLoading(adminId);

    const result = await setAdminRole(adminId, "customer");

    setActionLoading(null);

    if (result.error) {
      showError(result.error);
      return;
    }

    setAdmins((prev) => prev.filter((a) => a.id !== adminId));
    showSuccess(`${adminName} কে অ্যাডমিন থেকে সরানো হয়েছে।`);
  };

  return (
    <div className="space-y-8">
      {/* Status messages */}
      {successMsg && (
        <div className="bg-green-500/10 border border-green-500/30 text-green-400 px-5 py-3 rounded-lg text-sm">
          ✓ {successMsg}
        </div>
      )}
      {errorMsg && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-5 py-3 rounded-lg text-sm">
          ✗ {errorMsg}
        </div>
      )}

      {/* Add New Admin */}
      <div className="bg-[#151828] border border-white/10 rounded-xl p-6">
        <h2 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
          <UserPlus size={20} className="text-[#ac8545]" />
          নতুন অ্যাডমিন যোগ করুন
        </h2>
        <p className="text-sm text-gray-400 mb-5">কাস্টমারের ইমেইল দিয়ে সার্চ করুন এবং তাকে অ্যাডমিন করুন।</p>

        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="email"
            value={searchEmail}
            onChange={(e) => {
              setSearchEmail(e.target.value);
              setFoundUser(null);
              setNotFound(false);
            }}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            placeholder="customer@email.com"
            className="flex-1 bg-[#0f111a] border border-white/20 text-white placeholder-gray-600 px-4 py-3 rounded-lg text-sm focus:border-[#ac8545] focus:outline-none transition-colors"
          />
          <button
            onClick={handleSearch}
            disabled={searching || !searchEmail.trim()}
            className="w-full sm:w-auto px-6 py-3 bg-[#ac8545] hover:bg-[#9a7841] text-white text-sm font-bold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {searching ? "খুঁজছি..." : "সার্চ"}
          </button>
        </div>

        {/* Not found */}
        {notFound && (
          <div className="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
            <p className="text-red-400 text-sm">এই ইমেইলে কোনো কাস্টমার পাওয়া যায়নি।</p>
          </div>
        )}

        {/* Found user preview */}
        {foundUser && (
          <div className="mt-4 p-4 bg-white/5 border border-white/10 rounded-lg flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="h-10 w-10 shrink-0 bg-[#ac8545] text-white rounded-full flex items-center justify-center font-bold text-[16px]">
                {(foundUser.name || foundUser.email).charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-white truncate">{foundUser.name || "—"}</p>
                <p className="text-xs text-gray-400 truncate">{foundUser.email}</p>
              </div>
            </div>
            <button
              onClick={handleMakeAdmin}
              disabled={actionLoading === "make"}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 bg-[#ac8545] hover:bg-[#9a7841] text-white text-sm font-bold rounded-lg transition-colors disabled:opacity-60"
            >
              <ShieldCheck size={16} />
              {actionLoading === "make" ? "প্রসেস করছে..." : "অ্যাডমিন করুন"}
            </button>
          </div>
        )}
      </div>

      {/* Current Admins List */}
      <div className="bg-[#151828] border border-white/10 rounded-xl p-6">
        <h2 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
          <ShieldCheck size={20} className="text-[#ac8545]" />
          বর্তমান অ্যাডমিনদের তালিকা
        </h2>
        <p className="text-sm text-gray-400 mb-5">মোট {admins.length} জন অ্যাডমিন আছেন।</p>

        {admins.length === 0 ? (
          <p className="text-gray-500 text-center py-8">কোনো অ্যাডমিন নেই।</p>
        ) : (
          <div className="flex flex-col gap-3">
            {admins.map((admin) => (
              <div
                key={admin.id}
                className="flex flex-wrap items-center gap-x-4 gap-y-3 p-4 bg-white/5 border border-white/5 rounded-lg hover:bg-white/10 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className={`h-10 w-10 shrink-0 rounded-full flex items-center justify-center font-bold text-[15px] ${admin.role === "super_admin" ? "bg-amber-500" : "bg-[#ac8545]"} text-white`}>
                    {(admin.name || admin.email).charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <p className="font-semibold text-white truncate">{admin.name || "—"}</p>
                      {admin.role === "super_admin" && (
                        <span className="shrink-0 flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded-full whitespace-nowrap">
                          <Crown size={10} /> Super Admin
                        </span>
                      )}
                      {admin.role === "admin" && (
                        <span className="shrink-0 text-[10px] font-bold uppercase tracking-wider bg-blue-500/20 text-blue-400 border border-blue-500/30 px-2 py-0.5 rounded-full whitespace-nowrap">
                          Admin
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 truncate">{admin.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap shrink-0">
                  {/* Super Admin Promotion Toggle */}
                  <button
                    onClick={() => handleToggleSuperAdmin(admin.id, admin.role, admin.name || admin.email)}
                    disabled={actionLoading === admin.id + '-role'}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider rounded-lg border transition-all whitespace-nowrap ${
                      admin.role === 'super_admin'
                        ? 'bg-amber-500/10 border-amber-500/30 text-amber-500 hover:bg-amber-500/20'
                        : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10 hover:text-white'
                    } disabled:opacity-50`}
                    title={admin.role === 'super_admin' ? 'Demote to Admin' : 'Promote to Super Admin'}
                  >
                    <Crown size={14} className={admin.role === 'super_admin' ? 'text-amber-500' : 'text-gray-500'} />
                    {actionLoading === admin.id + '-role' ? 'প্রসেস...' : (admin.role === 'super_admin' ? 'Admin' : 'Super')}
                  </button>

                  {/* Remove Button */}
                  <button
                    onClick={() => handleRemoveAdmin(admin.id, admin.name || admin.email, admin.role)}
                    disabled={actionLoading === admin.id}
                    className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-red-400 hover:bg-red-500/10 rounded-lg transition-colors border border-transparent hover:border-red-500/20 disabled:opacity-50 whitespace-nowrap"
                  >
                    <Trash2 size={14} />
                    {actionLoading === admin.id ? "সরাচ্ছে..." : "সরান"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
