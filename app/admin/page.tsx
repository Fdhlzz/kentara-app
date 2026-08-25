import { redirect } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  ShieldAlert,
  Mail,
  Truck,
  Sprout,
  Users,
  ArrowLeft,
  ShieldCheck,
  Package,
  ShoppingBag,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { getCurrentUserProfile } from '@/lib/auth/actions';
import { getAdminDashboardStats, getCouriersList } from '@/lib/admin/courier-actions';
import { getAdminProductStats, getAdminProductsList } from '@/lib/admin/product-actions';
import { getAdminOrderStats, getAdminOrdersList } from '@/lib/admin/order-actions';
import { LogoutButton } from '@/components/auth/logout-button';
import { AdminViewSwitcher } from '@/components/admin/admin-view-switcher';

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

  const [stats, couriers, productStats, products, orderStats, orders] = await Promise.all([
    getAdminDashboardStats(),
    getCouriersList(),
    getAdminProductStats(),
    getAdminProductsList(),
    getAdminOrderStats(),
    getAdminOrdersList(),
  ]);

  return (
    <div className="min-h-screen flex flex-col bg-emerald-950/5 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
      {/* Header Bar */}
      <header className="sticky top-0 z-40 border-b border-emerald-900/10 bg-white/80 backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-900/80">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <Image
              src="/icons/icon-192x192.png"
              alt="Logo Kentara"
              width={36}
              height={36}
              className="rounded-xl shadow-xs"
              priority
            />
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold tracking-tight text-emerald-800 dark:text-emerald-400">
                  Kentara
                </span>
                <Badge className="bg-purple-600 text-white text-[10px] px-2 py-0.5">
                  Admin Panel
                </Badge>
              </div>
              <span className="text-[10px] text-zinc-500 font-medium">
                Pusat Kendali Marketplace &amp; Komoditas Benih Kentang
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-zinc-600 hover:text-emerald-700 dark:text-zinc-400 transition"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Lihat Marketplace</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {/* Welcome & Admin Profile Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <div className="flex items-center gap-3.5">
            <div className="h-14 w-14 rounded-2xl bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 flex items-center justify-center shadow-xs shrink-0">
              <ShieldAlert className="h-7 w-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-extrabold text-zinc-900 dark:text-white">
                  {profile.full_name}
                </h1>
                <Badge className="bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-950 dark:text-purple-300 text-xs">
                  {profile.role.toUpperCase()}
                </Badge>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 flex flex-wrap items-center gap-3">
                <span className="flex items-center gap-1">
                  <Mail className="h-3 w-3" />
                  {profile.email || 'admin@kentara.com'}
                </span>
                <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                  <ShieldCheck className="h-3 w-3" />
                  Akses Sistem Penuh
                </span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end md:self-center">
            <LogoutButton className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold px-4 py-2" />
          </div>
        </div>

        {/* Stats Metrics Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <Card className="p-4 sm:p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-500">Benih Kentang</span>
              <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50">
                <Sprout className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">
                {productStats.totalProducts}
              </span>
              <p className="text-[11px] text-zinc-400 mt-0.5">
                {productStats.activeProducts} aktif di etalase
              </p>
            </div>
          </Card>

          <Card className="p-4 sm:p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-500">Pesanan Masuk</span>
              <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50">
                <ShoppingBag className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl font-extrabold text-indigo-600 dark:text-indigo-400">
                {orderStats.totalOrders}
              </span>
              <p className="text-[11px] text-zinc-400 mt-0.5">
                {orderStats.paidOrders} perlu ditugaskan ke kurir
              </p>
            </div>
          </Card>

          <Card className="p-4 sm:p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-500">Mitra Kurir</span>
              <div className="p-2 rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/50">
                <Truck className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl font-extrabold text-blue-600 dark:text-blue-400">
                {stats.totalKurir}
              </span>
              <p className="text-[11px] text-zinc-400 mt-0.5">Armada pengiriman</p>
            </div>
          </Card>

          <Card className="p-4 sm:p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-500">Mitra Petani</span>
              <div className="p-2 rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950/50">
                <Users className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl font-extrabold text-amber-600 dark:text-amber-400">
                {stats.totalPetani}
              </span>
              <p className="text-[11px] text-zinc-400 mt-0.5">Pelanggan terdaftar</p>
            </div>
          </Card>
        </div>

        {/* Dynamic Multi-Tab Admin Section */}
        <section className="space-y-4">
          <AdminViewSwitcher
            initialProducts={products}
            productStats={productStats}
            initialOrders={orders}
            orderStats={orderStats}
            initialCouriers={couriers}
            defaultTab="products"
          />
        </section>
      </main>
    </div>
  );
}
