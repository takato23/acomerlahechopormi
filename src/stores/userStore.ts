import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { getUserProfile } from '@/features/user/userService';

// Definición de tipos para las preferencias nutricionales
interface NutritionalGoals {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

// Definición de tipos para las preferencias de usuario
interface UserPreferences {
  nutritionalGoals?: NutritionalGoals;
  // Otros campos de preferencias del usuario que se puedan necesitar
}

// Definición del estado del store
interface UserState {
  userId: string | null;
  userPreferences: UserPreferences;
  isLoading: boolean;
  error: string | null;
  // Acciones
  fetchUserPreferences: (userId: string) => Promise<void>;
  setUserPreferences: (preferences: UserPreferences) => void;
}

// Valores por defecto de objetivos nutricionales
const DEFAULT_NUTRITIONAL_GOALS: NutritionalGoals = {
  calories: 2000,
  protein: 50,
  carbs: 275,
  fat: 78
};

// Creación del store
export const useUserStore = create<UserState>()(
  devtools(
    (set, get) => ({
      userId: null,
      userPreferences: {
        nutritionalGoals: DEFAULT_NUTRITIONAL_GOALS
      },
      isLoading: false,
      error: null,

      // Cargar preferencias del usuario desde el perfil
      fetchUserPreferences: async (userId: string) => {
        if (!userId) return;
        
        try {
          set({ isLoading: true, error: null });
          
          // Obtener perfil de usuario
          const userProfile = await getUserProfile(userId);
          
          if (userProfile) {
            // Aquí mapeamos los datos del perfil a las preferencias
            // Por ahora, solo usamos valores por defecto
            set({
              userId,
              userPreferences: {
                nutritionalGoals: DEFAULT_NUTRITIONAL_GOALS
                // En un futuro, podríamos mapear más campos del perfil
              },
              isLoading: false
            });
          } else {
            set({
              userId,
              userPreferences: {
                nutritionalGoals: DEFAULT_NUTRITIONAL_GOALS
              },
              isLoading: false
            });
          }
        } catch (error) {
          console.error('Error al cargar preferencias del usuario:', error);
          set({ 
            isLoading: false, 
            error: 'No se pudieron cargar las preferencias del usuario.'
          });
        }
      },

      // Actualizar preferencias del usuario
      setUserPreferences: (preferences: UserPreferences) => {
        set({ userPreferences: { ...get().userPreferences, ...preferences } });
        // Aquí se podría añadir lógica para persistir los cambios en el backend
      }
    })
  )
); 