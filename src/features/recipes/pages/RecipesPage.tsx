import { useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useRecipeStore } from '@/stores/recipeStore';
import RecipeGrid from '../components/RecipeGrid';
import { Recipe } from '@/types/recipeTypes';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function RecipesPage() {
  const navigate = useNavigate();
  const store = useRecipeStore();

  const loadInitialRecipes = useCallback(() => {
    store.fetchRecipes({ reset: true });
  }, [store]);

  useEffect(() => {
    loadInitialRecipes();
  }, [store.filters, loadInitialRecipes]);

  const handleLoadMore = () => {
    store.fetchRecipes({ 
      page: Math.ceil(store.recipes.length / 12) + 1 
    });
  };

  const handleDelete = async (id: string) => {
    try {
      await store.deleteRecipe(id);
    } catch (error) {
      console.error('Error deleting recipe:', error);
    }
  };

  const handleEdit = (recipe: Recipe) => {
    store.setSelectedRecipe(recipe);
    navigate(`/recipes/edit/${recipe.id}`);
  };

  if (store.error) {
    return (
      <Alert variant="destructive" className="mb-4">
        <AlertDescription>{store.error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Mis Recetas</h1>
        <Button onClick={() => navigate('/recipes/new')}>
          <Plus className="h-4 w-4 mr-2" />
          Nueva Receta
        </Button>
      </div>

      {store.loading && store.recipes.length === 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="h-48 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ))}
        </div>
      ) : (
        <>
          <RecipeGrid
            recipes={store.recipes}
            onDelete={handleDelete}
            onEdit={handleEdit}
            onToggleFavorite={store.toggleFavorite}
          />
          {store.recipes.length > 0 && (
            <div className="mt-8 text-center">
              <Button
                variant="outline"
                onClick={handleLoadMore}
                disabled={store.loading}
              >
                {store.loading ? 'Cargando...' : 'Cargar más'}
              </Button>
            </div>
          )}
        </>
      )}

      {!store.loading && store.recipes.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">
            No hay recetas para mostrar
          </p>
          <Button onClick={() => navigate('/recipes/new')}>
            Crear mi primera receta
          </Button>
        </div>
      )}
    </div>
  );
}