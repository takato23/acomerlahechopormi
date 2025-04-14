import React from 'react';
import { Link } from 'react-router-dom';
import { Recipe } from '@/types/recipeTypes';
import { Badge } from '@/components/ui/badge';
import { Clock, Users, Heart, Trash2, Pencil } from 'lucide-react'; // Incluir iconos para posible uso futuro
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface RecipeListItemProps {
  recipe: Recipe;
  onToggleFavorite: () => void;
  onDelete: () => void;
}

const RecipeListItem: React.FC<RecipeListItemProps> = ({ recipe, onToggleFavorite, onDelete }) => {
  const prepTime = recipe.prep_time_minutes ?? 0;
  const cookTime = recipe.cook_time_minutes ?? 0;
  const totalTime = prepTime + cookTime;

  return (
    <div className="flex items-start justify-between p-3 border-b border-slate-100 hover:bg-slate-50 transition-colors group w-full max-w-full overflow-x-hidden">
      <Link to={`/app/recipes/${recipe.id}`} className="flex-1 min-w-0 mr-2 group-hover:text-primary overflow-hidden text-ellipsis w-full max-w-full">
        <p className="text-base font-medium truncate mb-1 w-full max-w-full">{recipe.title ?? 'Sin Título'}</p>
        {/* Mostrar Tags (con verificación de nulidad) */}
        {recipe.tags && recipe.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1 w-full max-w-full overflow-x-hidden">
            {(recipe.tags ?? []).slice(0, 2).map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs px-1.5 py-0.5 whitespace-nowrap max-w-full overflow-x-hidden">
                {tag}
              </Badge>
            ))}
            {(recipe.tags?.length ?? 0) > 2 && (
              <Badge variant="outline" className="text-xs px-1.5 py-0.5 whitespace-nowrap max-w-full overflow-x-hidden">
                +{(recipe.tags?.length ?? 0) - 2} más
              </Badge>
            )}
          </div>
        )}
      </Link>
      <div className="flex items-center text-sm text-slate-500 flex-shrink-0 pt-1 space-x-1 md:space-x-3 ml-auto w-auto max-w-full overflow-x-hidden">
        {/* Información adicional (opcional) */}
        {totalTime > 0 && (
          <div className="hidden sm:flex items-center space-x-1" title={`${totalTime} min`}>
            <Clock className="h-4 w-4" />
            <span>{totalTime}</span>
          </div>
        )}
        {/* Verificar servings > 0 explícitamente */}
        {(recipe.servings ?? 0) > 0 && (
          <div className="hidden sm:flex items-center space-x-1" title={`${recipe.servings} porciones`}>
            <Users className="h-4 w-4" />
            <span>{recipe.servings}</span>
          </div>
        )}
        <div className="flex items-center space-x-1 md:space-x-2 w-auto max-w-full overflow-x-hidden">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 opacity-90 md:opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity"
            onClick={(e) => {
              e.preventDefault();
              onToggleFavorite();
            }}
            title={recipe.is_favorite ? "Quitar de favoritos" : "Añadir a favoritos"}
          >
            <Heart className={cn("h-4 w-4", recipe.is_favorite ? "fill-current text-red-500" : "")} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 opacity-90 md:opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity text-red-500 hover:text-red-600"
            onClick={(e) => {
              e.preventDefault();
              onDelete();
            }}
            title="Eliminar receta"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default RecipeListItem;