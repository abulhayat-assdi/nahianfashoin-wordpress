import type { Metadata } from 'next';
import '../admin.css';

export const metadata: Metadata = {
  title: 'Admin Login — Nahian Fashion CMS',
  description: 'Sign in to the Nahian Fashion content management system.',
  robots: { index: false, follow: false },
};

export default function AdminLoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
