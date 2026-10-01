import { redirect } from "next/navigation";
import { getServerUser } from '@/lib/auth';
import ManageAdminsClient from "@/components/admin/ManageAdminsClient";
import { ShieldCheck } from "lucide-react";
import { getAdmins } from "./actions";

export const revalidate = 0;

export default async function ManageAdminsPage() {
  const user = await getServerUser('admin');
  if (!user) redirect("/admin/login");

  if (user.role !== "super_admin") {
    redirect("/admin");
  }

  const admins = await getAdmins();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 border-b border-white/10 pb-5">
        <div className="bg-amber-500/10 p-3 rounded-xl border border-amber-500/20">
          <ShieldCheck className="text-amber-400" size={24} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Manage Admins</h1>
          <p className="text-sm text-gray-400 mt-1">
            নতুন অ্যাডমিন যোগ করুন এবং বিদ্যমান অ্যাডমিনদের পরিচালনা করুন
          </p>
        </div>
      </div>
      <ManageAdminsClient admins={admins ?? []} />
    </div>
  );
}
