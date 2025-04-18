// src/features/planning/types.ts

// Usar los valores exactos del enum de Supabase
export type MealType = 'Desayuno' | 'Almuerzo' | 'Merienda' | 'Cena';

// Representa una comida planificada en la tabla planned_meals
export interface PlannedMeal {
  id: string; // UUID
  user_id: string; // UUID del usuario
  plan_date: string; // Fecha en formato YYYY-MM-DD (coincide con DB)
  meal_type: MealType;
  recipe_id: string | null; // UUID de la receta (si aplica)
  custom_meal_name: string | null; // Texto libre (si no es receta)
  created_at: string; // Timestamp
  notes?: string | null; // Añadido para consistencia con Upsert y plantillas

  // Opcional: Incluir datos de la receta si se hace JOIN
  recipes?: {
    id: string;
    title: string;
    description: string | null;
    image_url: string | null;
  } | null;
}

// Datos para crear/actualizar una comida planificada
export interface UpsertPlannedMealData {
  plan_date: string; // Coincide con DB
  meal_type: MealType;
  recipe_id?: string | null;
  custom_meal_name?: string | null;
  notes?: string | null; // Añadido para guardar descripción de receta generada
}

// --- Tipos para Sugerencias de Alternativas ---

// Contexto necesario para solicitar alternativas
export interface MealAlternativeRequestContext {
  meal_type: MealType;
  recipe_id?: string | null;
  custom_meal_name?: string | null;
  // Podríamos añadir más contexto aquí si la IA lo necesita (ej. día, perfil)
}

// Representa una alternativa sugerida
export type MealAlternative = 
  | { type: 'recipe'; id: string; title: string } 
  | { type: 'custom'; text: string };

// --- Tipos para Plantillas de Planificación ---

export interface PlanningTemplate {
  id: string;
  user_id: string;
  name: string;
  template_data: TemplateData;
  created_at: string;
}

export interface TemplateData {
  meals: TemplateMeal[];
}

export interface TemplateMeal {
  day_index: number; // 0 = Lunes, 1 = Martes, etc.
  meal_type: MealType;
  recipe_id?: string | null;
  custom_meal_name?: string | null;
  notes?: string | null; // Añadido para guardar/restaurar notas en plantillas
}

export interface SaveTemplateData {
  name: string;
  meals: PlannedMeal[];
}
