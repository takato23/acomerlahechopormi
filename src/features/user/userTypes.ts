// Define los tipos relacionados con el perfil de usuario

export type DietaryPreference = 'omnivore' | 'vegetarian' | 'vegan';
export type DifficultyPreference = 'easy' | 'medium' | 'hard'; 

export interface UserProfile {
  id: string; // Corresponde a auth.users.id
  email?: string; // Puede venir de auth.users
  username?: string | null; 
  dietary_preference?: DietaryPreference | null;
  avatar_url?: string | null; 
  difficulty_preference?: DifficultyPreference | null; 
  max_prep_time?: number | null; // Tiempo máximo en minutos
  allergies_restrictions?: string | null; // Campo de texto para alergias/restricciones
  gemini_api_key?: string | null; // Clave API de Gemini opcional
  // Otros campos futuros: budget, etc.
}