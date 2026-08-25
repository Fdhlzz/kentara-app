'use client';

import { useState, useEffect } from 'react';
import { MapPin, CheckCircle2, Locate, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { LeafletMap } from '@/components/maps/leaflet-map';
import { DEFAULT_MAP_CENTER } from '@/lib/maps/leaflet-helpers';
import { toast } from 'sonner';
import type { MapMarkerData } from '@/types/maps';

export interface LocationPickerProps {
  initialCoords?: [number, number];
  coords?: { lat: number; lng: number } | null;
  onCoordsChange?: (coords: { lat: number; lng: number }) => void;
  label?: string;
  hint?: string;
  height?: string;
  className?: string;
  showGetLocationButton?: boolean;
}

export function LocationPicker({
  initialCoords = DEFAULT_MAP_CENTER,
  coords: controlledCoords,
  onCoordsChange,
  label = 'Titik Pinpoint Lokasi Pengiriman',
  hint = 'Ketuk peta atau geser pin untuk menentukan titik pengantaran benih.',
  height = '240px',
  className = '',
  showGetLocationButton = true,
}: LocationPickerProps) {
  const [internalCoords, setInternalCoords] = useState<{ lat: number; lng: number }>({
    lat: controlledCoords?.lat ?? initialCoords[0],
    lng: controlledCoords?.lng ?? initialCoords[1],
  });
  const [isLocating, setIsLocating] = useState(false);

  // Sync if controlled coords change from parent
  useEffect(() => {
    if (controlledCoords && typeof controlledCoords.lat === 'number' && typeof controlledCoords.lng === 'number') {
      setInternalCoords(controlledCoords);
    }
  }, [controlledCoords?.lat, controlledCoords?.lng]);

  const activeCoords = controlledCoords || internalCoords;

  const handleLocationSelect = (coords: { lat: number; lng: number }) => {
    setInternalCoords(coords);
    onCoordsChange?.(coords);
  };

  const handleGetCurrentLocation = () => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      toast.error('Browser Anda tidak mendukung geolokasi GPS.');
      return;
    }

    setIsLocating(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        const newCoords = { lat: latitude, lng: longitude };
        setInternalCoords(newCoords);
        onCoordsChange?.(newCoords);
        setIsLocating(false);

        toast.success('Titik lokasi Anda berhasil dideteksi!', {
          description: `Akurasi ±${Math.round(accuracy)}m (${latitude.toFixed(5)}, ${longitude.toFixed(5)})`,
        });
      },
      (error) => {
        setIsLocating(false);
        let errorMsg = 'Gagal mendeteksi lokasi saat ini.';
        if (error.code === error.PERMISSION_DENIED) {
          errorMsg = 'Izin lokasi ditolak. Silakan izinkan akses lokasi di browser atau tentukan pin manual di peta.';
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          errorMsg = 'Sinyal GPS atau informasi lokasi tidak tersedia.';
        } else if (error.code === error.TIMEOUT) {
          errorMsg = 'Pencarian lokasi GPS melebihi batas waktu (timeout). Silakan coba lagi.';
        }
        toast.error(errorMsg);
      },
      {
        enableHighAccuracy: true,
        timeout: 12000,
        maximumAge: 0,
      }
    );
  };

  const markers: MapMarkerData[] = [
    {
      id: 'picked-customer-location',
      position: [activeCoords.lat, activeCoords.lng],
      title: 'Titik Pengiriman Anda',
      description: `Lat: ${activeCoords.lat.toFixed(5)}, Lng: ${activeCoords.lng.toFixed(5)}`,
      type: 'pin',
      badgeText: 'Lokasi Terpilih',
    },
  ];

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
        <div>
          <label className="text-xs font-bold text-zinc-900 dark:text-white flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>{label}</span>
          </label>
          {hint && <p className="text-[11px] text-zinc-500 dark:text-zinc-400">{hint}</p>}
        </div>

        {/* Selected Coordinates Badge */}
        <div className="flex items-center gap-1.5 self-start sm:self-auto">
          <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800 font-mono text-[10px] sm:text-[11px] px-2 py-0.5 flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
            <span>
              {activeCoords.lat.toFixed(5)}, {activeCoords.lng.toFixed(5)}
            </span>
          </Badge>
        </div>
      </div>

      {/* Get Current Location Action Button */}
      {showGetLocationButton && (
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleGetCurrentLocation}
            disabled={isLocating}
            className="w-full h-9 rounded-xl border-dashed border-emerald-500/60 bg-emerald-50/50 hover:bg-emerald-100/70 dark:bg-emerald-950/30 dark:hover:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer"
          >
            {isLocating ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin text-emerald-600 dark:text-emerald-400" />
                <span>Mendeteksi Lokasi GPS Anda...</span>
              </>
            ) : (
              <>
                <Locate className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Gunakan Lokasi Saya Saat Ini</span>
              </>
            )}
          </Button>
        </div>
      )}

      {/* Leaflet Picker Map Container */}
      <div className="rounded-2xl border border-zinc-200 dark:border-zinc-700 overflow-hidden shadow-xs">
        <LeafletMap
          center={[activeCoords.lat, activeCoords.lng]}
          zoom={14}
          markers={markers}
          isPickerMode={true}
          onLocationSelect={handleLocationSelect}
          height={height}
          className="w-full"
        />
      </div>
    </div>
  );
}
