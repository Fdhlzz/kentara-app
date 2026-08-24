'use client';

import { useState, useEffect } from 'react';
import {
  Truck,
  Sprout,
  Phone,
  Clock,
  Navigation,
  Locate,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { LeafletMap } from '@/components/maps/leaflet-map';
import { calculateDistanceKm } from '@/lib/maps/leaflet-helpers';
import type { MapMarkerData, MapRouteData } from '@/types/maps';

export interface DeliveryTrackingMapProps {
  orderId?: string;
  seedName?: string;
  courierName?: string;
  courierPhone?: string;
  initialCourierCoords?: [number, number];
  farmerName?: string;
  farmerAddress?: string;
  farmerCoords?: [number, number];
  warehouseCoords?: [number, number];
}

export function DeliveryTrackingMap({
  orderId = 'ORD-KNT-MKS-088',
  seedName = 'Benih Padi Inpari 32 Bersertifikat (10 Kg)',
  courierName = 'Armada Kurir Kentara',
  courierPhone = '081234567890',
  initialCourierCoords,
  farmerName = 'Lahan Pertanian Pembeli (Bpk. Subardi)',
  farmerAddress = 'Jl. Perintis Kemerdekaan, Tamalanrea, Makassar',
  farmerCoords = [-5.1379367, 119.4357388], // Lokasi Pembeli / Buyer Mockup
  warehouseCoords = [-5.1215, 119.4195], // Gudang Distribusi Kentara Makassar
}: DeliveryTrackingMapProps) {
  // Default courier fallback nearby if GPS is not yet acquired
  const fallbackCourier: [number, number] = initialCourierCoords || [
    farmerCoords[0] - 0.015,
    farmerCoords[1] - 0.018,
  ];

  const [courierPosition, setCourierPosition] = useState<[number, number]>(fallbackCourier);
  const [isGpsActive, setIsGpsActive] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);

  // Handler interaktif untuk tombol klik pengguna
  const handleManualLocate = () => {
    if (!navigator.geolocation) {
      setGpsError('Geolocation tidak didukung pada peramban ini.');
      return;
    }

    setIsLocating(true);
    setGpsError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setCourierPosition([latitude, longitude]);
        setIsGpsActive(true);
        setIsLocating(false);
      },
      (error) => {
        console.warn('[GPS Error]:', error.message);
        setGpsError('Izin GPS ditolak atau tidak tersedia. Menggunakan lokasi simulasi.');
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  // Initial GPS request on component mount
  useEffect(() => {
    if (typeof window === 'undefined' || !navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setCourierPosition([latitude, longitude]);
        setIsGpsActive(true);
      },
      () => {
        // Fallback silently to initial mock point if permission not yet granted
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 }
    );
  }, []);

  // Hitung jarak real-time dari posisi kurir saat ini ke titik pembeli
  const distanceKm = calculateDistanceKm(
    courierPosition[0],
    courierPosition[1],
    farmerCoords[0],
    farmerCoords[1]
  );

  // Estimasi waktu tempuh berdasarkan jarak aktual (kecepatan rata-rata 35 km/jam)
  const etaMinutes = Math.max(5, Math.round((distanceKm / 35) * 60));

  const markers: MapMarkerData[] = [
    {
      id: 'warehouse',
      position: warehouseCoords,
      title: 'Gudang Benih Kentara Hub Makassar',
      description: 'Pusat Distribusi & Quality Control Benih',
      type: 'warehouse',
      badgeText: 'Asal Pengiriman',
    },
    {
      id: 'courier',
      position: courierPosition,
      title: isGpsActive ? `Lokasi Anda (Kurir: ${courierName})` : `Kurir: ${courierName}`,
      description: isGpsActive
        ? `GPS Real-Time Aktif (${courierPosition[0].toFixed(5)}, ${courierPosition[1].toFixed(5)})`
        : 'Sedang dalam perjalanan menuju lokasi lahan',
      type: 'courier',
      phone: courierPhone,
      badgeText: isGpsActive ? 'Lokasi GPS Anda' : 'Armada Kurir',
    },
    {
      id: 'buyer-farmer',
      position: farmerCoords,
      title: `Tujuan Pembeli: ${farmerName}`,
      description: farmerAddress,
      type: 'farm',
      badgeText: 'Titik Lokasi Pembeli',
    },
  ];

  const route: MapRouteData = {
    id: 'active-delivery-route',
    from: courierPosition,
    to: farmerCoords,
    color: '#2563eb',
    dashArray: '8, 8',
    distanceKm,
    estimatedMinutes: etaMinutes,
  };

  return (
    <Card className="overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-lg dark:border-zinc-800 dark:bg-zinc-900">
      {/* Header Info Pesanan & Status GPS */}
      <div className="border-b border-zinc-100 dark:border-zinc-800 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-zinc-50/70 dark:bg-zinc-950/40">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-mono font-bold text-zinc-500">{orderId}</span>
            <Badge className="bg-blue-600 text-white text-[10px] px-2 py-0.5 animate-pulse">
              Pengantaran Aktif
            </Badge>
            {isGpsActive ? (
              <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300 text-[10px] px-2 py-0.5 flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                <span>GPS Perangkat Terhubung</span>
              </Badge>
            ) : (
              <Badge className="bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950 dark:text-amber-300 text-[10px] px-2 py-0.5 flex items-center gap-1">
                <AlertCircle className="h-3 w-3 text-amber-600" />
                <span>Mode Simulasi</span>
              </Badge>
            )}
          </div>
          <h3 className="text-base sm:text-lg font-extrabold text-zinc-900 dark:text-white">
            {seedName}
          </h3>
        </div>

        {/* Action Button & ETA Summary */}
        <div className="flex flex-wrap items-center gap-2.5 self-start sm:self-auto">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleManualLocate}
            disabled={isLocating}
            className="h-10 px-3.5 rounded-xl border-blue-200 hover:bg-blue-50 text-blue-700 dark:border-blue-900 dark:text-blue-300 dark:hover:bg-blue-950/50 text-xs font-semibold cursor-pointer shadow-xs"
          >
            {isLocating ? (
              <div className="flex items-center gap-1.5">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>Mencari GPS...</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                <Locate className="h-3.5 w-3.5" />
                <span>Sinkronkan Lokasi Saya</span>
              </div>
            )}
          </Button>

          {/* Metric Card */}
          <div className="flex items-center gap-3 bg-white dark:bg-zinc-900 px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-xs">
            <div className="flex items-center gap-1.5 text-xs">
              <Clock className="h-3.5 w-3.5 text-blue-600 shrink-0" />
              <div>
                <span className="text-[10px] text-zinc-400 block leading-none">ETA</span>
                <strong className="text-zinc-800 dark:text-zinc-200 font-bold">
                  {etaMinutes} mnt
                </strong>
              </div>
            </div>

            <div className="h-5 w-px bg-zinc-200 dark:bg-zinc-800" />

            <div className="flex items-center gap-1.5 text-xs">
              <Navigation className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
              <div>
                <span className="text-[10px] text-zinc-400 block leading-none">Jarak</span>
                <strong className="text-zinc-800 dark:text-zinc-200 font-bold">
                  {distanceKm} Km
                </strong>
              </div>
            </div>
          </div>
        </div>
      </div>

      {gpsError && (
        <div className="mx-4 mt-3 p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 text-xs text-amber-800 dark:text-amber-300 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0 text-amber-600" />
          <span>{gpsError}</span>
        </div>
      )}

      {/* Interactive Leaflet Map Component with Polyline Route & Pinpoints */}
      <div className="p-3 sm:p-4">
        <LeafletMap
          center={courierPosition}
          zoom={13}
          markers={markers}
          route={route}
          height="400px"
          className="rounded-2xl"
        />
      </div>

      {/* Footer Courier & Buyer Destination Coordinates Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-4 sm:p-5 pt-1 border-t border-zinc-100 dark:border-zinc-800">
        {/* Info Lokasi Kurir */}
        <div className="flex items-center justify-between p-3.5 rounded-2xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/40">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs shrink-0">
              <Truck className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-blue-700 dark:text-blue-300 font-semibold block">
                  Lokasi Kurir (Asal Rute)
                </span>
                {isGpsActive && (
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping inline-block" />
                )}
              </div>
              <strong className="text-xs sm:text-sm text-zinc-900 dark:text-white block truncate">
                {courierName}
              </strong>
              <span className="font-mono text-[11px] text-zinc-500 dark:text-zinc-400 block">
                {courierPosition[0].toFixed(5)}, {courierPosition[1].toFixed(5)}
              </span>
            </div>
          </div>

          {courierPhone && (
            <a
              href={`tel:${courierPhone}`}
              className="inline-flex items-center justify-center gap-1 h-9 px-3 rounded-xl text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/50 text-xs font-semibold transition shrink-0 ml-2"
            >
              <Phone className="h-3.5 w-3.5 mr-1" />
              <span>Hubungi</span>
            </a>
          )}
        </div>

        {/* Info Lokasi Pembeli / Buyer */}
        <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/40">
          <div className="h-10 w-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs shrink-0">
            <Sprout className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] text-emerald-700 dark:text-emerald-300 font-semibold block">
              Lokasi Pembeli (Titik Tujuan)
            </span>
            <strong className="text-xs sm:text-sm text-zinc-900 dark:text-white block truncate">
              {farmerName}
            </strong>
            <span className="font-mono text-[11px] text-emerald-700 dark:text-emerald-400 font-semibold block">
              -5.1379367, 119.4357388
            </span>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate mt-0.5">
              {farmerAddress}
            </p>
          </div>
        </div>
      </div>
    </Card>
  );
}
