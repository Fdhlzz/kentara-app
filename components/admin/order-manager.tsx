'use client';

import { useState, useTransition, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  ShoppingBag,
  Search,
  Truck,
  CheckCircle2,
  Clock,
  XCircle,
  Eye,
  UserCheck,
  Phone,
  MapPin,
  Calendar,
  DollarSign,
  AlertCircle,
  Package,
  Layers,
  ArrowUpDown,
  ExternalLink,
  ChevronRight,
  Sparkles,
  Loader2,
  RefreshCw,
  LayoutGrid,
  List,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { Order, AdminOrderStats, OrderStatus, PaymentStatus } from '@/types/order';
import type { CourierUser } from '@/lib/admin/courier-actions';
import {
  assignCourierToOrderAction,
  updateOrderStatusAction,
  deleteOrderAction,
} from '@/lib/admin/order-actions';

interface OrderManagerProps {
  initialOrders: Order[];
  stats: AdminOrderStats;
  couriers: CourierUser[];
}

export function OrderManager({
  initialOrders = [],
  stats: initialStats,
  couriers = [],
}: OrderManagerProps) {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [stats, setStats] = useState<AdminOrderStats>(initialStats);
  const [isPending, startTransition] = useTransition();

  // Sync state with props
  useEffect(() => {
    setOrders(initialOrders);
  }, [initialOrders]);

  useEffect(() => {
    if (initialStats) {
      setStats(initialStats);
    }
  }, [initialStats]);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrderStatus, setSelectedOrderStatus] = useState<string>('all');
  const [selectedPaymentStatus, setSelectedPaymentStatus] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'latest' | 'oldest' | 'amount_desc' | 'amount_asc'>('latest');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Modals
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [selectedCourierId, setSelectedCourierId] = useState<string>('');

  // Helpers for Status Badges
  const getOrderStatusBadge = (status: string) => {
    switch (status) {
      case 'menunggu_pembayaran':
        return (
          <Badge className="bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950 dark:text-amber-300 text-[10px] font-semibold">
            ⏳ Menunggu Pembayaran
          </Badge>
        );
      case 'sudah_dibayar':
        return (
          <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300 text-[10px] font-semibold">
            💳 Sudah Dibayar
          </Badge>
        );
      case 'diproses':
        return (
          <Badge className="bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950 dark:text-blue-300 text-[10px] font-semibold">
            📦 Sedang Diproses
          </Badge>
        );
      case 'dikirim':
        return (
          <Badge className="bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-950 dark:text-purple-300 text-[10px] font-semibold">
            🚚 Dalam Pengiriman
          </Badge>
        );
      case 'selesai':
        return (
          <Badge className="bg-zinc-100 text-zinc-800 border-zinc-300 dark:bg-zinc-800 dark:text-zinc-300 text-[10px] font-semibold">
            ✅ Selesai Diterima
          </Badge>
        );
      case 'dibatalkan':
        return (
          <Badge className="bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950 dark:text-rose-300 text-[10px] font-semibold">
            ❌ Dibatalkan
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPaymentStatusBadge = (status: string) => {
    switch (status) {
      case 'settlement':
      case 'paid':
      case 'capture':
      case 'success':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="h-3.5 w-3.5" /> Lunas
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-600 dark:text-amber-400">
            <Clock className="h-3.5 w-3.5" /> Menunggu
          </span>
        );
      case 'expire':
      case 'cancel':
      case 'deny':
      case 'failed':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-600 dark:text-rose-400">
            <XCircle className="h-3.5 w-3.5" /> Gagal/Batal
          </span>
        );
      default:
        return <span className="text-xs text-zinc-500">{status}</span>;
    }
  };

  // Filter and sort orders
  const filteredOrders = orders
    .filter((order) => {
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        order.order_code.toLowerCase().includes(q) ||
        order.customer_name.toLowerCase().includes(q) ||
        order.customer_phone.toLowerCase().includes(q) ||
        order.shipping_address.toLowerCase().includes(q) ||
        (order.courier_name && order.courier_name.toLowerCase().includes(q));

      const matchOrderStatus =
        selectedOrderStatus === 'all' || order.order_status === selectedOrderStatus;

      let matchPayment = true;
      if (selectedPaymentStatus === 'paid') {
        matchPayment = ['settlement', 'paid', 'capture', 'success'].includes(order.payment_status);
      } else if (selectedPaymentStatus === 'pending') {
        matchPayment = order.payment_status === 'pending';
      } else if (selectedPaymentStatus === 'failed') {
        matchPayment = ['expire', 'cancel', 'deny', 'failed'].includes(order.payment_status);
      }

      return matchSearch && matchOrderStatus && matchPayment;
    })
    .sort((a, b) => {
      if (sortBy === 'oldest') {
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      }
      if (sortBy === 'amount_desc') {
        return b.total_amount - a.total_amount;
      }
      if (sortBy === 'amount_asc') {
        return a.total_amount - b.total_amount;
      }
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

  // Open Assign Courier Dialog
  const openAssignModal = (order: Order) => {
    setSelectedOrder(order);
    setSelectedCourierId(order.courier_id || (couriers[0]?.id || ''));
    setIsAssignOpen(true);
  };

  // Handle Assign Courier
  const handleAssignCourier = () => {
    if (!selectedOrder || !selectedCourierId) return;

    const chosenCourier = couriers.find((c) => c.id === selectedCourierId);

    startTransition(async () => {
      const res = await assignCourierToOrderAction(selectedOrder.id, selectedCourierId);
      if (!res.success) {
        toast.error(res.error || 'Gagal menugaskan kurir');
        return;
      }

      toast.success('Kurir Berhasil Ditugaskan!', {
        description: `Pesanan ${selectedOrder.order_code} telah diserahkan kepada kurir ${
          chosenCourier?.full_name || ''
        }.`,
      });

      setOrders((prev) =>
        prev.map((o) =>
          o.id === selectedOrder.id
            ? {
                ...o,
                courier_id: selectedCourierId,
                courier_name: chosenCourier?.full_name || null,
                courier_phone: chosenCourier?.phone || null,
                courier_assigned_at: new Date().toISOString(),
                order_status: 'diproses',
              }
            : o
        )
      );

      setIsAssignOpen(false);
      setSelectedOrder(null);
      router.refresh();
    });
  };

  // Handle Update Status
  const handleStatusChange = (order: Order, newStatus: OrderStatus) => {
    startTransition(async () => {
      const res = await updateOrderStatusAction(order.id, newStatus);
      if (!res.success) {
        toast.error(res.error || 'Gagal mengubah status');
        return;
      }

      setOrders((prev) =>
        prev.map((o) => (o.id === order.id ? { ...o, order_status: newStatus } : o))
      );
      toast.success('Status Pesanan Diperbarui');
      router.refresh();
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card className="p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-500">Total Pesanan</span>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/50">
              <ShoppingBag className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-extrabold text-zinc-900 dark:text-white">
              {stats?.totalOrders ?? orders.length}
            </span>
            <p className="text-[11px] text-zinc-400 mt-0.5">Semua riwayat transaksi</p>
          </div>
        </Card>

        <Card className="p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-500">Perlu Dikirim</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50">
              <Truck className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">
              {stats?.paidOrders ?? orders.filter((o) => ['settlement', 'paid'].includes(o.payment_status) && !o.courier_id).length}
            </span>
            <p className="text-[11px] text-zinc-400 mt-0.5">Lunas, belum ada kurir</p>
          </div>
        </Card>

        <Card className="p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-500">Dalam Pengantaran</span>
            <div className="p-2 rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-950/50">
              <Package className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-extrabold text-purple-600 dark:text-purple-400">
              {stats?.inDeliveryOrders ?? orders.filter((o) => o.courier_id && ['diproses', 'dikirim'].includes(o.order_status)).length}
            </span>
            <p className="text-[11px] text-zinc-400 mt-0.5">Kurir sedang menuju lokasi</p>
          </div>
        </Card>

        <Card className="p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-500">Total Omzet Lunas</span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950/50">
              <DollarSign className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-lg sm:text-xl font-extrabold text-amber-600 dark:text-amber-400">
              Rp {(stats?.totalRevenue ?? orders.filter(o => ['settlement', 'paid'].includes(o.payment_status)).reduce((s, o) => s + (o.total_amount || 0), 0)).toLocaleString('id-ID')}
            </span>
            <p className="text-[11px] text-zinc-400 mt-0.5">Pembayaran terverifikasi</p>
          </div>
        </Card>
      </div>

      {/* Action Bar & Controls */}
      <div className="flex flex-col gap-4 bg-white dark:bg-zinc-900 p-4 sm:p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="p-2.5 rounded-xl bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300">
              <ShoppingBag className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-white">
                Daftar Pesanan &amp; Penugasan Kurir
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Pantau pesanan masuk, verifikasi pembayaran Midtrans, dan tugaskan kurir pengantar
              </p>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={() => router.refresh()}
            className="rounded-xl h-10 px-3 text-xs font-semibold gap-1.5 self-start sm:self-auto"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Segarkan Data</span>
          </Button>
        </div>

        {/* Filters Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5 pt-2 border-t border-zinc-100 dark:border-zinc-800">
          <div className="lg:col-span-2 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari kode pesanan, nama pembeli, WhatsApp..."
              className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-800/50 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <div>
            <select
              value={selectedOrderStatus}
              onChange={(e) => setSelectedOrderStatus(e.target.value)}
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
            >
              <option value="all">Semua Status Pesanan</option>
              <option value="menunggu_pembayaran">Menunggu Pembayaran</option>
              <option value="sudah_dibayar">Sudah Dibayar (Siap Kirim)</option>
              <option value="diproses">Sedang Diproses Kurir</option>
              <option value="dikirim">Dalam Pengiriman</option>
              <option value="selesai">Selesai</option>
              <option value="dibatalkan">Dibatalkan</option>
            </select>
          </div>

          <div>
            <select
              value={selectedPaymentStatus}
              onChange={(e) => setSelectedPaymentStatus(e.target.value)}
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
            >
              <option value="all">Semua Status Bayar</option>
              <option value="paid">Lunas (Settlement)</option>
              <option value="pending">Pending</option>
              <option value="failed">Gagal / Kadaluarsa</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="flex-1 px-2.5 py-2 text-xs sm:text-sm rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
            >
              <option value="latest">Terbaru</option>
              <option value="oldest">Terlama</option>
              <option value="amount_desc">Nominal Tertinggi</option>
              <option value="amount_asc">Nominal Terendah</option>
            </select>

            <div className="flex items-center border border-zinc-300 dark:border-zinc-700 rounded-xl overflow-hidden p-0.5 bg-zinc-100 dark:bg-zinc-800 shrink-0">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition ${
                  viewMode === 'grid'
                    ? 'bg-white dark:bg-zinc-900 text-blue-600 dark:text-blue-400 shadow-xs'
                    : 'text-zinc-400 hover:text-zinc-600'
                }`}
                title="Tampilan Kartu"
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-lg transition ${
                  viewMode === 'table'
                    ? 'bg-white dark:bg-zinc-900 text-blue-600 dark:text-blue-400 shadow-xs'
                    : 'text-zinc-400 hover:text-zinc-600'
                }`}
                title="Tampilan Tabel"
              >
                <List className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Orders List Content */}
      {filteredOrders.length === 0 ? (
        <Card className="p-12 text-center rounded-2xl border-dashed border-2 border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/50">
          <div className="h-16 w-16 mx-auto rounded-2xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-4">
            <ShoppingBag className="h-8 w-8" />
          </div>
          <h3 className="text-base font-bold text-zinc-900 dark:text-white">
            {orders.length === 0
              ? 'Belum ada pesanan masuk di sistem'
              : 'Tidak ada pesanan yang sesuai filter'}
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 max-w-sm mx-auto">
            {orders.length === 0
              ? 'Ketika pembeli melakukan checkout menggunakan Midtrans, transaksi akan muncul di sini secara otomatis.'
              : 'Coba ubah kata kunci pencarian atau sesuaikan filter status.'}
          </p>
        </Card>
      ) : viewMode === 'grid' ? (
        /* GRID VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
          {filteredOrders.map((order) => (
            <Card
              key={order.id}
              className="p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs hover:shadow-md transition flex flex-col justify-between"
            >
              <div className="space-y-3.5">
                {/* Header Row: Order Code & Badges */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-extrabold text-zinc-900 dark:text-white">
                        {order.order_code}
                      </span>
                      {order.payment_method && (
                        <span className="text-[10px] uppercase font-bold text-zinc-400 px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800">
                          {order.payment_method}
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-zinc-400 flex items-center gap-1 mt-0.5">
                      <Calendar className="h-3 w-3" />
                      {new Date(order.created_at).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>

                  <div className="flex flex-col items-end gap-1">
                    {getOrderStatusBadge(order.order_status)}
                    {getPaymentStatusBadge(order.payment_status)}
                  </div>
                </div>

                {/* Customer Information Box */}
                <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-100 dark:border-zinc-800 text-xs space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-zinc-900 dark:text-white">
                      {order.customer_name}
                    </span>
                    <a
                      href={`https://wa.me/${order.customer_phone.replace(/^0/, '62').replace(/\D/g, '')}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[11px] font-semibold text-emerald-600 hover:underline flex items-center gap-1"
                    >
                      <Phone className="h-3 w-3" />
                      {order.customer_phone}
                    </a>
                  </div>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400 flex items-start gap-1 line-clamp-2">
                    <MapPin className="h-3.5 w-3.5 text-zinc-400 shrink-0 mt-0.5" />
                    <span>{order.shipping_address}{order.shipping_city ? `, ${order.shipping_city}` : ''}</span>
                  </p>
                </div>

                {/* Items Summary */}
                <div className="space-y-1.5 text-xs">
                  <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wide">
                    Daftar Benih ({order.items?.length || 0} item):
                  </span>
                  <div className="space-y-1">
                    {order.items?.slice(0, 2).map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between text-xs">
                        <span className="font-medium text-zinc-800 dark:text-zinc-200 truncate max-w-[220px]">
                          {item.quantity} {item.unit} &times; {item.product_name}
                        </span>
                        <span className="font-semibold text-zinc-600 dark:text-zinc-400">
                          Rp {item.subtotal.toLocaleString('id-ID')}
                        </span>
                      </div>
                    ))}
                    {(order.items?.length || 0) > 2 && (
                      <span className="text-[11px] text-blue-600 dark:text-blue-400 font-medium block">
                        + {(order.items?.length || 0) - 2} varietas benih lainnya...
                      </span>
                    )}
                  </div>
                </div>

                {/* Courier Assignment Status Pill */}
                <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between text-xs">
                  <span className="text-zinc-500">Kurir Pengantar:</span>
                  {order.courier_name ? (
                    <span className="font-bold text-blue-700 dark:text-blue-400 flex items-center gap-1">
                      <Truck className="h-3.5 w-3.5" /> {order.courier_name}
                    </span>
                  ) : (
                    <span className="font-semibold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded-md text-[11px]">
                      Belum Ditugaskan
                    </span>
                  )}
                </div>
              </div>

              {/* Card Footer: Grand Total & Actions */}
              <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between gap-2">
                <div>
                  <span className="text-[10px] text-zinc-400 block font-medium">Total Tagihan</span>
                  <span className="text-base font-extrabold text-emerald-700 dark:text-emerald-400">
                    Rp {order.total_amount.toLocaleString('id-ID')}
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <Button
                    onClick={() => {
                      setSelectedOrder(order);
                      setIsDetailOpen(true);
                    }}
                    variant="outline"
                    size="sm"
                    className="text-xs font-semibold rounded-xl h-8 px-2.5"
                  >
                    <Eye className="h-3.5 w-3.5 mr-1" />
                    <span>Detail</span>
                  </Button>

                  {/* Tugaskan / Ganti Kurir: Hanya muncul jika pesanan belum diproses kirim atau selesai */}
                  {order.order_status !== 'dikirim' &&
                    order.order_status !== 'selesai' &&
                    order.order_status !== 'dibatalkan' && (
                      <Button
                        onClick={() => openAssignModal(order)}
                        size="sm"
                        className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl h-8 px-2.5 gap-1 shadow-xs"
                      >
                        <Truck className="h-3.5 w-3.5" />
                        <span>{order.courier_id ? 'Ganti Kurir' : 'Tugaskan Kurir'}</span>
                      </Button>
                    )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        /* TABLE VIEW */
        <div className="overflow-x-auto rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-zinc-50 dark:bg-zinc-800/60 text-zinc-600 dark:text-zinc-400 font-semibold border-b border-zinc-200 dark:border-zinc-800">
              <tr>
                <th className="py-3 px-4">Kode &amp; Waktu</th>
                <th className="py-3 px-3">Pembeli</th>
                <th className="py-3 px-3">Benih Dipesan</th>
                <th className="py-3 px-3">Total Bayar</th>
                <th className="py-3 px-3">Status Bayar</th>
                <th className="py-3 px-3">Kurir</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {filteredOrders.map((order) => (
                <tr key={order.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/40">
                  <td className="py-3 px-4">
                    <span className="font-mono font-bold text-zinc-900 dark:text-white block">
                      {order.order_code}
                    </span>
                    <span className="text-[11px] text-zinc-400">
                      {new Date(order.created_at).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </td>
                  <td className="py-3 px-3">
                    <span className="font-bold block">{order.customer_name}</span>
                    <span className="text-[11px] text-zinc-500">{order.customer_phone}</span>
                  </td>
                  <td className="py-3 px-3">
                    <span className="font-semibold block">{order.items?.length || 0} Varietas</span>
                    <span className="text-[11px] text-zinc-400">
                      {order.items?.map((i) => `${i.quantity} ${i.unit}`).join(', ') || '-'}
                    </span>
                  </td>
                  <td className="py-3 px-3 font-bold text-emerald-700 dark:text-emerald-400">
                    Rp {order.total_amount.toLocaleString('id-ID')}
                  </td>
                  <td className="py-3 px-3">
                    {getPaymentStatusBadge(order.payment_status)}
                    <div className="mt-0.5">{getOrderStatusBadge(order.order_status)}</div>
                  </td>
                  <td className="py-3 px-3">
                    {order.courier_name ? (
                      <span className="font-bold text-blue-600 dark:text-blue-400 text-xs">
                        {order.courier_name}
                      </span>
                    ) : (
                      <span className="text-zinc-400 text-xs">-</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <Button
                        onClick={() => {
                          setSelectedOrder(order);
                          setIsDetailOpen(true);
                        }}
                        variant="ghost"
                        size="sm"
                        className="h-8 px-2 text-xs"
                      >
                        Detail
                      </Button>
                      {order.order_status !== 'dikirim' &&
                        order.order_status !== 'selesai' &&
                        order.order_status !== 'dibatalkan' && (
                          <Button
                            onClick={() => openAssignModal(order)}
                            size="sm"
                            className="h-8 px-2 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-xl"
                          >
                            Kurir
                          </Button>
                        )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ASSIGN COURIER MODAL */}
      <Dialog open={isAssignOpen} onOpenChange={setIsAssignOpen}>
        <DialogContent className="max-w-md rounded-3xl p-6">
          <DialogHeader>
            <div className="h-12 w-12 rounded-2xl bg-blue-100 dark:bg-blue-950/80 text-blue-600 flex items-center justify-center mb-2">
              <Truck className="h-6 w-6" />
            </div>
            <DialogTitle className="text-lg font-extrabold text-zinc-900 dark:text-white">
              Tugaskan Mitra Kurir
            </DialogTitle>
            <DialogDescription className="text-xs text-zinc-500">
              Pilih mitra kurir aktif untuk mengantarkan pesanan{' '}
              <strong className="text-zinc-900 dark:text-white">{selectedOrder?.order_code}</strong>.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 mt-2">
            {couriers.length === 0 ? (
              <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-200 text-xs text-center">
                Belum ada mitra kurir terdaftar. Silakan buat akun kurir di tab &ldquo;Manajemen Mitra Kurir&rdquo; terlebih dahulu.
              </div>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {couriers.map((courier) => (
                  <label
                    key={courier.id}
                    className={`flex items-center justify-between p-3 rounded-2xl border cursor-pointer transition ${
                      selectedCourierId === courier.id
                        ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/50 ring-2 ring-blue-500/20'
                        : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="courier_choice"
                        value={courier.id}
                        checked={selectedCourierId === courier.id}
                        onChange={() => setSelectedCourierId(courier.id)}
                        className="text-blue-600 focus:ring-blue-500"
                      />
                      <div>
                        <span className="font-bold text-xs sm:text-sm text-zinc-900 dark:text-white block">
                          {courier.full_name}
                        </span>
                        <span className="text-[11px] text-zinc-500 flex items-center gap-1">
                          <Phone className="h-3 w-3" /> {courier.phone || '-'}
                        </span>
                      </div>
                    </div>
                    <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 text-[10px]">
                      Kurir Aktif
                    </Badge>
                  </label>
                ))}
              </div>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0 mt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsAssignOpen(false)}
              className="rounded-xl text-xs font-semibold"
            >
              Batal
            </Button>
            <Button
              type="button"
              onClick={handleAssignCourier}
              disabled={isPending || couriers.length === 0 || !selectedCourierId}
              className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold"
            >
              {isPending ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
                  <span>Menugaskan...</span>
                </>
              ) : (
                <span>Konfirmasi Penugasan</span>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ORDER DETAIL MODAL */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto rounded-3xl p-6">
          {selectedOrder && (
            <div className="space-y-4">
              <DialogHeader>
                <div className="flex items-center justify-between">
                  <DialogTitle className="text-lg font-extrabold flex items-center gap-2">
                    <ShoppingBag className="h-5 w-5 text-blue-600" />
                    Rincian Pesanan {selectedOrder.order_code}
                  </DialogTitle>
                </div>
                <DialogDescription className="text-xs">
                  Dibuat pada {new Date(selectedOrder.created_at).toLocaleString('id-ID')}
                </DialogDescription>
              </DialogHeader>

              {/* Status Bar */}
              <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-zinc-400 block font-medium">Status Pesanan:</span>
                  <div className="mt-0.5">{getOrderStatusBadge(selectedOrder.order_status)}</div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-zinc-400 block font-medium">Pembayaran:</span>
                  <div className="mt-0.5">{getPaymentStatusBadge(selectedOrder.payment_status)}</div>
                </div>
              </div>

              {/* Customer & Address */}
              <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-100 dark:border-zinc-800 space-y-2 text-xs">
                <h4 className="text-[11px] font-bold text-zinc-500 uppercase tracking-wide">
                  Informasi Pembeli &amp; Lokasi Pengiriman
                </h4>
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div>
                    <span className="text-zinc-400 block text-[10px]">Nama:</span>
                    <span className="font-semibold">{selectedOrder.customer_name}</span>
                  </div>
                  <div>
                    <span className="text-zinc-400 block text-[10px]">WhatsApp:</span>
                    <span className="font-semibold">{selectedOrder.customer_phone}</span>
                  </div>
                </div>
                <div className="pt-1">
                  <span className="text-zinc-400 block text-[10px]">Alamat Lengkap:</span>
                  <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                    {selectedOrder.shipping_address}{selectedOrder.shipping_city ? `, ${selectedOrder.shipping_city}` : ''}
                  </span>
                </div>
                {selectedOrder.notes && (
                  <div className="pt-1">
                    <span className="text-zinc-400 block text-[10px]">Catatan Pembeli:</span>
                    <span className="italic text-zinc-600 dark:text-zinc-400">{selectedOrder.notes}</span>
                  </div>
                )}
              </div>

              {/* Items List */}
              <div className="space-y-2 text-xs">
                <h4 className="text-[11px] font-bold text-zinc-500 uppercase tracking-wide">
                  Item Benih Kentang
                </h4>
                <div className="divide-y divide-zinc-100 dark:divide-zinc-800 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
                  {selectedOrder.items?.map((item, idx) => (
                    <div key={idx} className="p-3 bg-white dark:bg-zinc-900 flex items-center justify-between">
                      <div>
                        <span className="font-bold text-zinc-900 dark:text-white block">
                          {item.product_name}
                        </span>
                        <span className="text-[11px] text-zinc-500">
                          {item.quantity} {item.unit} &times; Rp {item.price.toLocaleString('id-ID')}
                        </span>
                      </div>
                      <span className="font-extrabold text-zinc-900 dark:text-white">
                        Rp {item.subtotal.toLocaleString('id-ID')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Pricing Breakdown */}
              <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-100 dark:border-zinc-800 space-y-1.5 text-xs">
                <div className="flex justify-between text-zinc-600 dark:text-zinc-400">
                  <span>Subtotal Benih</span>
                  <span>Rp {selectedOrder.subtotal.toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between text-zinc-600 dark:text-zinc-400">
                  <span>Ongkos Kirim Kurir</span>
                  <span>Rp {selectedOrder.shipping_cost.toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between text-sm font-extrabold text-zinc-900 dark:text-white pt-1.5 border-t border-zinc-200 dark:border-zinc-700">
                  <span>Total Pembayaran</span>
                  <span className="text-emerald-700 dark:text-emerald-400">
                    Rp {selectedOrder.total_amount.toLocaleString('id-ID')}
                  </span>
                </div>
              </div>

              {/* Status Update Buttons */}
              <div className="space-y-1.5 pt-1">
                <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wide">
                  Ubah Cepat Status Pesanan:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleStatusChange(selectedOrder, 'diproses')}
                    className="text-xs rounded-xl h-8"
                  >
                    Set Diproses
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleStatusChange(selectedOrder, 'dikirim')}
                    className="text-xs rounded-xl h-8"
                  >
                    Set Dikirim
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleStatusChange(selectedOrder, 'selesai')}
                    className="text-xs rounded-xl h-8 text-emerald-600"
                  >
                    Set Selesai
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleStatusChange(selectedOrder, 'dibatalkan')}
                    className="text-xs rounded-xl h-8 text-rose-600"
                  >
                    Batalkan
                  </Button>
                </div>
              </div>

              <DialogFooter>
                <Button
                  onClick={() => setIsDetailOpen(false)}
                  className="w-full rounded-xl text-xs font-semibold bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                >
                  Tutup Rincian
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
