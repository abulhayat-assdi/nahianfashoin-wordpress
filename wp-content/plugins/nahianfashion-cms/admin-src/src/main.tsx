import './shims/api';
import { createRoot } from 'react-dom/client';
import { usePathname } from 'next/navigation';
import { ConfirmProvider } from '@/contexts/ConfirmContext';
import AdminSidebar from '@/components/admin/AdminSidebar';
import AdminHeader from '@/components/admin/AdminHeader';
import Dashboard from '@/pages/dashboard';
import Orders from '@/pages/orders';
import Products from '@/pages/products';
import Categories from '@/pages/categories';
import HeroBanner from '@/pages/hero-banner';
import ComboOffers from '@/pages/combo-offers';
import Testimonials from '@/pages/testimonials';
import Reviews from '@/pages/reviews';
import Support from '@/pages/support';
import Footer from '@/pages/footer';
import Blocked from '@/pages/blocked';
import Coupons from '@/pages/coupons';
import Settings from '@/pages/settings';
import ManageAdmins from '@/pages/manage-admins';

const ROUTES: Record<string, () => JSX.Element> = {
  '/admin': Dashboard,
  '/admin/orders': Orders,
  '/admin/products': Products,
  '/admin/categories': Categories,
  '/admin/hero-banner': HeroBanner,
  '/admin/combo-offers': ComboOffers,
  '/admin/testimonials': Testimonials,
  '/admin/reviews': Reviews,
  '/admin/support': Support,
  '/admin/footer': Footer,
  '/admin/blocked': Blocked,
  '/admin/coupons': Coupons,
  '/admin/settings': Settings,
  '/admin/manage-admins': ManageAdmins,
};

function App() {
  const pathname = usePathname();
  const Page = ROUTES[pathname] || Dashboard;
  document.title = 'Nahian Fashion CMS';
  return (
    <ConfirmProvider>
      <div className="admin-shell">
        <AdminSidebar currentUserRole={window.NF_ADMIN.user.role} />
        <div className="admin-main">
          <AdminHeader />
          <main className="admin-content"><Page key={pathname} /></main>
        </div>
      </div>
    </ConfirmProvider>
  );
}

createRoot(document.getElementById('nf-admin-root')!).render(<App />);
