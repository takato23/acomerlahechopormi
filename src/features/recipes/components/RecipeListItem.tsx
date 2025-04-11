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
    <div className="flex items-start justify-between p-3 border-b border-slate-100 hover:bg-slate-50 transition-colors group"> {/* Alineación al inicio */}
      <Link to={`/app/recipes/${recipe.id}`} className="flex-grow min-w-0 mr-4 group-hover:text-primary">
        <p className="text-base font-medium truncate mb-1">{recipe.title ?? 'Sin Título'}</p>
        {/* Mostrar Tags (con verificación de nulidad) */}
        {recipe.tags && recipe.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {(recipe.tags ?? []).slice(0, 5).map((tag) => ( // Usar ?? [] para seguridad
              <Badge key={tag} variant="secondary" className="text-xs px-1.5 py-0.5">
                {tag}
              </Badge>
            ))}
            {(recipe.tags?.length ?? 0) > 5 && ( // Usar ?. y ?? para seguridad
              <Badge variant="outline" className="text-xs px-1.5 py-0.5">
                +{(recipe.tags?.length ?? 0) - 5} más
              </Badge>
            )}
          </div>
        )}
      </Link>
      {/* Añadir pt-1 para bajar ligeramente los iconos y alinearlos mejor con la primera línea del título */}
      <div className="flex items-center space-x-3 text-sm text-slate-500 flex-shrink-0 pt-1">
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
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity"
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
            className="h-7 w-7 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity text-red-500 hover:text-red-600"
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