import type { Metadata } from 'next';
import '../admin.css';

export const metadata: Metadata = {
  title: 'Reset Password — Nahian Fashion CMS',
  robots: { index: false, follow: false },
};

export default function AdminResetPasswordLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
