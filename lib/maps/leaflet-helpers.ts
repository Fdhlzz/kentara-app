import type * as L from 'leaflet';
import type { MarkerType, TileLayerProvider } from '@/types/maps';

/**
 * Tile Layer URLs & Attributions
 */
export const TILE_PROVIDERS: Record<
  TileLayerProvider,
  { url: string; attribution: string; maxZoom?: number }
> = {
  osm: {
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> kontributor',
    maxZoom: 19,
  },
  voyager: {
    url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
    maxZoom: 20,
  },
  satellite: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri &mdash; Sumber: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, dan Komunitas Pengguna GIS',
    maxZoom: 18,
  },
};

/**
 * Pusat koordinat default Indonesia / Sentra Pertanian
 */
export const DEFAULT_MAP_CENTER: [number, number] = [-7.250445, 112.768845]; // Surabaya / Jawa Timur
export const DEFAULT_MAP_ZOOM = 13;

/**
 * Menghitung jarak garis lurus antara dua titik koordinat (rumus Haversine) dalam Kilometer
 */
export function calculateDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Radius bumi dalam km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

export interface RoadRouteResult {
  geometry: [number, number][]; // Array titik koordinat jalan [lat, lng][]
  distanceKm: number;
  durationMinutes: number;
  isSuccess: boolean;
}

const routeCache = new Map<string, RoadRouteResult>();

/**
 * Mengambil geometri rute jalan asli (Real Road Routing) menggunakan OSRM Driving Engine
 * Dilengkapi in-memory caching untuk kecepatan instan (0ms) pada koordinat yang sama
 */
export async function fetchRealRoadRoute(
  from: [number, number],
  to: [number, number]
): Promise<RoadRouteResult> {
  const [lat1, lng1] = from;
  const [lat2, lng2] = to;

  // Cache key dibulatkan ke 4 desimal (~10 meter) untuk menghindari request berulang
  const cacheKey = `${lat1.toFixed(4)},${lng1.toFixed(4)}->${lat2.toFixed(4)},${lng2.toFixed(4)}`;
  if (routeCache.has(cacheKey)) {
    return routeCache.get(cacheKey)!;
  }

  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${lng1},${lat1};${lng2},${lat2}?overview=full&geometries=geojson`;
    const res = await fetch(url, { signal: AbortSignal.timeout(6000) });

    if (!res.ok) {
      throw new Error(`OSRM HTTP ${res.status}`);
    }

    const data = await res.json();
    if (data.code !== 'Ok' || !data.routes || data.routes.length === 0) {
      throw new Error('No road route found');
    }

    const route = data.routes[0];
    // OSRM coordinates are [lng, lat], convert to Leaflet's [lat, lng]
    const geometry: [number, number][] = route.geometry.coordinates.map(
      (c: [number, number]) => [c[1], c[0]]
    );

    const distanceKm = Math.round((route.distance / 1000) * 10) / 10;
    const durationMinutes = Math.max(1, Math.round(route.duration / 60));

    const result: RoadRouteResult = {
      geometry,
      distanceKm,
      durationMinutes,
      isSuccess: true,
    };

    // Simpan ke cache (maksimal 50 entri)
    if (routeCache.size >= 50) {
      const firstKey = routeCache.keys().next().value;
      if (firstKey) routeCache.delete(firstKey);
    }
    routeCache.set(cacheKey, result);

    return result;
  } catch (err) {
    console.warn('[Real Road Routing Fallback]:', err);
    // Fallback to straight line
    const distanceKm = calculateDistanceKm(lat1, lng1, lat2, lng2);
    const durationMinutes = Math.max(5, Math.round((distanceKm / 35) * 60));
    return {
      geometry: [from, to],
      distanceKm,
      durationMinutes,
      isSuccess: false,
    };
  }
}

/**
 * Membuat Custom DivIcon untuk Leaflet berdasarkan tipe marker
 */
export function createCustomMarkerIcon(
  leaflet: typeof L,
  type: MarkerType = 'pin',
  title?: string
): L.DivIcon {
  let iconSvg = '';
  let shadowColor = 'rgba(5, 150, 105, 0.4)';
  const labelAttr = title ? `title="${title}"` : '';

  switch (type) {
    case 'courier':
      shadowColor = 'rgba(37, 99, 235, 0.45)';
      iconSvg = `
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/>
          <path d="M15 18H9"/>
          <path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14"/>
          <circle cx="17" cy="18" r="2"/>
          <circle cx="7" cy="18" r="2"/>
        </svg>
      `;
      break;

    case 'farm':
      shadowColor = 'rgba(5, 150, 105, 0.45)';
      iconSvg = `
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M7 20h10"/>
          <path d="M10 20c5.5-2.5.8-6.4 3-10"/>
          <path d="M9.5 9.4c1.1.8 1.8 2.2 2.3 3.7-2 .4-3.5.4-4.8-.3-1.2-.6-2.3-1.9-3-4.2 2.8-.5 4.4 0 5.5.8z"/>
          <path d="M14.1 6a7 7 0 0 0-1.1 4c1.9-.1 3.3-.6 4.3-1.4 1-1 1.6-2.3 1.7-4.6-2.7.1-4 1-4.9 2z"/>
        </svg>
      `;
      break;

    case 'warehouse':
      shadowColor = 'rgba(147, 51, 234, 0.45)';
      iconSvg = `
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M22 8.35V20a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8.35A2 2 0 0 1 3.26 6.5l8-3.2a2 2 0 0 1 1.48 0l8 3.2A2 2 0 0 1 22 8.35Z"/>
          <path d="M6 18h12"/>
          <path d="M6 14h12"/>
        </svg>
      `;
      break;

    case 'pin':
    default:
      shadowColor = 'rgba(225, 29, 72, 0.45)';
      iconSvg = `
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/>
          <circle cx="12" cy="10" r="3"/>
        </svg>
      `;
      break;
  }

  const html = `
    <div class="kentara-pulsing-marker" style="width: 40px; height: 40px;" ${labelAttr}>
      <div style="
        width: 38px;
        height: 38px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 4px 14px 0 ${shadowColor};
        border: 2.5px solid white;
        background-color: ${type === 'courier' ? '#2563eb' : type === 'farm' ? '#059669' : type === 'warehouse' ? '#7c3aed' : '#e11d48'};
        color: white;
      ">
        ${iconSvg}
      </div>
    </div>
  `;

  return leaflet.divIcon({
    html,
    className: 'kentara-custom-marker',
    iconSize: [40, 40],
    iconAnchor: [20, 20],
    popupAnchor: [0, -22],
  });
}
