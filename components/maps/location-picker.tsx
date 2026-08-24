'use client';

import { useState } from 'react';
import { MapPin, CheckCircle2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { LeafletMap } from '@/components/maps/leaflet-map';
import { DEFAULT_MAP_CENTER } from '@/lib/maps/leaflet-helpers';
import type { MapMarkerData } from '@/types/maps';

export interface LocationPickerProps {
  initialCoords?: [number, number];
  onCoordsChange?: (coords: { lat: number; lng: number }) => void;
  label?: string;
  hint?: string;
}

export function LocationPicker({
  initialCoords = DEFAULT_MAP_CENTER,
  onCoordsChange,
  label = 'Pilih Titik Lokasi Lahan / Pengiriman',
  hint = 'Ketuk atau geser pin pada peta untuk menentukan koordinat lokasi secara presisi.',
}: LocationPickerProps) {
  const [selectedCoords, setSelectedCoords] = useState<{ lat: number; lng: number }>({
    lat: initialCoords[0],
    lng: initialCoords[1],
  });

  const handleLocationSelect = (coords: { lat: number; lng: number }) => {
    setSelectedCoords(coords);
    onCoordsChange?.(coords);
  };

  const markers: MapMarkerData[] = [
    {
      id: 'picked-location',
      position: [selectedCoords.lat, selectedCoords.lng],
      title: 'Titik Lokasi Terpilih',
      description: `Latitude: ${selectedCoords.lat.toFixed(6)}, Longitude: ${selectedCoords.lng.toFixed(6)}`,
      type: 'pin',
      badgeText: 'Koordinat Aktif',
    },
  ];

  return (
    <div className="space-y-2.5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
        <div>
          <label className="text-xs font-bold text-zinc-900 dark:text-white flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5 text-emerald-600" />
            <span>{label}</span>
          </label>
          {hint && <p className="text-[11px] text-zinc-500 dark:text-zinc-400">{hint}</p>}
        </div>

        {/* Selected Coordinates Badge */}
        <div className="flex items-center gap-1.5 self-start sm:self-auto">
          <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 font-mono text-[11px] px-2.5 py-1 flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3 text-emerald-600" />
            <span>
              {selectedCoords.lat.toFixed(5)}, {selectedCoords.lng.toFixed(5)}
            </span>
          </Badge>
        </div>
      </div>

      {/* Leaflet Picker Map */}
      <LeafletMap
        center={[selectedCoords.lat, selectedCoords.lng]}
        zoom={14}
        markers={markers}
        isPickerMode={true}
        onLocationSelect={handleLocationSelect}
        height="280px"
        className="rounded-2xl border border-zinc-300 dark:border-zinc-700 shadow-xs"
      />
    </div>
  );
}
