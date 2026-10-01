import { useEffect, useState } from 'react';
import { ShieldCheck } from 'lucide-react';
import ManageAdminsClient from '@/components/admin/ManageAdminsClient';
import { useRouter } from 'next/navigation';

export default function ManageAdminsPage() {
  const router = useRouter();
  const [admins, setAdmins] = useState<any[] | null>(null);

  useEffect(() => {
    if (window.NF_ADMIN.user.role !== 'super_admin') { router.replace('/admin'); return; }
    fetch('/api/admin/users').then((r) => r.json()).then((d) => setAdmins(d.data || [])).catch(() => setAdmins([]));
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 border-b border-white/10 pb-5">
        <div className="bg-amber-500/10 p-3 rounded-xl border border-amber-500/20">
          <ShieldCheck className="text-amber-400" size={24} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Manage Admins</h1>
          <p className="text-sm text-gray-400 mt-1">নতুন অ্যাডমিন যোগ করুন এবং বিদ্যমান অ্যাডমিনদের পরিচালনা করুন</p>
        </div>
      </div>
      {admins && <ManageAdminsClient admins={admins} />}
    </div>
  );
}
