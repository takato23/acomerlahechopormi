import { create } from 'zustand';
import { differenceInCalendarDays, parseISO, startOfDay } from 'date-fns';
import { toast } from 'sonner';
import {
  getPantryItems as getItemsService,
  addPantryItem as addItemService,
  updatePantryItem as updateItemService,
  deletePantryItem as deleteItemService,
  toggleFavoritePantryItem,
  fetchLowStockItems as fetchLowStockItemsService,
} from '../features/pantry/services/pantryService';
import type { PantryItem, CreatePantryItemData, UpdatePantryItemData } from '../features/pantry/types';

type PantryAlertTag = 'expired' | 'near-expiry' | 'low-stock';

interface PantryState {
  items: PantryItem[];
  lowStockItems: PantryItem[];
  isLoading: boolean;
  isLoadingLowStock: boolean;
  error: string | null;
  errorLowStock: string | null;
  alertTags: Record<string, PantryAlertTag[]>;
  autoFilters: PantryAlertTag[];
  fetchItems: () => Promise<void>;
  fetchLowStockItems: (threshold?: number) => Promise<void>;
  addItem: (itemData: CreatePantryItemData) => Promise<PantryItem | null>;
  updateItem: (itemId: string, updates: UpdatePantryItemData) => Promise<PantryItem | null>;
  deleteItem: (itemId: string) => Promise<boolean>;
  toggleFavorite: (itemId: string) => Promise<void>;
  clearAutoFilters: () => void;
}

const NEAR_EXPIRY_THRESHOLD_DAYS = 3;
const ALERT_PRIORITY: PantryAlertTag[] = ['expired', 'near-expiry', 'low-stock'];
const alertHistory = new Set<string>();

type ExpiryInfo = { status: Extract<PantryAlertTag, 'expired' | 'near-expiry'>; diff: number } | null;

interface ItemAlertAnalysis {
  tags: PantryAlertTag[];
  expiryInfo: ExpiryInfo;
}

