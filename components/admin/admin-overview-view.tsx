'use client';

import {
  Sprout,
  ShoppingBag,
  Truck,
  DollarSign,
  ArrowRight,
  Plus,
  Clock,
  CheckCircle2,
  AlertCircle,
  MapPin,
  Sparkles,
  Layers,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { AdminProductStats } from '@/types/product';
import type { AdminOrderStats, Order } from '@/types/order';
import type { AdminPaymentStats } from '@/types/payment';
import type { CourierUser, AdminDashboardStats } from '@/lib/admin/courier-actions';

interface AdminOverviewViewProps {
  productStats: AdminProductStats;
  orderStats: AdminOrderStats;
  paymentStats: AdminPaymentStats;
  courierStats: AdminDashboardStats;
  orders: Order[];
  couriers: CourierUser[];
  onNavigateTab: (tab: 'ringkasan' | 'pesanan' | 'produk' | 'kurir' | 'pengaturan') => void;
}

export function AdminOverviewView({
  productStats,
  orderStats,
  paymentStats,
  courierStats,
  orders,
  couriers,
  onNavigateTab,
}: AdminOverviewViewProps) {
  // Urgent orders requiring courier assignment (paid / diproses without courier)
  const unassignedOrders = orders.filter(
    (o) => (o.order_status === 'diproses' || o.payment_status === 'settlement') && !o.courier_id
  );

  const recentOrders = orders.slice(0, 5);

  return (
    <div className="space-y-5">
      {/* 1. KPI Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Katalog Benih */}
        <Card
          onClick={() => onNavigateTab('produk')}
          className="p-4 sm:p-5 rounded-3xl border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs hover:border-emerald-500/50 transition cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-500">Benih Kentang</span>
            <div className="p-2 rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400 group-hover:scale-110 transition">
              <Sprout className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400">
              {productStats?.totalProducts ?? 0}
            </span>
            <p className="text-[11px] text-zinc-400 mt-0.5 flex items-center justify-between">
              <span>{productStats?.activeProducts ?? 0} varietas aktif</span>
              <ChevronRight className="h-3 w-3 text-zinc-400 group-hover:translate-x-0.5 transition" />
            </p>
          </div>
        </Card>

        {/* Pesanan Masuk */}
        <Card
          onClick={() => onNavigateTab('pesanan')}
          className="p-4 sm:p-5 rounded-3xl border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs hover:border-indigo-500/50 transition cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-500">Pesanan Masuk</span>
            <div className="p-2 rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400 group-hover:scale-110 transition">
              <ShoppingBag className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-black text-indigo-600 dark:text-indigo-400">
              {orderStats?.totalOrders ?? 0}
            </span>
            <p className="text-[11px] text-zinc-400 mt-0.5 flex items-center justify-between">
              <span>{orderStats?.paidOrders ?? 0} perlu dikirim</span>
              <ChevronRight className="h-3 w-3 text-zinc-400 group-hover:translate-x-0.5 transition" />
            </p>
          </div>
        </Card>

        {/* Omzet Penjualan */}
        <Card className="p-4 sm:p-5 rounded-3xl border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-500">Omzet Lunas</span>
            <div className="p-2 rounded-2xl bg-purple-50 text-purple-600 dark:bg-purple-950/60 dark:text-purple-400">
              <DollarSign className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-xl sm:text-2xl font-black text-purple-600 dark:text-purple-400">
              Rp {(paymentStats?.totalRevenue ?? 0).toLocaleString('id-ID')}
            </span>
            <p className="text-[11px] text-zinc-400 mt-0.5">
              {paymentStats?.completedPayments ?? 0} transaksi lunas
            </p>
          </div>
        </Card>

        {/* Mitra Kurir */}
        <Card
          onClick={() => onNavigateTab('kurir')}
          className="p-4 sm:p-5 rounded-3xl border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs hover:border-blue-500/50 transition cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-500">Mitra Kurir</span>
            <div className="p-2 rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400 group-hover:scale-110 transition">
              <Truck className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-black text-blue-600 dark:text-blue-400">
              {courierStats?.totalKurir ?? couriers.length}
            </span>
            <p className="text-[11px] text-zinc-400 mt-0.5 flex items-center justify-between">
              <span>{couriers.length} armada terdaftar</span>
              <ChevronRight className="h-3 w-3 text-zinc-400 group-hover:translate-x-0.5 transition" />
            </p>
          </div>
        </Card>
      </div>

      {/* 2. Quick Action Shortcuts */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <Button
          type="button"
          onClick={() => onNavigateTab('produk')}
          className="h-12 bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:text-emerald-700 dark:hover:text-emerald-300 rounded-2xl font-bold text-xs shadow-xs justify-start px-3.5 gap-2"
        >
          <div className="p-1 rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
            <Plus className="h-3.5 w-3.5" />
          </div>
          <span>Tambah Benih</span>
        </Button>

        <Button
          type="button"
          onClick={() => onNavigateTab('pesanan')}
          className="h-12 bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 hover:text-indigo-700 dark:hover:text-indigo-300 rounded-2xl font-bold text-xs shadow-xs justify-start px-3.5 gap-2"
        >
          <div className="p-1 rounded-lg bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
            <ShoppingBag className="h-3.5 w-3.5" />
          </div>
          <span>Kelola Pesanan</span>
        </Button>

        <Button
          type="button"
          onClick={() => onNavigateTab('kurir')}
          className="h-12 bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200 hover:bg-blue-50 dark:hover:bg-blue-950/40 hover:text-blue-700 dark:hover:text-blue-300 rounded-2xl font-bold text-xs shadow-xs justify-start px-3.5 gap-2"
        >
          <div className="p-1 rounded-lg bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
            <Truck className="h-3.5 w-3.5" />
          </div>
          <span>Pantau Kurir</span>
        </Button>

        <Button
          type="button"
          onClick={() => onNavigateTab('pengaturan')}
          className="h-12 bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200 hover:bg-purple-50 dark:hover:bg-purple-950/40 hover:text-purple-700 dark:hover:text-purple-300 rounded-2xl font-bold text-xs shadow-xs justify-start px-3.5 gap-2"
        >
          <div className="p-1 rounded-lg bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300">
            <TrendingUp className="h-3.5 w-3.5" />
          </div>
          <span>Pengaturan Akun</span>
        </Button>
      </div>

      {/* 3. Urgent Deliveries / Unassigned Orders Attention */}
      {unassignedOrders.length > 0 && (
        <Card className="p-4 sm:p-5 rounded-3xl border border-amber-300/80 dark:border-amber-900/60 bg-amber-50/70 dark:bg-amber-950/20 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-amber-500 text-white">
                <AlertCircle className="h-4 w-4" />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-extrabold text-amber-900 dark:text-amber-200">
                  {unassignedOrders.length} Pesanan Perlu Penugasan Kurir
                </h4>
                <p className="text-[11px] text-amber-700 dark:text-amber-400">
                  Pesanan telah dibayar atau dikonfirmasi, segera tugaskan ke mitra kurir logistik.
                </p>
              </div>
            </div>

            <Button
              size="sm"
              onClick={() => onNavigateTab('pesanan')}
              className="bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold gap-1 shadow-xs"
            >
              <span>Tugaskan</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </Card>
      )}

      {/* 4. Recent Orders Feed */}
      <Card className="p-4 sm:p-5 rounded-3xl border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs space-y-3">
        <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3">
          <div>
            <h3 className="text-sm font-extrabold text-zinc-900 dark:text-white">
              Aktivitas Pesanan Terbaru
            </h3>
            <p className="text-xs text-zinc-400">
              Daftar transaksi pesanan benih petani terkini
            </p>
          </div>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onNavigateTab('pesanan')}
            className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-xl"
          >
            <span>Lihat Semua</span>
            <ChevronRight className="h-4 w-4 ml-0.5" />
          </Button>
        </div>

        {recentOrders.length === 0 ? (
          <div className="py-8 text-center text-xs text-zinc-400">
            Belum ada data transaksi pesanan.
          </div>
        ) : (
          <div className="space-y-2 divide-y divide-zinc-100 dark:divide-zinc-800/60">
            {recentOrders.map((order) => (
              <div
                key={order.id}
                onClick={() => onNavigateTab('pesanan')}
                className="pt-2.5 first:pt-0 flex items-center justify-between gap-3 cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800/40 p-2 rounded-2xl transition"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-9 w-9 rounded-xl bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 flex items-center justify-center text-xs font-black shrink-0">
                    {order.customer_name ? order.customer_name.charAt(0).toUpperCase() : 'P'}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-black text-zinc-900 dark:text-white truncate">
                        {order.customer_name}
                      </span>
                      <Badge className="bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 text-[9px] font-mono px-1.5 py-0">
                        {order.order_code}
                      </Badge>
                    </div>
                    <p className="text-[11px] text-zinc-400 truncate mt-0.5 flex items-center gap-1">
                      <MapPin className="h-3 w-3 text-rose-500 shrink-0" />
                      <span>{order.shipping_city || 'Makassar'}</span>
                    </p>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-xs font-black text-zinc-900 dark:text-white block">
                    Rp {order.total_amount.toLocaleString('id-ID')}
                  </span>
                  <Badge
                    className={`text-[9px] font-bold px-1.5 py-0 mt-0.5 ${
                      order.order_status === 'selesai'
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                        : order.order_status === 'dikirim'
                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                        : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                    }`}
                  >
                    {order.order_status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
