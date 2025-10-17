import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ShoppingListUIItem } from '@/stores/shoppingListStore';
import { notifyInfo, notifyWarning } from '@/lib/notifications';
import { searchProducts, type BuscaPreciosProduct } from '../services/buscaPreciosService';

const REFRESH_TTL_MS = 30 * 60 * 1000; // 30 minutes
const FETCH_DELAY_MS = 200; // small delay between sequential fetches

export type ItemPriceStatus = 'idle' | 'loading' | 'success' | 'error';

export interface ItemPriceSnapshot {
  status: ItemPriceStatus;
  products: BuscaPreciosProduct[];
  bestPrice: number | null;
  bestStore: string | null;
  lastUpdated: number | null;
  error: string | null;
}

const createIdleSnapshot = (): ItemPriceSnapshot => ({
  status: 'idle',
  products: [],
  bestPrice: null,
  bestStore: null,
  lastUpdated: null,
  error: null,
});

interface UseBuscapreciosPricingResult {
  priceByItemId: Record<string, ItemPriceSnapshot>;
  refreshAll: () => void;
  refreshItem: (itemId: string) => Promise<void>;
  isRefreshing: boolean;
  lastRefreshAt: number | null;
}

export const useBuscapreciosPricing = (items: ShoppingListUIItem[]): UseBuscapreciosPricingResult => {
  const [priceByItemId, setPriceByItemId] = useState<Record<string, ItemPriceSnapshot>>({});
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshAt, setLastRefreshAt] = useState<number | null>(null);
  const [refreshNonce, setRefreshNonce] = useState(0);

  const priceRef = useRef(priceByItemId);
  const shouldForceRef = useRef(false);
  const inFlightRef = useRef(new Map<string, Promise<void>>());

  useEffect(() => {
    priceRef.current = priceByItemId;
  }, [priceByItemId]);

  const upsertSnapshot = useCallback((itemId: string, next: ItemPriceSnapshot) => {
    setPriceByItemId((prev) => {
      if (prev[itemId] === next) return prev;
      return { ...prev, [itemId]: next };
    });
  }, []);

  const updateSnapshot = useCallback((itemId: string, updater: (prev: ItemPriceSnapshot) => ItemPriceSnapshot) => {
    setPriceByItemId((prev) => {
      const prevSnapshot = prev[itemId] ?? createIdleSnapshot();
      const nextSnapshot = updater(prevSnapshot);
      if (prevSnapshot === nextSnapshot) return prev;
      return { ...prev, [itemId]: nextSnapshot };
    });
  }, []);

  const shouldRefreshItem = useCallback(
    (itemId: string, force: boolean) => {
      if (force) return true;
      const snapshot = priceRef.current[itemId];
      if (!snapshot) return true;
      if (snapshot.status === 'loading') return false;
      if (!snapshot.lastUpdated) return true;
      return Date.now() - snapshot.lastUpdated > REFRESH_TTL_MS;
    },
    []
  );

  const fetchForItem = useCallback(
    async (item: ShoppingListUIItem, force = false) => {
      const trimmedName = item.name.trim();
      if (!trimmedName || item.is_purchased) return;

      if (!shouldRefreshItem(item.id, force)) return;

      const existingPromise = inFlightRef.current.get(item.id);
      if (existingPromise) {
        if (force) {
          await existingPromise;
        }
        return;
      }

      const task = (async () => {
        updateSnapshot(item.id, (prev) => ({
          ...prev,
          status: 'loading',
          error: null,
        }));

        try {
          const result = await searchProducts(trimmedName, force);
          if (result.error) {
            const message = result.originalError instanceof Error ? result.originalError.message : String(result.originalError);
            updateSnapshot(item.id, (prev) => ({
              ...prev,
              status: 'error',
              error: message,
              lastUpdated: Date.now(),
            }));
          } else {
            const products = result.products;
            const bestProduct = products[0] ?? null;
            updateSnapshot(item.id, () => ({
              status: 'success',
              products,
              bestPrice: bestProduct?.precio ?? null,
              bestStore: bestProduct?.tienda ?? null,
              lastUpdated: Date.now(),
              error: null,
            }));
          }
        } catch (error) {
          console.error('[useBuscapreciosPricing] searchProducts failed', error);
          const message = error instanceof Error ? error.message : 'Fallo desconocido al buscar precios';
          updateSnapshot(item.id, (prev) => ({
            ...prev,
            status: 'error',
            error: message,
            lastUpdated: Date.now(),
          }));
        }
      })().finally(() => {
        inFlightRef.current.delete(item.id);
      });

      inFlightRef.current.set(item.id, task);
      await task;
    },
    [shouldRefreshItem, updateSnapshot]
  );

  const itemsSignature = useMemo(
    () => items.map((item) => `${item.id}:${item.name}:${item.updated_at ?? ''}:${item.is_purchased ? '1' : '0'}`).join('|'),
    [items]
  );

  useEffect(() => {
    if (!items.length) {
      setIsRefreshing(false);
      return;
    }

    let cancelled = false;
    const force = shouldForceRef.current;
    shouldForceRef.current = false;

    const run = async () => {
      setIsRefreshing(true);
      let fetchedAny = false;

      for (const item of items) {
        if (cancelled) break;
        await fetchForItem(item, force);
        fetchedAny = true;
        if (!cancelled && fetchedAny) {
          await new Promise((resolve) => setTimeout(resolve, FETCH_DELAY_MS));
        }
      }

      if (!cancelled) {
        setIsRefreshing(false);
        setLastRefreshAt(Date.now());
        if (force && fetchedAny) {
          notifyInfo('Precios actualizados con BuscaPrecios.');
        }
      }
    };

    run().catch((error) => {
      console.error('[useBuscapreciosPricing] batch update failed', error);
      if (!cancelled) {
        setIsRefreshing(false);
        notifyWarning('No pudimos terminar de actualizar todos los precios. Podés reintentar manualmente.');
      }
    });

    return () => {
      cancelled = true;
    };
  }, [itemsSignature, fetchForItem, refreshNonce]);

  const refreshAll = useCallback(() => {
    if (!items.length) return;
    shouldForceRef.current = true;
    setRefreshNonce((value) => value + 1);
  }, [items.length]);

  const refreshItem = useCallback(
    async (itemId: string) => {
      const target = items.find((item) => item.id === itemId);
      if (!target) return;
      await fetchForItem(target, true);
    },
    [items, fetchForItem]
  );

  return {
    priceByItemId,
    refreshAll,
    refreshItem,
    isRefreshing,
    lastRefreshAt,
  };
};

export default useBuscapreciosPricing;
