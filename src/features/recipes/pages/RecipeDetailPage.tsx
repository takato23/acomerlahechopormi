import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/Spinner';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card as UICard, CardContent as UICardContent, CardHeader as UICardHeader, CardTitle as UICardTitle } from "@/components/ui/card"; // Renombrar
import { Edit, Trash2, Clock, Users, AlertCircle, Image as ImageIcon, ChefHat, Tag, Globe, Lock, Share2 } from 'lucide-react'; // Añadir Share2
import { ShoppingCart } from 'lucide-react'; // Icono para lista de compras
import { Wand2 } from 'lucide-react'; // Icono para variación
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner'; // Asumiendo que sonner está instalado para toasts
import { generateRecipeVariation } from '@/features/recipes/generationService'; // Ajustar path si es necesario
import { getRecipeById, deleteRecipe, toggleRecipePublic } from '@/features/recipes/services/recipeService';
import { addItemsToShoppingList, calculateMissingRecipeIngredients } from '@/features/shopping-list/services/shoppingListService';
import { useRecipeStore } from '@/stores/recipeStore';
import { Recipe, RecipeIngredient } from '@/types/recipeTypes';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/features/auth/AuthContext';

// Helper para validar y formatear info nutricional
const formatNutrient = (value: number | undefined | null, unit: string, multiplier: number = 1, originalServings: number | null = 1): string => {
  if (value == null || isNaN(value) || !originalServings || originalServings <= 0) {
    return 'No disponible';
  }
  const perServing = value / originalServings;
  const scaledValue = perServing * multiplier;
  // Mostrar 1 decimal, excepto para calorías que suelen ser enteras
  const decimals = unit === 'kcal' ? 0 : 1;
  const formattedValue = scaledValue.toFixed(decimals);
  return `${formattedValue}${unit}`;
};

