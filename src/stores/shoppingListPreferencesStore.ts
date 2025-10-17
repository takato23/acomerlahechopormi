import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export const ANONYMOUS_USER_KEY = '__anonymous__';

export type ShoppingListViewMode = 'flat' | 'grouped';

export interface ShoppingListFilters {
  searchTerm: string;
  categoryId: string | null;
  showPurchased: boolean;
}

export interface UserShoppingListPreferences {
  manualOrder: string[];
  viewMode: ShoppingListViewMode;
  filters: ShoppingListFilters;
}

interface ShoppingListPreferencesState {
  preferencesByUser: Record<string, UserShoppingListPreferences>;
  getPreferences: (userId?: string | null) => UserShoppingListPreferences;
  setViewMode: (userId: string | null, viewMode: ShoppingListViewMode) => void;
  updateManualOrder: (userId: string | null, manualOrder: string[]) => void;
  setFilters: (userId: string | null, updates: Partial<ShoppingListFilters>) => void;
  resetManualOrder: (userId: string | null) => void;
  ensureOrderContains: (userId: string | null, ids: string[]) => void;
}

export const DEFAULT_PREFERENCES: UserShoppingListPreferences = {
  manualOrder: [],
  viewMode: 'flat',
  filters: {
    searchTerm: '',
    categoryId: null,
    showPurchased: false,
  },
};

const clonePreferences = (prefs: UserShoppingListPreferences): UserShoppingListPreferences => ({
  manualOrder: [...prefs.manualOrder],
  viewMode: prefs.viewMode,
  filters: { ...prefs.filters },
});

const getStorage = (): Storage => {
  if (typeof window === 'undefined') {
    return {
      getItem: () => null,
      setItem: () => undefined,
      removeItem: () => undefined,
      length: 0,
      clear: () => undefined,
      key: () => null,
    } as Storage;
  }
  return window.localStorage;
};

const normalizeUserId = (userId?: string | null) => userId ?? ANONYMOUS_USER_KEY;

export const useShoppingListPreferencesStore = create<ShoppingListPreferencesState>()(
  persist(
    (set, get) => ({
      preferencesByUser: {},

      getPreferences: (userId) => {
        const key = normalizeUserId(userId);
        const stored = get().preferencesByUser[key];
        if (stored) return clonePreferences(stored);
        const fresh = clonePreferences(DEFAULT_PREFERENCES);
        set((state) => ({
          preferencesByUser: {
            ...state.preferencesByUser,
            [key]: fresh,
          },
        }));
        return fresh;
      },

      setViewMode: (userId, viewMode) => {
        const key = normalizeUserId(userId);
        set((state) => ({
          preferencesByUser: {
            ...state.preferencesByUser,
            [key]: {
              ...(state.preferencesByUser[key]
                ? clonePreferences(state.preferencesByUser[key])
                : clonePreferences(DEFAULT_PREFERENCES)),
              viewMode,
            },
          },
        }));
      },

      updateManualOrder: (userId, manualOrder) => {
        const key = normalizeUserId(userId);
        set((state) => ({
          preferencesByUser: {
            ...state.preferencesByUser,
            [key]: {
              ...(state.preferencesByUser[key]
                ? clonePreferences(state.preferencesByUser[key])
                : clonePreferences(DEFAULT_PREFERENCES)),
              manualOrder,
            },
          },
        }));
      },

      setFilters: (userId, updates) => {
        const key = normalizeUserId(userId);
        set((state) => {
          const base = state.preferencesByUser[key]
            ? clonePreferences(state.preferencesByUser[key])
            : clonePreferences(DEFAULT_PREFERENCES);
          return {
            preferencesByUser: {
              ...state.preferencesByUser,
              [key]: {
                ...base,
                filters: {
                  ...base.filters,
                  ...updates,
                },
              },
            },
          };
        });
      },

      resetManualOrder: (userId) => {
        const key = normalizeUserId(userId);
        set((state) => ({
          preferencesByUser: {
            ...state.preferencesByUser,
            [key]: {
              ...(state.preferencesByUser[key]
                ? clonePreferences(state.preferencesByUser[key])
                : clonePreferences(DEFAULT_PREFERENCES)),
              manualOrder: [],
            },
          },
        }));
      },

      ensureOrderContains: (userId, ids) => {
        const key = normalizeUserId(userId);
        const current = get().preferencesByUser[key]
          ? clonePreferences(get().preferencesByUser[key])
          : clonePreferences(DEFAULT_PREFERENCES);
        const existing = new Set(current.manualOrder);
        let changed = false;

        const sanitizedOrder = current.manualOrder.filter((id) => ids.includes(id));
        if (sanitizedOrder.length !== current.manualOrder.length) {
          changed = true;
        }

        ids.forEach((id) => {
          if (!existing.has(id)) {
            sanitizedOrder.push(id);
            existing.add(id);
            changed = true;
          }
        });

        if (!changed) return;

        set((state) => ({
          preferencesByUser: {
            ...state.preferencesByUser,
            [key]: {
              ...(state.preferencesByUser[key]
                ? clonePreferences(state.preferencesByUser[key])
                : clonePreferences(DEFAULT_PREFERENCES)),
              manualOrder: sanitizedOrder,
            },
          },
        }));
      },
    }),
    {
      name: 'shopping-list-preferences',
      storage: createJSONStorage(getStorage),
      version: 1,
    }
  )
);
