import { create } from 'zustand';

// Tipos base (deberían importarse de los models reales)
interface User { id: string; name: string; }
interface UserProfile { id: string; diet: string; restrictions: string[]; appliances: string[]; preferences: string[]; }
interface Recipe { id: string; title: string; ingredients: string[]; }
interface PantryItem { id: string; name: string; quantity: number; }
interface ShoppingItem { id: string; name: string; quantity: number; checked: boolean; }
interface PlannedMeal { id: string; date: string; mealType: string; recipeId: string; }

export type AppEventType =
  | 'recipeGenerated'
  | 'mealPlanned'
  | 'ingredientDepleted'
  | 'profileUpdated'
  | 'shoppingListUpdated';

export interface AppEvent {
  type: AppEventType;
  payload: any;
  timestamp: number;
}

interface AppState {
  user: User | null;
  profile: UserProfile | null;
  recipes: Recipe[];
  pantry: PantryItem[];
  shoppingList: ShoppingItem[];
  planning: PlannedMeal[];
  events: AppEvent[];
  addEvent: (event: AppEvent) => void;
  subscribeToEvent: (type: AppEventType, callback: (payload: any) => void) => void;
}

// Simple sistema de listeners en memoria
const listeners: { [K in AppEventType]?: Array<(payload: any) => void> } = {};

export const useAppStore = create<AppState>((set, get) => ({
  user: null,
  profile: null,
  recipes: [],
  pantry: [],
  shoppingList: [],
  planning: [],
  events: [],
  addEvent: (event) => {
    set((state) => ({ events: [...state.events, event] }));
    if (listeners[event.type]) {
      listeners[event.type]!.forEach(cb => cb(event.payload));
    }
  },
  subscribeToEvent: (type, callback) => {
    if (!listeners[type]) listeners[type] = [];
    listeners[type]!.push(callback);
  },
}));

// Ejemplo de uso:
// useAppStore.getState().addEvent({ type: 'recipeGenerated', payload: { ... }, timestamp: Date.now() });
// useAppStore.getState().subscribeToEvent('recipeGenerated', (payload) => { ... });
