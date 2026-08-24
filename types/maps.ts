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
  color?: string;
  dashArray?: string;
  distanceKm?: number;
  estimatedMinutes?: number;
}

export type TileLayerProvider = 'osm' | 'voyager' | 'satellite';
