'use client';

import { useState, useEffect, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  X,
  MapPin,
  Phone,
  MessageCircle,
  Package,
  Sprout,
  CheckCircle2,
  AlertCircle,
  Banknote,
  CreditCard,
  Truck,
  Locate,
  Navigation,
  Clock,
  ShieldCheck,
  Check,
  Loader2,
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
import { LeafletMap } from '@/components/maps/leaflet-map';
import { SwipeButton } from '@/components/ui/swipe-button';
import {
  calculateDistanceKm,
  fetchRealRoadRoute,
  type RoadRouteResult,
} from '@/lib/maps/leaflet-helpers';
import {
  startCourierDeliveryAction,
  completeCourierDeliveryAction,
} from '@/lib/admin/courier-actions';
import { useCourierLocationTracker } from '@/hooks/use-courier-location-tracker';
import type { Order } from '@/types/order';
import type { MapMarkerData, MapRouteData } from '@/types/maps';

interface CourierTaskModalProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
  courierName: string;
  courierPhone: string;
}

export function CourierTaskModal({
  order,
  isOpen,
  onClose,
  courierName,
  courierPhone,
}: CourierTaskModalProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Cash Confirmation Modal state
  const [isCashConfirmOpen, setIsCashConfirmOpen] = useState(false);
  const [cashConfirmedCheckbox, setCashConfirmedCheckbox] = useState(false);
  const [cashNotes, setCashNotes] = useState('');

  // Default coordinate Makassar if order has no specific coords
  const customerCoords: [number, number] = [-5.1379367, 119.4357388];

  // Live High-Performance Battery-Friendly GPS Tracker (Syncs to public.courier_locations)
  const isDeliveryActive = isOpen && !!order && order.order_status === 'dikirim';
  const { currentPosition, isGpsActive, lastSyncTime } = useCourierLocationTracker({
    orderId: order?.id,
    isActive: isDeliveryActive,
    minDistanceMeters: 10, // 10 meters distance threshold
    minIntervalMs: 10000,  // 10 seconds heartbeat interval
  });

  const courierPosition: [number, number] = currentPosition || [
    customerCoords[0] - 0.012,
    customerCoords[1] - 0.015,
  ];

  const [roadRoute, setRoadRoute] = useState<RoadRouteResult | null>(null);

  // Load real road routing
  useEffect(() => {
    if (!isOpen) return;
    let isCancelled = false;

    async function loadRoute() {
      const res = await fetchRealRoadRoute(courierPosition, customerCoords);
      if (!isCancelled) {
        setRoadRoute(res);
      }
    }

    loadRoute();
    return () => {
      isCancelled = true;
    };
  }, [isOpen, courierPosition[0], courierPosition[1]]);

  if (!order || !isOpen) return null;

  const isCashOrder = order.payment_gateway === 'cash';
  const isStarted = order.order_status === 'dikirim';
  const isFinished = order.order_status === 'selesai';

  const distanceKm =
    roadRoute?.distanceKm !== undefined
      ? roadRoute.distanceKm
      : calculateDistanceKm(
          courierPosition[0],
          courierPosition[1],
          customerCoords[0],
          customerCoords[1]
        );

  const etaMinutes =
    roadRoute?.durationMinutes !== undefined
      ? roadRoute.durationMinutes
      : Math.max(3, Math.round((distanceKm / 35) * 60));

  // Distance in meters for proximity check
  const distanceMeters = Math.round(distanceKm * 1000);
  const isNearCustomer = distanceMeters <= 500; // within 500 meters

  const markers: MapMarkerData[] = [
    {
      id: 'courier-live',
      position: courierPosition,
      title: `Kurir: ${courierName}`,
      description: isGpsActive ? 'Lokasi Anda saat ini (Live GPS)' : 'Lokasi Kurir',
      type: 'courier',
      phone: courierPhone,
      badgeText: 'Lokasi Anda',
    },
    {
      id: 'customer-dest',
      position: customerCoords,
      title: order.customer_name,
      description: order.shipping_address,
      type: 'farm',
      phone: order.customer_phone,
      badgeText: 'Tujuan Antar',
    },
  ];

  const route: MapRouteData = {
    id: 'courier-task-route',
    from: courierPosition,
    to: customerCoords,
    geometryPoints: roadRoute?.geometry,
    color: '#2563eb',
    distanceKm,
    estimatedMinutes: etaMinutes,
    isRealRoadRoute: roadRoute?.isSuccess ?? false,
  };

  // 1. Swipe to Start Delivery
  const handleStartDelivery = () => {
    startTransition(async () => {
      const res = await startCourierDeliveryAction(order.id);
      if (!res.success) {
        toast.error(res.error || 'Gagal memulai pengantaran');
        return;
      }
      toast.success('Pengantaran Dimulai!', {
        description: 'Status pesanan telah berubah menjadi Dalam Pengantaran.',
      });
      router.refresh();
    });
  };

  // 2. Swipe to Finish Delivery
  const handleFinishDeliveryAttempt = () => {
    // If cash order, open cash receipt confirmation dialog first
    if (isCashOrder && order.payment_status !== 'settlement' && order.payment_status !== 'paid') {
      setIsCashConfirmOpen(true);
      return;
    }

    // Direct completion for online gateway paid orders
    executeCompleteDelivery(true, 'Pengantaran telah diselesaikan oleh kurir.');
  };

  // Execute actual completion
  const executeCompleteDelivery = (cashPaid: boolean, notes?: string) => {
    startTransition(async () => {
      const res = await completeCourierDeliveryAction(order.id, {
        cashPaidConfirmed: cashPaid,
        cashNotes: notes,
      });

      if (!res.success) {
        toast.error(res.error || 'Gagal menyelesaikan pengantaran');
        return;
      }

      toast.success('Tugas Pengantaran Sukses Selesai!', {
        description: `Pesanan ${order.order_code} telah ditandai selesai. Terima kasih!`,
      });

      setIsCashConfirmOpen(false);
      onClose();
      router.refresh();
    });
  };

  const cleanPhone = order.customer_phone.replace(/^0/, '62').replace(/\D/g, '');

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col animate-in fade-in duration-200">
      {/* 1. Floating Top Navigation Bar */}
      <div className="absolute top-4 left-4 right-4 z-30 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 p-2 px-3 rounded-2xl bg-white/95 dark:bg-zinc-900/95 shadow-xl backdrop-blur-md border border-zinc-200/80 dark:border-zinc-800">
          <Badge className="bg-blue-600 text-white text-[10px] font-extrabold px-2 py-0.5">
            {order.order_code}
          </Badge>
          <span className="text-xs font-bold text-zinc-900 dark:text-white truncate max-w-[140px] sm:max-w-[200px]">
            {order.customer_name}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Quick WA & Call button */}
          <a
            href={`https://wa.me/${cleanPhone}`}
            target="_blank"
            rel="noreferrer"
            className="h-10 w-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-lg hover:bg-emerald-700 transition"
            title="Kirim WhatsApp"
          >
            <MessageCircle className="h-5 w-5" />
          </a>
          <a
            href={`tel:${order.customer_phone}`}
            className="h-10 w-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-lg hover:bg-blue-700 transition"
            title="Telepon Pembeli"
          >
            <Phone className="h-5 w-5" />
          </a>
          <button
            type="button"
            onClick={onClose}
            className="h-10 w-10 rounded-2xl bg-zinc-900/90 text-white flex items-center justify-center shadow-lg hover:bg-zinc-800 transition"
            title="Tutup Peta"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* 2. Full-Screen Leaflet Map Area */}
      <div className="flex-1 w-full h-full relative">
        <LeafletMap
          center={courierPosition}
          zoom={14}
          markers={markers}
          route={route}
          height="100%"
          className="w-full h-full"
        />

        {/* Floating ETA & Distance Badge */}
        <div className="absolute top-20 left-4 z-20 flex items-center gap-2 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md p-2 px-3 rounded-2xl shadow-lg border border-zinc-200 dark:border-zinc-800 text-xs">
          <div className="flex items-center gap-1.5 text-blue-700 dark:text-blue-400 font-bold">
            <Clock className="h-4 w-4" />
            <span>{etaMinutes} mnt</span>
          </div>
          <span className="text-zinc-300">|</span>
          <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 font-bold">
            <Navigation className="h-4 w-4" />
            <span>{distanceKm} km ({distanceMeters} m)</span>
          </div>
        </div>
      </div>

      {/* 3. Bottom Sliding Task Sheet & Swipe Controls */}
      <div className="bg-white/95 dark:bg-zinc-950/95 backdrop-blur-md border-t border-zinc-200 dark:border-zinc-800 p-4 sm:p-5 pb-6 space-y-3 z-30 shadow-2xl rounded-t-3xl max-w-lg mx-auto w-full">
        {/* Address & Ordered Items preview */}
        <div className="space-y-2">
          <div className="flex items-start justify-between gap-2">
            <div>
              <span className="text-[10px] uppercase font-bold text-zinc-400 block tracking-wider">
                Alamat Pengantaran Lahan
              </span>
              <p className="text-xs font-semibold text-zinc-900 dark:text-white leading-tight flex items-start gap-1 mt-0.5">
                <MapPin className="h-3.5 w-3.5 text-rose-500 shrink-0 mt-0.5" />
                <span>{order.shipping_address}{order.shipping_city ? `, ${order.shipping_city}` : ''}</span>
              </p>
            </div>

            <div className="text-right shrink-0">
              <span className="text-[10px] text-zinc-400 block font-medium">Tagihan Pembayaran</span>
              <span className="text-sm font-black text-emerald-700 dark:text-emerald-400">
                Rp {order.total_amount.toLocaleString('id-ID')}
              </span>
              <Badge
                className={`text-[9px] font-bold mt-0.5 ${
                  isCashOrder
                    ? 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950 dark:text-amber-300'
                    : 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300'
                }`}
              >
                {isCashOrder ? '💵 Bayar Tunai (COD)' : '💳 Lunas Online'}
              </Badge>
            </div>
          </div>

          {/* Items Breakdown list */}
          <div className="p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 text-[11px] space-y-1">
            <span className="text-zinc-400 font-semibold block text-[10px] uppercase">
              Daftar Benih ({order.items?.length || 0} varietas):
            </span>
            {order.items?.map((item, idx) => (
              <div key={idx} className="flex justify-between font-medium text-zinc-800 dark:text-zinc-200">
                <span>{item.quantity} {item.unit} &times; {item.product_name}</span>
                <span>Rp {item.subtotal.toLocaleString('id-ID')}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 4. Interactive Mobile Swipe-to-Action Buttons */}
        <div>
          {isFinished ? (
            <div className="p-3 rounded-2xl bg-zinc-100 dark:bg-zinc-900 text-center text-xs font-bold text-zinc-600 dark:text-zinc-400 flex items-center justify-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <span>Pengantaran ini telah selesai diserahkan.</span>
            </div>
          ) : !isStarted ? (
            /* STEP 1: Swipe to Start */
            <SwipeButton
              text="Geser untuk Mulai Pengantaran ➔"
              variant="primary"
              isLoading={isPending}
              onSwipeComplete={handleStartDelivery}
            />
          ) : (
            /* STEP 2: Swipe to Finish */
            <div className="space-y-1.5">
              {!isNearCustomer && (
                <p className="text-[10px] text-amber-600 dark:text-amber-400 text-center font-medium flex items-center justify-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  <span>Jarak ke pembeli: {distanceKm} km. Disarankan geser saat tiba di lokasi.</span>
                </p>
              )}
              <SwipeButton
                text={
                  isCashOrder
                    ? 'Geser untuk Terima Uang & Selesai ➔'
                    : 'Geser untuk Selesaikan Pengantaran ➔'
                }
                variant="success"
                isLoading={isPending}
                onSwipeComplete={handleFinishDeliveryAttempt}
              />
            </div>
          )}
        </div>
      </div>

      {/* CASH PAYMENT RECEIPT CONFIRMATION POPUP */}
      <Dialog open={isCashConfirmOpen} onOpenChange={setIsCashConfirmOpen}>
        <DialogContent className="max-w-md rounded-3xl p-6">
          <DialogHeader>
            <div className="h-14 w-14 rounded-2xl bg-amber-100 dark:bg-amber-950/80 text-amber-600 flex items-center justify-center mb-2 mx-auto">
              <Banknote className="h-8 w-8" />
            </div>
            <DialogTitle className="text-lg font-black text-center text-zinc-900 dark:text-white">
              Konfirmasi Penerimaan Uang Tunai (COD)
            </DialogTitle>
            <DialogDescription className="text-xs text-center text-zinc-500">
              Pelanggan memilih metode <strong>Bayar Tunai di Tempat (COD)</strong>. Mohon pastikan uang tunai telah Anda terima sebelum menyelesaikan tugas.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 my-2">
            {/* Amount Box */}
            <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-400/30 text-center space-y-1">
              <span className="text-xs text-amber-800 dark:text-amber-300 font-semibold block">
                Total Tagihan Tunai yang Harus Diterima:
              </span>
              <span className="text-2xl sm:text-3xl font-black text-amber-900 dark:text-amber-100">
                Rp {order.total_amount.toLocaleString('id-ID')}
              </span>
            </div>

            {/* Checkbox confirmation */}
            <label className="flex items-start gap-3 p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-900">
              <input
                type="checkbox"
                checked={cashConfirmedCheckbox}
                onChange={(e) => setCashConfirmedCheckbox(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded-md text-emerald-600 focus:ring-emerald-500"
              />
              <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 leading-snug">
                Saya mengonfirmasi telah menerima uang tunai pas sebesar{' '}
                <strong>Rp {order.total_amount.toLocaleString('id-ID')}</strong> dari{' '}
                {order.customer_name}.
              </span>
            </label>

            {/* Notes */}
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Catatan Serah Terima (Opsional)
              </label>
              <textarea
                rows={2}
                value={cashNotes}
                onChange={(e) => setCashNotes(e.target.value)}
                placeholder="Contoh: Diterima uang pas Rp 1.425.000 oleh istri pembeli..."
                className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsCashConfirmOpen(false)}
              className="rounded-xl text-xs font-semibold"
            >
              Batal
            </Button>
            <Button
              type="button"
              disabled={!cashConfirmedCheckbox || isPending}
              onClick={() => executeCompleteDelivery(true, cashNotes)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold gap-1.5"
            >
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Memproses...</span>
                </>
              ) : (
                <>
                  <Check className="h-4 w-4" />
                  <span>Konfirmasi &amp; Selesaikan Tugas</span>
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
