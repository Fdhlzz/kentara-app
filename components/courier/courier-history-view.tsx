'use client';

import { useState } from 'react';
import {
  CheckCircle2,
  Search,
  Calendar,
  Phone,
  MapPin,
  Banknote,
  CreditCard,
  Eye,
  Package,
  Receipt,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { Order } from '@/types/order';

interface CourierHistoryViewProps {
  orders: Order[];
}

export function CourierHistoryView({ orders }: CourierHistoryViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [paymentFilter, setPaymentFilter] = useState<'all' | 'cash' | 'gateway'>('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Filter completed jobs only
  const completedOrders = orders.filter((o) => o.order_status === 'selesai');

  const filteredOrders = completedOrders.filter((o) => {
    const q = searchQuery.toLowerCase().trim();
    const matchQuery =
      !q ||
      o.order_code.toLowerCase().includes(q) ||
      o.customer_name.toLowerCase().includes(q) ||
      (o.shipping_city && o.shipping_city.toLowerCase().includes(q));

    const matchPayment =
      paymentFilter === 'all' ||
      (paymentFilter === 'cash' && o.payment_gateway === 'cash') ||
      (paymentFilter === 'gateway' && o.payment_gateway !== 'cash');

    return matchQuery && matchPayment;
  });

  const totalCashCollected = completedOrders
    .filter((o) => o.payment_gateway === 'cash')
    .reduce((sum, o) => sum + (o.total_amount || 0), 0);

  const totalItemsDelivered = completedOrders.reduce((sum, o) => {
    return sum + (o.items?.reduce((iSum, it) => iSum + it.quantity, 0) || 0);
  }, 0);

  return (
    <div className="space-y-4">
      {/* Metrics Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <Card className="p-3.5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-zinc-400 block">
            Pengantaran Selesai
          </span>
          <span className="text-xl font-extrabold text-blue-600 dark:text-blue-400 mt-1 block">
            {completedOrders.length} Tugas
          </span>
        </Card>

        <Card className="p-3.5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-zinc-400 block">
            Total Kas COD Terkumpul
          </span>
          <span className="text-xl font-extrabold text-amber-600 dark:text-amber-400 mt-1 block">
            Rp {totalCashCollected.toLocaleString('id-ID')}
          </span>
        </Card>

        <Card className="col-span-2 sm:col-span-1 p-3.5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-zinc-400 block">
            Volume Benih Terantar
          </span>
          <span className="text-xl font-extrabold text-purple-600 dark:text-purple-400 mt-1 block">
            {totalItemsDelivered.toLocaleString('id-ID')} Satuan
          </span>
        </Card>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-2">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari kode pesanan, nama pembeli..."
            className="w-full pl-8 pr-3 py-2 text-xs rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white"
          />
        </div>

        <select
          value={paymentFilter}
          onChange={(e) => setPaymentFilter(e.target.value as any)}
          className="w-full sm:w-auto px-3 py-2 text-xs rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white"
        >
          <option value="all">Semua Metode Pembayaran</option>
          <option value="cash">Tunai / COD</option>
          <option value="gateway">Gerbang Online (Midtrans)</option>
        </select>
      </div>

      {/* List */}
      {filteredOrders.length === 0 ? (
        <Card className="p-8 text-center rounded-2xl border-dashed border-2 border-zinc-200 dark:border-zinc-800 bg-white/60 dark:bg-zinc-900/60">
          <CheckCircle2 className="h-8 w-8 mx-auto text-zinc-400 mb-2 opacity-50" />
          <h4 className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
            {completedOrders.length === 0
              ? 'Belum ada riwayat tugas pengantaran selesai'
              : 'Tidak ada tugas yang sesuai pencarian'}
          </h4>
          <p className="text-[11px] text-zinc-400 mt-0.5">
            Tugas yang telah Anda antarkan dan selesaikan akan tercatat di sini.
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredOrders.map((order) => {
            const isCash = order.payment_gateway === 'cash';

            return (
              <Card
                key={order.id}
                className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs space-y-2.5"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="font-mono font-bold text-xs text-zinc-900 dark:text-white block">
                      {order.order_code}
                    </span>
                    <span className="text-[10px] text-zinc-400 flex items-center gap-1 mt-0.5">
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

                  <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300 text-[10px] font-semibold">
                    ✅ Selesai Diterima
                  </Badge>
                </div>

                <div className="p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 text-xs space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-zinc-800 dark:text-zinc-200">
                      {order.customer_name}
                    </span>
                    {isCash ? (
                      <span className="font-extrabold text-amber-600 dark:text-amber-400">
                        Kas COD: Rp {order.total_amount.toLocaleString('id-ID')}
                      </span>
                    ) : (
                      <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                        Lunas Online
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-zinc-500 truncate flex items-center gap-1">
                    <MapPin className="h-3 w-3 shrink-0 text-zinc-400" />
                    <span>{order.shipping_address}</span>
                  </p>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <Badge
                    className={`text-[9px] ${
                      isCash
                        ? 'bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300'
                        : 'bg-blue-50 text-blue-700 border-blue-300 dark:bg-blue-950/60 dark:text-blue-300'
                    }`}
                  >
                    {isCash ? '💵 Bayar Tunai (COD)' : '💳 Lunas Online'}
                  </Badge>

                  <Button
                    onClick={() => setSelectedOrder(order)}
                    size="sm"
                    variant="ghost"
                    className="h-7 px-2.5 text-xs text-blue-600 hover:text-blue-700 gap-1 cursor-pointer"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    <span>Lihat Rincian</span>
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* DETAIL MODAL */}
      <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
        <DialogContent className="max-w-md rounded-3xl p-6">
          {selectedOrder && (
            <div className="space-y-4">
              <DialogHeader>
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                    <Receipt className="h-5 w-5" />
                  </div>
                  <div>
                    <DialogTitle className="text-base font-extrabold">
                      Rincian Bukti Pengantaran
                    </DialogTitle>
                    <DialogDescription className="text-xs font-mono">
                      {selectedOrder.order_code}
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-800 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-zinc-500">Penerima:</span>
                  <span className="font-bold">{selectedOrder.customer_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Nomor HP/WA:</span>
                  <span>{selectedOrder.customer_phone}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Alamat:</span>
                  <span className="text-right max-w-[200px]">{selectedOrder.shipping_address}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Metode Bayar:</span>
                  <span className="font-semibold">
                    {selectedOrder.payment_gateway === 'cash' ? '💵 Tunai (COD)' : '💳 Gerbang Online Midtrans'}
                  </span>
                </div>
                {selectedOrder.paid_at && (
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Waktu Selesai:</span>
                    <span className="font-semibold text-emerald-600">
                      {new Date(selectedOrder.paid_at).toLocaleString('id-ID')}
                    </span>
                  </div>
                )}
              </div>

              {/* Items List (Privacy Enforced) */}
              <div className="space-y-1.5 text-xs">
                <span className="font-bold text-zinc-700 dark:text-zinc-300 block text-[11px] uppercase">
                  Daftar Benih yang Diserahkan:
                </span>
                <div className="divide-y divide-zinc-100 dark:divide-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-800 p-2 bg-white dark:bg-zinc-900">
                  {selectedOrder.items?.map((it, idx) => (
                    <div key={idx} className="py-1.5 flex justify-between">
                      <span>{it.quantity} {it.unit} &times; {it.product_name}</span>
                      <span className="font-semibold text-zinc-400">Terserah</span>
                    </div>
                  ))}
                  {selectedOrder.payment_gateway === 'cash' && (
                    <div className="pt-2 flex justify-between font-black text-amber-700 dark:text-amber-400">
                      <span>Total Kas COD Diterima:</span>
                      <span>Rp {selectedOrder.total_amount.toLocaleString('id-ID')}</span>
                    </div>
                  )}
                </div>
              </div>

              <DialogFooter>
                <Button
                  onClick={() => setSelectedOrder(null)}
                  className="w-full rounded-xl text-xs font-semibold"
                >
                  Tutup
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
