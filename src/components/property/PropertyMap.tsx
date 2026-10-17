'use client';

import { useEffect, useRef, useState } from 'react';
import 'leaflet/dist/leaflet.css';

const TILE_URL = process.env.NEXT_PUBLIC_MAP_TILE_URL ?? 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
const ATTRIBUTION = process.env.NEXT_PUBLIC_MAP_ATTRIBUTION ?? '© OpenStreetMap contributors';

/**
 * Read-only map of a saved location (public detail page).
 * If the tile server cannot be reached, the map area is replaced by a text fallback and the
 * directions link keeps working, so the page never breaks because of the map provider.
 */
export function PropertyMap({ latitude, longitude, label }: { latitude: number; longitude: number; label: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [tilesFailed, setTilesFailed] = useState(false);

  useEffect(() => {
    let map: import('leaflet').Map | undefined;
    let cancelled = false;
    (async () => {
      const L = (await import('leaflet')).default;
      if (cancelled || !ref.current) return;
      map = L.map(ref.current, { scrollWheelZoom: false, attributionControl: true }).setView([latitude, longitude], 15);
      const layer = L.tileLayer(TILE_URL, { attribution: ATTRIBUTION, maxZoom: 19 });
      let errors = 0;
      layer.on('tileerror', () => {
        errors++;
        if (errors > 4) setTilesFailed(true);
      });
      layer.addTo(map);
      L.marker([latitude, longitude], { title: label, alt: label } as never).addTo(map).bindPopup(label);
    })().catch(() => setTilesFailed(true));
    return () => {
      cancelled = true;
      map?.remove();
    };
  }, [latitude, longitude, label]);

  return (
    <div className="relative">
      <div ref={ref} role="region" aria-label={`Map showing the location of ${label}`} className="h-72 w-full overflow-hidden rounded-lg border border-neutral-border bg-neutral-alt md:h-96" />
      {tilesFailed && (
        <p role="status" className="mt-2 text-support text-warning">
          The map tiles could not be loaded. Use the directions link below, or open the coordinates in your map app: {latitude.toFixed(5)}, {longitude.toFixed(5)}.
        </p>
      )}
    </div>
  );
}
