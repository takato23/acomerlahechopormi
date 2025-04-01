import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  // CardFooter, // No se usa
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/Spinner';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Edit, Trash2, Clock, Users, AlertCircle, Image as ImageIcon } from 'lucide-react';
// Importar funciones específicas del servicio
import { getRecipeById, deleteRecipe } from '@/features/recipes/services/recipeService';
import { useRecipeStore } from '@/stores/recipeStore';
import { Recipe, RecipeIngredient } from '@/types/recipeTypes';
// import { formatTime } from '@/lib/utils'; // formatTime no existe

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
        // Usar la función importada directamente
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

    // Usar recipe.title en lugar de recipe.name
    if (window.confirm(`¿Estás seguro de que quieres eliminar la receta "${recipe.title}"?`)) {
      setIsLoading(true);
      try {
        // Usar la función importada directamente
        await deleteRecipe(recipeId);
        removeRecipeFromStore(recipeId);
        navigate('/app/recipes');
      } catch (err) {
        console.error('Error deleting recipe:', err);
        setError('Error al eliminar la receta.');
        setIsLoading(false);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        {/* Usar tamaño 'lg' */}
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive" className="m-4">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!recipe) {
    return (
       <Alert className="m-4">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Información</AlertTitle>
        <AlertDescription>No se encontró la receta solicitada.</AlertDescription>
      </Alert>
    );
  }

  // Formatear instrucciones
  const formattedInstructions = recipe.instructions?.split('\n').map((step, index) => (
    step.trim() ? <li key={index} className="mb-2">{step}</li> : null
  )).filter(Boolean);

  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8">
      <Card className="overflow-hidden">
        <CardHeader className="relative p-0">
          {recipe.image_url ? (
            <img
              src={recipe.image_url}
              // Usar recipe.title
              alt={recipe.title}
              className="w-full h-64 object-cover"
            />
          ) : (
            <div className="w-full h-64 bg-muted flex items-center justify-center">
              <ImageIcon className="h-16 w-16 text-muted-foreground" />
            </div>
          )}
           <div className="absolute top-4 right-4 flex gap-2">
             <Button asChild size="icon" variant="outline">
                <Link to={`/app/recipes/${recipeId}/edit`}>
                  <Edit className="h-4 w-4" />
                </Link>
              </Button>
              <Button size="icon" variant="destructive" onClick={handleDelete} disabled={isLoading}>
                {/* Usar tamaño 'sm' */}
                {isLoading ? <Spinner size="sm" /> : <Trash2 className="h-4 w-4" />}
              </Button>
           </div>
        </CardHeader>
        <CardContent className="p-6">
          {/* Usar recipe.title */}
          <CardTitle className="text-3xl font-bold mb-2">{recipe.title}</CardTitle>
          <CardDescription className="text-muted-foreground mb-6">{recipe.description}</CardDescription>

          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-6">
            {/* Corregir &amp; a && */}
            {recipe.prep_time_minutes != null && (
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {/* Mostrar minutos directamente */}
                <span>Prep: {recipe.prep_time_minutes} min</span>
              </div>
            )}
             {/* Corregir &amp; a && */}
             {recipe.cook_time_minutes != null && (
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                 {/* Mostrar minutos directamente */}
                <span>Cocción: {recipe.cook_time_minutes} min</span>
              </div>
            )}
             {/* Eliminar sección de tiempo total */}
            {/* Corregir &amp; a && */}
            {recipe.servings != null && (
               <div className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                <span>Porciones: {recipe.servings}</span>
              </div>
            )}
          </div>

          {/* Corregir &amp; a && */}
          {recipe.ingredients && recipe.ingredients.length > 0 && (
            <div className="mb-6">
              <h3 className="text-xl font-semibold mb-3">Ingredientes</h3>
              <ul className="list-disc list-inside space-y-1">
                {recipe.ingredients.map((ing: RecipeIngredient, index: number) => (
                  <li key={index}>
                    {/* Usar ing.ingredient_name y eliminar ing.notes */}
                    {ing.quantity} {ing.unit} {ing.ingredient_name}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Corregir &amp; a && */}
          {formattedInstructions && formattedInstructions.length > 0 && (
            <div className="mb-6">
              <h3 className="text-xl font-semibold mb-3">Instrucciones</h3>
              <ol className="list-decimal list-inside space-y-2">
                {formattedInstructions}
              </ol>
            </div>
          )}

          {/* Corregir &amp; a && y asegurar manejo de null/undefined */}
          {recipe.tags && recipe.tags.length > 0 && (
             <div className="mt-6 pt-4 border-t">
                <h4 className="text-lg font-medium mb-2">Tags</h4>
                <div className="flex flex-wrap gap-2">
                  {recipe.tags.map((tag: string, index: number) => (
                    <Badge key={index} variant="secondary">{tag}</Badge>
                  ))}
                </div>
              </div>
          )}

        </CardContent>
      </Card>
    </div>
  );
};

export default RecipeDetailPage;