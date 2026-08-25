'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  LayoutDashboard,
  ShoppingBag,
  Sprout,
  Truck,
  Settings,
  Store,
  Sparkles,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { NotificationCenter } from '@/components/notifications/notification-center';
import { ThemeToggle } from '@/components/theme-toggle';
import { AdminOverviewView } from '@/components/admin/admin-overview-view';
import { OrderManager } from '@/components/admin/order-manager';
import { ProductManager } from '@/components/admin/product-manager';
import { CourierManager } from '@/components/admin/courier-manager';
import { AdminSettingsView } from '@/components/admin/admin-settings-view';
import type { UserProfile } from '@/types/auth';
import type { Product, AdminProductStats } from '@/types/product';
import type { Order, AdminOrderStats } from '@/types/order';
import type { Payment, AdminPaymentStats } from '@/types/payment';
import type { CourierUser, AdminDashboardStats } from '@/lib/admin/courier-actions';

export type AdminTab = 'ringkasan' | 'pesanan' | 'produk' | 'kurir' | 'pengaturan';

interface AdminAppShellProps {
  profile: UserProfile;
  products: Product[];
  productStats: AdminProductStats;
  orders: Order[];
  orderStats: AdminOrderStats;
  payments: Payment[];
  paymentStats: AdminPaymentStats;
  couriers: CourierUser[];
  courierStats: AdminDashboardStats;
}

