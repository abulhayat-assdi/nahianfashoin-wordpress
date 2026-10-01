import type { Metadata } from 'next';
import { getServerUser } from '@/lib/auth';
import AdminSidebar from '@/components/admin/AdminSidebar';
import AdminHeader from '@/components/admin/AdminHeader';
import AdminProviders from '@/components/admin/AdminProviders';
import '../admin.css';

export const metadata: Metadata = {
  title: 'Nahian Fashion CMS',
  description: 'Nahian Fashion Content Management System',
  robots: { index: false, follow: false },
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getServerUser('admin');
  const role = (user?.role ?? '') as string;

  return (
    <AdminProviders>
      <div className="admin-shell">
        <AdminSidebar currentUserRole={role} />
        <div className="admin-main">
          <AdminHeader />
          <main className="admin-content">{children}</main>
        </div>
      </div>
    </AdminProviders>
  );
}
