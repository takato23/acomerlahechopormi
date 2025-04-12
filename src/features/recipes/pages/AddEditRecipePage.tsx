// src/features/recipes/pages/AddEditRecipePage.tsx
import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Loader2, Trash2 } from 'lucide-react'; // Añadir Trash2
import { toast } from 'sonner';
import { useAuth } from '@/features/auth/AuthContext';
import { getRecipeById, updateRecipe } from '@/features/recipes/services/recipeService'; // Mantener getRecipeById y updateRecipe
import type { RecipeIngredient, Recipe, RecipeInputData } from '@/types/recipeTypes';
import type { Ingredient } from '@/types/ingredientTypes'; // Importar Ingredient
import ImageUpload from '@/components/common/ImageUpload'; // Importar ImageUpload
import { IngredientCombobox } from '../components/IngredientCombobox'; // Importar Combobox
import InstructionsEditor from '../components/InstructionsEditor'; // Importar el nuevo editor
import { supabase } from '@/lib/supabaseClient'; // Asegurarse de importar el cliente supabase

// Interfaz para los inputs de ingredientes en el estado local
interface RecipeIngredientInput {
  // localId se usa solo para el key en el map, no se guarda en BD
  localId: string;
  ingredient_id: string | null; // ID del ingrediente maestro seleccionado
  name: string; // Nombre para mostrar (puede venir del ingrediente maestro o ser temporal)
  quantity: string | null;
  unit: string | null;
}

// Definir un tipo local temporal si GeneratedRecipeData no está definido globalmente
// Ajusta los campos según lo que realmente viene en location.state.generatedRecipe
interface GeneratedRecipeDataTemp {
  title?: string | null;
  description?: string | null;
  ingredients?: Array<{ name?: string | null; quantity?: number | string | null; unit?: string | null }> | null;
  instructions?: string[] | string | null;
  prepTimeMinutes?: number | null;
  cookTimeMinutes?: number | null;
  servings?: number | null;
  tags?: string[] | null;
  // ... otros campos si existen
}