export function AdminAppShell({
  profile,
  products,
  productStats,
  orders,
  orderStats,
  payments,
  paymentStats,
  couriers,
  courierStats,
}: AdminAppShellProps) {
  const [activeTab, setActiveTab] = useState<AdminTab>('ringkasan');

  // Count unassigned or urgent orders
  const pendingOrdersCount = orderStats?.paidOrders ?? 0;

  return (
    <div className="min-h-screen flex flex-col bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 pb-20 md:pb-8">
      {/* 1. Modern Sticky Top Header (Mobile & Desktop) */}
      <header className="sticky top-0 z-30 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md border-b border-zinc-200/80 dark:border-zinc-800 px-4 py-3 sm:px-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <Image
              src="/icons/icon-192x192.png"
              alt="Logo Kentara"
              width={34}
              height={34}
              className="rounded-xl shadow-xs"
              priority
            />
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="text-base sm:text-lg font-black tracking-tight text-emerald-800 dark:text-emerald-400 leading-tight">
                  Kentara Admin
                </span>
                <Badge className="bg-purple-600 text-white text-[9px] font-black px-1.5 py-0 uppercase">
                  Panel
                </Badge>
              </div>
              <span className="text-[10px] text-zinc-500 font-medium hidden sm:block">
                Pusat Kendali &amp; Manajemen Distribusi Benih
              </span>
            </div>
          </div>

          {/* Desktop Tab Navigation (Hidden on mobile) */}
          <nav className="hidden md:flex items-center gap-1.5 bg-zinc-100 dark:bg-zinc-800/80 p-1.5 rounded-2xl border border-zinc-200/80 dark:border-zinc-700/60 text-xs font-bold">
            <button
              type="button"
              onClick={() => setActiveTab('ringkasan')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl transition cursor-pointer ${
                activeTab === 'ringkasan'
                  ? 'bg-white dark:bg-zinc-900 text-emerald-700 dark:text-emerald-400 shadow-xs'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
              }`}
            >
              <LayoutDashboard className="h-4 w-4" />
              <span>Ringkasan</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('pesanan')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl transition cursor-pointer ${
                activeTab === 'pesanan'
                  ? 'bg-white dark:bg-zinc-900 text-indigo-700 dark:text-indigo-400 shadow-xs'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
              }`}
            >
              <ShoppingBag className="h-4 w-4" />
              <span>Pesanan</span>
              {pendingOrdersCount > 0 && (
                <span className="h-4 min-w-4 px-1 rounded-full bg-rose-500 text-white text-[9px] font-black flex items-center justify-center">
                  {pendingOrdersCount}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('produk')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl transition cursor-pointer ${
                activeTab === 'produk'
                  ? 'bg-white dark:bg-zinc-900 text-emerald-700 dark:text-emerald-400 shadow-xs'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
              }`}
            >
              <Sprout className="h-4 w-4" />
              <span>Produk</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('kurir')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl transition cursor-pointer ${
                activeTab === 'kurir'
                  ? 'bg-white dark:bg-zinc-900 text-blue-700 dark:text-blue-400 shadow-xs'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
              }`}
            >
              <Truck className="h-4 w-4" />
              <span>Kurir</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('pengaturan')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl transition cursor-pointer ${
                activeTab === 'pengaturan'
                  ? 'bg-white dark:bg-zinc-900 text-purple-700 dark:text-purple-400 shadow-xs'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
              }`}
            >
              <Settings className="h-4 w-4" />
              <span>Pengaturan</span>
            </button>
          </nav>

          {/* Action Tools: ThemeToggle, Notifications, Store Link */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <Link
              href="/"
              className="hidden sm:inline-flex items-center gap-1.5 text-xs font-bold text-zinc-600 dark:text-zinc-400 hover:text-emerald-700 dark:hover:text-emerald-400 p-2 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
              title="Lihat Toko Marketplace"
            >
              <Store className="h-4 w-4" />
              <span>Toko</span>
            </Link>

            <ThemeToggle />
            <NotificationCenter role="admin" userId={profile.id} />
          </div>
        </div>
      </header>

      {/* 2. Main Content Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {activeTab === 'ringkasan' && (
          <AdminOverviewView
            productStats={productStats}
            orderStats={orderStats}
            paymentStats={paymentStats}
            courierStats={courierStats}
            orders={orders}
            couriers={couriers}
            onNavigateTab={setActiveTab}
          />
        )}

        {activeTab === 'pesanan' && (
          <OrderManager
            initialOrders={orders}
            stats={orderStats}
            couriers={couriers}
          />
        )}

        {activeTab === 'produk' && (
          <ProductManager
            initialProducts={products}
            stats={productStats}
          />
        )}

        {activeTab === 'kurir' && (
          <CourierManager
            initialCouriers={couriers}
          />
        )}

        {activeTab === 'pengaturan' && (
          <AdminSettingsView
            profile={profile}
          />
        )}
      </main>

      {/* 3. Mobile Bottom Navigation Bar (Hidden on md/desktop screens) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md border-t border-zinc-200/80 dark:border-zinc-800 py-1.5 px-2 shadow-2xl">
        <div className="max-w-md mx-auto grid grid-cols-5 gap-1">
          {/* Ringkasan */}
          <button
            type="button"
            onClick={() => setActiveTab('ringkasan')}
            className={`flex flex-col items-center justify-center py-1.5 rounded-2xl transition active:scale-95 cursor-pointer ${
              activeTab === 'ringkasan'
                ? 'text-emerald-600 dark:text-emerald-400 font-extrabold bg-emerald-50 dark:bg-emerald-950/60'
                : 'text-zinc-500 dark:text-zinc-400 font-medium hover:text-zinc-800 dark:hover:text-zinc-200'
            }`}
          >
            <LayoutDashboard className="h-5 w-5" />
            <span className="text-[10px] mt-0.5">Ringkasan</span>
          </button>

          {/* Pesanan */}
          <button
            type="button"
            onClick={() => setActiveTab('pesanan')}
            className={`relative flex flex-col items-center justify-center py-1.5 rounded-2xl transition active:scale-95 cursor-pointer ${
              activeTab === 'pesanan'
                ? 'text-indigo-600 dark:text-indigo-400 font-extrabold bg-indigo-50 dark:bg-indigo-950/60'
                : 'text-zinc-500 dark:text-zinc-400 font-medium hover:text-zinc-800 dark:hover:text-zinc-200'
            }`}
          >
            <div className="relative">
              <ShoppingBag className="h-5 w-5" />
              {pendingOrdersCount > 0 && (
                <span className="absolute -top-1 -right-1 h-3.5 w-3.5 rounded-full bg-rose-500 text-white text-[8px] font-black flex items-center justify-center">
                  {pendingOrdersCount}
                </span>
              )}
            </div>
            <span className="text-[10px] mt-0.5">Pesanan</span>
          </button>

          {/* Produk */}
          <button
            type="button"
            onClick={() => setActiveTab('produk')}
            className={`flex flex-col items-center justify-center py-1.5 rounded-2xl transition active:scale-95 cursor-pointer ${
              activeTab === 'produk'
                ? 'text-emerald-600 dark:text-emerald-400 font-extrabold bg-emerald-50 dark:bg-emerald-950/60'
                : 'text-zinc-500 dark:text-zinc-400 font-medium hover:text-zinc-800 dark:hover:text-zinc-200'
            }`}
          >
            <Sprout className="h-5 w-5" />
            <span className="text-[10px] mt-0.5">Produk</span>
          </button>

          {/* Kurir */}
          <button
            type="button"
            onClick={() => setActiveTab('kurir')}
            className={`flex flex-col items-center justify-center py-1.5 rounded-2xl transition active:scale-95 cursor-pointer ${
              activeTab === 'kurir'
                ? 'text-blue-600 dark:text-blue-400 font-extrabold bg-blue-50 dark:bg-blue-950/60'
                : 'text-zinc-500 dark:text-zinc-400 font-medium hover:text-zinc-800 dark:hover:text-zinc-200'
            }`}
          >
            <Truck className="h-5 w-5" />
            <span className="text-[10px] mt-0.5">Kurir</span>
          </button>

          {/* Pengaturan */}
          <button
            type="button"
            onClick={() => setActiveTab('pengaturan')}
            className={`flex flex-col items-center justify-center py-1.5 rounded-2xl transition active:scale-95 cursor-pointer ${
              activeTab === 'pengaturan'
                ? 'text-purple-600 dark:text-purple-400 font-extrabold bg-purple-50 dark:bg-purple-950/60'
                : 'text-zinc-500 dark:text-zinc-400 font-medium hover:text-zinc-800 dark:hover:text-zinc-200'
            }`}
          >
            <Settings className="h-5 w-5" />
            <span className="text-[10px] mt-0.5">Pengaturan</span>
          </button>
        </div>
      </nav>
    </div>
  );
}
