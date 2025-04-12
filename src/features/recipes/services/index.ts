// Re-exportamos las funciones del servicio de recetas
export {
  getRecipes,
  getRecipeById,
  createRecipe,
  addRecipe,
  updateRecipe,
  deleteRecipe,
  type RecipeIngredient
} from './recipeService';

// Re-exportamos las funciones del servicio de categorías
export {
  getCategories,
  getCategoryById
} from './categoryService';

// Nota: Todas las funciones relacionadas con categorías ahora se exportan desde aquí