const RecipePageContent: React.FC = () => {
  const { recipeId } = useParams<{ recipeId?: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Estados para el formulario
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [ingredients, setIngredients] = useState<RecipeIngredientInput[]>([]);
  const [instructions, setInstructions] = useState<string[]>([]);
  const [prepTime, setPrepTime] = useState('');
  const [cookTime, setCookTime] = useState('');
  const [servings, setServings] = useState<number | string>('');
   const [imageUrl, setImageUrl] = useState<string | null>(null);
   const [tags, setTags] = useState<string>(''); // Tags como string separado por comas

  // --- Lógica de Carga Inicial ---
  useEffect(() => {
    const recipeData = location.state?.generatedRecipe as GeneratedRecipeDataTemp | undefined;

    if (recipeData && !recipeId) {
      setTitle(recipeData.title || '');
      setDescription(recipeData.description || '');

      // Mapear ingredientes de GeneratedRecipeData a RecipeIngredientInput
      setIngredients(recipeData.ingredients?.map((ing, index) => ({
        localId: crypto.randomUUID(), // Generar ID local único
        ingredient_id: null, // No tenemos ID maestro aquí
        name: ing.name || '',
        // Convertir quantity a string para el estado local
        quantity: ing.quantity != null ? String(ing.quantity) : '', 
        unit: ing.unit || null, // Asegurar que sea string | null
      })) || []);

      // Manejar instructions (puede ser string o array desde la generación)
      let instructionsArray: string[] = [];
      if (Array.isArray(recipeData.instructions)) {
        instructionsArray = recipeData.instructions;
      } else if (typeof recipeData.instructions === 'string') {
        instructionsArray = recipeData.instructions.split('\n').filter((line: string) => line.trim() !== '');
      }
      setInstructions(instructionsArray);

      // Convertir tiempos y porciones a string para el estado local
      setPrepTime(recipeData.prepTimeMinutes != null ? String(recipeData.prepTimeMinutes) : '');
      setCookTime(recipeData.cookTimeMinutes != null ? String(recipeData.cookTimeMinutes) : '');
      setServings(recipeData.servings != null ? String(recipeData.servings) : '');
      
      setImageUrl(null); // No hay imagen en receta generada inicialmente
      setTags(recipeData.tags?.join(', ') || ''); // Unir tags si existen

      // Limpiar el estado de location para evitar repoblar si se navega atrás/adelante
      // ¡Importante! Hacer esto DESPUÉS de leer todos los datos necesarios.
      window.history.replaceState({}, document.title);

    } else if (recipeId) {
      setIsLoading(true);
      const loadRecipe = async () => {
           try {
             const fetchedRecipe = await getRecipeById(recipeId);
             if (fetchedRecipe) {
               setTitle(fetchedRecipe.title);
               setDescription(fetchedRecipe.description || '');
               setIngredients(fetchedRecipe.recipe_ingredients?.map(ing => ({
                 localId: crypto.randomUUID(),
                 ingredient_id: ing.ingredient_id || null,
                 name: ing.ingredient_name || '',
                 quantity: String(ing.quantity ?? ''),
                 unit: ing.unit || null,
               })) || []);
               
               // Simplificar manejo de instructions basado en el tipo Recipe
               setInstructions(fetchedRecipe.instructions || []);
               setPrepTime(String(fetchedRecipe.prep_time_minutes ?? ''));
               setCookTime(String(fetchedRecipe.cook_time_minutes ?? ''));
               setServings(fetchedRecipe.servings ?? '');
               setImageUrl(fetchedRecipe.image_url || null);
               setTags(fetchedRecipe.tags?.join(', ') || '');
             } else {
                 toast.error("No se encontró la receta solicitada");
                 navigate('/app/recipes');
             }
           } catch (error) {
             console.error("Error al cargar la receta:", error);
             toast.error("Error al cargar la receta. Inténtalo de nuevo más tarde.");
             navigate('/app/recipes');
           } finally {
             setIsLoading(false);
           }
         };
         loadRecipe();
    }
  }, [location.state, recipeId, navigate]);

  // --- Helpers para Textarea (Eliminados ya que no se usarán) ---
  // const formatIngredientsForTextarea = ...
  // const parseIngredientsFromTextarea = ...


  // --- Handlers para la lista de ingredientes ---
  const handleIngredientChange = (index: number, field: keyof RecipeIngredientInput, value: any) => {
    const newIngredients = [...ingredients];
    if (field === 'ingredient_id' && typeof value === 'object' && value !== null && 'id' in value && 'name' in value) {
      newIngredients[index] = {
          ...newIngredients[index],
          ingredient_id: value.id as string,
          name: value.name as string,
      };
  } else if (field === 'name') {
      newIngredients[index][field] = value as string ?? '';
  } else if (field === 'quantity' || field === 'unit') {
      newIngredients[index][field] = value as string | null;
  }
    setIngredients(newIngredients);
  };

  const addIngredientRow = () => {
    setIngredients([
      ...ingredients,
      { localId: crypto.randomUUID(), ingredient_id: null, name: '', quantity: '', unit: '' }
    ]);
  };

  const removeIngredientRow = (index: number) => {
    const newIngredients = ingredients.filter((_, i) => i !== index);
    setIngredients(newIngredients);
  };


  // Funciones formatInstructionsForTextarea y parseInstructionsFromTextarea eliminadas,
  // ya que InstructionsEditor maneja el array directamente.


  // --- Lógica de Guardado ---
  const handleSaveRecipe = useCallback(async () => {
    if (!user) {
      toast.error("Debes iniciar sesión para guardar recetas.");
      return;
    }
    if (!title.trim()) {
       toast.error("El título de la receta es obligatorio.");
       return;
    }

    setIsSaving(true);
    setSaveError(null);

    const payloadForFunction = {
      title: title.trim(),
      description: description.trim() || null,
      instructions: Array.isArray(instructions) ? instructions.filter((inst: string) => inst.trim() !== '') : [],
      prep_time: prepTime ? parseInt(prepTime, 10) || null : null,
      cook_time: cookTime ? parseInt(cookTime, 10) || null : null,
      servings: servings ? parseInt(String(servings), 10) || null : null,
      ingredients: ingredients
        .filter(ing => ing.name && ing.name.trim() !== '') 
        .map(ing => ({
          name: ing.name.trim(),
          quantity: ing.quantity !== null && ing.quantity.trim() !== '' ? Number(ing.quantity) : null, 
          unit: ing.unit || null,
      })),
      image_url: imageUrl || null,
    };

    try {
      if (recipeId) {
        console.log("Actualizando receta existente:", recipeId);
        
        // Utilizamos el servicio updateRecipe para editar
        const updatedRecipe = await updateRecipe(recipeId, {
          user_id: user.id,
          title,
          description,
          instructions: instructions.length > 0 ? instructions : [],
          prep_time_minutes: prepTime ? parseInt(prepTime, 10) : undefined,
          cook_time_minutes: cookTime ? parseInt(cookTime, 10) : undefined,
          servings: servings ? parseInt(String(servings), 10) : undefined,
          ingredients: ingredients
            .filter(ing => ing.name && ing.name.trim() !== '')
            .map(ing => ({
              name: ing.name.trim(),
              quantity: ing.quantity !== null && ing.quantity.trim() !== '' ? ing.quantity : null,
              unit: ing.unit || null,
            })),
          image_url: imageUrl || undefined,
          tags: Array.isArray(tags) ? tags : undefined
        });
        
        toast.success("Receta actualizada exitosamente!");
        navigate(`/app/recipes/${recipeId}`);
      } else {
        const { data, error: functionError } = await supabase.functions.invoke(
          'create-recipe-handler',
          { body: payloadForFunction }
        );

        if (functionError) {
          throw functionError;
        }

        toast.success("Receta creada exitosamente!");
        const newRecipeId = data?.recipe_id?.id;
        if (newRecipeId) {
            navigate(`/app/recipes/${newRecipeId}`);
        } else {
            navigate('/app/recipes');
        }
      }
    } catch (error: any) {
      console.error("Error al guardar la receta:", error);
      setSaveError(error.message || "Ocurrió un error desconocido.");
      const functionErrorMessage = error?.context?.errorMessage || error.message;
      toast.error(`Error al guardar: ${functionErrorMessage || "Inténtalo de nuevo."}`);
    } finally {
      setIsSaving(false);
    }
  }, [
    user, title, description, ingredients, instructions, prepTime, cookTime, servings, imageUrl, tags, recipeId, navigate, supabase
  ]);


  // --- Renderizado ---
  if (isLoading) {
    return (
       <div className="flex justify-center items-center h-screen">
           <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
           <p className="ml-2 text-slate-600">Cargando receta...</p>
       </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6 lg:p-8">
      <h1 className="text-2xl md:text-3xl font-bold mb-6 text-slate-900">
        {recipeId ? 'Editar Receta' : 'Crear Nueva Receta'}
      </h1>

      {isLoading && (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-12 w-12 animate-spin text-emerald-600" />
          </div>
      )}

      {!isLoading && (
        <form onSubmit={(e) => { e.preventDefault(); handleSaveRecipe(); }}>
          {/* Card para Información General */}
          <Card className="mb-6 bg-white border border-slate-200 shadow-md rounded-lg">
            <CardHeader>
              <CardTitle className="text-slate-900">Información General</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <Label htmlFor="title" className="text-slate-700">Título</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTitle(e.target.value)}
                  placeholder="Nombre de la receta"
                  required
                  disabled={isSaving}
                  className="border-slate-300 focus:ring-emerald-500 focus:border-emerald-500"
                  aria-required="true"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="description" className="text-slate-700">Descripción</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDescription(e.target.value)}
                  placeholder="Una breve descripción de la receta..."
                  disabled={isSaving}
                  className="border-slate-300 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <Label htmlFor="prepTime" className="text-slate-700">Tiempo de Preparación (min)</Label>
                    <Input
                      id="prepTime"
                      type="number"
                      value={prepTime}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPrepTime(e.target.value)}
                      placeholder="Ej: 15"
                      disabled={isSaving}
                      className="border-slate-300 focus:ring-emerald-500 focus:border-emerald-500"
                      min="0"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="cookTime" className="text-slate-700">Tiempo de Cocción (min)</Label>
                    <Input
                      id="cookTime"
                      type="number"
                      value={cookTime}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCookTime(e.target.value)}
                      placeholder="Ej: 30"
                      disabled={isSaving}
                      className="border-slate-300 focus:ring-emerald-500 focus:border-emerald-500"
                      min="0"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="servings" className="text-slate-700">Porciones</Label>
                    <Input
                      id="servings"
                      type="number"
                      value={servings}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setServings(e.target.value)}
                      placeholder="Ej: 4"
                      disabled={isSaving}
                      className="border-slate-300 focus:ring-emerald-500 focus:border-emerald-500"
                      min="1"
                    />
                  </div>
              </div>
            </CardContent>
          </Card>

          {/* Card para Imagen */}
          <Card className="mb-6 bg-white border border-slate-200 shadow-md rounded-lg">
            <CardHeader>
              <CardTitle className="text-slate-900">Imagen</CardTitle>
            </CardHeader>
            <CardContent>
              <ImageUpload
                initialImageUrl={imageUrl}
                onUploadSuccess={(url: string) => setImageUrl(url)}
                bucketName="recipe-images"
                disabled={isSaving}
              />
            </CardContent>
          </Card>

          {/* Card para Ingredientes */}
          <Card className="mb-6 bg-white border border-slate-200 shadow-md rounded-lg">
            <CardHeader>
              <CardTitle id="ingredients-heading" className="text-slate-900">Ingredientes</CardTitle> {/* Añadir ID */}
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {ingredients.map((ingredient, index) => (
                  <div key={ingredient.localId} className="flex items-center space-x-2 bg-slate-50 p-2 rounded border border-slate-200">
                    {/* Combobox para seleccionar ingrediente */}
                    <div className="flex-grow">
                        <Label htmlFor={`ingredient-name-${ingredient.localId}`} className="sr-only">Nombre Ingrediente</Label>
                        <IngredientCombobox
                          value={ingredient.ingredient_id ? { id: ingredient.ingredient_id, name: ingredient.name } : null}
                          onChange={(selectedIngredient) => handleIngredientChange(index, 'ingredient_id', selectedIngredient)}
                          disabled={isSaving}
                          aria-label={`Seleccionar ingrediente ${index + 1}`}
                        />
                        {/* Mostrar input de texto si no hay ingrediente seleccionado o para edición manual? */}
                        {/* Podría ser útil si el combobox permite crear nuevos */}
                        {!ingredient.ingredient_id && (
                          <Input
                            type="text"
                            value={ingredient.name}
                            onChange={(e) => handleIngredientChange(index, 'name', e.target.value)}
                            placeholder="O escribe un nuevo ingrediente"
                            className="mt-1 w-full border-slate-300 focus:ring-emerald-500 focus:border-emerald-500"
                            disabled={isSaving}
                          />
                         )}
                    </div>

                    {/* Input para Cantidad */}
                    <div className="flex-shrink-0">
                       <Label htmlFor={`ingredient-quantity-${ingredient.localId}`} className="sr-only">Cantidad</Label>
                       <Input
                         id={`ingredient-quantity-${ingredient.localId}`}
                         type="text" // Cambiado a text para permitir "al gusto" o fracciones
                         value={ingredient.quantity ?? ''}
                         onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleIngredientChange(index, 'quantity', e.target.value)}
                         placeholder="Cantidad"
                         className="w-24 border-slate-300 focus:ring-emerald-500 focus:border-emerald-500"
                         disabled={isSaving}
                         aria-label={`Cantidad para ${ingredient.name || 'ingrediente'}`}
                       />
                    </div>

                     {/* Input para Unidad */}
                    <div className="flex-shrink-0">
                       <Label htmlFor={`ingredient-unit-${ingredient.localId}`} className="sr-only">Unidad</Label>
                       <Input
                         id={`ingredient-unit-${ingredient.localId}`}
                         type="text"
                         value={ingredient.unit ?? ''}
                         onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleIngredientChange(index, 'unit', e.target.value)}
                         placeholder="Unidad"
                         className="w-24 border-slate-300 focus:ring-emerald-500 focus:border-emerald-500"
                         disabled={isSaving}
                         aria-label={`Unidad para ${ingredient.name || 'ingrediente'}`}
                       />
                    </div>

                    {/* Botón Eliminar */}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeIngredientRow(index)}
                      disabled={isSaving}
                      className="text-red-500 hover:bg-red-100"
                      aria-label="Eliminar ingrediente"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
              <Button
                variant="outline"
                onClick={addIngredientRow}
                disabled={isSaving}
                className="mt-4 border-emerald-500 text-emerald-600 hover:bg-emerald-50"
              >
                Añadir Ingrediente
              </Button>
            </CardContent>
          </Card>

          {/* Card para Instrucciones */}
          <Card className="mb-6 bg-white border border-slate-200 shadow-md rounded-lg">
             <CardHeader>
               <CardTitle id="instructions-heading" className="text-slate-900">Instrucciones</CardTitle>
             </CardHeader>
             <CardContent>
                <InstructionsEditor
                  value={instructions}
                  onChange={setInstructions}
                  disabled={isSaving}
                  aria-labelledby="instructions-heading"
                />
             </CardContent>
          </Card>

          {/* Card para Tags */}
          <Card className="mb-6 bg-white border border-slate-200 shadow-md rounded-lg">
            <CardHeader>
              <CardTitle className="text-slate-900">Etiquetas (Tags)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                <Label htmlFor="tags" className="text-slate-700">Tags (separados por comas)</Label>
                <Input
                  id="tags"
                  value={tags}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTags(e.target.value)}
                  placeholder="Ej: postre, fácil, rápido, vegano"
                  disabled={isSaving}
                  className="border-slate-300 focus:ring-emerald-500 focus:border-emerald-500"
                />
                <p className="text-xs text-slate-500">Ayudan a categorizar y encontrar la receta.</p>
              </div>
            </CardContent>
          </Card>

          {/* Mensaje de Error de Guardado */}
          {saveError && (
            <p className="text-red-500 text-sm text-center mb-4">{saveError}</p>
          )}

          {/* Botones */}
          <div className="flex justify-end space-x-2 mt-4">
            <Button type="button" variant="outline" onClick={() => navigate('/app/recipes')} disabled={isSaving} className="border-slate-300 text-slate-700 hover:bg-slate-50">
              Cancelar
            </Button>
            <Button type="submit" disabled={isSaving || !title.trim()} className="bg-emerald-600 hover:bg-emerald-700 text-white">
              {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {recipeId ? 'Actualizar Receta' : 'Guardar Receta'}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
};

const AddEditRecipePage: React.FC = () => {
  // Puedes añadir lógica aquí si es necesario, como cargar datos globales
  // o envolver con otros providers específicos de esta página.
  return <RecipePageContent />;
};

export default AddEditRecipePage;