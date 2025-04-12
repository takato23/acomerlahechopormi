import { Recipe } from '@/types/recipeTypes';
import RecipeCard from './RecipeCard';

interface RecipeGridProps {
  recipes: Recipe[];
  onDelete?: (id: string) => void;
  onEdit?: (recipe: Recipe) => void;
  onToggleFavorite?: (id: string) => void;
}

export default function RecipeGrid({ 
  recipes, 
  onDelete,
  onEdit,
  onToggleFavorite 
}: RecipeGridProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {recipes.map((recipe) => (
        <RecipeCard
          key={recipe.id}
          recipe={recipe}
          onDelete={onDelete}
          onEdit={onEdit}
          onToggleFavorite={onToggleFavorite}
        />
      ))}
    </div>
  );
}