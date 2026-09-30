import type { Metadata } from 'next';
import '../admin.css';

export const metadata: Metadata = {
  title: 'Forgot Password — Nahian Fashion CMS',
  robots: { index: false, follow: false },
};

export default function AdminForgotPasswordLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
