import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card'; 
import { Link } from 'react-router-dom';
import { UtensilsCrossed, Star } from 'lucide-react'; // Añadir Star
import { Button } from '@/components/ui/button'; // Importar Button
import { cn } from '@/lib/utils'; // Importar cn
// Usar any temporalmente
// import type { Recipe } from '../recipeTypes';
type Recipe = any;

interface RecipeCardProps {
  recipe: Recipe;
  // Nueva prop para manejar el toggle de favorito
  onToggleFavorite: (recipeId: string, currentStatus: boolean) => void; 
}

export function RecipeCard({ recipe, onToggleFavorite }: RecipeCardProps) {
  const ingredientCount = recipe.recipe_ingredients?.length ?? 0;
  const truncatedDescription = recipe.description
    ? recipe.description.slice(0, 80) + (recipe.description.length > 80 ? '...' : '')
    : 'Sin descripción'; 
  
  const isFavorite = !!recipe.is_favorite; // Convertir a boolean

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.preventDefault(); // Evitar que el Link navegue
    e.stopPropagation(); // Evitar que el Link navegue
    onToggleFavorite(recipe.id, isFavorite);
  };

  return (
    // Quitar Link de aquí para que el botón funcione independientemente
    <Card className="overflow-hidden h-full flex flex-col transition-all duration-200 hover:shadow-md hover:-translate-y-1 relative group"> {/* Añadir relative y group */}
      {/* Botón Favorito (Absoluto) */}
      <Button
        variant="ghost"
        size="icon"
        className={cn(
          "absolute top-2 right-2 z-10 h-8 w-8 rounded-full bg-card/70 backdrop-blur-sm",
          "text-muted-foreground hover:text-yellow-500 hover:bg-card",
          isFavorite && "text-yellow-400 fill-yellow-400" // Estilo cuando es favorito
        )}
        onClick={handleFavoriteClick}
        aria-label={isFavorite ? "Quitar de favoritos" : "Añadir a favoritos"}
      >
        <Star className="h-4 w-4" />
      </Button>

      <Link to={`/app/recipes/${recipe.id}`} className="block flex flex-col flex-grow"> {/* Link envuelve contenido */}
        {/* Placeholder de Imagen */}
        <div className="aspect-video bg-muted flex items-center justify-center">
          <UtensilsCrossed className="h-12 w-12 text-muted-foreground/50" />
        </div>
        <CardHeader className="pb-2"> 
          <CardTitle className="text-lg group-hover:text-primary transition-colors line-clamp-2"> 
            {recipe.name} {/* Cambiado de title a name */}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-grow pt-0 space-y-1"> 
          <CardDescription className="text-sm line-clamp-3"> 
            {truncatedDescription}
          </CardDescription>
          <p className="text-xs text-muted-foreground pt-1"> 
            {ingredientCount} ingrediente{ingredientCount !== 1 ? 's' : ''}
          </p>
        </CardContent>
      </Link>
    </Card>
  );
}