import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/Spinner';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card as UICard, CardContent as UICardContent, CardHeader as UICardHeader, CardTitle as UICardTitle } from "@/components/ui/card"; // Renombrar
import { Edit, Trash2, Clock, Users, AlertCircle, Image as ImageIcon, ChefHat, Tag } from 'lucide-react'; // Añadir iconos
import { ShoppingCart } from 'lucide-react'; // Icono para lista de compras
import { Wand2 } from 'lucide-react'; // Icono para variación
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner'; // Asumiendo que sonner está instalado para toasts
import { generateRecipeVariation } from '@/features/recipes/generationService'; // Ajustar path si es necesario
import { getRecipeById, deleteRecipe } from '@/features/recipes/services/recipeService';
import { addItemsToShoppingList, calculateMissingRecipeIngredients } from '@/features/shopping-list/services/shoppingListService';
import { useRecipeStore } from '@/stores/recipeStore';
import { Recipe, RecipeIngredient } from '@/types/recipeTypes';
import { cn } from '@/lib/utils';

const RecipeDetailPage: React.FC = () => {
  const { recipeId } = useParams<{ recipeId: string }>();
  const navigate = useNavigate();
  const removeRecipeFromStore = useRecipeStore((state) => state.removeRecipe);

  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [isVariationModalOpen, setIsVariationModalOpen] = useState<boolean>(false);
  const [variationRequestText, setVariationRequestText] = useState<string>('');
  const [isGeneratingVariation, setIsGeneratingVariation] = useState<boolean>(false);
  const [isAddingToShoppingList, setIsAddingToShoppingList] = useState<boolean>(false);
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
      setIsLoading(true);
      try {
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

  const handleRequestVariation = async () => {
    if (!recipe || !variationRequestText.trim()) return;

    setIsGeneratingVariation(true);
    setError(null); // Limpiar errores previos

    try {
      const generatedRecipe = await generateRecipeVariation(recipe, variationRequestText);

      if (generatedRecipe) {
        // Navegar a la página de creación/edición con la receta generada
        navigate('/app/recipes/new', {
          state: {
            generatedRecipe: {
              ...generatedRecipe,
              // Sugerir un título para la variación
              title: `[Variación] ${recipe.title}`.substring(0, 100), // Limitar longitud si es necesario
            }
          }
        });
        setIsVariationModalOpen(false); // Cerrar modal al éxito
        setVariationRequestText(''); // Limpiar texto
      } else {
        toast.error('No se pudo generar la variación. La IA no devolvió una receta válida.');
      }
    } catch (err) {
      console.error('Error generating recipe variation:', err);
      toast.error('Ocurrió un error al generar la variación. Inténtalo de nuevo.');
      // Podríamos usar setError aquí también si preferimos mostrarlo en la página en lugar de un toast
      // setError('Ocurrió un error al generar la variación. Inténtalo de nuevo.');
    } finally {
      setIsGeneratingVariation(false);
    }
  };


  const handleAddRecipeToShoppingList = async () => {
    if (!recipe || !recipe.ingredients || recipe.ingredients.length === 0) {
      toast.info('No hay ingredientes en esta receta para añadir.');
      return;
    }

    setIsAddingToShoppingList(true);
    try {
      const missingIngredients = await calculateMissingRecipeIngredients(recipe.ingredients);

      if (missingIngredients.length > 0) {
        await addItemsToShoppingList(missingIngredients);
        toast.success(`${missingIngredients.length} ingrediente(s) faltante(s) añadido(s) a la lista de compras.`);
      } else {
        toast.info('Todos los ingredientes necesarios ya están en tu despensa o son básicos. ¡No se añadió nada!');
      }
    } catch (err) {
      console.error('Error adding recipe ingredients to shopping list:', err);
      toast.error('Error al añadir ingredientes a la lista. Inténtalo de nuevo.');
    } finally {
      setIsAddingToShoppingList(false);
    }
  };

  // --- Renderizado ---

  if (isLoading && !recipe) {
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

  // Formatear instrucciones directamente desde el array
  const formattedInstructions = recipe.instructions
    ? (Array.isArray(recipe.instructions)
        ? recipe.instructions
        : (recipe.instructions as string).split('\n'))
        .map((step: string) => step.trim())
        .filter((step: string) => step.length > 0)
        .map((step: string, index: number) => (
          <li key={index} className="mb-2 leading-relaxed">{step}</li>
        ))
    : []; // Devolver array vacío si no es string o no existe

  const totalTime = (recipe.prep_time_minutes ?? 0) + (recipe.cook_time_minutes ?? 0);

  return (
    <div className="bg-slate-50 min-h-screen">
      <div className="container mx-auto max-w-4xl p-4 md:p-6 lg:p-8">
        {/* --- Imagen --- */}
        <div className="mb-8">
          {recipe.image_url ? (
            <img
              src={recipe.image_url ?? undefined}
              alt={recipe.title}
              className="w-full h-auto max-h-[450px] object-cover rounded-lg shadow-md"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-64 bg-slate-200 rounded-lg flex items-center justify-center shadow-md">
              <ImageIcon className="h-16 w-16 text-slate-400" aria-hidden="true" /> {/* Ocultar icono decorativo */}
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
              <Clock className="h-5 w-5 text-emerald-600" />
              <span>Prep: {recipe.prep_time_minutes} min</span>
            </div>
          )}
           {recipe.cook_time_minutes != null && (
            <div className="flex items-center gap-1.5">
              <Clock className="h-5 w-5 text-orange-600" />
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
              <Link to={`/app/recipes/${recipeId}/edit`} className="flex items-center">
                <Edit className="mr-2 h-4 w-4" />
                <span>Editar</span>
              </Link>
            </Button>
            <Dialog open={isVariationModalOpen} onOpenChange={setIsVariationModalOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="flex items-center">
                  <Wand2 className="mr-2 h-4 w-4" />
                  <span>Pedir Variación</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Pedir Variación de Receta</DialogTitle>
                  <DialogDescription>
                    Describe qué tipo de variación quieres para "{recipe?.title}". Por ejemplo: "vegetariana", "para 6 personas", "sin gluten y más picante".
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="variation-request" className="text-right">
                      Petición
                    </Label>
                    <Textarea
                      id="variation-request"
                      value={variationRequestText}
                      onChange={(e) => setVariationRequestText(e.target.value)}
                      placeholder="Ej: Hazla vegetariana y para 2 personas..."
                      className="col-span-3"
                      rows={3}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    type="button"
                    onClick={handleRequestVariation}
                    disabled={isGeneratingVariation || !variationRequestText.trim()}
                  >
                    {isGeneratingVariation ? <Spinner size="sm" className="mr-2" /> : null}
                    Generar Variación
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleAddRecipeToShoppingList} 
              disabled={isAddingToShoppingList || !recipe?.ingredients || recipe.ingredients.length === 0}
              className="flex items-center"
            >
              {isAddingToShoppingList ? (
                <Spinner size="sm" className="mr-2" />
              ) : (
                <ShoppingCart className="mr-2 h-4 w-4" />
              )}
              <span>Añadir a Lista</span>
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


        {/* --- Ingredientes (en Card) --- */}
        {recipe.ingredients && recipe.ingredients.length > 0 && (
          <UICard className="mt-8">
            <UICardHeader>
              <UICardTitle className="text-xl flex items-center gap-2">
                <ChefHat className="h-5 w-5" /> Ingredientes
              </UICardTitle>
            </UICardHeader>
            <UICardContent>
              {/* Revertir a lista simple, más flexible */}
              <ul className="list-disc list-outside space-y-1.5 text-slate-700 pl-5">
                {recipe.ingredients.map((ing: RecipeIngredient, index: number) => (
                  <li key={index}>
                    {/* Mostrar cantidad y unidad si existen, luego el nombre */}
                    {ing.quantity && <span className="font-medium">{ing.quantity}</span>}
                    {ing.unit && <span className="ml-1">{ing.unit}</span>}
                    <span className="ml-2">{ing.ingredient_name}</span>
                  </li>
                ))}
              </ul>
            </UICardContent>
          </UICard>
        )}

        {/* --- Instrucciones (en Card) --- */}
        {formattedInstructions && formattedInstructions.length > 0 && (
          <UICard className="mt-8">
             <UICardHeader>
               <UICardTitle className="text-xl">Instrucciones</UICardTitle>
             </UICardHeader>
             <UICardContent>
               <ol className="list-decimal list-outside space-y-3 text-slate-700 pl-5">
                 {formattedInstructions}
               </ol>
             </UICardContent>
          </UICard>
        )}

        {/* --- Tags (en Card) --- */}
        {recipe.tags && recipe.tags.length > 0 && (
           <UICard className="mt-8">
             <UICardHeader>
                <UICardTitle className="text-xl flex items-center gap-2">
                  <Tag className="h-5 w-5" /> Tags
                </UICardTitle>
             </UICardHeader>
             <UICardContent>
               <div className="flex flex-wrap gap-2">
                 {recipe.tags.map((tag: string, index: number) => (
                   <Badge key={index} variant="secondary" className="font-normal">
                     {tag}
                   </Badge>
                 ))}
               </div>
             </UICardContent>
           </UICard>
        )}

      </div>
    </div>
  );
};

export default RecipeDetailPage;