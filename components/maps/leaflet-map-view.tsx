'use client';

import { useEffect, useRef } from 'react';
import type * as L from 'leaflet';
import { Navigation } from 'lucide-react';
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
  height = '100%',
  className = '',
}: LeafletMapViewProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const markerGroupRef = useRef<L.LayerGroup | null>(null);
  const routeLayerRef = useRef<L.Polyline | null>(null);
  const pickerMarkerRef = useRef<L.Marker | null>(null);

  // Always use bright, high-visibility daylight road map (Voyager)
  const activeTile: TileLayerProvider = 'voyager';

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
        zoomControl: false, // Clean UI without zoom clutter
        attributionControl: false, // Clean map without bottom attribution text clutter
      });

      // Tile Layer (Always bright Voyager clean road map)
      const provider = TILE_PROVIDERS[activeTile];
      const tileLayer = L.tileLayer(provider.url, {
        attribution: '',
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

  // Update Center / Zoom
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;
    map.setView(center, zoom ?? map.getZoom());
    if (isPickerMode && pickerMarkerRef.current) {
      pickerMarkerRef.current.setLatLng(center);
    }
  }, [center, zoom, isPickerMode]);

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

        // Clean, High-Contrast Popup Content
        const popupContent = `
          <div style="padding: 10px 12px; font-family: system-ui, -apple-system, sans-serif; min-width: 170px; background: #ffffff; color: #09090b; border-radius: 12px;">
            <div style="font-weight: 800; font-size: 13px; margin-bottom: 2px; color: #09090b;">
              ${m.title}
            </div>
            ${m.badgeText ? `<div style="display: inline-block; font-size: 10px; font-weight: 700; padding: 2px 6px; border-radius: 6px; background: #ecfdf5; color: #047857; margin-bottom: 4px;">${m.badgeText}</div>` : ''}
            ${m.description ? `<div style="font-size: 11px; color: #71717a; margin-bottom: 4px; line-height: 1.3;">${m.description}</div>` : ''}
            ${m.phone ? `<div style="font-size: 11px; color: #2563eb; font-weight: 700;">📞 ${m.phone}</div>` : ''}
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
        const polylinePoints =
          route.geometryPoints && route.geometryPoints.length > 0
            ? route.geometryPoints
            : [route.from, route.to];

        const polyline = L.polyline(polylinePoints, {
          color: route.color || '#2563eb',
          weight: 5,
          opacity: 0.9,
          lineJoin: 'round',
          lineCap: 'round',
          dashArray: route.dashArray || undefined,
        }).addTo(map);

        routeLayerRef.current = polyline;

        // Auto-fit bounds with padding
        const bounds = L.latLngBounds(polylinePoints);
        map.fitBounds(bounds, { padding: [60, 60], maxZoom: 15 });
      }
    });
  }, [route]);

  return (
    <div
      className={`relative overflow-hidden w-full h-full bg-zinc-100 dark:bg-zinc-900 ${className}`}
      style={{ height }}
    >
      {/* Map Target Container (Edge-to-edge) */}
      <div ref={mapContainerRef} className="h-full w-full z-0" />

      {/* Picker Mode Instruction Hint */}
      {isPickerMode && (
        <div className="absolute bottom-3 left-3 z-30 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md px-3 py-2 rounded-xl shadow-md border border-emerald-500/30 text-xs font-semibold text-emerald-800 dark:text-emerald-400 flex items-center gap-2">
          <Navigation className="h-3.5 w-3.5 text-emerald-600 animate-pulse" />
          <span>Ketuk peta untuk menentukan titik lokasi</span>
        </div>
      )}
    </div>
  );
}
