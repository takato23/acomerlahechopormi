import { Database } from '@/lib/database.types';

/**
 * Tipo base para el perfil de usuario, basado en la tabla de perfiles de Supabase
 */
export type Profile = Database['public']['Tables']['profiles']['Row'];

/**
 * Tipo para las preferencias del usuario, incluyendo configuraciones de UI y preferencias de alimentos
 */
export interface UserPreferences {
  theme?: 'light' | 'dark' | 'system';
  fontSize?: 'small' | 'medium' | 'large';
  dietaryRestrictions?: string[];
  favoriteCuisines?: string[];
  availableEquipment?: string[];
  maxPrepTime?: number;
  allergies?: string[];
  excludedIngredients?: string[];
}

/**
 * Tipo para las actualizaciones del perfil, haciendo opcionales todos los campos
 */
export type ProfileUpdate = Partial<Profile>;

/**
 * Estado del perfil para manejo en contexto/store
 */
export interface ProfileState {
  loading: boolean;
  error: string | null;
  data: Profile | null;
}

/**
 * Enumeración de roles de usuario
 */
export enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
  PREMIUM = 'premium'
}