const safeParseDate = (value: string): Date | null => {
  try {
    const parsed = parseISO(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  } catch (error) {
    console.warn('[pantryStore] Unable to parse date', value, error);
    return null;
  }
};

const getItemName = (item: PantryItem) => item.ingredient?.name ?? 'Este producto';

const analyzeItemAlerts = (item: PantryItem): ItemAlertAnalysis => {
  const tags: PantryAlertTag[] = [];
  let expiryInfo: ExpiryInfo = null;

  if (item.expiry_date) {
    const parsedDate = safeParseDate(item.expiry_date);
    if (parsedDate) {
      const today = startOfDay(new Date());
      const diff = differenceInCalendarDays(parsedDate, today);
      if (diff < 0) {
        tags.push('expired');
        expiryInfo = { status: 'expired', diff };
      } else if (diff <= NEAR_EXPIRY_THRESHOLD_DAYS) {
        tags.push('near-expiry');
        expiryInfo = { status: 'near-expiry', diff };
      }
    }
  }

  const minStock = item.min_stock ?? null;
  if (minStock !== null) {
    const quantity = typeof item.quantity === 'number' ? item.quantity : Number(item.quantity ?? 0);
    if (Number.isFinite(quantity) && quantity <= minStock) {
      tags.push('low-stock');
    }
  }

  return { tags, expiryInfo };
};

const emitAlerts = (item: PantryItem, analysis: ItemAlertAnalysis, activeKeys: Set<string>) => {
  const name = getItemName(item);
  analysis.tags.forEach((tag) => {
    const key = `${item.id}:${tag}`;
    activeKeys.add(key);
    if (alertHistory.has(key)) {
      return;
    }

    if (tag === 'expired') {
      const description = item.expiry_date ? `Caducó el ${item.expiry_date}.` : undefined;
      toast.error(`${name} está vencido.`, { description });
    } else if (tag === 'near-expiry') {
      const days = analysis.expiryInfo ? analysis.expiryInfo.diff : 0;
      const description =
        days === 0 ? 'Caduca hoy.' : `Caduca en ${days} día${days === 1 ? '' : 's'}.`;
      toast.warning(`${name} caducará pronto.`, { description });
    } else if (tag === 'low-stock') {
      const quantityText = typeof item.quantity === 'number' ? item.quantity : Number(item.quantity ?? 0);
      const description = `Stock actual: ${Number.isFinite(quantityText) ? quantityText : '0'}${
        item.unit ? ` ${item.unit}` : ''
      }.`;
      toast.warning(`${name} está por debajo del stock mínimo.`, { description });
    }

    alertHistory.add(key);
  });
};

const calculateAlerts = (items: PantryItem[]) => {
  const alertTags: Record<string, PantryAlertTag[]> = {};
  const activeKeys = new Set<string>();
  const activeFilters = new Set<PantryAlertTag>();

  items.forEach((item) => {
    const analysis = analyzeItemAlerts(item);
    if (analysis.tags.length > 0) {
      alertTags[item.id] = analysis.tags;
      analysis.tags.forEach((tag) => activeFilters.add(tag));
      emitAlerts(item, analysis, activeKeys);
    }
  });

  Array.from(alertHistory).forEach((key) => {
    if (!activeKeys.has(key)) {
      alertHistory.delete(key);
    }
  });

  const autoFilters = ALERT_PRIORITY.filter((tag) => activeFilters.has(tag));
  return { alertTags, autoFilters };
};

export const usePantryStore = create<PantryState>((set, get) => ({
  items: [],
  lowStockItems: [],
  isLoading: false,
  isLoadingLowStock: false,
  error: null,
  errorLowStock: null,
  alertTags: {},
  autoFilters: [],

  clearAutoFilters: () => set({ autoFilters: [] }),

  fetchItems: async () => {
    if (get().isLoading) return;
    set({ isLoading: true, error: null });
    try {
      const items = await getItemsService();
      const { alertTags, autoFilters } = calculateAlerts(items);
      set({ items, isLoading: false, alertTags, autoFilters });
    } catch (error) {
      console.error('Error fetching pantry items for store:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Error desconocido al cargar despensa.';
      set({ error: errorMessage, isLoading: false, alertTags: {}, autoFilters: [] });
    }
  },

  fetchLowStockItems: async (threshold = 2) => {
    if (get().isLoadingLowStock) return;
    set({ isLoadingLowStock: true, errorLowStock: null });
    try {
      const lowStockItems = await fetchLowStockItemsService(threshold);
      set({ lowStockItems, isLoadingLowStock: false });
    } catch (error) {
      console.error('Error fetching low stock items:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Error desconocido al cargar items bajos de stock.';
      set({ errorLowStock: errorMessage, isLoadingLowStock: false });
    }
  },

  addItem: async (itemData: CreatePantryItemData) => {
    try {
      const newItem = await addItemService(itemData);
      if (!newItem) throw new Error('Failed to add item');
      set((state) => {
        const items = [newItem, ...state.items].sort(
          (a, b) => new Date(b.created_at ?? 0).getTime() - new Date(a.created_at ?? 0).getTime(),
        );
        const { alertTags, autoFilters } = calculateAlerts(items);
        return { items, alertTags, autoFilters };
      });
      return newItem;
    } catch (error) {
      console.error('Error adding pantry item via store:', error);
      return null;
    }
  },

  updateItem: async (itemId: string, updates: UpdatePantryItemData) => {
    const originalItems = get().items;
    const itemIndex = originalItems.findIndex((i) => i.id === itemId);
    if (itemIndex === -1) return null;

    set((state) => {
      const items = state.items.map((i) => (i.id === itemId ? { ...i, ...updates } : i));
      const { alertTags, autoFilters } = calculateAlerts(items);
      return { items, alertTags, autoFilters };
    });

    try {
      const updatedItem = await updateItemService(itemId, updates);
      if (!updatedItem) throw new Error('Update failed on server');
      set((state) => {
        const items = state.items.map((i) => (i.id === itemId ? updatedItem : i));
        const { alertTags, autoFilters } = calculateAlerts(items);
        return { items, alertTags, autoFilters };
      });
      return updatedItem;
    } catch (error) {
      console.error('Error updating pantry item via store:', error);
      const { alertTags, autoFilters } = calculateAlerts(originalItems);
      set({ items: originalItems, alertTags, autoFilters });
      return null;
    }
  },

  deleteItem: async (itemId: string) => {
    const originalItems = get().items;
    set((state) => {
      const items = state.items.filter((i) => i.id !== itemId);
      const { alertTags, autoFilters } = calculateAlerts(items);
      return { items, alertTags, autoFilters };
    });
    try {
      await deleteItemService(itemId);
      return true;
    } catch (error) {
      console.error('Error deleting pantry item via store:', error);
      const { alertTags, autoFilters } = calculateAlerts(originalItems);
      set({ items: originalItems, alertTags, autoFilters });
      return false;
    }
  },

  toggleFavorite: async (itemId: string) => {
    const originalItems = get().items;
    const itemIndex = originalItems.findIndex((i) => i.id === itemId);
    if (itemIndex === -1) {
      console.error(`[toggleFavorite] Item with ID ${itemId} not found in store.`);
      return;
    }

    const currentItem = originalItems[itemIndex];
    const currentState = Boolean(currentItem.is_favorite);
    const newState = !currentState;

    set((state) => {
      const items = state.items.map((i) =>
        i.id === itemId ? { ...i, is_favorite: newState } : i,
      );
      const { alertTags, autoFilters } = calculateAlerts(items);
      return { items, alertTags, autoFilters };
    });

    try {
      const updatedItem = await toggleFavoritePantryItem(itemId, newState);
      if (!updatedItem) {
        throw new Error('Toggle favorite failed on server or item not found.');
      }
      console.log(`[toggleFavorite] Successfully toggled favorite for ${itemId} to ${newState}`);
      set((state) => {
        const items = state.items.map((i) => (i.id === itemId ? updatedItem : i));
        const { alertTags, autoFilters } = calculateAlerts(items);
        return { items, alertTags, autoFilters };
      });
    } catch (error) {
      console.error('Error toggling favorite via store:', error);
      const { alertTags, autoFilters } = calculateAlerts(originalItems);
      set({ items: originalItems, alertTags, autoFilters });
    }
  },
}));
