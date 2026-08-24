'use client';

import { useEffect, useRef, useState } from 'react';
import type * as L from 'leaflet';
import {
  Locate,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  Loader2,
  Navigation,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DEFAULT_MAP_CENTER,
  DEFAULT_MAP_ZOOM,
  TILE_PROVIDERS,
  createCustomMarkerIcon,
} from '@/lib/maps/leaflet-helpers';
import type { MapMarkerData, MapRouteData, TileLayerProvider } from '@/types/maps';

export interface LeafletMapViewProps {
  center?: [number, number];
  zoom?: number;
  markers?: MapMarkerData[];
  route?: MapRouteData;
  isPickerMode?: boolean;
  onLocationSelect?: (coords: { lat: number; lng: number }) => void;
  height?: string;
  className?: string;
  showControls?: boolean;
  showTileSwitcher?: boolean;
}

export default function LeafletMapView({
  center = DEFAULT_MAP_CENTER,
  zoom = DEFAULT_MAP_ZOOM,
  markers = [],
  route,
  isPickerMode = false,
  onLocationSelect,
  height = '420px',
  className = '',
  showControls = true,
  showTileSwitcher = true,
}: LeafletMapViewProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const markerGroupRef = useRef<L.LayerGroup | null>(null);
  const routeLayerRef = useRef<L.Polyline | null>(null);
  const pickerMarkerRef = useRef<L.Marker | null>(null);

  const [activeTile, setActiveTile] = useState<TileLayerProvider>('voyager');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLocating, setIsLocating] = useState(false);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    let isMounted = true;

    // Dynamically import Leaflet in browser only
    import('leaflet').then((L) => {
      if (!isMounted || !mapContainerRef.current) return;

      const map = L.map(mapContainerRef.current, {
        center,
        zoom,
        zoomControl: false, // We use custom thumb-friendly mobile zoom controls
        attributionControl: true,
      });

      // Initial Tile Layer
      const provider = TILE_PROVIDERS[activeTile];
      const tileLayer = L.tileLayer(provider.url, {
        attribution: provider.attribution,
        maxZoom: provider.maxZoom,
      }).addTo(map);

      tileLayerRef.current = tileLayer;

      // Layer groups for markers & route
      const markerGroup = L.layerGroup().addTo(map);
      markerGroupRef.current = markerGroup;

      mapInstanceRef.current = map;

      // Picker Mode Click Listener
      if (isPickerMode) {
        map.on('click', (e: L.LeafletMouseEvent) => {
          const { lat, lng } = e.latlng;
          if (pickerMarkerRef.current) {
            pickerMarkerRef.current.setLatLng([lat, lng]);
          } else {
            const icon = createCustomMarkerIcon(L, 'pin', 'Lokasi Terpilih');
            const newPickerMarker = L.marker([lat, lng], {
              icon,
              draggable: true,
            }).addTo(map);

            newPickerMarker.on('dragend', (dragEvent) => {
              const marker = dragEvent.target as L.Marker;
              const pos = marker.getLatLng();
              onLocationSelect?.({ lat: pos.lat, lng: pos.lng });
            });

            pickerMarkerRef.current = newPickerMarker;
          }

          onLocationSelect?.({ lat, lng });
        });
      }
    });

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update Tile Layer when activeTile changes
  useEffect(() => {
    if (!mapInstanceRef.current || !tileLayerRef.current) return;

    import('leaflet').then((L) => {
      const map = mapInstanceRef.current;
      if (!map) return;

      if (tileLayerRef.current) {
        map.removeLayer(tileLayerRef.current);
      }

      const provider = TILE_PROVIDERS[activeTile];
      const newTileLayer = L.tileLayer(provider.url, {
        attribution: provider.attribution,
        maxZoom: provider.maxZoom,
      }).addTo(map);

      tileLayerRef.current = newTileLayer;
    });
  }, [activeTile]);

  // Update Markers
  useEffect(() => {
    if (!mapInstanceRef.current || !markerGroupRef.current) return;

    import('leaflet').then((L) => {
      const markerGroup = markerGroupRef.current;
      if (!markerGroup) return;

      markerGroup.clearLayers();

      markers.forEach((m) => {
        const icon = createCustomMarkerIcon(L, m.type || 'pin', m.title);
        const marker = L.marker(m.position, { icon });

        // Popup Content
        const popupContent = `
          <div style="padding: 12px; font-family: inherit; min-width: 180px;">
            <div style="font-weight: 700; font-size: 13px; color: #18181b; margin-bottom: 2px;">
              ${m.title}
            </div>
            ${m.badgeText ? `<div style="display: inline-block; font-size: 10px; font-weight: 600; padding: 2px 6px; border-radius: 4px; background: #ecfdf5; color: #047857; margin-bottom: 6px;">${m.badgeText}</div>` : ''}
            ${m.description ? `<div style="font-size: 11px; color: #71717a; margin-bottom: 6px;">${m.description}</div>` : ''}
            ${m.phone ? `<div style="font-size: 11px; color: #2563eb; font-weight: 600;">📞 ${m.phone}</div>` : ''}
          </div>
        `;

        marker.bindPopup(popupContent);
        marker.addTo(markerGroup);
      });
    });
  }, [markers]);

  // Update Route Polyline
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    import('leaflet').then((L) => {
      const map = mapInstanceRef.current;
      if (!map) return;

      if (routeLayerRef.current) {
        map.removeLayer(routeLayerRef.current);
        routeLayerRef.current = null;
      }

      if (route) {
        const polyline = L.polyline([route.from, route.to], {
          color: route.color || '#2563eb',
          weight: 4,
          opacity: 0.85,
          dashArray: route.dashArray || '6, 8',
        }).addTo(map);

        routeLayerRef.current = polyline;

        // Auto-fit bounds
        const bounds = L.latLngBounds([route.from, route.to]);
        map.fitBounds(bounds, { padding: [50, 50] });
      }
    });
  }, [route]);

  // Handle Zoom In/Out
  const handleZoomIn = () => mapInstanceRef.current?.zoomIn();
  const handleZoomOut = () => mapInstanceRef.current?.zoomOut();

  // Handle Geolocation (Find My Location)
  const handleFindMyLocation = () => {
    if (!navigator.geolocation || !mapInstanceRef.current) return;

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        const map = mapInstanceRef.current;
        if (!map) return;

        map.flyTo([latitude, longitude], 15, { duration: 1.5 });

        import('leaflet').then((L) => {
          if (pickerMarkerRef.current) {
            pickerMarkerRef.current.setLatLng([latitude, longitude]);
          } else if (isPickerMode) {
            const icon = createCustomMarkerIcon(L, 'pin', 'Lokasi Saya');
            const marker = L.marker([latitude, longitude], {
              icon,
              draggable: true,
            }).addTo(map);
            pickerMarkerRef.current = marker;
          }
        });

        onLocationSelect?.({ lat: latitude, lng: longitude });
        setIsLocating(false);
      },
      (err) => {
        console.warn('Geolocation failed:', err.message);
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900 shadow-sm ${
        isFullscreen ? 'fixed inset-0 z-50 rounded-none border-none h-screen!' : ''
      } ${className}`}
      style={{ height: isFullscreen ? '100vh' : height }}
    >
      {/* Map Target Container */}
      <div ref={mapContainerRef} className="h-full w-full z-0" />

      {/* Floating Controls Overlay */}
      {showControls && (
        <div className="absolute top-3 right-3 z-30 flex flex-col gap-2">
          {/* Tile Layer Switcher */}
          {showTileSwitcher && (
            <div className="flex bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md p-1 rounded-xl shadow-md border border-zinc-200 dark:border-zinc-800 gap-1 text-[11px] font-semibold">
              <button
                type="button"
                onClick={() => setActiveTile('voyager')}
                className={`px-2.5 py-1.5 rounded-lg transition cursor-pointer ${
                  activeTile === 'voyager'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                }`}
              >
                Peta
              </button>
              <button
                type="button"
                onClick={() => setActiveTile('satellite')}
                className={`px-2.5 py-1.5 rounded-lg transition cursor-pointer ${
                  activeTile === 'satellite'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                }`}
              >
                Satelit
              </button>
            </div>
          )}

          {/* Location & Zoom Actions */}
          <div className="flex flex-col bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md rounded-xl shadow-md border border-zinc-200 dark:border-zinc-800 overflow-hidden">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={handleFindMyLocation}
              title="Gunakan Lokasi GPS Saya"
              disabled={isLocating}
              className="h-10 w-10 text-zinc-700 dark:text-zinc-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 hover:text-emerald-600 rounded-none border-b border-zinc-200 dark:border-zinc-800 cursor-pointer"
            >
              {isLocating ? (
                <Loader2 className="h-4 w-4 animate-spin text-emerald-600" />
              ) : (
                <Locate className="h-4 w-4" />
              )}
            </Button>

            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={handleZoomIn}
              title="Perbesar Peta"
              className="h-10 w-10 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-none border-b border-zinc-200 dark:border-zinc-800 cursor-pointer"
            >
              <ZoomIn className="h-4 w-4" />
            </Button>

            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={handleZoomOut}
              title="Perkecil Peta"
              className="h-10 w-10 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-none cursor-pointer"
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
          </div>

          {/* Fullscreen Toggle */}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => setIsFullscreen(!isFullscreen)}
            title={isFullscreen ? 'Keluar Layar Penuh' : 'Layar Penuh'}
            className="h-10 w-10 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md rounded-xl shadow-md border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
          >
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </Button>
        </div>
      )}

      {/* Picker Hint Badge */}
      {isPickerMode && (
        <div className="absolute bottom-3 left-3 z-30 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md px-3 py-2 rounded-xl shadow-md border border-emerald-500/30 text-xs font-semibold text-emerald-800 dark:text-emerald-400 flex items-center gap-2">
          <Navigation className="h-3.5 w-3.5 text-emerald-600 animate-pulse" />
          <span>Ketuk peta untuk menentukan titik koordinat</span>
        </div>
      )}
    </div>
  );
}
