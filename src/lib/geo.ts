import { getEnv } from '@/lib/env';
import { ApiError } from '@/lib/http';

export interface GeoResult {
  label: string;
  latitude: number;
  longitude: number;
  type: string;
}

let lastCallAt = 0;

/**
 * Nominatim usage policy: at most one request per second, identify the application, and
 * cache results where possible. This in-process throttle serialises calls from this instance.
 */
async function throttle() {
  const wait = lastCallAt + 1100 - Date.now();
  if (wait > 0) await new Promise((r) => setTimeout(r, wait));
  lastCallAt = Date.now();
}

async function nominatim(path: string, params: Record<string, string>): Promise<unknown> {
  const env = getEnv();
  const url = new URL(path, env.NOMINATIM_BASE_URL);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  await throttle();
  let res: Response;
  try {
    res = await fetch(url, {
      headers: { 'User-Agent': env.NOMINATIM_USER_AGENT, Accept: 'application/json', 'Accept-Language': 'en' },
      signal: AbortSignal.timeout(8000),
      cache: 'no-store',
    });
  } catch {
    throw new ApiError(502, 'GEOCODER_UNAVAILABLE', 'Address search is unavailable right now. You can still place the marker by hand.');
  }
  if (!res.ok) {
    throw new ApiError(502, 'GEOCODER_UNAVAILABLE', 'Address search is unavailable right now. You can still place the marker by hand.');
  }
  return res.json();
}

/** Forward search restricted to Nigeria. Returns an empty array when nothing matches. */
export async function searchPlaces(query: string): Promise<GeoResult[]> {
  const data = (await nominatim('/search', {
    q: query,
    format: 'jsonv2',
    limit: '5',
    countrycodes: 'ng',
    addressdetails: '0',
  })) as Array<{ display_name: string; lat: string; lon: string; type?: string }>;
  return data
    .map((r) => ({ label: r.display_name, latitude: Number(r.lat), longitude: Number(r.lon), type: r.type ?? 'place' }))
    .filter((r) => Number.isFinite(r.latitude) && Number.isFinite(r.longitude));
}

export async function reverseLookup(lat: number, lng: number): Promise<GeoResult | null> {
  const data = (await nominatim('/reverse', { lat: String(lat), lon: String(lng), format: 'jsonv2', zoom: '18' })) as
    | { display_name?: string; lat?: string; lon?: string; type?: string; error?: string }
    | null;
  if (!data || data.error || !data.display_name) return null;
  return { label: data.display_name, latitude: Number(data.lat), longitude: Number(data.lon), type: data.type ?? 'place' };
}
