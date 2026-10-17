'use client';

import { useEffect, useRef, useState } from 'react';
import 'leaflet/dist/leaflet.css';
import { Button } from '@/components/ui/Button';
import { apiRequest, ApiClientError } from '@/lib/client/api';

const TILE_URL = process.env.NEXT_PUBLIC_MAP_TILE_URL ?? 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
const ATTRIBUTION = process.env.NEXT_PUBLIC_MAP_ATTRIBUTION ?? '© OpenStreetMap contributors';
const NIGERIA_CENTRE: [number, number] = [9.082, 8.6753];

interface GeoResult {
  label: string;
  latitude: number;
  longitude: number;
}

interface Props {
  latitude: string;
  longitude: string;
  onChange: (next: { latitude: string; longitude: string; formattedAddress?: string }) => void;
  disabled?: boolean;
  errorLatitude?: string;
  errorLongitude?: string;
}

/**
 * Admin location picker.
 * - Search a place (Nigeria-restricted) through the server geocoding proxy.
 * - Click the map or drag the marker to refine the position; zoom with the map controls.
 * - Latitude and longitude inputs stay editable for keyboard and precise entry.
 * - Nothing is reported as "found" unless the geocoder returned a result.
 */
export function MapPicker({ latitude, longitude, onChange, disabled = false, errorLatitude, errorLongitude }: Props) {
  const mapEl = useRef<HTMLDivElement>(null);
  const mapRef = useRef<import('leaflet').Map | null>(null);
  const markerRef = useRef<import('leaflet').Marker | null>(null);
  const LRef = useRef<typeof import('leaflet') | null>(null);
  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<GeoResult[] | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [mapError, setMapError] = useState<string | null>(null);
  const [reverse, setReverse] = useState<GeoResult | null>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const latNum = Number(latitude);
  const lngNum = Number(longitude);
  const hasPoint = latitude !== '' && longitude !== '' && Number.isFinite(latNum) && Number.isFinite(lngNum) && latNum >= -90 && latNum <= 90 && lngNum >= -180 && lngNum <= 180;

  // Initialise the map once on the client.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const L = (await import('leaflet')).default;
      if (cancelled || !mapEl.current || mapRef.current) return;
      LRef.current = L as unknown as typeof import('leaflet');
      const map = L.map(mapEl.current, { scrollWheelZoom: true, zoomControl: true }).setView(NIGERIA_CENTRE, 6);
      const layer = L.tileLayer(TILE_URL, { attribution: ATTRIBUTION, maxZoom: 19 });
      let errs = 0;
      layer.on('tileerror', () => {
        errs++;
        if (errs > 4) setMapError('The map tiles could not be loaded. You can still enter coordinates manually below.');
      });
      layer.addTo(map);
      map.on('click', (e: import('leaflet').LeafletMouseEvent) => {
        placeMarker(e.latlng.lat, e.latlng.lng, true);
      });
      mapRef.current = map;
      if (hasPoint) placeMarker(latNum, lngNum, false, 16);
    })().catch(() => setMapError('The map could not be loaded. Enter the coordinates manually below.'));
    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep the marker in sync when coordinates are typed manually.
  useEffect(() => {
    if (!mapRef.current || !LRef.current) return;
    if (hasPoint) {
      const current = markerRef.current?.getLatLng();
      if (!current || Math.abs(current.lat - latNum) > 1e-7 || Math.abs(current.lng - lngNum) > 1e-7) {
        placeMarker(latNum, lngNum, false);
      }
    } else if (markerRef.current) {
      markerRef.current.remove();
      markerRef.current = null;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [latitude, longitude]);

  function placeMarker(lat: number, lng: number, fromUser: boolean, zoom?: number) {
    const map = mapRef.current;
    const L = LRef.current;
    if (!map || !L) return;
    const rounded = { lat: Number(lat.toFixed(6)), lng: Number(lng.toFixed(6)) };
    if (!markerRef.current) {
      const marker = L.marker([rounded.lat, rounded.lng], { draggable: !disabled, title: 'Property location. Drag to adjust.' });
      marker.on('dragend', () => {
        const p = marker.getLatLng();
        const next = { lat: Number(p.lat.toFixed(6)), lng: Number(p.lng.toFixed(6)) };
        onChangeRef.current({ latitude: String(next.lat), longitude: String(next.lng) });
        void reverseAt(next.lat, next.lng);
      });
      marker.addTo(map);
      markerRef.current = marker;
    } else {
      markerRef.current.setLatLng([rounded.lat, rounded.lng]);
    }
    if (zoom) map.setView([rounded.lat, rounded.lng], zoom);
    else if (fromUser) map.panTo([rounded.lat, rounded.lng]);
    if (fromUser) {
      onChangeRef.current({ latitude: String(rounded.lat), longitude: String(rounded.lng) });
      void reverseAt(rounded.lat, rounded.lng);
    }
  }

  async function reverseAt(lat: number, lng: number) {
    try {
      const data = await apiRequest<{ result: GeoResult | null }>(`/api/admin/geocode/reverse?lat=${lat}&lng=${lng}`);
      setReverse(data.result);
    } catch {
      setReverse(null);
    }
  }

  async function search(e?: React.FormEvent) {
    e?.preventDefault();
    if (query.trim().length < 3) {
      setSearchError('Enter at least 3 characters to search.');
      return;
    }
    setSearching(true);
    setSearchError(null);
    setResults(null);
    try {
      const data = await apiRequest<{ results: GeoResult[] }>(`/api/admin/geocode?q=${encodeURIComponent(query.trim())}`);
      setResults(data.results);
    } catch (err) {
      setSearchError(err instanceof ApiClientError ? err.message : 'Address search failed. Place the marker by hand.');
    } finally {
      setSearching(false);
    }
  }

  function chooseResult(r: GeoResult) {
    placeMarker(r.latitude, r.longitude, false, 16);
    onChange({ latitude: String(Number(r.latitude.toFixed(6))), longitude: String(Number(r.longitude.toFixed(6))), formattedAddress: r.label.slice(0, 400) });
    setResults(null);
  }

  function clear() {
    markerRef.current?.remove();
    markerRef.current = null;
    setReverse(null);
    onChange({ latitude: '', longitude: '' });
  }

  return (
    <fieldset disabled={disabled} className="space-y-4 rounded-lg border border-neutral-border bg-white p-4 md:p-5">
      <legend className="px-1 text-card text-brand-ink">Location on the map</legend>
      <p className="text-support text-neutral-muted">Search for a place in Nigeria, then click the map or drag the marker to the exact position. Coordinates are saved only when you save the listing.</p>

      <form onSubmit={search} role="search" aria-label="Search for a place" className="flex flex-col gap-3 sm:flex-row">
        <label htmlFor="map-search" className="sr-only">
          Search for an address or place
        </label>
        <input id="map-search" type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="e.g. Nasara Shopping Complex, Bauchi" className="input flex-1" maxLength={200} />
        <Button variant="secondary" type="submit" loading={searching} loadingLabel="Searching…">
          Search
        </Button>
      </form>

      {searchError && (
        <p role="alert" className="text-support text-danger">
          {searchError}
        </p>
      )}
      {results && results.length === 0 && (
        <p role="status" className="text-support text-neutral-text">
          No places matched that search. Try a nearby landmark or street, or place the marker on the map.
        </p>
      )}
      {results && results.length > 0 && (
        <ul className="divide-y divide-neutral-border rounded-md border border-neutral-border" aria-label="Search results">
          {results.map((r, i) => (
            <li key={`${r.latitude}-${r.longitude}-${i}`} className="flex flex-col gap-2 p-3 sm:flex-row sm:items-center sm:justify-between">
              <span className="text-support text-neutral-text">{r.label}</span>
              <Button variant="ghost" className="min-h-9 px-3" onClick={() => chooseResult(r)}>
                Use this place<span className="sr-only">: {r.label}</span>
              </Button>
            </li>
          ))}
        </ul>
      )}

      {mapError && (
        <p role="status" className="rounded-md bg-neutral-alt p-3 text-support text-warning">
          {mapError}
        </p>
      )}

      <div ref={mapEl} role="application" aria-label="Interactive map. Click to place the marker, drag it to refine, or use the zoom controls." className="h-80 w-full overflow-hidden rounded-md border border-neutral-border bg-neutral-alt md:h-[420px]" />

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="field-latitude" className="block text-support font-semibold text-brand-ink">
            Latitude
          </label>
          <input id="field-latitude" type="number" inputMode="decimal" step="0.000001" min={-90} max={90} value={latitude} onChange={(e) => onChange({ latitude: e.target.value, longitude })} className={`mt-1.5 input ${errorLatitude ? 'input-invalid' : ''}`} aria-invalid={!!errorLatitude || undefined} aria-describedby={errorLatitude ? 'field-latitude-error' : 'coord-help'} />
          {errorLatitude && <p id="field-latitude-error" className="mt-1.5 text-[0.8125rem] text-danger">{errorLatitude}</p>}
        </div>
        <div>
          <label htmlFor="field-longitude" className="block text-support font-semibold text-brand-ink">
            Longitude
          </label>
          <input id="field-longitude" type="number" inputMode="decimal" step="0.000001" min={-180} max={180} value={longitude} onChange={(e) => onChange({ latitude, longitude: e.target.value })} className={`mt-1.5 input ${errorLongitude ? 'input-invalid' : ''}`} aria-invalid={!!errorLongitude || undefined} aria-describedby={errorLongitude ? 'field-longitude-error' : 'coord-help'} />
          {errorLongitude && <p id="field-longitude-error" className="mt-1.5 text-[0.8125rem] text-danger">{errorLongitude}</p>}
        </div>
      </div>
      <p id="coord-help" className="text-[0.8125rem] text-neutral-muted">Latitude must be between -90 and 90. Longitude must be between -180 and 180.</p>

      <div className="flex flex-col gap-3 rounded-md bg-neutral-alt p-4 text-support text-neutral-text sm:flex-row sm:items-center sm:justify-between">
        <p>
          {hasPoint ? (
            <>
              Marker set at <span className="font-semibold">{latNum.toFixed(6)}, {lngNum.toFixed(6)}</span>.
            </>
          ) : (
            'No marker placed yet.'
          )}
          {reverse && (
            <span className="mt-1 block text-neutral-muted">Nearest address: {reverse.label}</span>
          )}
        </p>
        <div className="flex flex-wrap gap-2">
          {reverse && (
            <Button variant="secondary" className="min-h-9 px-3" onClick={() => onChange({ latitude, longitude, formattedAddress: reverse.label.slice(0, 400) })}>
              Use this as the formatted address
            </Button>
          )}
          {hasPoint && (
            <Button variant="ghost" className="min-h-9 px-3" onClick={clear}>
              Remove marker
            </Button>
          )}
        </div>
      </div>
    </fieldset>
  );
}
