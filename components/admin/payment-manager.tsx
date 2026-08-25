'use client';

import { useState, useTransition, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  CreditCard,
  Banknote,
  Search,
  CheckCircle2,
  Clock,
  XCircle,
  Eye,
  Phone,
  MapPin,
  Calendar,
  DollarSign,
  Receipt,
  Truck,
  Sparkles,
  Loader2,
  RefreshCw,
  LayoutGrid,
  List,
  Check,
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
import type { Payment, AdminPaymentStats } from '@/types/payment';
import { confirmCashPaymentAction } from '@/lib/admin/payment-actions';

interface PaymentManagerProps {
  initialPayments: Payment[];
  stats: AdminPaymentStats;
}

export function PaymentManager({
  initialPayments = [],
  stats: initialStats,
}: PaymentManagerProps) {
  const router = useRouter();
  const [payments, setPayments] = useState<Payment[]>(initialPayments);
  const [stats, setStats] = useState<AdminPaymentStats>(initialStats);
  const [isPending, startTransition] = useTransition();

  // Sync state
  useEffect(() => {
    setPayments(initialPayments);
  }, [initialPayments]);

  useEffect(() => {
    if (initialStats) {
      setStats(initialStats);
    }
  }, [initialStats]);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMethodType, setSelectedMethodType] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'latest' | 'oldest' | 'amount_desc' | 'amount_asc'>('latest');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Modals
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isConfirmCashOpen, setIsConfirmCashOpen] = useState(false);
  const [cashNotes, setCashNotes] = useState('');

  // Status Badge Helper
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
      case 'settlement':
      case 'paid':
      case 'success':
        return (
          <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300 text-[10px] font-semibold flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3" /> Lunas Terverifikasi
          </Badge>
        );
      case 'pending':
        return (
          <Badge className="bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950 dark:text-amber-300 text-[10px] font-semibold flex items-center gap-1">
            <Clock className="h-3 w-3" /> Menunggu Pembayaran
          </Badge>
        );
      case 'failed':
      case 'expire':
      case 'cancel':
      case 'deny':
        return (
          <Badge className="bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950 dark:text-rose-300 text-[10px] font-semibold flex items-center gap-1">
            <XCircle className="h-3 w-3" /> Gagal / Dibatalkan
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Method Badge Helper
  const getMethodBadge = (type: string, detail: string) => {
    if (type === 'cash') {
      return (
        <Badge className="bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 text-[10px] font-semibold flex items-center gap-1">
          <Banknote className="h-3 w-3 text-amber-600" /> Tunai / COD
        </Badge>
      );
    }
    return (
      <Badge className="bg-blue-50 text-blue-700 border-blue-300 dark:bg-blue-950/60 dark:text-blue-300 text-[10px] font-semibold flex items-center gap-1">
        <CreditCard className="h-3 w-3 text-blue-600" /> Gerbang Midtrans ({detail || 'Online'})
      </Badge>
    );
  };

  // Filter & Sort payments
  const filteredPayments = payments
    .filter((pay) => {
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        pay.payment_code.toLowerCase().includes(q) ||
        pay.order_code.toLowerCase().includes(q) ||
        pay.customer_name.toLowerCase().includes(q) ||
        pay.customer_phone.toLowerCase().includes(q) ||
        (pay.shipping_city && pay.shipping_city.toLowerCase().includes(q));

      const matchType =
        selectedMethodType === 'all' || pay.payment_method_type === selectedMethodType;

      let matchStatus = true;
      if (selectedStatus === 'completed') {
        matchStatus = ['completed', 'settlement', 'paid', 'success'].includes(pay.payment_status);
      } else if (selectedStatus === 'pending') {
        matchStatus = pay.payment_status === 'pending';
      } else if (selectedStatus === 'failed') {
        matchStatus = ['failed', 'expire', 'cancel', 'deny'].includes(pay.payment_status);
      }

      return matchSearch && matchType && matchStatus;
    })
    .sort((a, b) => {
      if (sortBy === 'oldest') {
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      }
      if (sortBy === 'amount_desc') {
        return b.amount - a.amount;
      }
      if (sortBy === 'amount_asc') {
        return a.amount - b.amount;
      }
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

  // Handle Confirm Cash Payment
  const handleConfirmCash = () => {
    if (!selectedPayment) return;

    startTransition(async () => {
      const res = await confirmCashPaymentAction(selectedPayment.id, cashNotes);
      if (!res.success || !res.payment) {
        toast.error(res.error || 'Gagal mengonfirmasi pelunasan tunai');
        return;
      }

      toast.success('Pelunasan Tunai Dikonfirmasi!', {
        description: `Transaksi ${selectedPayment.payment_code} telah tercatat lunas dan stok diperbarui.`,
      });

      setPayments((prev) =>
        prev.map((p) => (p.id === selectedPayment.id ? res.payment! : p))
      );

      setIsConfirmCashOpen(false);
      setSelectedPayment(null);
      setCashNotes('');
      router.refresh();
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card className="p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-500">Total Transaksi</span>
            <div className="p-2 rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-950/50">
              <Receipt className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-extrabold text-zinc-900 dark:text-white">
              {stats?.totalPayments ?? payments.length}
            </span>
            <p className="text-[11px] text-zinc-400 mt-0.5">Rekapitulasi pembayaran</p>
          </div>
        </Card>

        <Card className="p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-500">Omzet Lunas (Semua)</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50">
              <DollarSign className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400">
              Rp {(stats?.totalRevenue ?? payments.filter(p => ['completed', 'settlement', 'paid'].includes(p.payment_status)).reduce((s, p) => s + (p.amount || 0), 0)).toLocaleString('id-ID')}
            </span>
            <p className="text-[11px] text-zinc-400 mt-0.5">
              {stats?.completedPayments ?? payments.filter(p => ['completed', 'settlement', 'paid'].includes(p.payment_status)).length} transaksi berhasil
            </p>
          </div>
        </Card>

        <Card className="p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-500">Gerbang Online (Midtrans)</span>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/50">
              <CreditCard className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-xl font-extrabold text-blue-600 dark:text-blue-400">
              Rp {(stats?.gatewayRevenue ?? 0).toLocaleString('id-ID')}
            </span>
            <p className="text-[11px] text-zinc-400 mt-0.5">
              {stats?.gatewayPaymentsCount ?? 0} transaksi QRIS / VA
            </p>
          </div>
        </Card>

        <Card className="p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-500">Bayar Tunai / COD</span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950/50">
              <Banknote className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-xl font-extrabold text-amber-600 dark:text-amber-400">
              Rp {(stats?.cashRevenue ?? 0).toLocaleString('id-ID')}
            </span>
            <p className="text-[11px] text-zinc-400 mt-0.5">
              {stats?.cashPaymentsCount ?? 0} transaksi kurir
            </p>
          </div>
        </Card>
      </div>

      {/* Action Bar & Controls */}
      <div className="flex flex-col gap-4 bg-white dark:bg-zinc-900 p-4 sm:p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="p-2.5 rounded-xl bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300">
              <Receipt className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-white">
                Daftar &amp; Riwayat Transaksi Pembayaran
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Pantau seluruh pembayaran melalui Gateway Midtrans dan penerimaan uang tunai (COD)
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
              placeholder="Cari kode pembayaran, kode pesanan, nama..."
              className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-800/50 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
            />
          </div>

          <div>
            <select
              value={selectedMethodType}
              onChange={(e) => setSelectedMethodType(e.target.value)}
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
            >
              <option value="all">Semua Metode Bayar</option>
              <option value="gateway">Gerbang Online (Midtrans)</option>
              <option value="cash">Bayar Tunai di Tempat (COD)</option>
            </select>
          </div>

          <div>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
            >
              <option value="all">Semua Status</option>
              <option value="completed">Lunas (Completed)</option>
              <option value="pending">Menunggu Pelunasan</option>
              <option value="failed">Gagal / Dibatalkan</option>
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
                    ? 'bg-white dark:bg-zinc-900 text-purple-600 dark:text-purple-400 shadow-xs'
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
                    ? 'bg-white dark:bg-zinc-900 text-purple-600 dark:text-purple-400 shadow-xs'
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

      {/* Payment List Content */}
      {filteredPayments.length === 0 ? (
        <Card className="p-12 text-center rounded-2xl border-dashed border-2 border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/50">
          <div className="h-16 w-16 mx-auto rounded-2xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 flex items-center justify-center mb-4">
            <Receipt className="h-8 w-8" />
          </div>
          <h3 className="text-base font-bold text-zinc-900 dark:text-white">
            {payments.length === 0
              ? 'Belum ada data transaksi pembayaran'
              : 'Tidak ada transaksi yang sesuai filter'}
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 max-w-sm mx-auto">
            {payments.length === 0
              ? 'Setiap transaksi pembelian benih (baik melalui Midtrans maupun Bayar Tunai) akan otomatis tercatat di sini.'
              : 'Coba ubah kata kunci pencarian atau sesuaikan filter status.'}
          </p>
        </Card>
      ) : viewMode === 'grid' ? (
        /* GRID VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
          {filteredPayments.map((pay) => (
            <Card
              key={pay.id}
              className="p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs hover:shadow-md transition flex flex-col justify-between"
            >
              <div className="space-y-3.5">
                {/* Header: Payment Code & Status */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="font-mono text-sm font-extrabold text-zinc-900 dark:text-white block">
                      {pay.payment_code}
                    </span>
                    <span className="text-[11px] text-zinc-400 flex items-center gap-1 mt-0.5">
                      <Calendar className="h-3 w-3" />
                      {new Date(pay.created_at).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>

                  <div className="flex flex-col items-end gap-1">
                    {getStatusBadge(pay.payment_status)}
                    {getMethodBadge(pay.payment_method_type, pay.payment_method_detail)}
                  </div>
                </div>

                {/* Info Box: Order & Customer */}
                <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-100 dark:border-zinc-800 text-xs space-y-1.5">
                  <div className="flex justify-between items-center">
                    <span className="text-zinc-500">Kode Pesanan:</span>
                    <span className="font-mono font-bold text-zinc-900 dark:text-white">
                      {pay.order_code}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-zinc-500">Nama Pembeli:</span>
                    <span className="font-bold text-zinc-900 dark:text-white">
                      {pay.customer_name}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-zinc-500">WhatsApp:</span>
                    <a
                      href={`https://wa.me/${pay.customer_phone.replace(/^0/, '62').replace(/\D/g, '')}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-emerald-600 hover:underline flex items-center gap-1 font-semibold"
                    >
                      <Phone className="h-3 w-3" />
                      {pay.customer_phone}
                    </a>
                  </div>
                  {pay.paid_at && (
                    <div className="flex justify-between items-center pt-1 border-t border-zinc-200/50 dark:border-zinc-700/50">
                      <span className="text-zinc-400 text-[10px]">Waktu Pelunasan:</span>
                      <span className="font-medium text-emerald-700 dark:text-emerald-400 text-[11px]">
                        {new Date(pay.paid_at).toLocaleString('id-ID')}
                      </span>
                    </div>
                  )}
                </div>

                {/* Amount Section */}
                <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-zinc-400 block font-medium">Nominal Transaksi</span>
                    <span className="text-lg font-black text-emerald-700 dark:text-emerald-400">
                      Rp {pay.amount.toLocaleString('id-ID')}
                    </span>
                  </div>

                  {pay.payment_method_type === 'cash' && pay.payment_status === 'pending' && (
                    <Button
                      onClick={() => {
                        setSelectedPayment(pay);
                        setIsConfirmCashOpen(true);
                      }}
                      size="sm"
                      className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold h-8 px-3 gap-1 shadow-xs"
                    >
                      <Check className="h-3.5 w-3.5" />
                      <span>Konfirmasi Lunas</span>
                    </Button>
                  )}
                </div>
              </div>

              {/* Card Footer */}
              <div className="mt-3 pt-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                <Button
                  onClick={() => {
                    setSelectedPayment(pay);
                    setIsDetailOpen(true);
                  }}
                  variant="outline"
                  size="sm"
                  className="w-full text-xs font-semibold rounded-xl h-8"
                >
                  <Eye className="h-3.5 w-3.5 mr-1" />
                  <span>Lihat Rincian Kwitansi</span>
                </Button>
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
                <th className="py-3 px-4">Kode Pembayaran</th>
                <th className="py-3 px-3">Kode Pesanan &amp; Pembeli</th>
                <th className="py-3 px-3">Metode</th>
                <th className="py-3 px-3">Nominal</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {filteredPayments.map((pay) => (
                <tr key={pay.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/40">
                  <td className="py-3 px-4">
                    <span className="font-mono font-bold block">{pay.payment_code}</span>
                    <span className="text-[11px] text-zinc-400">
                      {new Date(pay.created_at).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </td>
                  <td className="py-3 px-3">
                    <span className="font-mono text-zinc-500 block text-xs">{pay.order_code}</span>
                    <span className="font-bold">{pay.customer_name}</span>
                  </td>
                  <td className="py-3 px-3">
                    {getMethodBadge(pay.payment_method_type, pay.payment_method_detail)}
                  </td>
                  <td className="py-3 px-3 font-bold text-emerald-700 dark:text-emerald-400">
                    Rp {pay.amount.toLocaleString('id-ID')}
                  </td>
                  <td className="py-3 px-3">
                    {getStatusBadge(pay.payment_status)}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <Button
                        onClick={() => {
                          setSelectedPayment(pay);
                          setIsDetailOpen(true);
                        }}
                        variant="ghost"
                        size="sm"
                        className="h-8 px-2 text-xs"
                      >
                        Detail
                      </Button>
                      {pay.payment_method_type === 'cash' && pay.payment_status === 'pending' && (
                        <Button
                          onClick={() => {
                            setSelectedPayment(pay);
                            setIsConfirmCashOpen(true);
                          }}
                          size="sm"
                          className="h-8 px-2.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl"
                        >
                          Lunas
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

      {/* CONFIRM CASH MODAL */}
      <Dialog open={isConfirmCashOpen} onOpenChange={setIsConfirmCashOpen}>
        <DialogContent className="max-w-md rounded-3xl p-6">
          <DialogHeader>
            <div className="h-12 w-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 flex items-center justify-center mb-2">
              <Banknote className="h-6 w-6" />
            </div>
            <DialogTitle className="text-lg font-extrabold text-zinc-900 dark:text-white">
              Konfirmasi Pelunasan Tunai (COD)
            </DialogTitle>
            <DialogDescription className="text-xs text-zinc-500">
              Pastikan uang tunai sebesar{' '}
              <strong className="text-zinc-900 dark:text-white font-bold">
                Rp {selectedPayment?.amount.toLocaleString('id-ID')}
              </strong>{' '}
              untuk pesanan {selectedPayment?.order_code} telah diserahkan oleh kurir/pembeli.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 mt-2">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Catatan Penerimaan Kas (Opsional)
              </label>
              <textarea
                rows={2}
                value={cashNotes}
                onChange={(e) => setCashNotes(e.target.value)}
                placeholder="Contoh: Diterima tunai pas oleh kurir..."
                className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0 mt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsConfirmCashOpen(false)}
              className="rounded-xl text-xs font-semibold"
            >
              Batal
            </Button>
            <Button
              type="button"
              onClick={handleConfirmCash}
              disabled={isPending}
              className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold"
            >
              {isPending ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
                  <span>Memproses...</span>
                </>
              ) : (
                <span>Tandai Lunas Sekarang</span>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DETAIL PAYMENT / RECEIPT MODAL */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-md rounded-3xl p-6">
          {selectedPayment && (
            <div className="space-y-4">
              <DialogHeader>
                <div className="flex items-center justify-between">
                  <DialogTitle className="text-lg font-extrabold flex items-center gap-2">
                    <Receipt className="h-5 w-5 text-purple-600" />
                    Kwitansi Pembayaran
                  </DialogTitle>
                </div>
                <DialogDescription className="text-xs">
                  {selectedPayment.payment_code}
                </DialogDescription>
              </DialogHeader>

              <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-800 space-y-2.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-zinc-500">Status:</span>
                  <div>{getStatusBadge(selectedPayment.payment_status)}</div>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Metode Bayar:</span>
                  <div>{getMethodBadge(selectedPayment.payment_method_type, selectedPayment.payment_method_detail)}</div>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Nomor Pesanan:</span>
                  <span className="font-mono font-bold">{selectedPayment.order_code}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Pembeli:</span>
                  <span className="font-bold">{selectedPayment.customer_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">WhatsApp:</span>
                  <span>{selectedPayment.customer_phone}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Waktu Dibuat:</span>
                  <span>{new Date(selectedPayment.created_at).toLocaleString('id-ID')}</span>
                </div>
                {selectedPayment.paid_at && (
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Waktu Lunas:</span>
                    <span className="font-semibold text-emerald-700 dark:text-emerald-400">
                      {new Date(selectedPayment.paid_at).toLocaleString('id-ID')}
                    </span>
                  </div>
                )}
                {selectedPayment.gateway_transaction_id && (
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Transaction ID (Midtrans):</span>
                    <span className="font-mono text-[11px]">{selectedPayment.gateway_transaction_id}</span>
                  </div>
                )}
              </div>

              <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-500/20 flex justify-between items-center">
                <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Total Nominal Pembayaran</span>
                <span className="text-lg font-black text-emerald-900 dark:text-emerald-100">
                  Rp {selectedPayment.amount.toLocaleString('id-ID')}
                </span>
              </div>

              <DialogFooter>
                <Button
                  onClick={() => setIsDetailOpen(false)}
                  className="w-full rounded-xl text-xs font-semibold bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                >
                  Tutup Kwitansi
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
