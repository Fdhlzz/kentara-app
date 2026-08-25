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
  Route as RouteIcon,
  MapPin,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { LeafletMap } from '@/components/maps/leaflet-map';
import {
  ChangeCustomerLocationDialog,
  type CustomerLocationData,
} from '@/components/maps/change-customer-location-dialog';
import {
  calculateDistanceKm,
  fetchRealRoadRoute,
  type RoadRouteResult,
} from '@/lib/maps/leaflet-helpers';
import { getCourierLocationByOrderAction } from '@/lib/maps/location-actions';
import type { MapMarkerData, MapRouteData } from '@/types/maps';

export interface DeliveryTrackingMapProps {
  orderId?: string;
  seedName?: string;
  courierName?: string;
  courierPhone?: string;
  initialCourierCoords?: [number, number];
  farmerName?: string;
  farmerPhone?: string;
  farmerAddress?: string;
  farmerCoords?: [number, number];
  warehouseCoords?: [number, number];
  allowChangeCustomerLocation?: boolean;
}

export function DeliveryTrackingMap({
  orderId = 'ORD-KNT-MKS-088',
  seedName = 'Benih Padi Inpari 32 Bersertifikat (10 Kg)',
  courierName = 'Armada Kurir Kentara',
  courierPhone = '081234567890',
  initialCourierCoords,
  farmerName = 'Lahan Pertanian Pembeli (Bpk. Subardi)',
  farmerPhone = '085156392978',
  farmerAddress = 'Jl. Perintis Kemerdekaan, Tamalanrea, Makassar',
  farmerCoords = [-5.1379367, 119.4357388], // Lokasi Pembeli / Buyer Mockup
  warehouseCoords = [-5.1215, 119.4195], // Gudang Distribusi Kentara Makassar
  allowChangeCustomerLocation = true,
}: DeliveryTrackingMapProps) {
  // State Lokasi Pembeli / Customer yang dapat diubah oleh Kurir
  const [customer, setCustomer] = useState<CustomerLocationData>({
    name: farmerName,
    phone: farmerPhone,
    address: farmerAddress,
    coords: farmerCoords,
  });

  // Default courier fallback nearby if GPS is not yet acquired
  const fallbackCourier: [number, number] = initialCourierCoords || [
    customer.coords[0] - 0.015,
    customer.coords[1] - 0.018,
  ];

  const [courierPosition, setCourierPosition] = useState<[number, number]>(fallbackCourier);
  const [isGpsActive, setIsGpsActive] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);

  // Real road routing state
  const [roadRoute, setRoadRoute] = useState<RoadRouteResult | null>(null);
  const [isCalculatingRoute, setIsCalculatingRoute] = useState(false);

  // Poll live courier location from public.courier_locations if orderId is provided
  useEffect(() => {
    if (!orderId) return;
    let isMounted = true;

    async function fetchLiveCourier() {
      try {
        const liveLoc = await getCourierLocationByOrderAction(orderId);
        if (liveLoc && isMounted && liveLoc.is_active) {
          setCourierPosition([liveLoc.latitude, liveLoc.longitude]);
          setIsGpsActive(true);
        }
      } catch (e) {
        console.warn('[Live Courier Fetch]:', e);
      }
    }

    fetchLiveCourier();
    const interval = setInterval(fetchLiveCourier, 10000); // 10s poll
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [orderId]);

  // Handler interaktif untuk tombol sinkronisasi GPS
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

  // Fetch real road route geometry from OSRM whenever courierPosition or customer.coords updates
  useEffect(() => {
    let isCancelled = false;

    async function loadRoadRoute() {
      setIsCalculatingRoute(true);
      const result = await fetchRealRoadRoute(courierPosition, customer.coords);
      if (!isCancelled) {
        setRoadRoute(result);
        setIsCalculatingRoute(false);
      }
    }

    loadRoadRoute();

    return () => {
      isCancelled = true;
    };
  }, [courierPosition, customer.coords]);

  // Jarak dan estimasi waktu: utamakan rute jalan raya asli (OSRM), jika gagal gunakan kalkulasi Haversine
  const distanceKm =
    roadRoute?.distanceKm !== undefined
      ? roadRoute.distanceKm
      : calculateDistanceKm(
          courierPosition[0],
          courierPosition[1],
          customer.coords[0],
          customer.coords[1]
        );

  const etaMinutes =
    roadRoute?.durationMinutes !== undefined
      ? roadRoute.durationMinutes
      : Math.max(5, Math.round((distanceKm / 35) * 60));

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
      position: customer.coords,
      title: `Tujuan Pembeli: ${customer.name}`,
      description: customer.address,
      type: 'farm',
      phone: customer.phone,
      badgeText: 'Titik Lokasi Pembeli',
    },
  ];

  const route: MapRouteData = {
    id: 'active-delivery-road-route',
    from: courierPosition,
    to: customer.coords,
    geometryPoints: roadRoute?.geometry, // Real street navigation polyline points
    color: '#2563eb',
    distanceKm,
    estimatedMinutes: etaMinutes,
    isRealRoadRoute: roadRoute?.isSuccess ?? false,
  };

  return (
    <Card className="overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-lg dark:border-zinc-800 dark:bg-zinc-900">
      {/* Header Info Pesanan, Status GPS & Tombol Ubah Lokasi */}
      <div className="border-b border-zinc-100 dark:border-zinc-800 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-zinc-50/70 dark:bg-zinc-950/40">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-mono font-bold text-zinc-500">{orderId}</span>
            <Badge className="bg-blue-600 text-white text-[10px] px-2 py-0.5 animate-pulse">
              Pengantaran Aktif
            </Badge>

            {/* GPS Status */}
            {isGpsActive ? (
              <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300 text-[10px] px-2 py-0.5 flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                <span>GPS Terhubung</span>
              </Badge>
            ) : (
              <Badge className="bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950 dark:text-amber-300 text-[10px] px-2 py-0.5 flex items-center gap-1">
                <AlertCircle className="h-3 w-3 text-amber-600" />
                <span>Mode Simulasi</span>
              </Badge>
            )}

            {/* Real Road Navigation Badge */}
            <Badge className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 text-[10px] px-2 py-0.5 flex items-center gap-1">
              <RouteIcon className="h-3 w-3 text-blue-600" />
              <span>Rute Jalan (OSRM)</span>
            </Badge>
          </div>

          <h3 className="text-base sm:text-lg font-extrabold text-zinc-900 dark:text-white">
            {seedName}
          </h3>
        </div>

        {/* Action Buttons & Summary Metrics */}
        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          {allowChangeCustomerLocation && (
            <ChangeCustomerLocationDialog
              currentCustomer={customer}
              onCustomerLocationChange={setCustomer}
            />
          )}

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleManualLocate}
            disabled={isLocating || isCalculatingRoute}
            className="h-9 px-3 rounded-xl border-blue-200 hover:bg-blue-50 text-blue-700 dark:border-blue-900 dark:text-blue-300 dark:hover:bg-blue-950/50 text-xs font-semibold cursor-pointer shadow-xs"
          >
            {isLocating || isCalculatingRoute ? (
              <div className="flex items-center gap-1.5">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>{isLocating ? 'Cari GPS...' : 'Hitung Rute...'}</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                <Locate className="h-3.5 w-3.5" />
                <span>GPS Saya</span>
              </div>
            )}
          </Button>

          {/* Metric Badge Card */}
          <div className="flex items-center gap-2.5 bg-white dark:bg-zinc-900 px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-xs">
            <div className="flex items-center gap-1.5 text-xs">
              <Clock className="h-3.5 w-3.5 text-blue-600 shrink-0" />
              <div>
                <span className="text-[9px] text-zinc-400 block leading-none">ETA</span>
                <strong className="text-zinc-800 dark:text-zinc-200 font-bold text-xs">
                  {etaMinutes} mnt
                </strong>
              </div>
            </div>

            <div className="h-4 w-px bg-zinc-200 dark:bg-zinc-800" />

            <div className="flex items-center gap-1.5 text-xs">
              <Navigation className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
              <div>
                <span className="text-[9px] text-zinc-400 block leading-none">Jarak</span>
                <strong className="text-zinc-800 dark:text-zinc-200 font-bold text-xs">
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

      {/* Interactive Leaflet Map Component with Real Road Polyline Navigation */}
      <div className="p-3 sm:p-4">
        <LeafletMap
          center={courierPosition}
          zoom={13}
          markers={markers}
          route={route}
          height="420px"
          className="rounded-2xl"
        />
      </div>

      {/* Footer Courier & Customer Destination Coordinates Info */}
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
                  Titik Kurir (Asal Rute)
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

        {/* Info Lokasi Pembeli / Customer with Edit Button */}
        <div className="flex items-center justify-between p-3.5 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/40">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-10 w-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs shrink-0">
              <Sprout className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-[10px] text-emerald-700 dark:text-emerald-300 font-semibold block">
                Titik Pembeli (Tujuan Lahan)
              </span>
              <strong className="text-xs sm:text-sm text-zinc-900 dark:text-white block truncate">
                {customer.name}
              </strong>
              <span className="font-mono text-[11px] text-emerald-700 dark:text-emerald-400 font-semibold block">
                {customer.coords[0].toFixed(6)}, {customer.coords[1].toFixed(6)}
              </span>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate mt-0.5">
                {customer.address}
              </p>
            </div>
          </div>

          {allowChangeCustomerLocation && (
            <ChangeCustomerLocationDialog
              currentCustomer={customer}
              onCustomerLocationChange={setCustomer}
              trigger={
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-9 w-9 rounded-xl border-emerald-300 text-emerald-800 hover:bg-emerald-100 dark:border-emerald-800 dark:text-emerald-300 dark:hover:bg-emerald-950 shrink-0 ml-2 cursor-pointer shadow-xs"
                  title="Ubah Lokasi Pembeli"
                >
                  <MapPin className="h-4 w-4 text-emerald-600" />
                </Button>
              }
            />
          )}
        </div>
      </div>
    </Card>
  );
}
