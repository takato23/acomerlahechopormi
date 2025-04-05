import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, Users, ImageOff, Heart, Trash2, Pencil } from 'lucide-react'; // Asegurar todos los iconos
import { Recipe } from '@/types/recipeTypes';
import { Link, useNavigate } from 'react-router-dom'; // Añadir importación Link y useNavigate
import { cn } from "@/lib/utils";
import { Button } from '@/components/ui/button'; // Asegurar Button
import { Badge } from "@/components/ui/badge"; // Importar Badge

interface RecipeCardProps {
  recipe: Recipe;
  className?: string;
  // Mantener props aunque no se usen en la versión mínima para evitar errores en RecipeListPage
  onToggleFavorite: (recipeId: string) => void;
  onDelete: (recipeId: string) => void;
}

const RecipeCard: React.FC<RecipeCardProps> = ({ recipe, className, onToggleFavorite, onDelete }) => {
  const navigate = useNavigate(); // Definir navigate aquí
  // Reintroducir cálculo de tiempo total
  const prepTime = recipe.prep_time_minutes ?? 0;
  const cookTime = recipe.cook_time_minutes ?? 0;
  const totalTime = prepTime + cookTime;

  // Reintroducir estructura principal y contenido
  return (
    <Card className={cn(
      "group relative bg-white border border-slate-200 shadow-md hover:shadow-lg focus-within:shadow-lg transition-shadow duration-200 flex flex-col h-full rounded-xl overflow-hidden",
      className
    )}>
      {/* Mantener Link de fondo (simplificado, sin span sr-only por ahora) */}
      {/* Restaurar Link original */}
      <Link
        to={`/app/recipes/${recipe.id}`}
        className="absolute inset-0 z-0" // Cubre el área, pero está detrás de los botones
        aria-label={`Ver receta ${recipe.title ?? 'receta sin título'}`} // Añadir fallback para title
        tabIndex={-1} // Quitar del orden de tabulación normal
      >
        <span className="sr-only">Ver receta {recipe.title ?? 'receta sin título'}</span>
      </Link>

      {/* Contenido principal */}
      <div className="relative z-[1] flex flex-col flex-grow"> {/* Añadido flex-grow */}
        {/* Restaurar sección de imagen */}
        <div className="aspect-video w-full flex-shrink-0 bg-slate-100 flex items-center justify-center overflow-hidden">
          {recipe.image_url ? (
            <img
              src={recipe.image_url} // Usar original, la lógica ternaria maneja null
              alt={recipe.title ?? 'Imagen de receta'}
              className="object-cover w-full h-full"
              loading="lazy"
              onError={(e) => {
                  console.error(`Error cargando imagen para receta ${recipe.id}: ${recipe.image_url}`);
                  (e.target as HTMLImageElement).style.display = 'none'; // Ocultar imagen rota
              }}
            />
          ) : (
            // Asegurar que ImageOff esté importado
            <ImageOff className="h-12 w-12 text-slate-400" aria-hidden="true" />
          )}
        </div>
        {/* Contenido Principal */}
        <div className="flex flex-col flex-grow p-4"> {/* Contenedor del texto */}
          <CardHeader className="p-0 mb-2">
            <CardTitle className="text-lg font-semibold line-clamp-2">{recipe.title ?? 'Sin Título'}</CardTitle>
          </CardHeader>
          <CardContent className="p-0 flex-grow">
            {recipe.description && (
              <p className="text-sm text-slate-600 mb-3 line-clamp-3">
                {recipe.description}
              </p>
            )}
            {/* Mostrar Tags */}
            {recipe.tags && recipe.tags.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {recipe.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
            <div className="flex items-center space-x-4 text-sm text-slate-500 mt-auto"> {/* mt-auto para empujar al fondo */}
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
        {/* Botones comentados por ahora */}
      </div>

      {/* Restaurar botones con logs y simplificaciones */}
      <div className="absolute top-2 right-2 z-10 flex flex-col gap-1 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 focus-within:opacity-100 transition-opacity">
         {/* Botón Favorito */}
         {/* Log eliminado del JSX */}
         <Button
           variant="ghost"
           size="icon"
           // Simplificar cn temporalmente
           className={`h-7 w-7 bg-background/50 backdrop-blur-sm rounded-full transition-colors duration-150 ${
             recipe.is_favorite ? "text-red-500 hover:text-red-600" : "text-muted-foreground hover:text-red-500 hover:bg-red-500/10"
           }`}
           onClick={(e) => {
             e.stopPropagation();
             e.preventDefault();
             console.log(`[RecipeCard Fav Click] Toggling favorite for ID: ${recipe?.id}`);
             if (recipe.id) onToggleFavorite(recipe.id); // Añadir check por si acaso
           }}
           aria-label={recipe.is_favorite ? "Quitar de favoritos" : "Añadir a favoritos"}
         >
           {/* Simplificar cn temporalmente */}
           <Heart className={`h-4 w-4 ${recipe.is_favorite ? "fill-current" : ""}`} />
         </Button>
         {/* Botón Editar */}
         {/* Log eliminado del JSX */}
         <Button
           variant="ghost"
           size="icon"
           className="h-7 w-7 bg-background/50 backdrop-blur-sm rounded-full text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors duration-150"
           onClick={(e) => {
             e.stopPropagation();
             e.preventDefault();
             console.log(`[RecipeCard Edit Click] Navigating to edit for ID: ${recipe?.id}`);
             // Usar la variable navigate definida al inicio del componente
             if (recipe.id) navigate(`/app/recipes/${recipe.id}/edit`);
           }}
           aria-label="Editar receta"
         >
           <Pencil className="h-4 w-4" />
         </Button>
         {/* Botón Eliminar */}
         {/* Log eliminado del JSX */}
         <Button
           variant="ghost"
           size="icon"
           className="h-7 w-7 bg-background/50 backdrop-blur-sm rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors duration-150"
           onClick={(e) => {
             e.stopPropagation();
             e.preventDefault();
             const title = recipe.title ?? 'sin título';
             console.log(`[RecipeCard Delete Click] Confirming delete for ID: ${recipe?.id}, Title: ${title}`);
             if (window.confirm(`¿Eliminar la receta "${title}"?`)) {
               if (recipe.id) onDelete(recipe.id); // Añadir check por si acaso
             }
           }}
           aria-label="Eliminar receta"
         >
           <Trash2 className="h-4 w-4" />
         </Button>
      </div>
    </Card>
  );
};

export default RecipeCard;