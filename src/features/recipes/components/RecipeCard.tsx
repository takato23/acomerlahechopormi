import React from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, Users, Heart, Trash2, ImageOff } from 'lucide-react'; // Añadir ImageOff
import { cn } from "@/lib/utils";
import { Recipe } from '@/types/recipeTypes';
import { Button } from '@/components/ui/button'; // Importar Button
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"; // Importar AlertDialog

interface RecipeCardProps {
  recipe: Recipe;
  className?: string;
  onToggleFavorite: (recipeId: string) => void; // Nueva prop
  onDelete: (recipeId: string) => void; // Nueva prop
}

const RecipeCard: React.FC<RecipeCardProps> = ({ recipe, className, onToggleFavorite, onDelete }) => {
  // Calcular tiempo total
  const prepTime = recipe.prep_time_minutes ?? 0;
  const cookTime = recipe.cook_time_minutes ?? 0;
  const totalTime = prepTime + cookTime;

  return (
    <Card className={cn(
      "bg-white border border-slate-200 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-200 overflow-hidden flex flex-col h-full", // Aumentar redondeo, flex col para footer fijo
      className
    )}>
      {/* Contenedor de Imagen o Placeholder */}
      <div className="aspect-video w-full flex-shrink-0 bg-slate-100 flex items-center justify-center overflow-hidden"> {/* Cambiado h-48 por aspect-video */}
        {recipe.image_url ? (
          <img
            src={recipe.image_url}
            alt={recipe.title}
            className="object-cover w-full h-full"
            loading="lazy" // Carga lazy para imágenes
          />
        ) : (
          <ImageOff className="h-12 w-12 text-slate-400" /> // Placeholder Icon
        )}
      </div>
      {/* Contenido Principal (crece para empujar footer abajo) */}
      <div className="flex flex-col flex-grow p-4">
        <CardHeader className="p-0 mb-2"> {/* Quitar padding, añadir margen inferior */}
          <CardTitle className="text-lg font-semibold line-clamp-2">{recipe.title}</CardTitle> {/* Limitar a 2 líneas */}
        </CardHeader>
        <CardContent className="p-0 flex-grow"> {/* Quitar padding, permitir crecer */}
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
      </div> {/* Cierre del div flex-grow p-4 */}
      <CardFooter className="p-3 pt-2 flex justify-end gap-1 border-t border-slate-100 mt-auto"> {/* Asegurar borde y margen auto */}
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "h-8 w-8",
            recipe.is_favorite ? "text-red-500 hover:text-red-600" : "text-muted-foreground hover:text-red-500"
          )}
          onClick={(e) => {
            e.stopPropagation(); // Evitar que el click navegue si la card es un link
            onToggleFavorite(recipe.id);
          }}
          aria-label={recipe.is_favorite ? "Quitar de favoritos" : "Añadir a favoritos"}
        >
          <Heart className={cn("h-4 w-4", recipe.is_favorite && "fill-current")} />
        </Button>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-destructive"
              onClick={(e) => e.stopPropagation()} // Evitar navegación
              aria-label="Eliminar receta"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent onClick={(e) => e.stopPropagation()}>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Eliminar Receta?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta acción no se puede deshacer. Se eliminará permanentemente la receta "{recipe.title}".
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => onDelete(recipe.id)}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Eliminar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardFooter>
    </Card>
  );
};

export default RecipeCard;