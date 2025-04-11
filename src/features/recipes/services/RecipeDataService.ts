import { SupabaseClient } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabaseClient';
import { Recipe } from '@/types/recipeTypes';
import { RecipeSearchCriteria } from '@/types/recipeRecommendationTypes';

// Use the shared Supabase client instance
const supabaseClient: SupabaseClient = supabase;

/**
 * Servicio para obtener datos de recetas de la base de datos
 */
class RecipeDataService {
  private static instance: RecipeDataService;

  private constructor() {}

  public static getInstance(): RecipeDataService {
    if (!RecipeDataService.instance) {
      RecipeDataService.instance = new RecipeDataService();
    }
    return RecipeDataService.instance;
  }

  /**
   * Obtener todas las recetas (o un subconjunto) como candidatas iniciales
   * TODO: Implementar paginación o filtrado más inteligente si hay muchas recetas
   */
  async getCandidateRecipes(limit = 200): Promise<Recipe[]> {
    const { data, error } = await supabaseClient
      .from('recipes')
      .select(`
        *,
        ingredients:recipe_ingredients(*)
      `)
      .limit(limit); // Limitar para evitar cargar demasiadas recetas

    if (error || !data) {
      console.error('Error fetching candidate recipes:', error);
      return [];
    }

    // Mapear a tipo Recipe (asumiendo que la estructura coincide)
    // Puede requerir validación/transformación más robusta
    return data as Recipe[];
  }

  /**
   * Buscar recetas por criterios más específicos (usando RPC si es necesario)
   * TODO: Implementar búsqueda avanzada si se requiere
   */
  async findRecipesByCriteria(criteria: RecipeSearchCriteria): Promise<Recipe[]> {
     // Por ahora, simplemente obtenemos todas y dejamos que el FilterService haga el trabajo pesado
     // En el futuro, podríamos pasar algunos criterios a la consulta SQL/RPC
     console.warn("findRecipesByCriteria actualmente devuelve todas las recetas candidatas. El filtrado se realiza en RecipeFilterService.");
     return this.getCandidateRecipes();
  }

  /**
   * Obtener una receta específica por ID
   */
   async getRecipeById(recipeId: string): Promise<Recipe | null> {
     const { data, error } = await supabaseClient
       .from('recipes')
       .select(`
         *,
         ingredients:recipe_ingredients(*)
       `)
       .eq('id', recipeId)
       .single();

     if (error || !data) {
       console.error(`Error fetching recipe ${recipeId}:`, error);
       return null;
     }

     return data as Recipe;
   }
}

// Exportar instancia única
export const recipeDataService = RecipeDataService.getInstance();