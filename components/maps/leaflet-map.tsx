'use client';

import dynamic from 'next/dynamic';
import { Loader2, MapPin } from 'lucide-react';
import type { LeafletMapViewProps } from './leaflet-map-view';

// Dynamic import with ssr: false to prevent Next.js SSR window is not defined error
const DynamicLeafletMapView = dynamic(() => import('./leaflet-map-view'), {
  ssr: false,
  loading: () => (
    <div className="flex flex-col items-center justify-center h-[380px] w-full rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 text-zinc-400 gap-3">
      <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 animate-pulse">
        <MapPin className="h-6 w-6" />
      </div>
      <div className="flex items-center gap-2 text-xs font-semibold text-zinc-500">
        <Loader2 className="h-4 w-4 animate-spin text-emerald-600" />
        <span>Memuat Peta Interaktif Leaflet...</span>
      </div>
    </div>
  ),
});

export function LeafletMap(props: LeafletMapViewProps) {
  return <DynamicLeafletMapView {...props} />;
}
