import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/Spinner';
import { RecipeCard } from './components/RecipeCard';
import { AnimatedTabs } from '@/components/common/AnimatedTabs';
import { EmptyState } from '@/components/common/EmptyState'; 
import { Plus, ClipboardList, SearchX, Star } from 'lucide-react';
import { useRecipeStore } from '@/stores/recipeStore'; // Importar la tienda Zustand
import { useDebounce } from '@/hooks/useDebounce'; // Asumiendo que existe useDebounce

// Usar any temporalmente
// import type { Recipe } from './recipeTypes';
type Recipe = any;

type ViewMode = 'all' | 'favorites';

export function RecipeListPage() {
  // Usar el estado de la tienda Zustand
  const { recipes, isLoading, error, fetchRecipes, toggleFavorite } = useRecipeStore();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [activeView, setActiveView] = useState<ViewMode>('all');
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Cargar recetas al montar el componente usando la acción de la tienda
  useEffect(() => {
    fetchRecipes();
  }, [fetchRecipes]);

  // Filtrar recetas basado en búsqueda y vista activa
  const filteredRecipes = useMemo(() => {
    let results = recipes;

    // Filtrar por favoritas si es necesario
    if (activeView === 'favorites') {
      results = results.filter(recipe => recipe.is_favorite);
    }

    // Filtrar por término de búsqueda (debounceado)
    if (debouncedSearchTerm) {
      const lowerCaseSearch = debouncedSearchTerm.toLowerCase();
      results = results.filter(recipe => 
        recipe.name?.toLowerCase().includes(lowerCaseSearch) ||
        recipe.description?.toLowerCase().includes(lowerCaseSearch) ||
        recipe.recipe_ingredients?.some((ing: any) => ing.name?.toLowerCase().includes(lowerCaseSearch))
      );
    }
    return results;
  }, [recipes, debouncedSearchTerm, activeView]);

  // Manejar cambio de pestaña
  const handleTabChange = (value: string) => {
    setActiveView(value as ViewMode);
  };

  // Manejar toggle de favorito (llama a la acción de la tienda)
  const handleToggleFavorite = async (recipeId: string, currentStatus: boolean) => {
    await toggleFavorite(recipeId, currentStatus);
    // La UI se actualiza automáticamente por la reacción al cambio en la tienda
  };

  // Renderizado condicional del contenido
  const renderContent = () => {
    if (isLoading) {
      return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;
    }

    if (error) {
      return <p className="text-center text-destructive py-10">{error}</p>;
    }

    // Estado vacío inicial (sin recetas en total)
    if (recipes.length === 0) {
      return (
        <EmptyState
          icon={<ClipboardList className="h-16 w-16 text-muted-foreground/50" />}
          title="Aún no has añadido ninguna receta"
          description="¡Empieza creando una para organizar tus comidas!"
          action={
            <Link to="/app/recipes/new">
              <Button>
                <Plus className="mr-2 h-4 w-4" /> Añadir Receta
              </Button>
            </Link>
          }
        />
      );
    }

    // Estado vacío por filtros/búsqueda
    if (filteredRecipes.length === 0) {
       let emptyTitle = "No se encontraron recetas";
       let emptyDescription = "Intenta ajustar tu búsqueda o los filtros.";
       if (activeView === 'favorites' && !debouncedSearchTerm) {
         emptyTitle = "No tienes recetas favoritas";
         emptyDescription = "Marca algunas recetas como favoritas para verlas aquí.";
       } else if (debouncedSearchTerm) {
         emptyTitle = `Sin resultados para "${debouncedSearchTerm}"`;
         emptyDescription = `No encontramos recetas que coincidan con tu búsqueda${activeView === 'favorites' ? ' en tus favoritas' : ''}.`;
       }
       
      return (
        <EmptyState
          icon={<SearchX className="h-16 w-16 text-muted-foreground/50" />}
          title={emptyTitle}
          description={emptyDescription}
        />
      );
    }

    // Mostrar grid de recetas filtradas
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredRecipes.map((recipe) => (
          <RecipeCard 
            key={recipe.id} 
            recipe={recipe} 
            onToggleFavorite={handleToggleFavorite} // Pasar handler
          />
        ))}
      </div>
    );
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
        <h1 className="text-3xl font-bold">Mis Recetas</h1>
        <Link to="/app/recipes/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" /> Añadir Receta
          </Button>
        </Link>
      </div>

      {/* Controles: Búsqueda y Pestañas */}
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
         <Input
           type="search"
           placeholder="Buscar recetas por nombre, descripción, ingrediente..."
           value={searchTerm}
           onChange={(e) => setSearchTerm(e.target.value)}
           className="max-w-sm w-full sm:w-auto"
         />
         <AnimatedTabs
           tabs={[
             { id: 'all', label: 'Todas' }, // Usar 'id' en lugar de 'value', quitar icono (no soportado por AnimatedTabs)
             { id: 'favorites', label: 'Favoritas' }, // Usar 'id' en lugar de 'value', quitar icono
           ]}
           activeTabId={activeView} // Prop se llama activeTabId
           onChange={handleTabChange} // Prop correcta es onChange
         />
      </div>

      {/* Contenido principal (Grid o Estados Vacíos) */}
      {renderContent()}
    </div>
  );
}