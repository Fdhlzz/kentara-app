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
  ChevronDown,
  ChevronUp,
  Lock,
  Sparkles,
  ArrowRight,
  PartyPopper,
  User,
  Minimize2,
  Maximize2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import { ThemeToggle } from '@/components/theme-toggle';
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

function getOrderCustomerCoords(order?: Order | null): [number, number] {
  if (!order) return [-5.1379367, 119.4357388];
  const addr = (order.shipping_address || '').toLowerCase();
  if (addr.includes('bontoala')) return [-5.1298, 119.4215];
  if (addr.includes('tamalanrea')) return [-5.1385, 119.4912];
  if (addr.includes('panakkukang') || addr.includes('pettarani')) return [-5.1554, 119.4428];
  if (addr.includes('mariso') || addr.includes('losari')) return [-5.1485, 119.4089];

  // Deterministic hash within Makassar bounds
  let hash = 0;
  for (let i = 0; i < (order.id || '').length; i++) {
    hash = (hash << 5) - hash + order.id.charCodeAt(i);
  }
  const latOffset = ((Math.abs(hash) % 400) / 10000) - 0.02;
  const lngOffset = ((Math.abs(hash >> 3) % 500) / 10000) - 0.025;
  return [-5.140 + latOffset, 119.440 + lngOffset];
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

  // Optimistic order status state for instantaneous UI transition
  const [currentOrderStatus, setCurrentOrderStatus] = useState<string>(order?.order_status || 'diproses');
  const [isSimulatedArrival, setIsSimulatedArrival] = useState(false);

  // Minimizable Bottom Sheet State (Default to MINIMIZED for full-screen map view)
  const [isSheetMinimized, setIsSheetMinimized] = useState(true);

  // Success Celebration & Redirect Modal
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [countdown, setCountdown] = useState(3);

  // Sync state when order prop changes (only reset if new order opened)
  useEffect(() => {
    if (order) {
      setCurrentOrderStatus(order.order_status);
      setIsSimulatedArrival(false);
      setIsSuccessModalOpen(false);
      setIsSheetMinimized(true);
    }
  }, [order?.id]);

  // Automatic countdown redirect to main pages when success modal is open
  useEffect(() => {
    if (!isSuccessModalOpen) return;

    setCountdown(3);
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          handleRedirectToMainDashboard();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isSuccessModalOpen]);

  const handleRedirectToMainDashboard = () => {
    setIsSuccessModalOpen(false);
    onClose();
    router.push('/kurir');
    router.refresh();
  };

  // Cash Confirmation Modal state
  const [isCashConfirmOpen, setIsCashConfirmOpen] = useState(false);
  const [cashConfirmedCheckbox, setCashConfirmedCheckbox] = useState(false);
  const [cashNotes, setCashNotes] = useState('');
  const [isItemsExpanded, setIsItemsExpanded] = useState(false);

  // Customer destination coordinate in Makassar
  const customerCoords = getOrderCustomerCoords(order);

  // REAL LIVE GPS TRACKING: Direct hardware GPS position from courier's device
  const isDeliveryActive = isOpen && !!order;
  const {
    currentPosition,
    accuracy,
    isGpsActive,
    isLocating,
    gpsError,
    recenterGps,
  } = useCourierLocationTracker({
    orderId: order?.id,
    isActive: isDeliveryActive,
    minDistanceMeters: 10,
    minIntervalMs: 10000,
  });

  const courierPosition: [number, number] = currentPosition || [
    customerCoords[0] - 0.012,
    customerCoords[1] - 0.015,
  ];

  const [roadRoute, setRoadRoute] = useState<RoadRouteResult | null>(null);

  // Real road route geometry
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
  }, [isOpen, courierPosition[0], courierPosition[1], customerCoords[0], customerCoords[1]]);

  if (!order || !isOpen) return null;

  const isCashOrder = order.payment_gateway === 'cash';
  const isStarted = currentOrderStatus === 'dikirim';
  const isFinished = currentOrderStatus === 'selesai';

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

  const distanceMeters = Math.round(distanceKm * 1000);
  
  // Proximity Gate: Enabled if within 500m of customer or if simulation arrival is clicked
  const isNearCustomer = distanceMeters <= 500 || isSimulatedArrival;

  const markers: MapMarkerData[] = [
    {
      id: 'courier-real-live',
      position: courierPosition,
      title: `Kurir: ${courierName}`,
      description: isGpsActive
        ? `📍 GPS Asli Perangkat (${courierPosition[0].toFixed(5)}, ${courierPosition[1].toFixed(5)})`
        : 'Mencari sinyal GPS perangkat...',
      type: 'courier',
      phone: courierPhone,
      badgeText: isGpsActive ? 'Lokasi GPS Anda' : 'Armada Kurir',
    },
    {
      id: 'customer-dest',
      position: customerCoords,
      title: `Tujuan: ${order.customer_name}`,
      description: order.shipping_address,
      type: 'farm',
      phone: order.customer_phone,
      badgeText: 'Titik Pengantaran',
    },
  ];

  const route: MapRouteData = {
    id: 'courier-task-road-route',
    from: courierPosition,
    to: customerCoords,
    geometryPoints: roadRoute?.geometry,
    color: '#2563eb',
    distanceKm,
    estimatedMinutes: etaMinutes,
    isRealRoadRoute: roadRoute?.isSuccess ?? false,
  };

  // 1. Swipe to Start Delivery (Immediately hides start button & switches to finish button)
  const handleStartDelivery = () => {
    // Instant local optimistic update
    setCurrentOrderStatus('dikirim');

    startTransition(async () => {
      const res = await startCourierDeliveryAction(order.id);
      if (!res.success) {
        // Rollback if failed
        setCurrentOrderStatus('diproses');
        toast.error(res.error || 'Gagal memulai pengantaran');
        return;
      }
      toast.success('Pengantaran Dimulai!', {
        description: 'Status pesanan telah berubah menjadi Dalam Pengantaran. Lacak rute ke lokasi pembeli.',
      });
      router.refresh();
    });
  };

  // 2. Swipe to Finish Delivery
  const handleFinishDeliveryAttempt = () => {
    if (!isNearCustomer) {
      toast.warning('Belum Tiba di Lokasi', {
        description: `Jarak Anda masih ${distanceKm} km dari titik pembeli. Tombol akan aktif saat tiba di lokasi.`,
      });
      return;
    }

    if (isCashOrder && order.payment_status !== 'settlement' && order.payment_status !== 'paid') {
      setIsCashConfirmOpen(true);
      return;
    }

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

      setCurrentOrderStatus('selesai');
      setIsCashConfirmOpen(false);
      
      // Open Success Completion Pop-up Modal
      setIsSuccessModalOpen(true);
    });
  };

  const cleanPhone = order.customer_phone.replace(/^0/, '62').replace(/\D/g, '');
  const waMessage = encodeURIComponent(
    `Halo Bpk/Ibu ${order.customer_name}, saya kurir dari Kentara sedang dalam perjalanan mengantarkan pesanan benih kentang Anda (${order.order_code}) ke lokasi ${order.shipping_address}. Mohon pastikan penerima berada di lokasi.`
  );

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col w-screen h-screen overflow-hidden select-none">
      {/* 1. Full-Screen Edge-to-Edge Leaflet Map (Zero Rounding, Zero Borders) */}
      <div className="absolute inset-0 w-full h-full z-0">
        <LeafletMap
          center={courierPosition}
          zoom={14}
          markers={markers}
          route={route}
          height="100%"
          className="w-full h-full rounded-none border-none shadow-none"
        />
      </div>

      {/* 2. Floating Top Driver Cockpit Header with Readable Full Name */}
      <div className="relative z-30 pt-3 px-3 max-w-lg mx-auto w-full pointer-events-auto">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 p-2 px-3 rounded-2xl bg-white/95 dark:bg-zinc-900/95 shadow-xl backdrop-blur-md border border-zinc-200/80 dark:border-zinc-800 flex-1 min-w-0">
            <div className="h-9 w-9 rounded-xl bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 flex items-center justify-center font-black text-sm shrink-0 shadow-xs border border-blue-200 dark:border-blue-800">
              {order.customer_name ? order.customer_name.charAt(0).toUpperCase() : 'P'}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <Badge className="bg-blue-600 text-white text-[9px] font-black px-1.5 py-0 shrink-0">
                  {order.order_code}
                </Badge>
                <span className="text-[10px] text-zinc-500 truncate">
                  {order.shipping_city || 'Makassar'}
                </span>
              </div>
              <span className="text-xs sm:text-sm font-black text-zinc-900 dark:text-white truncate block leading-tight mt-0.5">
                {order.customer_name}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {/* Quick Theme Toggle */}
            <div className="h-10 w-10 rounded-2xl bg-white/95 dark:bg-zinc-900/95 shadow-lg flex items-center justify-center border border-zinc-200/80 dark:border-zinc-800 backdrop-blur-md">
              <ThemeToggle />
            </div>

            {/* Quick WA Button */}
            <a
              href={`https://wa.me/${cleanPhone}?text=${waMessage}`}
              target="_blank"
              rel="noreferrer"
              className="h-10 w-10 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center shadow-lg transition active:scale-95 cursor-pointer"
              title="Kirim WhatsApp ke Pembeli"
            >
              <MessageCircle className="h-4 w-4" />
            </a>

            {/* Direct Phone Call Button */}
            <a
              href={`tel:${order.customer_phone}`}
              className="h-10 w-10 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center shadow-lg transition active:scale-95 cursor-pointer"
              title="Telepon Pembeli"
            >
              <Phone className="h-4 w-4" />
            </a>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="h-10 w-10 rounded-2xl bg-zinc-900/90 hover:bg-zinc-800 text-white flex items-center justify-center shadow-lg transition active:scale-95 border border-zinc-700/50 cursor-pointer"
              title="Tutup Navigasi"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 3. Floating Telemetry HUD (ETA, Distance & Real GPS Signal) */}
      <div className="relative z-20 px-3 pt-2 max-w-lg mx-auto w-full pointer-events-none flex items-center justify-between gap-2">
        {/* ETA & Distance */}
        <div className="flex items-center gap-2 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md p-2 px-3 rounded-2xl shadow-lg border border-zinc-200 dark:border-zinc-800 text-xs pointer-events-auto">
          <div className="flex items-center gap-1.5 text-blue-700 dark:text-blue-400 font-black">
            <Clock className="h-3.5 w-3.5" />
            <span>{etaMinutes} mnt</span>
          </div>
          <span className="text-zinc-300 dark:text-zinc-700">|</span>
          <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 font-bold">
            <Navigation className="h-3.5 w-3.5" />
            <span>{distanceKm} km ({distanceMeters} m)</span>
          </div>
        </div>

        {/* Real GPS Status & Recenter Button */}
        <div className="flex items-center gap-1.5 pointer-events-auto">
          <div className="flex items-center gap-1.5 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md p-2 px-2.5 rounded-2xl shadow-lg border border-zinc-200 dark:border-zinc-800 text-[10px]">
            {isGpsActive ? (
              <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-300 font-bold">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping inline-block" />
                <span>GPS Asli</span>
                {accuracy && <span className="text-zinc-400">(&plusmn;{accuracy}m)</span>}
              </div>
            ) : (
              <div className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-semibold">
                <Loader2 className="h-3 w-3 animate-spin" />
                <span>Cari GPS...</span>
              </div>
            )}
          </div>

          <Button
            type="button"
            size="icon"
            variant="outline"
            onClick={recenterGps}
            disabled={isLocating}
            className="h-9 w-9 rounded-2xl bg-white/95 dark:bg-zinc-900/95 border-zinc-200 dark:border-zinc-800 shadow-lg text-blue-600 hover:bg-blue-50 dark:hover:bg-zinc-800 cursor-pointer"
            title="Pusatkan ke GPS Saya"
          >
            <Locate className={`h-4 w-4 ${isLocating ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* GPS Error Alert */}
      {gpsError && (
        <div className="relative z-20 px-3 pt-2 max-w-lg mx-auto w-full pointer-events-auto">
          <div className="p-2.5 rounded-2xl bg-amber-50 dark:bg-amber-950/90 border border-amber-300 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-200 flex items-center justify-between gap-2 shadow-lg backdrop-blur-md">
            <div className="flex items-center gap-1.5">
              <AlertCircle className="h-4 w-4 shrink-0 text-amber-600" />
              <span className="text-[11px] font-medium">{gpsError}</span>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={recenterGps}
              className="h-6 text-[10px] px-2 rounded-lg"
            >
              Coba Lagi
            </Button>
          </div>
        </div>
      )}

      {/* 4. MINIMIZABLE BOTTOM SLIDING TASK SHEET & PINNED BOTTOM ACTION CONTROLS */}
      <div className="mt-auto relative z-30 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-md border-t border-zinc-200 dark:border-zinc-800 shadow-2xl rounded-t-3xl max-w-lg mx-auto w-full pointer-events-auto transition-all duration-300">
        {/* Clickable Header Handle to Toggle Minimize / Expand */}
        <button
          type="button"
          onClick={() => setIsSheetMinimized(!isSheetMinimized)}
          className="w-full pt-3 pb-2 px-4 flex flex-col items-center justify-center gap-1.5 cursor-pointer hover:bg-zinc-50/50 dark:hover:bg-zinc-900/50 transition rounded-t-3xl"
          title={isSheetMinimized ? 'Perluas Rincian Pengantaran' : 'Ciutkan Rincian Pengantaran'}
        >
          <div className="w-12 h-1.5 rounded-full bg-zinc-300 dark:bg-zinc-700" />

          {/* Compact Mini Bar when Minimized */}
          {isSheetMinimized ? (
            <div className="w-full flex items-center justify-between pt-1">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-xs font-black text-zinc-900 dark:text-white truncate">
                  {order.customer_name}
                </span>
                <Badge
                  className={`text-[9px] font-bold px-1.5 py-0 ${
                    isCashOrder
                      ? 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950 dark:text-amber-300'
                      : 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300'
                  }`}
                >
                  {isCashOrder ? `💵 COD: Rp ${order.total_amount.toLocaleString('id-ID')}` : '💳 Lunas Online'}
                </Badge>
              </div>

              <div className="flex items-center gap-1 text-[11px] font-bold text-blue-600 dark:text-blue-400">
                <span>Rincian</span>
                <ChevronUp className="h-4 w-4" />
              </div>
            </div>
          ) : (
            <div className="w-full flex items-center justify-between pt-0.5 text-[10px] text-zinc-400 font-bold uppercase tracking-wider">
              <span>Rincian Pengantaran</span>
              <span className="flex items-center gap-0.5 text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300">
                <span>Ciutkan</span>
                <ChevronDown className="h-3.5 w-3.5" />
              </span>
            </div>
          )}
        </button>

        {/* EXPANDED DETAILS BODY (Hidden when minimized to clear map clutter) */}
        {!isSheetMinimized && (
          <div className="px-4 sm:px-5 pb-2 space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-200">
            {/* Readable Recipient & Farm Location Card */}
            <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-900/80 border border-zinc-200/80 dark:border-zinc-800 space-y-2.5">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1 text-[10px] uppercase font-bold text-zinc-400">
                    <User className="h-3 w-3 text-blue-600" />
                    <span>Penerima / Petani Lahan</span>
                  </div>
                  <p className="text-sm sm:text-base font-black text-zinc-900 dark:text-white mt-0.5 leading-snug">
                    {order.customer_name}
                  </p>
                  <p className="text-xs text-zinc-600 dark:text-zinc-300 flex items-center gap-1 mt-0.5">
                    <Phone className="h-3 w-3 text-emerald-600 shrink-0" />
                    <span className="font-semibold">{order.customer_phone}</span>
                  </p>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-[10px] text-zinc-400 block font-medium">
                    {isCashOrder ? 'Tagihan Tunai COD' : 'Status Tagihan'}
                  </span>
                  {isCashOrder ? (
                    <span className="text-base font-black text-amber-700 dark:text-amber-400">
                      Rp {order.total_amount.toLocaleString('id-ID')}
                    </span>
                  ) : (
                    <span className="text-[11px] font-black text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-lg border border-emerald-300 dark:border-emerald-800 inline-block mt-0.5">
                      Lunas Online (Rp 0)
                    </span>
                  )}
                </div>
              </div>

              <div className="pt-2 border-t border-zinc-200/60 dark:border-zinc-800 text-xs">
                <div className="text-[10px] uppercase font-bold text-zinc-400 flex items-center gap-1">
                  <MapPin className="h-3 w-3 text-rose-500 shrink-0" />
                  <span>Titik Alamat Lahan</span>
                </div>
                <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 mt-0.5 leading-tight">
                  {order.shipping_address}{order.shipping_city ? `, ${order.shipping_city}` : ''}
                </p>
              </div>
            </div>

            {/* Payment Method Notice Badge */}
            <div
              className={`p-2.5 rounded-2xl flex items-center justify-between border ${
                isCashOrder
                  ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800/60'
                  : 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800/60'
              }`}
            >
              <div className="flex items-center gap-2">
                <div
                  className={`p-1.5 rounded-xl ${
                    isCashOrder ? 'bg-amber-500 text-white' : 'bg-emerald-600 text-white'
                  }`}
                >
                  {isCashOrder ? <Banknote className="h-4 w-4" /> : <CreditCard className="h-4 w-4" />}
                </div>
                <div>
                  <span
                    className={`text-xs font-black block ${
                      isCashOrder
                        ? 'text-amber-900 dark:text-amber-200'
                        : 'text-emerald-900 dark:text-emerald-200'
                    }`}
                  >
                    {isCashOrder
                      ? `💵 Tagih Uang Tunai: Rp ${order.total_amount.toLocaleString('id-ID')}`
                      : '💳 Lunas Online (Jangan Minta Uang)'}
                  </span>
                  <span className="text-[10px] text-zinc-500 dark:text-zinc-400 block">
                    {isCashOrder
                      ? `Wajib kumpulkan uang pas Rp ${order.total_amount.toLocaleString('id-ID')} dari pembeli saat serah terima.`
                      : 'Pesanan telah dibayar lunas online. Anda tidak perlu menagih uang kepada pembeli.'}
                  </span>
                </div>
              </div>
            </div>

            {/* Expandable Ordered Seed Items */}
            <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-900/80 overflow-hidden text-xs">
              <button
                type="button"
                onClick={() => setIsItemsExpanded(!isItemsExpanded)}
                className="w-full p-2.5 px-3 flex items-center justify-between text-zinc-700 dark:text-zinc-300 font-bold hover:bg-zinc-100 dark:hover:bg-zinc-800/60 transition cursor-pointer"
              >
                <span className="flex items-center gap-1.5 text-[11px] uppercase tracking-wide">
                  <Package className="h-3.5 w-3.5 text-blue-600" />
                  <span>Rincian Muatan ({order.items?.length || 0} varietas benih)</span>
                </span>
                {isItemsExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </button>

              {isItemsExpanded && (
                <div className="p-3 pt-0 border-t border-zinc-200/60 dark:border-zinc-800 space-y-1.5 divide-y divide-zinc-100 dark:divide-zinc-800">
                  {order.items?.map((item, idx) => (
                    <div key={idx} className="pt-1.5 flex justify-between font-medium text-[11px] text-zinc-800 dark:text-zinc-200">
                      <span>{item.quantity} {item.unit} &times; {item.product_name}</span>
                      <span className="font-semibold text-zinc-500">
                        Muatan Siap Serah
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* 5. PERMANENTLY PINNED BOTTOM ACTION CONTROLS & SWIPE BUTTON */}
        <div className="p-4 sm:p-5 pt-2 pb-6 space-y-2">
          {isFinished ? (
            <div className="p-3 rounded-2xl bg-zinc-100 dark:bg-zinc-900 text-center text-xs font-bold text-zinc-600 dark:text-zinc-400 flex items-center justify-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <span>Pengantaran ini telah selesai diserahkan.</span>
            </div>
          ) : !isStarted ? (
            /* STEP 1: Swipe to Start Delivery (Gone once swiped) */
            <div className="space-y-1.5">
              <SwipeButton
                text="Geser untuk Mulai Pengantaran ➔"
                variant="primary"
                isLoading={isPending}
                onSwipeComplete={handleStartDelivery}
              />
              {!isSheetMinimized && (
                <p className="text-[10px] text-zinc-400 text-center">
                  Geser ke kanan untuk memulai navigasi rute ke lahan pembeli.
                </p>
              )}
            </div>
          ) : (
            /* STEP 2: Swipe to Complete Delivery (Enabled ONLY when close to customer location) */
            <div className="space-y-2">
              {/* Proximity Status Hint */}
              {isNearCustomer ? (
                <div className="p-2 px-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-[11px] text-emerald-800 dark:text-emerald-300 flex items-center justify-between gap-2 shadow-xs">
                  <div className="flex items-center gap-1.5 font-bold">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span>Anda telah tiba di lokasi lahan!</span>
                  </div>
                  <span className="text-[10px] font-semibold bg-emerald-600 text-white px-2 py-0.5 rounded-full">
                    Siap Selesai
                  </span>
                </div>
              ) : (
                <div className="p-2 px-3 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-800 text-[11px] text-amber-800 dark:text-amber-300 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 font-semibold min-w-0">
                    <Lock className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                    <span className="truncate">Terkunci: Jarak {distanceKm} km ({distanceMeters}m lagi)</span>
                  </div>
                  {/* Simulation / Testing arrival toggle */}
                  <button
                    type="button"
                    onClick={() => setIsSimulatedArrival(true)}
                    className="text-[10px] text-blue-600 hover:underline font-bold shrink-0 bg-white dark:bg-zinc-900 px-2 py-0.5 rounded-lg border border-blue-200 dark:border-blue-900 cursor-pointer"
                  >
                    Simulasi Tiba
                  </button>
                </div>
              )}

              {/* Complete Swipe Button (Disabled until arrived) */}
              <SwipeButton
                text={
                  isCashOrder
                    ? `Geser untuk Terima Kas Tunai (Rp ${order.total_amount.toLocaleString('id-ID')}) ➔`
                    : 'Geser untuk Selesaikan Pengantaran ➔'
                }
                disabledText={`Terkunci: Belum Tiba (${distanceKm} km lagi)`}
                variant={isNearCustomer ? 'success' : 'primary'}
                disabled={!isNearCustomer || isPending}
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
            <div className="h-14 w-14 rounded-2xl bg-amber-100 dark:bg-amber-950/80 text-amber-600 flex items-center justify-center mb-2 mx-auto shadow-xs">
              <Banknote className="h-8 w-8" />
            </div>
            <DialogTitle className="text-lg font-black text-center text-zinc-900 dark:text-white">
              Konfirmasi Penerimaan Uang Tunai (COD)
            </DialogTitle>
            <DialogDescription className="text-xs text-center text-zinc-500">
              Pelanggan memilih metode <strong>Bayar Tunai di Tempat (COD)</strong>. Pastikan uang tunai pas telah Anda terima sebelum menyelesaikan tugas.
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

            {/* Checkbox confirmation with Readable Full Name */}
            <label className="flex items-start gap-3 p-3 rounded-2xl border border-zinc-200 dark:border-zinc-800 cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-900 transition">
              <input
                type="checkbox"
                checked={cashConfirmedCheckbox}
                onChange={(e) => setCashConfirmedCheckbox(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded-md text-emerald-600 focus:ring-emerald-500 cursor-pointer"
              />
              <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 leading-snug">
                Saya mengonfirmasi telah menerima uang tunai pas sebesar{' '}
                <strong>Rp {order.total_amount.toLocaleString('id-ID')}</strong> dari{' '}
                <strong>{order.customer_name}</strong>.
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
                placeholder={`Contoh: Diterima uang pas Rp ${order.total_amount.toLocaleString('id-ID')} oleh ${order.customer_name} di lokasi...`}
                className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white"
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
              className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold gap-1.5 shadow-md"
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

      {/* 6. EYE-CATCHING TASK COMPLETION CELEBRATION MODAL & AUTOMATIC DASHBOARD REDIRECT */}
      <Dialog open={isSuccessModalOpen} onOpenChange={(open) => {
        if (!open) handleRedirectToMainDashboard();
      }}>
        <DialogContent className="max-w-md rounded-3xl p-6 border-2 border-emerald-500/30 text-center space-y-4">
          <DialogHeader className="text-center">
            {/* Animated Celebration Badge */}
            <div className="relative mx-auto mb-2">
              <div className="h-20 w-20 rounded-3xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 flex items-center justify-center mx-auto shadow-xl ring-8 ring-emerald-500/20 animate-bounce">
                <PartyPopper className="h-10 w-10 text-emerald-600" />
              </div>
            </div>

            <DialogTitle className="text-xl font-black text-zinc-900 dark:text-white tracking-tight">
              Tugas Pengantaran Berhasil Selesai! 🎉
            </DialogTitle>
            <DialogDescription className="text-xs text-zinc-500 max-w-xs mx-auto">
              Pesanan benih telah sukses diserahkan ke pembeli dan data sistem telah disinkronkan.
            </DialogDescription>
          </DialogHeader>

          {/* Delivery Summary Box (Readable Full Name) */}
          <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900/90 border border-zinc-200/80 dark:border-zinc-800 text-left space-y-2.5 text-xs">
            <div className="flex justify-between items-center pb-2 border-b border-zinc-200 dark:border-zinc-800">
              <span className="text-zinc-500 font-medium">Kode Pesanan:</span>
              <Badge className="bg-blue-600 text-white text-[10px] font-black font-mono">
                {order.order_code}
              </Badge>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-zinc-500">Penerima Lahan:</span>
              <span className="font-black text-sm text-zinc-900 dark:text-white">{order.customer_name}</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-zinc-500">Status Pembayaran:</span>
              <Badge
                className={`text-[10px] font-bold ${
                  isCashOrder
                    ? 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950 dark:text-amber-300'
                    : 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300'
                }`}
              >
                {isCashOrder ? '💵 Kas COD Dikumpulkan' : '💳 Lunas Online (Midtrans)'}
              </Badge>
            </div>

            {isCashOrder && (
              <div className="flex justify-between items-center pt-2 border-t border-zinc-200 dark:border-zinc-800 font-extrabold text-amber-700 dark:text-amber-400">
                <span>Total Kas COD Diterima:</span>
                <span className="text-sm font-black">
                  Rp {order.total_amount.toLocaleString('id-ID')}
                </span>
              </div>
            )}
          </div>

          {/* Countdown Redirect Indicator */}
          <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 text-blue-700 dark:text-blue-300 text-xs font-semibold flex items-center justify-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
            <span>Otomatis kembali ke Beranda dalam <strong>{countdown} detik...</strong></span>
          </div>

          {/* Action Button */}
          <DialogFooter>
            <Button
              onClick={handleRedirectToMainDashboard}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl h-12 font-extrabold text-xs sm:text-sm shadow-lg gap-2 cursor-pointer"
            >
              <span>Kembali ke Beranda Tugas</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
