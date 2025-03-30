import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getRecipeById } from './recipeService'; // Solo necesitamos getById
import { useRecipeStore } from '@/stores/recipeStore'; // Importar tienda
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/Spinner';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { UtensilsCrossed, Trash2, Pencil, Clock, Users, Star } from 'lucide-react'; // Añadir Star
import { toast } from 'sonner';
import { cn } from '@/lib/utils'; // Importar cn

// Usar any temporalmente
// import type { Recipe } from './recipeTypes';
type Recipe = any;

export function RecipeDetailPage() {
  const { recipeId } = useParams<{ recipeId: string }>();
  const navigate = useNavigate();
  const { deleteRecipe, toggleFavorite, recipes } = useRecipeStore(); // Obtener acciones y estado de la tienda

  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isTogglingFavorite, setIsTogglingFavorite] = useState(false);

  // Encontrar la receta en el estado global o cargarla si no está
  useEffect(() => {
    if (!recipeId) {
      setError('ID de receta no válido.');
      setIsLoading(false);
      return;
    }

    // Intentar encontrar la receta en la tienda primero
    const recipeFromStore = recipes.find(r => r.id === recipeId);

    if (recipeFromStore) {
      setRecipe(recipeFromStore);
      setIsLoading(false);
    } else {
      // Si no está en la tienda (ej. acceso directo por URL), cargarla
      setIsLoading(true);
      setError(null);
      getRecipeById(recipeId)
        .then(data => {
          if (data) {
            setRecipe(data);
          } else {
            setError('Receta no encontrada.');
          }
        })
        .catch(err => {
          console.error("Error loading recipe detail:", err);
          setError('Error al cargar la receta.');
        })
        .finally(() => setIsLoading(false));
    }
  }, [recipeId, recipes]); // Depender de recipes para actualizar si cambia en la tienda

  const handleDelete = async () => {
    if (!recipeId) return;
    const confirmDelete = window.confirm('¿Estás seguro de que quieres eliminar esta receta? Esta acción no se puede deshacer.');
    if (confirmDelete) {
      setIsDeleting(true);
      const success = await deleteRecipe(recipeId); // Llamar a la acción de la tienda
      if (success) {
        toast.success('Receta eliminada con éxito.');
        navigate('/app/recipes'); // Volver a la lista
      } else {
        toast.error('Error al eliminar la receta.');
        setIsDeleting(false);
      }
      // No necesitamos setIsDeleting(false) en caso de éxito porque navegamos
    }
  };

  const handleToggleFavorite = async () => {
     if (!recipe) return;
     setIsTogglingFavorite(true);
     const success = await toggleFavorite(recipe.id, !!recipe.is_favorite);
     if (success) {
        // Actualizar el estado local para reflejar el cambio inmediatamente
        // (aunque Zustand también lo hará, esto asegura la respuesta visual)
        setRecipe((prev: any) => prev ? { ...prev, is_favorite: !prev.is_favorite } : null); // Añadir tipo explícito any
        toast.success(recipe.is_favorite ? 'Receta quitada de favoritos.' : 'Receta añadida a favoritos.');
     } else {
        toast.error('Error al actualizar favoritos.');
     }
     setIsTogglingFavorite(false);
  };


  if (isLoading) {
    return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;
  }

  if (error) {
    return <p className="text-center text-destructive py-10">{error}</p>;
  }

  if (!recipe) {
    // Este caso podría darse si se eliminó mientras se veía, o por error de carga inicial
    return <p className="text-center py-10">No se encontró la receta.</p>;
  }
  
  const isFavorite = !!recipe.is_favorite;

  return (
    <div className="container mx-auto max-w-3xl py-8 px-4">
      <Card>
        {/* Placeholder Imagen */}
        <div className="aspect-video bg-muted flex items-center justify-center rounded-t-lg">
          <UtensilsCrossed className="h-20 w-20 text-muted-foreground/30" />
        </div>

        <CardHeader>
          <div className="flex justify-between items-start gap-4">
             <CardTitle className="text-2xl lg:text-3xl">{recipe.name}</CardTitle>
             {/* Botón Favorito */}
             <Button
               variant="ghost"
               size="icon"
               className={cn(
                 "h-9 w-9 rounded-full bg-card/70 backdrop-blur-sm text-muted-foreground hover:text-yellow-500 hover:bg-card",
                 isFavorite && "text-yellow-400 fill-yellow-400"
               )}
               onClick={handleToggleFavorite}
               disabled={isTogglingFavorite}
               aria-label={isFavorite ? "Quitar de favoritos" : "Añadir a favoritos"}
             >
               {isTogglingFavorite ? <Spinner size="sm"/> : <Star className="h-5 w-5" />}
             </Button>
          </div>
          {recipe.description && (
            <CardDescription className="pt-2">{recipe.description}</CardDescription>
          )}
          {/* Meta Info */}
          <div className="flex items-center gap-4 text-sm text-muted-foreground pt-3">
            {recipe.prep_time && (
              <span className="flex items-center gap-1.5">
                <Clock className="h-4 w-4" /> {recipe.prep_time} min
              </span>
            )}
             {/* Añadir 'servings' si existe en tu modelo */}
            {/* {recipe.servings && (
              <span className="flex items-center gap-1.5">
                <Users className="h-4 w-4" /> {recipe.servings} porciones
              </span>
            )} */}
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Ingredientes */}
          <div>
            <h3 className="text-lg font-semibold mb-2">Ingredientes</h3>
            {recipe.recipe_ingredients && recipe.recipe_ingredients.length > 0 ? (
              <ul className="list-disc space-y-1 pl-5 text-sm">
                {recipe.recipe_ingredients.map((ing: any) => (
                  <li key={ing.id || ing.name}> {/* Usar ID si existe, sino nombre */}
                    {ing.quantity && `${ing.quantity} `}
                    {ing.unit && `${ing.unit} de `}
                    {ing.name}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground italic">No hay ingredientes listados.</p>
            )}
          </div>

          {/* Instrucciones */}
          {recipe.instructions && (
             <div>
               <h3 className="text-lg font-semibold mb-2">Instrucciones</h3>
               {/* Usar whitespace-pre-wrap para respetar saltos de línea */}
               <p className="text-sm whitespace-pre-wrap">{recipe.instructions}</p> 
             </div>
           )}
        </CardContent>

        <CardFooter className="flex justify-end gap-2">
           <Button variant="outline" asChild>
             <Link to={`/app/recipes/${recipeId}/edit`}>
               <Pencil className="mr-2 h-4 w-4" /> Editar
             </Link>
           </Button>
           <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
             {isDeleting ? <Spinner size="sm" className="mr-2"/> : <Trash2 className="mr-2 h-4 w-4" />}
             Eliminar
           </Button>
        </CardFooter>
      </Card>
    </div>
  );
}