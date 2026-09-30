import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
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

  if (!user) {
    redirect('/admin/login');
  }

  const role = user.role as string;

  if (role !== 'admin' && role !== 'super_admin') {
    redirect('/admin/login');
  }

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
