import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/Spinner';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Edit, Trash2, Clock, Users, AlertCircle, Image as ImageIcon } from 'lucide-react';
import { getRecipeById, deleteRecipe } from '@/features/recipes/services/recipeService';
import { useRecipeStore } from '@/stores/recipeStore';
import { Recipe, RecipeIngredient } from '@/types/recipeTypes';
import { cn } from '@/lib/utils'; // Importar cn para clases condicionales

const RecipeDetailPage: React.FC = () => {
  const { recipeId } = useParams<{ recipeId: string }>();
  const navigate = useNavigate();
  const removeRecipeFromStore = useRecipeStore((state) => state.removeRecipe);

  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRecipe = async () => {
      if (!recipeId) {
        setError('No se proporcionó un ID de receta.');
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      setError(null);
      try {
        const fetchedRecipe = await getRecipeById(recipeId);
        if (fetchedRecipe) {
          setRecipe(fetchedRecipe);
        } else {
          setError('Receta no encontrada.');
        }
      } catch (err) {
        console.error('Error fetching recipe:', err);
        setError('Error al cargar la receta. Inténtalo de nuevo más tarde.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchRecipe();
  }, [recipeId]);

  const handleDelete = async () => {
    if (!recipeId || !recipe) return;

    if (window.confirm(`¿Estás seguro de que quieres eliminar la receta "${recipe.title}"?`)) {
      setIsLoading(true); // Podríamos usar un estado de loading específico para el borrado
      try {
        await deleteRecipe(recipeId);
        removeRecipeFromStore(recipeId);
        navigate('/app/recipes');
      } catch (err) {
        console.error('Error deleting recipe:', err);
        setError('Error al eliminar la receta.');
        setIsLoading(false); // Resetear loading general si falla el borrado
      }
      // No necesitamos resetear isLoading aquí si la navegación tiene éxito
    }
  };

  // --- Renderizado ---

  if (isLoading && !recipe) { // Mostrar spinner solo en la carga inicial
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-4 md:p-6 lg:p-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!recipe) {
    return (
       <div className="container mx-auto p-4 md:p-6 lg:p-8">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Información</AlertTitle>
          <AlertDescription>No se encontró la receta solicitada.</AlertDescription>
        </Alert>
      </div>
    );
  }

  // Formatear instrucciones (mejorado para manejar saltos de línea extra)
  const formattedInstructions = recipe.instructions
    ?.split('\n')
    .map(step => step.trim()) // Limpiar espacios
    .filter(step => step.length > 0) // Filtrar líneas vacías
    .map((step, index) => (
      <li key={index} className="mb-2 leading-relaxed">{step}</li>
  ));

  // Calcular tiempo total si ambos tiempos existen
  const totalTime = (recipe.prep_time_minutes ?? 0) + (recipe.cook_time_minutes ?? 0);

  return (
    <div className="bg-slate-50 min-h-screen">
      <div className="container mx-auto max-w-4xl p-4 md:p-6 lg:p-8">
        {/* --- Imagen de la Receta --- */}
        <div className="mb-8">
          {recipe.image_url ? (
            <img
              src={recipe.image_url ?? undefined}
              alt={recipe.title}
              className="w-full h-auto max-h-[450px] object-cover rounded-lg shadow-md"
              loading="lazy" // Carga diferida para imágenes grandes
            />
          ) : (
            <div className="w-full h-64 bg-slate-200 rounded-lg flex items-center justify-center shadow-md">
              <ImageIcon className="h-16 w-16 text-slate-400" />
            </div>
          )}
        </div>

        {/* --- Título y Descripción --- */}
        <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-3">{recipe.title}</h1>
        {recipe.description && (
          <p className="text-lg text-slate-600 mb-6">{recipe.description}</p>
        )}

        {/* --- Metadata --- */}
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-slate-600 mb-6">
          {totalTime > 0 && (
            <div className="flex items-center gap-1.5">
              <Clock className="h-5 w-5" />
              <span>Total: {totalTime} min</span>
            </div>
          )}
           {recipe.prep_time_minutes != null && (
            <div className="flex items-center gap-1.5">
              <Clock className="h-5 w-5 text-emerald-600" /> {/* Icono diferente o color? */}
              <span>Prep: {recipe.prep_time_minutes} min</span>
            </div>
          )}
           {recipe.cook_time_minutes != null && (
            <div className="flex items-center gap-1.5">
              <Clock className="h-5 w-5 text-orange-600" /> {/* Icono diferente o color? */}
              <span>Cocción: {recipe.cook_time_minutes} min</span>
            </div>
          )}
          {recipe.servings != null && (
             <div className="flex items-center gap-1.5">
              <Users className="h-5 w-5" />
              <span>Porciones: {recipe.servings}</span>
            </div>
          )}
        </div>

         {/* --- Botones de Acción --- */}
         <div className="flex gap-3 mb-8">
            <Button asChild variant="outline" size="sm">
              <Link to={`/app/recipes/${recipeId}/edit`}>
                <Edit className="mr-2 h-4 w-4" /> Editar
              </Link>
            </Button>
            <Button variant="destructive" size="sm" onClick={handleDelete} disabled={isLoading}>
              {isLoading ? (
                <Spinner size="sm" className="mr-2" />
              ) : (
                <Trash2 className="mr-2 h-4 w-4" />
              )}
              Eliminar
            </Button>
         </div>


        {/* --- Ingredientes --- */}
        {recipe.ingredients && recipe.ingredients.length > 0 && (
          <section className="border-t border-slate-200 mt-8 pt-8">
            <h2 className="text-2xl font-semibold text-slate-800 mb-4">Ingredientes</h2>
            <ul className="list-disc list-inside space-y-2 text-slate-700 pl-2">
              {recipe.ingredients.map((ing: RecipeIngredient, index: number) => (
                <li key={index}>
                  {ing.quantity && <span className="font-medium">{ing.quantity}</span>}
                  {ing.unit && <span className="ml-1">{ing.unit}</span>}
                  <span className="ml-2">{ing.ingredient_name}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* --- Instrucciones --- */}
        {formattedInstructions && formattedInstructions.length > 0 && (
          <section className="border-t border-slate-200 mt-8 pt-8">
            <h2 className="text-2xl font-semibold text-slate-800 mb-4">Instrucciones</h2>
            <ol className="list-decimal list-inside space-y-4 text-slate-700 pl-2">
              {formattedInstructions}
            </ol>
          </section>
        )}

        {/* --- Tags --- */}
        {recipe.tags && recipe.tags.length > 0 && (
           <section className="border-t border-slate-200 mt-8 pt-8">
              <h3 className="text-xl font-semibold text-slate-800 mb-3">Tags</h3>
              <div className="flex flex-wrap gap-2">
                {recipe.tags.map((tag: string, index: number) => (
                  <Badge key={index} variant="secondary" className="font-normal">
                    {tag}
                  </Badge>
                ))}
              </div>
            </section>
        )}

      </div>
    </div>
  );
};

export default RecipeDetailPage;