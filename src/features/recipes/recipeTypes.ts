import type { Database } from '@/lib/database.types'; // Asegúrate que la ruta sea correcta

// Tipo base para Ingrediente de Receta (usando tipos generados)
export type RecipeIngredient = Database['public']['Tables']['recipe_ingredients']['Row'];

// Tipo base para Receta (usando tipos generados)
// Incluimos explícitamente la relación con recipe_ingredients
export type Recipe = Omit<Database['public']['Tables']['recipes']['Row'], 'user_id'> & { 
  recipe_ingredients: RecipeIngredient[];
  is_favorite?: boolean; // Añadir campo opcional para favoritos
};

// Tipo para crear/actualizar receta (puede diferir ligeramente)
export type UpsertRecipeData = Omit<Database['public']['Tables']['recipes']['Insert'], 'id' | 'user_id' | 'created_at'> & {
  ingredients: Omit<RecipeIngredient, 'id' | 'recipe_id'>[];
  is_favorite?: boolean; // También aquí por si se edita
};

// Tipo para la relación (si se necesita por separado)
export type RecipeWithIngredients = Recipe; // Alias por claridad