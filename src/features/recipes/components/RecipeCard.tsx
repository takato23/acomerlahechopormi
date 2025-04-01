import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, Users } from 'lucide-react';
import { cn } from "@/lib/utils";
import { Recipe } from '@/types/recipeTypes'; // Importar el tipo global

interface RecipeCardProps {
  recipe: Recipe;
  className?: string;
}

const RecipeCard: React.FC<RecipeCardProps> = ({ recipe, className }) => {
  // Calcular tiempo total
  const prepTime = recipe.prep_time_minutes ?? 0;
  const cookTime = recipe.cook_time_minutes ?? 0;
  const totalTime = prepTime + cookTime;

  return (
    <Card className={cn(
      "bg-white border border-slate-200 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 overflow-hidden",
      className
    )}>
      {recipe.image_url && (
        <div className="h-48 overflow-hidden">
          <img
            src={recipe.image_url}
            alt={recipe.title}
            className="object-cover w-full h-full"
          />
        </div>
      )}
      <CardHeader className="p-4">
        <CardTitle className="text-lg font-semibold">{recipe.title}</CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        {recipe.description && (
          <p className="text-sm text-slate-600 mb-3 line-clamp-3">
            {recipe.description}
          </p>
        )}
        <div className="flex items-center space-x-4 text-sm text-slate-500">
          {totalTime > 0 && (
            <div className="flex items-center space-x-1">
              <Clock className="h-4 w-4" />
              <span>{totalTime} min</span>
            </div>
          )}
          {recipe.servings && recipe.servings > 0 && (
            <div className="flex items-center space-x-1">
              <Users className="h-4 w-4" />
              <span>{recipe.servings} {recipe.servings === 1 ? 'porción' : 'porciones'}</span>
            </div>
          )}
        </div>
        {/* Podría ir un CardFooter aquí si se necesitaran botones */}
        {/* <CardFooter className="p-4 pt-2">...</CardFooter> */}
      </CardContent>
    </Card>
  );
};

export default RecipeCard;