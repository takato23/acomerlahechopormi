import React from 'react';
import { Recipe } from '@/types/recipeTypes';
import RecipeListItem from './RecipeListItem'; // Importar el componente de item
import { Card, CardContent } from '@/components/ui/card'; // Usar Card para un contenedor consistente

interface RecipeListProps {
  recipes: Recipe[];
  // Podríamos pasar aquí las funciones onToggleFavorite y onDelete si las implementamos en RecipeListItem
}

const RecipeList: React.FC<RecipeListProps> = ({ recipes }) => {
  if (!recipes || recipes.length === 0) {
    // Aunque RecipeListPage ya maneja el estado vacío, es bueno tener un fallback
    return <p className="text-center text-slate-500 mt-8">No hay recetas para mostrar en la lista.</p>;
  }

  return (
    <Card className="border shadow-sm rounded-lg overflow-hidden"> {/* Contenedor con estilo */}
      <CardContent className="p-0"> {/* Sin padding interno en CardContent */}
        {/* Usar un div en lugar de ul/li para evitar estilos de lista por defecto */}
        <div>
          {recipes.map((recipe) => (
            <RecipeListItem key={recipe.id} recipe={recipe} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default RecipeList;