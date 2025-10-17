import type { BuscaPreciosProduct } from '../services/buscaPreciosService';

export interface PriceHistoryPoint {
  price: number;
  timestamp: number;
  store?: string;
}

interface PriceHistoryStore {
  [productId: string]: PriceHistoryPoint[];
}

const STORAGE_KEY = 'shopping-list-price-history';
const MAX_POINTS_PER_PRODUCT = 30;
const DUPLICATE_THRESHOLD_MS = 60 * 60 * 1000; // 1 hora

const getStorage = (): Storage | null => {
  if (typeof window === 'undefined') return null;
  return window.localStorage;
};

const loadStore = (): PriceHistoryStore => {
  const storage = getStorage();
  if (!storage) return {};
  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as PriceHistoryStore;
    return parsed ?? {};
  } catch (error) {
    console.warn('No se pudo cargar el historial de precios desde localStorage.', error);
    return {};
  }
};

const saveStore = (store: PriceHistoryStore): void => {
  const storage = getStorage();
  if (!storage) return;
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch (error) {
    console.warn('No se pudo guardar el historial de precios.', error);
  }
};

let inMemoryStore: PriceHistoryStore | null = null;

const getStore = (): PriceHistoryStore => {
  if (!inMemoryStore) {
    inMemoryStore = loadStore();
  }
  return inMemoryStore;
};

export const recordPriceObservation = (product: BuscaPreciosProduct, observedAt = Date.now()): void => {
  if (!product.id || Number.isNaN(product.precio)) return;

  const store = getStore();
  const history = store[product.id] ?? [];
  const lastPoint = history[history.length - 1];

  if (lastPoint) {
    const isDuplicate = Math.abs(observedAt - lastPoint.timestamp) < DUPLICATE_THRESHOLD_MS;
    if (isDuplicate && Math.abs(lastPoint.price - product.precio) < 0.01) {
      return;
    }
  }

  const nextHistory = [...history, {
    price: product.precio,
    timestamp: observedAt,
    store: product.tienda,
  }];

  if (nextHistory.length > MAX_POINTS_PER_PRODUCT) {
    nextHistory.splice(0, nextHistory.length - MAX_POINTS_PER_PRODUCT);
  }

  store[product.id] = nextHistory;
  saveStore(store);
};

export const recordMultipleObservations = (products: BuscaPreciosProduct[], observedAt = Date.now()): void => {
  products.forEach((product) => recordPriceObservation(product, observedAt));
};

export const getPriceHistory = (productId: string): PriceHistoryPoint[] => {
  const store = getStore();
  return (store[productId] ?? []).slice();
};

export const clearPriceHistory = (productId?: string): void => {
  const store = getStore();
  if (productId) {
    delete store[productId];
  } else {
    inMemoryStore = {};
  }
  saveStore(store);
};
