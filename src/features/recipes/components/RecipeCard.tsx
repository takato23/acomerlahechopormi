import React from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, Users, Heart, Trash2, ImageOff, Pencil } from 'lucide-react'; // Asegurar Pencil
import { cn } from "@/lib/utils";
import { Recipe } from '@/types/recipeTypes';
import { Button } from '@/components/ui/button';
import { Link, useNavigate } from 'react-router-dom'; // Importar useNavigate

interface RecipeCardProps {
  recipe: Recipe;
  className?: string;
  onToggleFavorite: (recipeId: string) => void;
  onDelete: (recipeId: string) => void;
}

const RecipeCard: React.FC<RecipeCardProps> = ({ recipe, className, onToggleFavorite, onDelete }) => {
  const navigate = useNavigate(); // Hook para navegación programática
  // Calcular tiempo total
  const prepTime = recipe.prep_time_minutes ?? 0;
  const cookTime = recipe.cook_time_minutes ?? 0;
  const totalTime = prepTime + cookTime;

  return (
    // Envolver toda la tarjeta en un Link, excepto los botones de acción
    <Link
      to={`/app/recipes/${recipe.id}`}
      className={cn("block group relative rounded-xl overflow-hidden", className)} // Añadir group, relative, rounded, overflow
      aria-label={`Ver receta ${recipe.title}`}
    >
      <Card className={cn(
        "bg-white border border-slate-200 shadow-md group-hover:shadow-lg transition-shadow duration-200 flex flex-col h-full", // Quitar rounded y overflow de aquí
      )}>
        {/* Contenedor de Imagen o Placeholder */}
        <div className="aspect-video w-full flex-shrink-0 bg-slate-100 flex items-center justify-center overflow-hidden">
          {recipe.image_url ? (
            <img
              src={recipe.image_url}
              alt={recipe.title}
              className="object-cover w-full h-full"
              loading="lazy"
            />
          ) : (
            <ImageOff className="h-12 w-12 text-slate-400" />
          )}
        </div>
        {/* Contenido Principal */}
        <div className="flex flex-col flex-grow p-4">
          <CardHeader className="p-0 mb-2">
            <CardTitle className="text-lg font-semibold line-clamp-2">{recipe.title}</CardTitle>
          </CardHeader>
          <CardContent className="p-0 flex-grow">
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
        </CardContent>
        </div>
        {/* Footer vacío o con otra info si se necesita, los botones ahora están en hover */}
        {/* <CardFooter className="p-3 pt-2 border-t border-slate-100 mt-auto"></CardFooter> */}
      </Card>

      {/* Botones de acción en hover */}
      <div className="absolute top-2 right-2 z-10 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
         {/* Botón Favorito */}
         <Button
           variant="ghost"
           size="icon"
           className={cn(
             "h-7 w-7 bg-background/50 hover:bg-background/80 backdrop-blur-sm rounded-full", // Fondo y redondeado
             recipe.is_favorite ? "text-red-500 hover:text-red-600" : "text-muted-foreground hover:text-red-500"
           )}
           onClick={(e) => {
             e.stopPropagation();
             e.preventDefault();
             onToggleFavorite(recipe.id);
           }}
           title={recipe.is_favorite ? "Quitar de favoritos" : "Añadir a favoritos"}
         >
           <Heart className={cn("h-4 w-4", recipe.is_favorite && "fill-current")} />
         </Button>
         {/* Botón Editar */}
         <Button
           variant="ghost"
           size="icon"
           className="h-7 w-7 bg-background/50 hover:bg-background/80 backdrop-blur-sm rounded-full text-muted-foreground hover:text-primary"
           onClick={(e) => {
             e.stopPropagation();
             e.preventDefault();
             navigate(`/app/recipes/${recipe.id}/edit`); // Navegar programáticamente
           }}
           title="Editar receta"
         >
           <Pencil className="h-4 w-4" />
         </Button>
         {/* Botón Eliminar */}
         <Button
           variant="ghost"
           size="icon"
           className="h-7 w-7 bg-background/50 hover:bg-background/80 backdrop-blur-sm rounded-full text-muted-foreground hover:text-destructive"
           onClick={(e) => {
             e.stopPropagation();
             e.preventDefault();
             if (window.confirm(`¿Eliminar la receta "${recipe.title}"?`)) {
               onDelete(recipe.id);
             }
           }}
           title="Eliminar receta"
         >
           <Trash2 className="h-4 w-4" />
         </Button>
      </div>
    </Link>
  );
};

export default RecipeCard;