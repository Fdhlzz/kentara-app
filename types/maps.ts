export type MarkerType = 'courier' | 'farm' | 'warehouse' | 'pin';

export interface MapCoordinates {
  lat: number;
  lng: number;
}

export interface MapMarkerData {
  id: string;
  position: [number, number]; // [lat, lng]
  title: string;
  description?: string;
  type?: MarkerType;
  phone?: string;
  badgeText?: string;
  avatarLetter?: string;
}

export interface MapRouteData {
  id: string;
  from: [number, number];
  to: [number, number];
  geometryPoints?: [number, number][]; // Real road polyline points [lat, lng][]
  color?: string;
  dashArray?: string;
  distanceKm?: number;
  estimatedMinutes?: number;
  isRealRoadRoute?: boolean;
}

export type TileLayerProvider = 'osm' | 'voyager' | 'dark' | 'satellite';

export interface CourierLocationInput {
  order_id?: string | null;
  latitude: number;
  longitude: number;
  heading?: number | null;
  speed?: number | null;
  accuracy?: number | null;
  is_active?: boolean;
}

export interface CourierLocationRecord {
  id: string;
  courier_id: string;
  order_id?: string | null;
  latitude: number;
  longitude: number;
  heading?: number | null;
  speed?: number | null;
  accuracy?: number | null;
  is_active: boolean;
  updated_at: string;
}
