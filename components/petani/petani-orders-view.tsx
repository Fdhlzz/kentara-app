'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Package,
  Clock,
  CheckCircle2,
  Truck,
  Ban,
  Search,
  ArrowLeft,
  Copy,
  ExternalLink,
  ChevronRight,
  MapPin,
  Phone,
  MessageSquare,
  RefreshCw,
  ShoppingBag,
  CreditCard,
  Banknote,
  Receipt,
  FileText,
  Sparkles,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { useCart } from '@/lib/cart/cart-context';
import { useMidtransSnap } from '@/hooks/use-midtrans-snap';
import { markOrderPaymentSuccessAction } from '@/lib/admin/order-actions';
import type { Order, OrderStatus } from '@/types/order';
import type { UserProfile } from '@/types/auth';

interface PetaniOrdersViewProps {
  orders: Order[];
  currentUser: UserProfile;
}

export function PetaniOrdersView({ orders: initialOrders, currentUser }: PetaniOrdersViewProps) {
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [activeTab, setActiveTab] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const { addToCart, setIsCartOpen } = useCart();
  const { openSnapPopup } = useMidtransSnap();

  // Status Tab Counts
  const counts = useMemo(() => {
    return {
      all: orders.length,
      menunggu_pembayaran: orders.filter((o) => o.order_status === 'menunggu_pembayaran').length,
      diproses: orders.filter(
        (o) => o.order_status === 'diproses' || o.order_status === 'sudah_dibayar'
      ).length,
      dikirim: orders.filter((o) => o.order_status === 'dikirim').length,
      selesai: orders.filter((o) => o.order_status === 'selesai').length,
      dibatalkan: orders.filter((o) => o.order_status === 'dibatalkan').length,
    };
  }, [orders]);

  // Filtered Orders
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      // Tab Filtering
      if (activeTab === 'menunggu_pembayaran' && order.order_status !== 'menunggu_pembayaran') {
        return false;
      }
      if (
        activeTab === 'diproses' &&
        order.order_status !== 'diproses' &&
        order.order_status !== 'sudah_dibayar'
      ) {
        return false;
      }
      if (activeTab === 'dikirim' && order.order_status !== 'dikirim') {
        return false;
      }
      if (activeTab === 'selesai' && order.order_status !== 'selesai') {
        return false;
      }
      if (activeTab === 'dibatalkan' && order.order_status !== 'dibatalkan') {
        return false;
      }

      // Search Query Filtering
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchCode = order.order_code.toLowerCase().includes(q);
        const matchCity = order.shipping_city?.toLowerCase().includes(q);
        const matchAddress = order.shipping_address?.toLowerCase().includes(q);
        const matchItems = order.items?.some(
          (item) =>
            item.product_name.toLowerCase().includes(q) ||
            item.product_variety?.toLowerCase().includes(q)
        );
        if (!matchCode && !matchCity && !matchAddress && !matchItems) {
          return false;
        }
      }

      return true;
    });
  }, [orders, activeTab, searchQuery]);

  // Copy Order Code
  const copyOrderCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success(`Kode pesanan ${code} disalin ke papan klip.`);
  };

  // Reorder / Buy Again
  const handleReorder = async (order: Order) => {
    if (!order.items || order.items.length === 0) return;

    for (const item of order.items) {
      if (item.product_id) {
        await addToCart(
          {
            id: item.product_id,
            name: item.product_name,
            price: item.price,
            unit: item.unit,
            stock: 999,
            min_order: 1,
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          } as any,
          item.quantity
        );
      }
    }

    toast.success('Semua item telah dimasukkan ke keranjang belanja.', {
      action: {
        label: 'Buka Keranjang',
        onClick: () => setIsCartOpen(true),
      },
    });
  };

  // Pay Now for Pending Midtrans Orders
  const handlePayNow = (order: Order) => {
    if (!order.midtrans_snap_token) {
      toast.info('Silakan hubungi admin untuk melanjutkan pembayaran ini.');
      return;
    }

    openSnapPopup(order.midtrans_snap_token, {
      onSuccess: async () => {
        await markOrderPaymentSuccessAction(order.id);
        setOrders((prev) =>
          prev.map((o) =>
            o.id === order.id ? { ...o, order_status: 'sudah_dibayar', payment_status: 'paid' } : o
          )
        );
        toast.success('Pembayaran berhasil dikonfirmasi!');
      },
      onPending: () => {
        toast.info('Menunggu penyelesaian pembayaran.');
      },
      onError: () => {
        toast.error('Pembayaran gagal atau kedaluwarsa.');
      },
      onClose: () => {
        toast.info('Jendela pembayaran ditutup.');
      },
    });
  };

  // Status Badge Helper
  const renderStatusBadge = (status: OrderStatus | string) => {
    switch (status) {
      case 'menunggu_pembayaran':
        return (
          <Badge className="bg-amber-500 text-white text-[10px] font-black px-2 py-0.5 border-none shadow-xs flex items-center gap-1">
            <Clock className="h-3 w-3" />
            <span>Menunggu Pembayaran</span>
          </Badge>
        );
      case 'sudah_dibayar':
        return (
          <Badge className="bg-emerald-600 text-white text-[10px] font-black px-2 py-0.5 border-none shadow-xs flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3" />
            <span>Pembayaran Diterima</span>
          </Badge>
        );
      case 'diproses':
        return (
          <Badge className="bg-blue-600 text-white text-[10px] font-black px-2 py-0.5 border-none shadow-xs flex items-center gap-1">
            <Package className="h-3 w-3" />
            <span>Sedang Dikemas</span>
          </Badge>
        );
      case 'dikirim':
        return (
          <Badge className="bg-purple-600 text-white text-[10px] font-black px-2 py-0.5 border-none shadow-xs flex items-center gap-1 animate-pulse">
            <Truck className="h-3 w-3" />
            <span>Sedang Dikirim</span>
          </Badge>
        );
      case 'selesai':
        return (
          <Badge className="bg-emerald-700 text-white text-[10px] font-black px-2 py-0.5 border-none shadow-xs flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3" />
            <span>Pesanan Selesai</span>
          </Badge>
        );
      case 'dibatalkan':
        return (
          <Badge className="bg-rose-600 text-white text-[10px] font-black px-2 py-0.5 border-none shadow-xs flex items-center gap-1">
            <Ban className="h-3 w-3" />
            <span>Dibatalkan</span>
          </Badge>
        );
      default:
        return (
          <Badge className="bg-zinc-700 text-white text-[10px] font-black px-2 py-0.5">
            {status}
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 pb-20">
      {/* 1. TOP HEADER BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white dark:bg-zinc-900 p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-zinc-200/80 dark:border-zinc-800 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <Link
              href="/petani"
              className="p-1.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:text-emerald-600 transition"
              title="Kembali ke Pasar Benih"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <h1 className="text-base sm:text-xl font-black text-zinc-900 dark:text-white leading-none">
              Daftar Pesanan Benih Saya
            </h1>
          </div>
          <p className="text-xs text-zinc-400 font-medium mt-1">
            Pantau status pesanan, pembayaran, dan armada pengiriman benih ke lahan Anda.
          </p>
        </div>

        {/* Search Bar for Orders */}
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari kode pesanan / benih..."
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-xs font-semibold text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
          />
        </div>
      </div>

      {/* 2. HORIZONTAL SCROLLABLE STATUS TABS */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none px-0.5">
        <button
          type="button"
          onClick={() => setActiveTab('all')}
          className={`px-3.5 py-1.5 rounded-full text-xs font-black whitespace-nowrap shrink-0 transition cursor-pointer border ${
            activeTab === 'all'
              ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
              : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'
          }`}
        >
          Semua ({counts.all})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('menunggu_pembayaran')}
          className={`px-3.5 py-1.5 rounded-full text-xs font-black whitespace-nowrap shrink-0 transition cursor-pointer border ${
            activeTab === 'menunggu_pembayaran'
              ? 'bg-amber-500 text-white border-amber-500 shadow-xs'
              : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'
          }`}
        >
          Belum Bayar ({counts.menunggu_pembayaran})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('diproses')}
          className={`px-3.5 py-1.5 rounded-full text-xs font-black whitespace-nowrap shrink-0 transition cursor-pointer border ${
            activeTab === 'diproses'
              ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
              : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'
          }`}
        >
          Diproses ({counts.diproses})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('dikirim')}
          className={`px-3.5 py-1.5 rounded-full text-xs font-black whitespace-nowrap shrink-0 transition cursor-pointer border ${
            activeTab === 'dikirim'
              ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
              : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'
          }`}
        >
          Dikirim ({counts.dikirim})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('selesai')}
          className={`px-3.5 py-1.5 rounded-full text-xs font-black whitespace-nowrap shrink-0 transition cursor-pointer border ${
            activeTab === 'selesai'
              ? 'bg-emerald-700 text-white border-emerald-700 shadow-xs'
              : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'
          }`}
        >
          Selesai ({counts.selesai})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('dibatalkan')}
          className={`px-3.5 py-1.5 rounded-full text-xs font-black whitespace-nowrap shrink-0 transition cursor-pointer border ${
            activeTab === 'dibatalkan'
              ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
              : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'
          }`}
        >
          Dibatalkan ({counts.dibatalkan})
        </button>
      </div>

      {/* 3. ORDER CARDS LIST */}
      {filteredOrders.length === 0 ? (
        <Card className="p-8 sm:p-12 text-center rounded-2xl sm:rounded-3xl border-dashed border-2 border-zinc-200 dark:border-zinc-800 bg-white/60 dark:bg-zinc-900/60 space-y-3">
          <div className="h-14 w-14 rounded-2xl bg-zinc-100 dark:bg-zinc-800 text-zinc-400 mx-auto flex items-center justify-center">
            <Package className="h-7 w-7" />
          </div>
          <div className="space-y-1 max-w-sm mx-auto">
            <h3 className="text-sm font-bold text-zinc-800 dark:text-zinc-200">
              Belum Ada Pesanan pada Kategori Ini
            </h3>
            <p className="text-xs text-zinc-400">
              Pilih benih bersertifikat di katalog Kentara untuk melakukan pemesanan langsung ke penangkar.
            </p>
          </div>
          <Link href="/petani">
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black h-10 px-5 shadow-xs">
              🌾 Buka Katalog Benih
            </Button>
          </Link>
        </Card>
      ) : (
        <div className="space-y-3.5 sm:space-y-4">
          {filteredOrders.map((order) => {
            const isPendingPayment = order.order_status === 'menunggu_pembayaran';
            const isInDelivery = order.order_status === 'dikirim';
            const isCompleted = order.order_status === 'selesai';
            const totalKg = order.items?.reduce((sum, i) => sum + (i.weight_kg || i.quantity), 0) || 0;

            return (
              <div
                key={order.id}
                className="p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200/90 dark:border-zinc-800 shadow-xs hover:border-emerald-500/40 transition-all space-y-3.5"
              >
                {/* Header Row: Code, Date, Status */}
                <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-zinc-100 dark:border-zinc-800">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 flex items-center justify-center shrink-0">
                      <Receipt className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-xs font-black text-zinc-900 dark:text-white">
                          {order.order_code}
                        </span>
                        <button
                          type="button"
                          onClick={() => copyOrderCode(order.order_code)}
                          className="p-1 rounded-md text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition"
                          title="Salin Kode Pesanan"
                        >
                          <Copy className="h-3 w-3" />
                        </button>
                      </div>
                      <span className="text-[10px] text-zinc-400 block">
                        {new Date(order.created_at).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}{' '}
                        WIB
                      </span>
                    </div>
                  </div>

                  <div>{renderStatusBadge(order.order_status)}</div>
                </div>

                {/* Body Row: Order Items Preview */}
                <div
                  onClick={() => setSelectedOrder(order)}
                  className="space-y-2 cursor-pointer group"
                >
                  {order.items?.slice(0, 2).map((item, idx) => (
                    <div key={idx} className="flex items-start justify-between gap-2 text-xs">
                      <div className="min-w-0">
                        <span className="font-black text-zinc-900 dark:text-white group-hover:text-emerald-600 transition block truncate">
                          {item.product_name}
                        </span>
                        <div className="flex items-center gap-1.5 text-[10px] text-zinc-400 mt-0.5">
                          {item.seed_class && (
                            <span className="px-1.5 py-0.2 rounded-sm bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-bold">
                              Kelas {item.seed_class}
                            </span>
                          )}
                          <span>
                            {item.quantity} {item.unit} x Rp {item.price.toLocaleString('id-ID')}
                          </span>
                        </div>
                      </div>

                      <span className="font-black text-zinc-800 dark:text-zinc-200 shrink-0">
                        Rp {item.subtotal.toLocaleString('id-ID')}
                      </span>
                    </div>
                  ))}

                  {order.items && order.items.length > 2 && (
                    <span className="text-[10px] font-bold text-zinc-400 block pt-0.5">
                      + {order.items.length - 2} varietas benih lainnya
                    </span>
                  )}
                </div>

                {/* Courier / Shipping Notice Banner if active */}
                {isInDelivery && order.courier_name && (
                  <div className="p-3 rounded-2xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/80 flex items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="h-8 w-8 rounded-xl bg-purple-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                        <Truck className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <span className="font-black text-purple-950 dark:text-purple-200 block truncate">
                          {order.courier_name}
                        </span>
                        <span className="text-[10px] text-purple-700 dark:text-purple-300 block truncate">
                          Armada Khusus Kentara sedang menuju ke lahan Anda
                        </span>
                      </div>
                    </div>

                    {order.courier_phone && (
                      <a
                        href={`https://wa.me/${order.courier_phone.replace(/^0/, '62')}`}
                        target="_blank"
                        rel="noreferrer"
                        className="px-2.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-[11px] shrink-0 flex items-center gap-1 shadow-xs"
                      >
                        <MessageSquare className="h-3 w-3" />
                        <span>WA Kurir</span>
                      </a>
                    )}
                  </div>
                )}

                {/* Footer Row: Total, Method & Interactive Buttons */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2.5 border-t border-zinc-100 dark:border-zinc-800">
                  <div className="flex items-center justify-between sm:justify-start gap-3">
                    <div>
                      <span className="text-[10px] text-zinc-400 block">Total Tagihan ({totalKg} kg):</span>
                      <span className="text-sm sm:text-base font-black text-emerald-700 dark:text-emerald-400">
                        Rp {order.total_amount.toLocaleString('id-ID')}
                      </span>
                    </div>

                    <Badge className="bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 text-[10px] font-bold border border-zinc-200 dark:border-zinc-700 px-2 py-0.5">
                      {order.payment_gateway === 'cod' ? '💵 Bayar Tunai (COD)' : '💳 Gateway Online'}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedOrder(order)}
                      className="flex-1 sm:flex-none rounded-xl text-xs font-bold h-9 px-3 border-zinc-200 dark:border-zinc-700"
                    >
                      <span>Detail</span>
                      <ChevronRight className="h-3.5 w-3.5" />
                    </Button>

                    {isPendingPayment && (
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => handlePayNow(order)}
                        className="flex-1 sm:flex-none bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black h-9 px-4 shadow-md gap-1"
                      >
                        <CreditCard className="h-3.5 w-3.5" />
                        <span>Bayar Sekarang</span>
                      </Button>
                    )}

                    {(isCompleted || order.order_status === 'dibatalkan') && (
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => handleReorder(order)}
                        className="flex-1 sm:flex-none bg-zinc-900 dark:bg-zinc-800 hover:bg-zinc-800 text-white rounded-xl text-xs font-black h-9 px-3.5 gap-1"
                      >
                        <RefreshCw className="h-3 w-3" />
                        <span>Pesan Lagi</span>
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 4. DETAIL PESANAN BOTTOM SHEET / MODAL */}
      <Dialog open={!!selectedOrder} onOpenChange={(open) => !open && setSelectedOrder(null)}>
        {selectedOrder && (
          <DialogContent className="max-w-lg w-full rounded-t-3xl sm:rounded-3xl p-4 sm:p-6 max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <div className="flex items-center justify-between">
                <DialogTitle className="text-base sm:text-lg font-black text-zinc-900 dark:text-white flex items-center gap-2">
                  <FileText className="h-5 w-5 text-emerald-600" />
                  <span>Rincian Pesanan Benih</span>
                </DialogTitle>
                {renderStatusBadge(selectedOrder.order_status)}
              </div>
              <DialogDescription className="text-xs text-zinc-500 font-mono">
                No. Pesanan: {selectedOrder.order_code}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 my-2 text-xs">
              {/* Recipient & Destination Info */}
              <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 space-y-2">
                <div className="flex items-center gap-1.5 font-bold text-zinc-900 dark:text-white">
                  <MapPin className="h-4 w-4 text-rose-500" />
                  <span>Tujuan Pengiriman Lahan</span>
                </div>
                <div className="space-y-0.5 text-zinc-600 dark:text-zinc-300 text-[11px]">
                  <p className="font-bold text-zinc-900 dark:text-white">{selectedOrder.customer_name} ({selectedOrder.customer_phone})</p>
                  <p>{selectedOrder.shipping_address}</p>
                  {selectedOrder.shipping_city && <p className="font-semibold">{selectedOrder.shipping_city}</p>}
                  {selectedOrder.notes && (
                    <p className="text-zinc-400 italic pt-1 border-t border-zinc-200/60 dark:border-zinc-700/60">
                      Catatan kurir: &quot;{selectedOrder.notes}&quot;
                    </p>
                  )}
                </div>
              </div>

              {/* Items Breakdown */}
              <div className="space-y-2">
                <span className="font-bold text-zinc-700 dark:text-zinc-300 block uppercase text-[10px] tracking-wider">
                  Daftar Benih Dipesan
                </span>
                <div className="divide-y divide-zinc-100 dark:divide-zinc-800 rounded-2xl border border-zinc-200 dark:border-zinc-700 p-3 bg-white dark:bg-zinc-900 space-y-2">
                  {selectedOrder.items?.map((item, idx) => (
                    <div key={idx} className="pt-2 first:pt-0 flex items-center justify-between gap-2">
                      <div>
                        <span className="font-black text-zinc-900 dark:text-white block">
                          {item.product_name}
                        </span>
                        <div className="flex items-center gap-1.5 text-[10px] text-zinc-400">
                          {item.seed_class && <span>Kelas {item.seed_class} •</span>}
                          <span>
                            {item.quantity} {item.unit} x Rp {item.price.toLocaleString('id-ID')}
                          </span>
                        </div>
                      </div>
                      <span className="font-black text-zinc-900 dark:text-white">
                        Rp {item.subtotal.toLocaleString('id-ID')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Payment & Cost Summary */}
              <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 space-y-1.5">
                <div className="flex justify-between text-zinc-500 text-[11px]">
                  <span>Metode Pembayaran:</span>
                  <span className="font-bold text-zinc-900 dark:text-white">
                    {selectedOrder.payment_gateway === 'cod' ? 'Bayar Tunai di Lokasi (COD)' : 'Gateway Online (Midtrans)'}
                  </span>
                </div>
                <div className="flex justify-between text-zinc-500 text-[11px]">
                  <span>Subtotal Benih:</span>
                  <span className="font-bold text-zinc-900 dark:text-white">
                    Rp {selectedOrder.subtotal.toLocaleString('id-ID')}
                  </span>
                </div>
                <div className="flex justify-between text-zinc-500 text-[11px]">
                  <span>Ongkos Kirim Armada Khusus:</span>
                  <span className="font-bold text-zinc-900 dark:text-white">
                    Rp {selectedOrder.shipping_cost.toLocaleString('id-ID')}
                  </span>
                </div>
                <div className="pt-1.5 border-t border-zinc-200 dark:border-zinc-700 flex justify-between font-black text-sm text-emerald-700 dark:text-emerald-400">
                  <span>Total Pembayaran:</span>
                  <span>Rp {selectedOrder.total_amount.toLocaleString('id-ID')}</span>
                </div>
              </div>

              {/* Courier Actions if assigned */}
              {selectedOrder.courier_name && (
                <div className="p-3 rounded-2xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 text-xs flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-purple-700 dark:text-purple-400 block font-semibold">Kurir Pengantar:</span>
                    <strong className="text-purple-950 dark:text-purple-200">{selectedOrder.courier_name}</strong>
                  </div>
                  {selectedOrder.courier_phone && (
                    <a
                      href={`https://wa.me/${selectedOrder.courier_phone.replace(/^0/, '62')}`}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1.5 rounded-xl bg-purple-600 text-white font-black text-xs flex items-center gap-1 shadow-xs"
                    >
                      <Phone className="h-3 w-3" />
                      <span>Hubungi Kurir</span>
                    </a>
                  )}
                </div>
              )}

              {/* Action Buttons in Modal */}
              <div className="pt-2 flex items-center gap-2">
                {selectedOrder.order_status === 'menunggu_pembayaran' && (
                  <Button
                    type="button"
                    onClick={() => {
                      const ord = selectedOrder;
                      setSelectedOrder(null);
                      handlePayNow(ord);
                    }}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-black h-11 shadow-md gap-1.5"
                  >
                    <CreditCard className="h-4 w-4" />
                    <span>Bayar Sekarang via Gateway</span>
                  </Button>
                )}

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setSelectedOrder(null)}
                  className="w-full rounded-2xl text-xs font-bold h-11"
                >
                  Tutup Rincian
                </Button>
              </div>
            </div>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}
