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
    name: 'Malino, Gowa (Sentra Benih Kentang)',
    displayName: 'Kecamatan Tinggimoncong, Malino, Kabupaten Gowa, Sulawesi Selatan',
    lat: -5.2536,
    lng: 119.8557,
    city: 'Gowa',
    province: 'Sulawesi Selatan',
  },
  {
    id: 'pop-2',
    name: 'Tamalanrea, Makassar (Sentra Distribusi)',
    displayName: 'Kecamatan Tamalanrea, Kota Makassar, Sulawesi Selatan',
    lat: -5.1379367,
    lng: 119.4357388,
    city: 'Makassar',
    province: 'Sulawesi Selatan',
  },
  {
    id: 'pop-3',
    name: 'Enrekang (Sentra Hortikultura)',
    displayName: 'Sentra Sayuran Dataran Tinggi, Kabupaten Enrekang, Sulawesi Selatan',
    lat: -3.5628,
    lng: 119.7745,
    city: 'Enrekang',
    province: 'Sulawesi Selatan',
  },
  {
    id: 'pop-4',
    name: 'Bantimurung, Maros',
    displayName: 'Lahan Padi Sawah & Hortikultura Bantimurung, Kabupaten Maros, Sulawesi Selatan',
    lat: -5.0124,
    lng: 119.6158,
    city: 'Maros',
    province: 'Sulawesi Selatan',
  },
  {
    id: 'pop-5',
    name: 'Rantepao, Toraja Utara',
    displayName: 'Sentra Pertanian Dataran Tinggi Rantepao, Kabupaten Toraja Utara, Sulawesi Selatan',
    lat: -2.9712,
    lng: 119.8986,
    city: 'Toraja Utara',
    province: 'Sulawesi Selatan',
  },
  {
    id: 'pop-6',
    name: 'Watampone, Bone',
    displayName: 'Sentra Pertanian Padi & Jagung Watampone, Kabupaten Bone, Sulawesi Selatan',
    lat: -4.5387,
    lng: 120.3276,
    city: 'Bone',
    province: 'Sulawesi Selatan',
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
