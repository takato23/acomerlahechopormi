import React from 'react';
import { Recipe } from '@/types/recipeTypes';
import RecipeListItem from './RecipeListItem'; // Importar el componente de item
import { Card, CardContent } from '@/components/ui/card'; // Usar Card para un contenedor consistente

interface RecipeListProps {
  recipes: Recipe[];
  onToggleFavorite: (id: string, isFavorite: boolean) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

const RecipeList: React.FC<RecipeListProps> = ({ recipes, onToggleFavorite, onDelete }) => {
  if (!recipes || recipes.length === 0) {
    // Aunque RecipeListPage ya maneja el estado vacío, es bueno tener un fallback
    return <p className="text-center text-slate-500 mt-8">No hay recetas para mostrar en la lista.</p>;
  }

  return (
    <div className="w-full max-w-full overflow-x-hidden">
      <Card className="border shadow-sm rounded-lg overflow-x-hidden max-w-full w-full">
        <CardContent className="p-0 overflow-x-hidden w-full max-w-full">
          {/* Usar un div en lugar de ul/li para evitar estilos de lista por defecto */}
          <div className="overflow-x-hidden w-full max-w-full">
            {recipes.map((recipe) => (
              <RecipeListItem
                key={recipe.id}
                recipe={recipe}
                onToggleFavorite={() => onToggleFavorite(recipe.id, !recipe.is_favorite)}
                onDelete={() => onDelete(recipe.id)}
              />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RecipeList;