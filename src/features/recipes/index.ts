// Re-exportamos todos los servicios de recetas
export {
  getRecipes,
  getRecipeById,
  createRecipe,
  addRecipe,
  updateRecipe,
  deleteRecipe,
  type RecipeIngredient
} from './services';

// Exportamos el store
export { useRecipeStore } from './stores/recipeStore';

// Las funciones de categorías se importan directamente de dataService cuando se necesitan
// import { getCategories } from '@/services/dataService';