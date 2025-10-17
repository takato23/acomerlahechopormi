import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { GeoPoint } from '@/lib/geo';
import { haversineDistance, isWithinRadius } from '@/lib/geo';
import { preciosClarosService, type Store } from '../services/preciosClarosService';

const DEFAULT_FETCH_LIMIT = 60;

export interface NearbyStore extends Store {
  distanceKm: number;
  position: [number, number];
}

interface UseNearbyStoresOptions {
  limit?: number;
  autoFetch?: boolean;
}

interface UseNearbyStoresResult {
  stores: NearbyStore[];
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  lastFetchedAt: number | null;
  totalFetched: number;
}

const normalizeStore = (store: Store, center: GeoPoint): NearbyStore | null => {
  if (typeof store.lat !== 'number' || typeof store.lng !== 'number') {
    return null;
  }

  const position: [number, number] = [store.lat, store.lng];
  const distanceKm = Number.isFinite(store.distanciaNumero)
    ? Number(store.distanciaNumero)
    : haversineDistance(center, { lat: store.lat, lng: store.lng });

  return {
    ...store,
    position,
    distanceKm: Number(distanceKm.toFixed(2)),
  };
};

export const useNearbyStores = (
  center: GeoPoint | null,
  radiusKm: number,
  { limit = DEFAULT_FETCH_LIMIT, autoFetch = true }: UseNearbyStoresOptions = {}
): UseNearbyStoresResult => {
  const [rawStores, setRawStores] = useState<NearbyStore[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastFetchedAt, setLastFetchedAt] = useState<number | null>(null);
  const centerRef = useRef<GeoPoint | null>(center);

  centerRef.current = center;

  const fetchStores = useCallback(async () => {
    const currentCenter = centerRef.current;

    if (!currentCenter) {
      setRawStores([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const stores = await preciosClarosService.getStoresNearby(currentCenter.lat, currentCenter.lng, limit);
      const normalized = stores
        .map((store) => normalizeStore(store, currentCenter))
        .filter((store): store is NearbyStore => Boolean(store));

      setRawStores(normalized);
      setLastFetchedAt(Date.now());
    } catch (err) {
      console.error('[useNearbyStores] getStoresNearby failed', err);
      setError('No se pudieron obtener tiendas cercanas.');
      setRawStores([]);
    } finally {
      setIsLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    if (!autoFetch) return;
    fetchStores().catch((err) => console.error('[useNearbyStores] fetchStores effect failed', err));
  }, [fetchStores, autoFetch, center?.lat, center?.lng]);

  const stores = useMemo(() => {
    if (!centerRef.current) return [];
    return rawStores
      .map((store) => ({
        ...store,
        distanceKm: Number(
          (store.distanciaNumero && Number.isFinite(store.distanciaNumero)
            ? store.distanciaNumero
            : haversineDistance(centerRef.current!, { lat: store.lat, lng: store.lng })
          ).toFixed(2)
        ),
      }))
      .filter((store) => isWithinRadius(centerRef.current!, { lat: store.lat, lng: store.lng }, radiusKm))
      .sort((a, b) => a.distanceKm - b.distanceKm);
  }, [rawStores, radiusKm]);

  return {
    stores,
    isLoading,
    error,
    refresh: fetchStores,
    lastFetchedAt,
    totalFetched: rawStores.length,
  };
};
