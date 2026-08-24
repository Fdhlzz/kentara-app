export interface LocationSearchResult {
  id: string;
  name: string;
  displayName: string;
  lat: number;
  lng: number;
  type?: string;
  district?: string;
  city?: string;
  province?: string;
}

/**
 * Daftar lokasi sentra pertanian & kota populer di Indonesia untuk saran cepat
 */
export const POPULAR_AGRI_LOCATIONS: LocationSearchResult[] = [
  {
    id: 'pop-1',
    name: 'Tamalanrea, Makassar',
    displayName: 'Kecamatan Tamalanrea, Kota Makassar, Sulawesi Selatan',
    lat: -5.1379367,
    lng: 119.4357388,
    city: 'Makassar',
    province: 'Sulawesi Selatan',
  },
  {
    id: 'pop-2',
    name: 'Bontomarannu, Gowa',
    displayName: 'Sentra Hortikultura & Pertanian Bontomarannu, Kabupaten Gowa, Sulawesi Selatan',
    lat: -5.2285,
    lng: 119.5312,
    city: 'Gowa',
    province: 'Sulawesi Selatan',
  },
  {
    id: 'pop-3',
    name: 'Bantimurung, Maros',
    displayName: 'Lahan Padi Sawah Bantimurung, Kabupaten Maros, Sulawesi Selatan',
    lat: -5.0124,
    lng: 119.6158,
    city: 'Maros',
    province: 'Sulawesi Selatan',
  },
  {
    id: 'pop-4',
    name: 'Karangploso, Malang',
    displayName: 'Sentra Sayuran & Pembibitan Karangploso, Kabupaten Malang, Jawa Timur',
    lat: -7.8864,
    lng: 112.6021,
    city: 'Malang',
    province: 'Jawa Timur',
  },
  {
    id: 'pop-5',
    name: 'Rengasdengklok, Karawang',
    displayName: 'Sentra Lumbung Padi Nasional Rengasdengklok, Kabupaten Karawang, Jawa Barat',
    lat: -6.1594,
    lng: 107.2978,
    city: 'Karawang',
    province: 'Jawa Barat',
  },
  {
    id: 'pop-6',
    name: 'Gisting, Tanggamus',
    displayName: 'Sentra Hortikultura & Palawija Gisting, Kabupaten Tanggamus, Lampung',
    lat: -5.4418,
    lng: 104.7214,
    city: 'Tanggamus',
    province: 'Lampung',
  },
];

const geocodeCache = new Map<string, LocationSearchResult[]>();

/**
 * Mencari nama tempat / alamat di Indonesia menggunakan Nominatim Geocoding dengan cache
 */
export async function searchPlacesInIndonesia(
  query: string
): Promise<LocationSearchResult[]> {
  const trimmed = query.trim();
  if (!trimmed || trimmed.length < 2) {
    return POPULAR_AGRI_LOCATIONS;
  }

  const cacheKey = trimmed.toLowerCase();
  if (geocodeCache.has(cacheKey)) {
    return geocodeCache.get(cacheKey)!;
  }

  try {
    const encoded = encodeURIComponent(trimmed);
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encoded}&countrycodes=id&limit=8&addressdetails=1`;

    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Kentara-Agricultural-App/1.0 (info@kentara.com)',
        'Accept-Language': 'id,en-US;q=0.8,en;q=0.5',
      },
      signal: AbortSignal.timeout(5000),
    });

    if (!res.ok) {
      throw new Error(`Nominatim HTTP ${res.status}`);
    }

    const data = await res.json();
    if (!Array.isArray(data) || data.length === 0) {
      // Filter from popular locations if online search yields no matches
      const localMatches = POPULAR_AGRI_LOCATIONS.filter(
        (loc) =>
          loc.name.toLowerCase().includes(cacheKey) ||
          loc.displayName.toLowerCase().includes(cacheKey)
      );
      return localMatches;
    }

    const results: LocationSearchResult[] = data.map((item: {
      place_id: number;
      name?: string;
      display_name: string;
      lat: string;
      lon: string;
      type?: string;
      address?: {
        city?: string;
        town?: string;
        municipality?: string;
        state?: string;
        county?: string;
      };
    }) => {
      const city =
        item.address?.city ||
        item.address?.town ||
        item.address?.municipality ||
        item.address?.county ||
        '';
      const province = item.address?.state || '';
      const name = item.name || item.display_name.split(',')[0] || trimmed;

      return {
        id: String(item.place_id),
        name,
        displayName: item.display_name,
        lat: parseFloat(item.lat),
        lng: parseFloat(item.lon),
        type: item.type,
        city,
        province,
      };
    });

    // Simpan ke cache (maksimal 100 queries)
    if (geocodeCache.size >= 100) {
      const firstKey = geocodeCache.keys().next().value;
      if (firstKey) geocodeCache.delete(firstKey);
    }
    geocodeCache.set(cacheKey, results);

    return results;
  } catch (err) {
    console.warn('[Geocoding Search Error]:', err);
    return POPULAR_AGRI_LOCATIONS.filter(
      (loc) =>
        loc.name.toLowerCase().includes(cacheKey) ||
        loc.displayName.toLowerCase().includes(cacheKey)
    );
  }
}
