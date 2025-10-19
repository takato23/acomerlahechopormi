import { create } from 'zustand';
import { devtools, persist, createJSONStorage } from 'zustand/middleware';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabaseClient';
import { getUserProfile, updateUserProfile } from '@/features/user/userService';
import type { UserProfile } from '@/features/user/userTypes';

// Definición de tipos para las preferencias nutricionales
interface NutritionalGoals {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

// Definición de tipos para las preferencias de usuario (mantener compatibilidad)
interface UserPreferences {
  nutritionalGoals?: NutritionalGoals;
}

// Estado del store
interface UserState {
  userId: string | null;
  session: Session | null;
  profile: UserProfile | null;
  userPreferences: UserPreferences;
  isLoading: boolean;
  isHydrating: boolean;
  hydrated: boolean;
  error: string | null;
  // Acciones
  fetchUserPreferences: (userId: string) => Promise<void>;
  setUserPreferences: (preferences: UserPreferences) => void;
  hydrateFromSupabase: () => Promise<void>;
  setSession: (session: Session | null) => void;
  setProfile: (profile: UserProfile | null) => void;
  updateProfile: (updates: Partial<Omit<UserProfile, 'id' | 'email'>>) => Promise<boolean>;
  clear: () => void;
}

// Valores por defecto de objetivos nutricionales
const DEFAULT_NUTRITIONAL_GOALS: NutritionalGoals = {
  calories: 2000,
  protein: 50,
  carbs: 275,
  fat: 78,
};

const DEFAULT_PREFERENCES: UserPreferences = {
  nutritionalGoals: DEFAULT_NUTRITIONAL_GOALS,
};

const memoryStorage: Storage = {
  getItem: () => null,
  setItem: () => undefined,
  removeItem: () => undefined,
  key: () => null,
  length: 0,
  clear: () => undefined,
};

const persistentStorage = typeof window !== 'undefined' ? window.localStorage : memoryStorage;

export const useUserStore = create<UserState>()(
  devtools(
    persist(
      (set, get) => ({
        userId: null,
        session: null,
        profile: null,
        userPreferences: DEFAULT_PREFERENCES,
        isLoading: false,
        isHydrating: false,
        hydrated: false,
        error: null,

        // Cargar preferencias del usuario desde su perfil almacenado en Supabase
        fetchUserPreferences: async (userId: string) => {
          if (!userId) return;

          try {
            set({ isLoading: true, error: null });
            const profile = await getUserProfile(userId);

            if (profile) {
              set({
                userId,
                profile,
                userPreferences: DEFAULT_PREFERENCES,
                isLoading: false,
              });
            } else {
              set({
                userId,
                profile: null,
                userPreferences: DEFAULT_PREFERENCES,
                isLoading: false,
              });
            }
          } catch (error) {
            console.error('Error al cargar preferencias del usuario:', error);
            set({
              isLoading: false,
              error: 'No se pudieron cargar las preferencias del usuario.',
            });
          }
        },

        // Actualizar preferencias en memoria
        setUserPreferences: (preferences: UserPreferences) => {
          set({ userPreferences: { ...get().userPreferences, ...preferences } });
        },

        hydrateFromSupabase: async () => {
          if (get().isHydrating) return;

          set({ isHydrating: true, error: null });

          try {
            const { data, error } = await supabase.auth.getSession();
            if (error) {
              throw error;
            }

            let activeSession = data.session ?? null;

            // Manejar expiración de token refrescando la sesión si es necesario
            if (activeSession?.expires_at && activeSession.expires_at * 1000 <= Date.now()) {
              const { data: refreshData, error: refreshError } =
                await supabase.auth.refreshSession();
              if (refreshError) {
                throw refreshError;
              }
              activeSession = refreshData.session ?? null;
            }

            set({
              session: activeSession,
              userId: activeSession?.user?.id ?? null,
            });

            if (activeSession?.user?.id) {
              const profile = await getUserProfile(activeSession.user.id);
              set({ profile: profile ?? null });
            } else {
              set({ profile: null });
            }
          } catch (error) {
            console.error('Error al hidratar el store de usuario:', error);
            set({
              session: null,
              userId: null,
              profile: null,
              error: 'No se pudo cargar la sesión de usuario.',
            });
          } finally {
            set({ isHydrating: false, hydrated: true });
          }
        },

        setSession: (session: Session | null) => {
          set({ session, userId: session?.user?.id ?? null });
        },

        setProfile: (profile: UserProfile | null) => {
          set({ profile });
        },

        updateProfile: async (updates) => {
          const { userId, profile } = get();

          if (!userId) {
            const message = 'No hay un usuario autenticado.';
            set({ error: message });
            throw new Error(message);
          }

          try {
            const success = await updateUserProfile(userId, updates);
            if (success) {
              set({
                profile: {
                  ...(profile ?? { id: userId }),
                  ...updates,
                } as UserProfile,
                error: null,
              });
            }

            return success;
          } catch (error) {
            const message =
              error instanceof Error ? error.message : 'No se pudo actualizar el perfil.';
            set({ error: message });
            throw error instanceof Error ? error : new Error(message);
          }
        },

        clear: () => {
          set({
            userId: null,
            session: null,
            profile: null,
            userPreferences: DEFAULT_PREFERENCES,
            error: null,
            isLoading: false,
          });
        },
      }),
      {
        name: 'user-store',
        storage: createJSONStorage(() => persistentStorage),
        partialize: (state) => ({
          userId: state.userId,
          session: state.session,
          profile: state.profile,
          userPreferences: state.userPreferences,
        }),
      },
    ),
  ),
);
