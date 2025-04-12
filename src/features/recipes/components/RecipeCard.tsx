import { Link } from 'react-router-dom';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Recipe } from '@/types/recipeTypes';
import { Clock, ChefHat, Trash2, Star, Users2, Edit } from 'lucide-react';

interface RecipeCardProps {
  recipe: Recipe;
  onDelete?: (id: string) => void;
  onEdit?: (recipe: Recipe) => void;
  onToggleFavorite?: (id: string) => void;
}

export default function RecipeCard({ 
  recipe, 
  onDelete, 
  onEdit,
  onToggleFavorite 
}: RecipeCardProps) {
  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault(); // Evitar navegación al hacer clic en eliminar
    if (onDelete) {
      onDelete(recipe.id);
    }
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.preventDefault();
    if (onEdit) {
      onEdit(recipe);
    }
  };

  const handleToggleFavorite = (e: React.MouseEvent) => {
    e.preventDefault();
    if (onToggleFavorite) {
      onToggleFavorite(recipe.id);
    }
  };

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <Link to={`/recipes/${recipe.id}`}>
        <CardHeader className="p-0">
          {recipe.image_url ? (
            <img
              src={recipe.image_url}
              alt={recipe.title}
              className="w-full h-48 object-cover"
            />
          ) : (
            <div className="w-full h-48 bg-muted flex items-center justify-center">
              <ChefHat className="w-12 h-12 text-muted-foreground" />
            </div>
          )}
        </CardHeader>

        <CardContent className="p-4">
          <h3 className="text-lg font-semibold line-clamp-2">{recipe.title}</h3>
          
          {recipe.description && (
            <p className="text-muted-foreground mt-2 line-clamp-2">
              {recipe.description}
            </p>
          )}

          <div className="flex flex-wrap gap-2 mt-4">
            {(recipe.prep_time_minutes || recipe.cook_time_minutes) && (
              <div className="flex items-center text-sm text-muted-foreground">
                <Clock className="w-4 h-4 mr-1" />
                {recipe.prep_time_minutes && recipe.cook_time_minutes
                  ? `${recipe.prep_time_minutes + recipe.cook_time_minutes} min`
                  : recipe.prep_time_minutes 
                    ? `${recipe.prep_time_minutes} min prep`
                    : `${recipe.cook_time_minutes} min cocción`}
              </div>
            )}

            {recipe.servings && (
              <div className="flex items-center text-sm text-muted-foreground">
                <Users2 className="w-4 h-4 mr-1" />
                {recipe.servings} porciones
              </div>
            )}
          </div>
        </CardContent>

        <CardFooter className="p-4 pt-0 flex justify-between">
          <div className="flex gap-2">
            {onEdit && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={handleEdit}
              >
                <Edit className="h-4 w-4" />
              </Button>
            )}
            {onDelete && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-destructive hover:text-destructive"
                onClick={handleDelete}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
          {onToggleFavorite && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={handleToggleFavorite}
            >
              <Star
                className={`h-4 w-4 ${
                  recipe.is_favorite
                    ? 'fill-yellow-400 text-yellow-400'
                    : 'text-muted-foreground'
                }`}
              />
            </Button>
          )}
        </CardFooter>
      </Link>
    </Card>
  );
}