const RecipeDetailPage: React.FC = () => {
  const { recipeId } = useParams<{ recipeId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { deleteRecipe: removeRecipeFromStore } = useRecipeStore();

  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [isVariationModalOpen, setIsVariationModalOpen] = useState<boolean>(false);
  const [variationRequestText, setVariationRequestText] = useState<string>('');
  const [isGeneratingVariation, setIsGeneratingVariation] = useState<boolean>(false);
  const [isAddingToShoppingList, setIsAddingToShoppingList] = useState<boolean>(false);
  const [isTogglingPublic, setIsTogglingPublic] = useState<boolean>(false);
  const [isSharing, setIsSharing] = useState<boolean>(false);
  const [servingsMultiplier, setServingsMultiplier] = useState<number>(1);
  const [originalServings, setOriginalServings] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

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
          setOriginalServings(fetchedRecipe.servings ?? null);
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
    if (!recipeId || !recipe || isDeleting) return;

    if (window.confirm(`¿Estás seguro de que quieres eliminar la receta "${recipe.title}"?`)) {
      setIsDeleting(true);
      try {
        await deleteRecipe(recipeId);
        removeRecipeFromStore(recipeId);
        toast.success("Receta eliminada con éxito");
        navigate('/app/recipes');
      } catch (err) {
        console.error('[RecipeDetailPage] Error deleting recipe:', err);
        toast.error(err instanceof Error ? err.message : 'Error al eliminar la receta.');
        setIsDeleting(false);
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
    if (!recipe || !recipe.recipe_ingredients || recipe.recipe_ingredients.length === 0) {
      toast.info('No hay ingredientes en esta receta para añadir.');
      return;
    }

    setIsAddingToShoppingList(true);
    try {
      const missingIngredients = await calculateMissingRecipeIngredients(recipe, []);

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

  const handleTogglePublic = async () => {
    if (!recipe || !recipeId) return;
    
    setIsTogglingPublic(true);
    try {
      const updatedRecipe = await toggleRecipePublic(recipeId, !recipe.is_public);
      setRecipe(updatedRecipe);
      toast.success(updatedRecipe.is_public 
        ? 'Receta marcada como pública. Ahora todos pueden verla.' 
        : 'Receta marcada como privada. Solo tú puedes verla.');
    } catch (err) {
      console.error('Error al cambiar visibilidad de la receta:', err);
      toast.error('No se pudo cambiar la visibilidad de la receta. Inténtalo de nuevo.');
    } finally {
      setIsTogglingPublic(false);
    }
  };

  // Función para compartir la receta
  const handleShareRecipe = async () => {
    if (!recipe) return;
    
    setIsSharing(true);
    try {
      // Si la receta no es pública, preguntamos al usuario si quiere hacerla pública
      if (!recipe.is_public && recipe.user_id === user?.id) {
        const wantToMakePublic = window.confirm(
          "Esta receta es privada. ¿Quieres hacerla pública para poder compartirla?"
        );
        
        if (wantToMakePublic) {
          const updatedRecipe = await toggleRecipePublic(recipeId!, true);
          setRecipe(updatedRecipe);
          toast.success("¡Receta marcada como pública!");
        } else {
          setIsSharing(false);
          return; // El usuario no quiere hacerla pública
        }
      }
      
      // Crear URL completa para compartir
      const shareUrl = `${window.location.origin}/app/recipes/${recipeId}`;
      
      // Intentar usar la API de compartir si está disponible
      if (navigator.share) {
        await navigator.share({
          title: recipe.title,
          text: `Mira esta receta: ${recipe.title}`,
          url: shareUrl
        });
        toast.success("¡Receta compartida!");
      } else {
        // Fallback: copiar al portapapeles
        await navigator.clipboard.writeText(shareUrl);
        toast.success("Enlace copiado al portapapeles");
      }
    } catch (err) {
      console.error('Error al compartir:', err);
      toast.error("No se pudo compartir la receta");
    } finally {
      setIsSharing(false);
    }
  };

  // Función para escalar la cantidad de un ingrediente
  const scaleIngredientQuantity = (quantity: number | undefined | null, multiplier: number): string => {
    if (quantity == null) return '';
    
    const scaledQuantity = quantity * multiplier;
    
    // Formatear fracciones comunes para mejor legibilidad
    if (scaledQuantity === 0.25) return '¼';
    if (scaledQuantity === 0.5) return '½';
    if (scaledQuantity === 0.75) return '¾';
    if (scaledQuantity === 1.5) return '1½';
    if (scaledQuantity === 2.5) return '2½';
    
    // Para otros valores, mantener 1 decimal si es necesario
    return Number.isInteger(scaledQuantity) 
      ? scaledQuantity.toString() 
      : scaledQuantity.toFixed(1).replace(/\.0$/, '');
  };

  // Función para incrementar/decrementar porciones
  const updateServings = (increment: boolean) => {
    if (!recipe || !originalServings) return;
    
    const newMultiplier = increment 
      ? servingsMultiplier + 0.5 
      : Math.max(0.5, servingsMultiplier - 0.5);
    
    setServingsMultiplier(newMultiplier);
  };

  // --- Cálculo de instrucciones formateadas ---
  // Memoizar el cálculo para evitar recalcular en cada render
  const formattedInstructions = React.useMemo(() => {
    if (!recipe?.instructions) {
      return [];
    }
    // Asegurarse de que recipe.instructions es un array antes de mapear
    if (Array.isArray(recipe.instructions)) {
      return recipe.instructions.map((step, index) => (
        <li key={index}>{step}</li>
      ));
    } else {
      console.warn('recipe.instructions no es un array:', recipe.instructions);
      return [<li key="invalid">Formato de instrucciones inválido.</li>]; // Mensaje de error o vacío
    }
  }, [recipe?.instructions]);

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
              <span>Porciones: 
                <div className="inline-flex items-center ml-2 border rounded-md">
                  <button 
                    onClick={() => updateServings(false)}
                    className="px-2 py-1 border-r focus:outline-none" 
                    disabled={servingsMultiplier <= 0.5}
                    aria-label="Reducir porciones"
                  >–</button>
                  <span className="px-2">{Math.round(originalServings! * servingsMultiplier)}</span>
                  <button 
                    onClick={() => updateServings(true)} 
                    className="px-2 py-1 border-l focus:outline-none"
                    aria-label="Aumentar porciones"
                  >+</button>
                </div>
              </span>
            </div>
          )}
        </div>

         {/* --- Botones de Acción --- */}
         <div className="flex flex-col md:flex-row gap-2 md:gap-3 mb-8">
            <Button asChild variant="outline" size="sm" className="justify-center">
              <Link to={`/app/recipes/${recipeId}/edit`} className="flex items-center">
                <Edit className="mr-2 h-4 w-4" />
                <span>Editar</span>
              </Link>
            </Button>
            <Dialog open={isVariationModalOpen} onOpenChange={setIsVariationModalOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="flex items-center justify-center">
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
              disabled={isAddingToShoppingList || !recipe?.recipe_ingredients || recipe.recipe_ingredients.length === 0}
              className="flex items-center justify-center"
            >
              {isAddingToShoppingList ? (
                <Spinner size="sm" className="mr-2" />
              ) : (
                <ShoppingCart className="mr-2 h-4 w-4" />
              )}
              <span>Añadir a Lista</span>
            </Button>
            {recipe.user_id === user?.id && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleTogglePublic}
                disabled={isTogglingPublic}
                className="flex items-center justify-center"
              >
                {isTogglingPublic ? (
                  <Spinner size="sm" className="mr-2" />
                ) : recipe.is_public ? (
                  <Globe className="mr-2 h-4 w-4 text-green-600" />
                ) : (
                  <Lock className="mr-2 h-4 w-4" />
                )}
                <span>{recipe.is_public ? 'Pública' : 'Privada'}</span>
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={handleShareRecipe}
              disabled={isSharing}
              className="flex items-center justify-center"
            >
              {isSharing ? (
                <Spinner size="sm" className="mr-2" />
              ) : (
                <Share2 className="mr-2 h-4 w-4" />
              )}
              <span>Compartir</span>
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? <Spinner size="sm" className="mr-2" /> : <Trash2 className="mr-2 h-4 w-4" />}
              {isDeleting ? 'Eliminando...' : 'Eliminar'}
            </Button>
         </div>


        {/* --- Ingredientes (en Card) --- */}
        {recipe.recipe_ingredients && recipe.recipe_ingredients.length > 0 && (
          <UICard className="mt-8">
            <UICardHeader>
              <UICardTitle className="text-xl flex items-center gap-2">
                <ChefHat className="h-5 w-5" /> Ingredientes
              </UICardTitle>
            </UICardHeader>
            <UICardContent>
              {/* Revertir a lista simple, más flexible */}
              <ul className="list-disc list-outside space-y-1.5 text-slate-700 pl-5">
                {recipe.recipe_ingredients.map((ing: RecipeIngredient, index: number) => (
                  <li key={index}>
                    {/* Mostrar cantidad y unidad si existen, luego el nombre */}
                    {ing.quantity && (
                      <span className="font-medium">
                        {scaleIngredientQuantity(ing.quantity, servingsMultiplier)}
                      </span>
                    )}
                    {ing.unit && <span className="ml-1">{ing.unit}</span>}
                    <span className="ml-2">{ing.ingredient_name}</span>
                  </li>
                ))}
              </ul>
            </UICardContent>
          </UICard>
        )}

        {/* --- Instrucciones (en Card) --- */}
        {formattedInstructions.length > 0 && (
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

        {/* --- Información Nutricional (en Card) --- */}
        {recipe.nutritional_info && (
          <UICard className="mt-8">
            <UICardHeader>
              <UICardTitle className="text-xl flex items-center gap-2">
                <AlertCircle className="h-5 w-5" /> Información Nutricional
              </UICardTitle>
              <p className="text-sm text-slate-500">
                {servingsMultiplier !== 1 ? 
                  'Valores ajustados por porción según cantidad seleccionada' : 
                  'Valores por porción'}
              </p>
            </UICardHeader>
            <UICardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div className="bg-slate-50 p-3 rounded-md">
                  <p className="text-sm text-slate-500">Calorías</p>
                  <p className="text-lg font-medium">
                    {formatNutrient(recipe.nutritional_info.calories, 'kcal', servingsMultiplier, originalServings)}
                  </p>
                </div>
                <div className="bg-slate-50 p-3 rounded-md">
                  <p className="text-sm text-slate-500">Proteínas</p>
                  <p className="text-lg font-medium">
                    {formatNutrient(recipe.nutritional_info.protein, 'g', servingsMultiplier, originalServings)}
                  </p>
                </div>
                <div className="bg-slate-50 p-3 rounded-md">
                  <p className="text-sm text-slate-500">Carbohidratos</p>
                  <p className="text-lg font-medium">
                    {formatNutrient(recipe.nutritional_info.carbs, 'g', servingsMultiplier, originalServings)}
                  </p>
                </div>
                <div className="bg-slate-50 p-3 rounded-md">
                  <p className="text-sm text-slate-500">Grasas</p>
                  <p className="text-lg font-medium">
                    {formatNutrient(recipe.nutritional_info.fat, 'g', servingsMultiplier, originalServings)}
                  </p>
                </div>
                <div className="bg-slate-50 p-3 rounded-md">
                  <p className="text-sm text-slate-500">Fibra</p>
                  <p className="text-lg font-medium">
                    {formatNutrient(recipe.nutritional_info.fiber, 'g', servingsMultiplier, originalServings)}
                  </p>
                </div>
                <div className="bg-slate-50 p-3 rounded-md">
                  <p className="text-sm text-slate-500">Azúcar</p>
                  <p className="text-lg font-medium">
                    {formatNutrient(recipe.nutritional_info.sugar, 'g', servingsMultiplier, originalServings)}
                  </p>
                </div>
              </div>
            </UICardContent>
          </UICard>
        )}

      </div>
    </div>
  );
};

export default RecipeDetailPage;