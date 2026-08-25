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

const geocodeCache = new Map<string, LocationSearchResult[]>();

/**
 * Mencari nama tempat / alamat di Indonesia menggunakan Nominatim Geocoding dengan cache
 */
export async function searchPlacesInIndonesia(
  query: string
): Promise<LocationSearchResult[]> {
  const trimmed = query.trim();
  if (!trimmed || trimmed.length < 2) {
    return [];
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
      return [];
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
    return [];
  }
}
