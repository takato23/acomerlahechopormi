import { create } from 'zustand';
import {
  getShoppingListItems,
  addShoppingListItem,
  updateShoppingListItem,
  deleteShoppingListItem,
  clearPurchasedItems,
  clearAllItems,
  type AddShoppingListItemInput
} from '@/features/shopping-list/shoppingListService';
import type { Database } from '@/lib/database.types';
import { handleError } from '@/lib/errorHandler';

type DBShoppingListRow = Database['public']['Tables']['shopping_list_items']['Row'];
type DBShoppingListUpdate = Database['public']['Tables']['shopping_list_items']['Update'];

export interface ShoppingListUIItem {
  id: string;
  user_id: string;
  name: string;
  quantity: number | null;
  unit: string | null;
  is_purchased: boolean;
  created_at: string | null;
  updated_at: string | null;
  notes?: string | null;
  category_id?: string | null;
  category_label?: string | null;
  ingredient_id?: string | null;
  ingredient_name?: string | null;
}

interface ShoppingListState {
  items: ShoppingListUIItem[];
  isLoading: boolean;
  error: string | null;
  fetchItems: () => Promise<void>;
  addItem: (input: AddShoppingListItemInput) => Promise<ShoppingListUIItem | null>;
  updateItem: (itemId: string, updates: DBShoppingListUpdate) => Promise<ShoppingListUIItem | null>;
  deleteItem: (itemId: string) => Promise<boolean>;
  clearPurchased: () => Promise<boolean>;
  clearAll: () => Promise<boolean>;
}

function mapDbToUi(item: DBShoppingListRow): ShoppingListUIItem {
  return {
    id: item.id,
    user_id: item.user_id,
    name: item.name,
    quantity: item.quantity ?? null,
    unit: item.unit ?? null,
    is_purchased: item.is_purchased ?? false,
    created_at: item.created_at ?? null,
    updated_at: item.updated_at ?? null,
    notes: item.notes ?? null,
    category_id: item.category_id ?? null,
    category_label: item.category_label ?? null,
    ingredient_id: item.ingredient_id ?? null,
    ingredient_name: item.ingredient_name ?? null
  };
}

export const useShoppingListStore = create<ShoppingListState>((set, get) => ({
  items: [],
  isLoading: false,
  error: null,

  fetchItems: async () => {
    if (get().isLoading) return;
    set({ isLoading: true, error: null });
    try {
      const items = await getShoppingListItems();
      set({
        items: items.map(mapDbToUi),
        isLoading: false,
        error: null
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No se pudo cargar la lista de compras.';
      handleError(error, {
        component: 'shoppingListStore',
        action: 'fetchItems',
        severity: 'low'
      });
      set({ error: message, isLoading: false });
    }
  },

  addItem: async (input) => {
    try {
      const created = await addShoppingListItem(input);
      if (!created) return null;
      const mapped = mapDbToUi(created);
      set((state) => ({
        items: [...state.items, mapped].sort((a, b) => {
          if (a.is_purchased !== b.is_purchased) {
            return a.is_purchased ? 1 : -1;
          }
          const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
          const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
          return dateA - dateB;
        })
      }));
      return mapped;
    } catch (error) {
      handleError(error, {
        component: 'shoppingListStore',
        action: 'addItem',
        severity: 'low'
      });
      return null;
    }
  },

  updateItem: async (itemId, updates) => {
    const previousItems = get().items;
    set((state) => ({
      items: state.items
        .map((item) =>
          item.id === itemId
            ? {
                ...item,
                ...updates,
                quantity: updates.quantity ?? item.quantity,
                unit: updates.unit ?? item.unit,
                name: updates.name ?? item.name,
                is_purchased: updates.is_purchased ?? item.is_purchased
              }
            : item
        )
        .sort((a, b) => {
          if (a.is_purchased !== b.is_purchased) {
            return a.is_purchased ? 1 : -1;
          }
          const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
          const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
          return dateA - dateB;
        })
    }));

    try {
      const updated = await updateShoppingListItem(itemId, updates);
      return updated ? mapDbToUi(updated) : null;
    } catch (error) {
      handleError(error, {
        component: 'shoppingListStore',
        action: 'updateItem',
        severity: 'low',
        metadata: { itemId }
      });
      set({ items: previousItems });
      return null;
    }
  },

  deleteItem: async (itemId) => {
    const previousItems = get().items;
    set((state) => ({
      items: state.items.filter((item) => item.id !== itemId)
    }));

    try {
      await deleteShoppingListItem(itemId);
      return true;
    } catch (error) {
      handleError(error, {
        component: 'shoppingListStore',
        action: 'deleteItem',
        severity: 'low',
        metadata: { itemId }
      });
      set({ items: previousItems });
      return false;
    }
  },

  clearPurchased: async () => {
    const previousItems = get().items;
    const remaining = previousItems.filter((item) => !item.is_purchased);
    set({ items: remaining });

    try {
      await clearPurchasedItems();
      return true;
    } catch (error) {
      handleError(error, {
        component: 'shoppingListStore',
        action: 'clearPurchased',
        severity: 'low'
      });
      set({ items: previousItems });
      return false;
    }
  },

  clearAll: async () => {
    const previousItems = get().items;
    set({ items: [] });

    try {
      await clearAllItems();
      return true;
    } catch (error) {
      handleError(error, {
        component: 'shoppingListStore',
        action: 'clearAll',
        severity: 'low'
      });
      set({ items: previousItems });
      return false;
    }
  }
}));
