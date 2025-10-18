import { useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useRecipeStore } from '@/stores/recipeStore';
import RecipeGrid from '../components/RecipeGrid';
import { Recipe } from '@/types/recipeTypes';
import { Skeleton } from '@/components/ui/skeleton';
import { BookOpen, Plus } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { PageLayout } from '@/components/layout/PageLayout';
import { PageSection } from '@/components/ui/PageSection';

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

  const actions = (
    <Button onClick={() => navigate('/recipes/new')}>
      <Plus className="mr-2 h-4 w-4" />
      Nueva Receta
    </Button>
  );

  const isInitialLoading = store.loading && store.recipes.length === 0;

  return (
    <PageLayout
      title="Mis Recetas"
      description="Organiza tus recetas guardadas y añade nuevas creaciones."
      icon={<BookOpen className="h-6 w-6" />}
      actions={actions}
    >
      {store.error && (
        <Alert variant="destructive">
          <AlertDescription>{store.error}</AlertDescription>
        </Alert>
      )}

      <PageSection padded>
        {isInitialLoading && (
          <div className="grid grid-cols-1 gap-section sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {[...Array(8)].map((_, index) => (
              <div key={index} className="space-y-section-sm">
                <Skeleton className="h-48 w-full rounded-2xl" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))}
          </div>
        )}

        {!isInitialLoading && store.recipes.length > 0 && (
          <>
            <RecipeGrid
              recipes={store.recipes}
              onDelete={handleDelete}
              onEdit={handleEdit}
              onToggleFavorite={store.toggleFavorite}
            />
            <div className="mt-section flex justify-center">
              <Button
                variant="outline"
                onClick={handleLoadMore}
                disabled={store.loading}
              >
                {store.loading ? 'Cargando...' : 'Cargar más'}
              </Button>
            </div>
          </>
        )}

        {!isInitialLoading && store.recipes.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-muted/60 bg-muted/20 px-section py-section text-center">
            <p className="mb-4 text-muted-foreground">No hay recetas para mostrar</p>
            <Button onClick={() => navigate('/recipes/new')}>
              Crear mi primera receta
            </Button>
          </div>
        )}
      </PageSection>
    </PageLayout>
  );
}