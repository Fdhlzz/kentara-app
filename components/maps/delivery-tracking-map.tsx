'use client';

import { Truck, Sprout, Phone, Clock, Navigation } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LeafletMap } from '@/components/maps/leaflet-map';
import { calculateDistanceKm } from '@/lib/maps/leaflet-helpers';
import type { MapMarkerData, MapRouteData } from '@/types/maps';

export interface DeliveryTrackingMapProps {
  orderId?: string;
  seedName?: string;
  courierName?: string;
  courierPhone?: string;
  courierCoords?: [number, number];
  farmerName?: string;
  farmerAddress?: string;
  farmerCoords?: [number, number];
  warehouseCoords?: [number, number];
}

export function DeliveryTrackingMap({
  orderId = 'ORD-KNT-2026-088',
  seedName = 'Benih Padi Ciherang Unggul (5 Kg)',
  courierName = 'Bambang Supriyanto',
  courierPhone = '081234567890',
  courierCoords = [-7.265, 112.748],
  farmerName = 'Kelompok Tani Makmur (Bpk. Subardi)',
  farmerAddress = 'Jl. Raya Pertanian No. 45, Karangploso, Malang',
  farmerCoords = [-7.288, 112.782],
  warehouseCoords = [-7.242, 112.732],
}: DeliveryTrackingMapProps) {
  const distanceKm = calculateDistanceKm(
    courierCoords[0],
    courierCoords[1],
    farmerCoords[0],
    farmerCoords[1]
  );

  // Perkiraan waktu pengantaran (rata-rata 30 km/jam di rute pedesaan/suburban)
  const etaMinutes = Math.max(10, Math.round((distanceKm / 30) * 60));

  const markers: MapMarkerData[] = [
    {
      id: 'warehouse',
      position: warehouseCoords,
      title: 'Gudang Benih Kentara Pusat',
      description: 'Pusat Distribusi & Quality Control Benih Bersertifikat',
      type: 'warehouse',
      badgeText: 'Pusat Distribusi',
    },
    {
      id: 'courier',
      position: courierCoords,
      title: `Kurir: ${courierName}`,
      description: 'Sedang dalam perjalanan menuju lokasi lahan pertanian',
      type: 'courier',
      phone: courierPhone,
      badgeText: 'Armada Pengiriman',
    },
    {
      id: 'farmer',
      position: farmerCoords,
      title: farmerName,
      description: farmerAddress,
      type: 'farm',
      badgeText: 'Titik Tujuan Lahan',
    },
  ];

  const route: MapRouteData = {
    id: 'active-delivery-route',
    from: courierCoords,
    to: farmerCoords,
    color: '#2563eb',
    dashArray: '8, 8',
    distanceKm,
    estimatedMinutes: etaMinutes,
  };

  return (
    <Card className="overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-lg dark:border-zinc-800 dark:bg-zinc-900">
      {/* Header Info Pesanan */}
      <div className="border-b border-zinc-100 dark:border-zinc-800 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-zinc-50/70 dark:bg-zinc-950/40">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold text-zinc-500">{orderId}</span>
            <Badge className="bg-blue-600 text-white text-[10px] px-2 py-0.5 animate-pulse">
              Sedang Dikirim
            </Badge>
          </div>
          <h3 className="text-base sm:text-lg font-extrabold text-zinc-900 dark:text-white">
            {seedName}
          </h3>
        </div>

        {/* ETA & Jarak Card */}
        <div className="flex items-center gap-3 bg-white dark:bg-zinc-900 p-2.5 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xs self-start sm:self-auto">
          <div className="flex items-center gap-2 text-xs">
            <Clock className="h-4 w-4 text-blue-600 shrink-0" />
            <div>
              <span className="text-[10px] text-zinc-400 block leading-none">Estimasi Tiba</span>
              <strong className="text-zinc-800 dark:text-zinc-200 font-bold">
                {etaMinutes} Menit
              </strong>
            </div>
          </div>

          <div className="h-6 w-px bg-zinc-200 dark:bg-zinc-800" />

          <div className="flex items-center gap-2 text-xs">
            <Navigation className="h-4 w-4 text-emerald-600 shrink-0" />
            <div>
              <span className="text-[10px] text-zinc-400 block leading-none">Sisa Jarak</span>
              <strong className="text-zinc-800 dark:text-zinc-200 font-bold">
                {distanceKm} Km
              </strong>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Map Component */}
      <div className="p-3 sm:p-4">
        <LeafletMap
          center={courierCoords}
          zoom={13}
          markers={markers}
          route={route}
          height="360px"
          className="rounded-2xl"
        />
      </div>

      {/* Footer Courier & Destination Info */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 sm:p-5 pt-1 border-t border-zinc-100 dark:border-zinc-800">
        {/* Info Kurir */}
        <div className="flex items-center justify-between p-3.5 rounded-2xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/40">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
              <Truck className="h-5 w-5" />
            </div>
            <div>
              <span className="text-[10px] text-blue-700 dark:text-blue-300 font-semibold block">
                Kurir Logistik
              </span>
              <strong className="text-xs sm:text-sm text-zinc-900 dark:text-white">
                {courierName}
              </strong>
            </div>
          </div>

          {courierPhone && (
            <a
              href={`tel:${courierPhone}`}
              className="inline-flex items-center justify-center gap-1 h-9 px-3 rounded-xl text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/50 text-xs font-semibold transition"
            >
              <Phone className="h-3.5 w-3.5 mr-1" />
              <span>Hubungi</span>
            </a>
          )}
        </div>

        {/* Info Tujuan Petani */}
        <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/40">
          <div className="h-10 w-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs shrink-0">
            <Sprout className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] text-emerald-700 dark:text-emerald-300 font-semibold block">
              Tujuan Pengiriman Benih
            </span>
            <strong className="text-xs sm:text-sm text-zinc-900 dark:text-white block truncate">
              {farmerName}
            </strong>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate">
              {farmerAddress}
            </p>
          </div>
        </div>
      </div>
    </Card>
  );
}
