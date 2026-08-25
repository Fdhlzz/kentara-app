import { redirect } from 'next/navigation';
import { getCurrentUserProfile } from '@/lib/auth/actions';
import { getAdminDashboardStats, getCouriersList } from '@/lib/admin/courier-actions';
import { getAdminProductStats, getAdminProductsList } from '@/lib/admin/product-actions';
import { getAdminOrderStats, getAdminOrdersList } from '@/lib/admin/order-actions';
import { getAdminPaymentStats, getAdminPaymentsList } from '@/lib/admin/payment-actions';
import { AdminAppShell } from '@/components/admin/admin-app-shell';

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  const profile = await getCurrentUserProfile();

  if (!profile) {
    redirect('/login');
  }

  // Jika bukan admin, arahkan ke role yang sesuai
  if (profile.role !== 'admin') {
    redirect(`/${profile.role}`);
  }

  const [
    courierStats,
    couriers,
    productStats,
    products,
    orderStats,
    orders,
    paymentStats,
    payments,
  ] = await Promise.all([
    getAdminDashboardStats(),
    getCouriersList(),
    getAdminProductStats(),
    getAdminProductsList(),
    getAdminOrderStats(),
    getAdminOrdersList(),
    getAdminPaymentStats(),
    getAdminPaymentsList(),
  ]);

  return (
    <AdminAppShell
      profile={profile}
      products={products}
      productStats={productStats}
      orders={orders}
      orderStats={orderStats}
      payments={payments}
      paymentStats={paymentStats}
      couriers={couriers}
      courierStats={courierStats}
    />
  );
}
