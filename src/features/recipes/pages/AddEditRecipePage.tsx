// src/features/recipes/pages/AddEditRecipePage.tsx
import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Loader2, Trash2 } from 'lucide-react'; // Añadir Trash2
import { notifyError, notifySuccess } from '@/lib/notifications';
import { useAuth } from '@/features/auth/AuthContext';
import { addRecipe, updateRecipe, getRecipeById } from '@/features/recipes/services/recipeService'; // Importar getRecipeById
import type { GeneratedRecipeData } from '@/types/recipeTypes';
import type { Ingredient } from '@/types/ingredientTypes'; // Importar Ingredient
import ImageUpload from '@/components/common/ImageUpload'; // Importar ImageUpload
import { IngredientCombobox } from '../components/IngredientCombobox'; // Importar Combobox
import InstructionsEditor from '../components/InstructionsEditor'; // Importar el nuevo editor
// Interfaz para los inputs de ingredientes en el estado local
interface RecipeIngredientInput {
  // localId se usa solo para el key en el map, no se guarda en BD
  localId: string;
  ingredient_id: string | null; // ID del ingrediente maestro seleccionado
  name: string; // Nombre para mostrar (puede venir del ingrediente maestro o ser temporal)
  quantity: string | null;
  unit: string | null;
  notes: string;
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
    const recipeData = location.state?.generatedRecipe as GeneratedRecipeData | undefined;

    if (recipeData && !recipeId) {
      console.log("Receta generada recibida, poblando formulario:", recipeData);
      setTitle(recipeData.title || '');
      setDescription(recipeData.description || '');
      setIngredients(
        recipeData.ingredients?.map((ing) => ({
          localId: crypto.randomUUID(),
          ingredient_id: null,
          name: ing.name || '',
          quantity: String(ing.quantity ?? ''),
          unit: ing.unit || '',
          notes: ''
        })) || []
      );
      setInstructions(recipeData.instructions || []);
      setPrepTime(recipeData.prepTimeMinutes != null ? String(recipeData.prepTimeMinutes) : '');
      setCookTime(recipeData.cookTimeMinutes != null ? String(recipeData.cookTimeMinutes) : '');
      setServings(recipeData.servings != null ? String(recipeData.servings) : '');
      setImageUrl(recipeData.imageUrl ?? null);
      setTags(recipeData.tags?.join(', ') || '');
      setSaveError(null);

      window.history.replaceState({}, document.title);
      return;
    }

    if (!recipeId) {
      return;
    }

    let isMounted = true;

    const loadRecipe = async () => {
      setIsLoading(true);
      setSaveError(null);
      try {
        const existingRecipe = await getRecipeById(recipeId);
        if (!isMounted) {
          return;
        }

        if (!existingRecipe) {
          notifyError("No se encontró la receta solicitada.");
          navigate('/app/recipes');
          return;
        }

        setTitle(existingRecipe.title || '');
        setDescription(existingRecipe.description || '');
        const mappedIngredients = (existingRecipe.ingredients || []).map((ing) => ({
          localId: crypto.randomUUID(),
          ingredient_id: ing.ingredient_id || null,
          name: ing.ingredient_name || '',
          quantity: ing.quantity !== null && ing.quantity !== undefined ? String(ing.quantity) : '',
          unit: ing.unit || '',
          notes: ing.notes ?? ''
        }));
        setIngredients(
          mappedIngredients.length > 0
            ? mappedIngredients
            : [{ localId: crypto.randomUUID(), ingredient_id: null, name: '', quantity: '', unit: '', notes: '' }]
        );
        setInstructions(Array.isArray(existingRecipe.instructions) ? existingRecipe.instructions : []);
        setPrepTime(existingRecipe.prep_time_minutes != null ? String(existingRecipe.prep_time_minutes) : '');
        setCookTime(existingRecipe.cook_time_minutes != null ? String(existingRecipe.cook_time_minutes) : '');
        setServings(existingRecipe.servings != null ? String(existingRecipe.servings) : '');
        setImageUrl(existingRecipe.image_url || null);
        setTags(existingRecipe.tags?.join(', ') || '');
      } catch (error: any) {
        console.error("Error al cargar la receta:", error);
        if (isMounted) {
          const message = error?.message || 'No se pudo cargar la receta seleccionada.';
          setSaveError(message);
          notifyError(message);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadRecipe();

    return () => {
      isMounted = false;
    };
  }, [location.state, recipeId, navigate]);

  // --- Helpers para Textarea (Eliminados ya que no se usarán) ---
  // const formatIngredientsForTextarea = ...
  // const parseIngredientsFromTextarea = ...


  // --- Handlers para la lista de ingredientes ---
  const handleIngredientChange = (index: number, field: keyof RecipeIngredientInput, value: any) => {
    const newIngredients = [...ingredients];
    // Si cambia el ingrediente desde el combobox, 'value' será el objeto Ingredient completo
  if (field === 'ingredient_id' && typeof value === 'object' && value !== null) {
        newIngredients[index] = {
            ...newIngredients[index],
            ingredient_id: value.id,
            name: value.name, // Actualizar el nombre para mostrar
        };
    } else if (field === 'notes') {
        newIngredients[index] = {
            ...newIngredients[index],
            notes: typeof value === 'string' ? value : ''
        };
    } else {
        newIngredients[index] = {
            ...newIngredients[index],
            [field]: value
        } as RecipeIngredientInput;
    }
    setIngredients(newIngredients);
  };

  const addIngredientRow = () => {
    setIngredients([
      ...ingredients,
      { localId: crypto.randomUUID(), ingredient_id: null, name: '', quantity: '', unit: '', notes: '' }
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
      notifyError('Iniciá sesión para guardar recetas.');
      return;
    }

    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      const message = "El título de la receta es obligatorio.";
      setSaveError(message);
      notifyError(message);
      return;
    }

    const hasAtLeastOneIngredient = ingredients.some(
      (ing) => (ing.name && ing.name.trim() !== '') || ing.ingredient_id
    );
    if (!hasAtLeastOneIngredient) {
      const message = "Añade al menos un ingrediente con nombre.";
      setSaveError(message);
      notifyError(message);
      return;
    }

    const cleanedIngredients = ingredients
      .filter((ing) => ing.ingredient_id || (ing.name && ing.name.trim() !== ''))
      .map((ing) => {
        const trimmedName = ( ing.name || '' ).trim();
        const rawQuantity = typeof ing.quantity === 'string' ? ing.quantity.trim() : ing.quantity;
        const normalizedQuantity = rawQuantity === '' || rawQuantity === null || rawQuantity === undefined ? null : rawQuantity;
        const rawUnit = typeof ing.unit === 'string' ? ing.unit.trim() : '';
        return {
          name: trimmedName,
          quantity: normalizedQuantity,
          unit: rawUnit ? rawUnit : null,
        };
      });

    if (cleanedIngredients.length === 0) {
      const message = "Añade al menos un ingrediente con nombre.";
      setSaveError(message);
      notifyError(message);
      return;
    }

    const parseNonNegative = (value: string) => {
      const normalized = value.trim();
      if (normalized === '') return null;
      const parsed = Number(normalized);
      if (!Number.isFinite(parsed) || parsed < 0) return Number.NaN;
      return Math.round(parsed);
    };

    const parsePositiveInt = (value: string) => {
      const normalized = value.trim();
      if (normalized === '') return null;
      const parsed = Number(normalized);
      if (!Number.isFinite(parsed) || parsed < 1) return Number.NaN;
      return Math.floor(parsed);
    };

    const prepMinutes = parseNonNegative(String(prepTime));
    if (Number.isNaN(prepMinutes)) {
      const message = "El tiempo de preparación debe ser un número mayor o igual a 0.";
      setSaveError(message);
      notifyError(message);
      return;
    }

    const cookMinutes = parseNonNegative(String(cookTime));
    if (Number.isNaN(cookMinutes)) {
      const message = "El tiempo de cocción debe ser un número mayor o igual a 0.";
      setSaveError(message);
      notifyError(message);
      return;
    }

    const servingsValue = parsePositiveInt(String(servings));
    if (Number.isNaN(servingsValue)) {
      const message = "Las porciones deben ser un número entero igual o mayor a 1.";
      setSaveError(message);
      notifyError(message);
      return;
    }

    const cleanedInstructions = Array.isArray(instructions)
      ? instructions.map((inst) => inst.trim()).filter((inst) => inst !== '')
      : [];

    const rawTags = tags
      .split(',')
      .map((tag) => tag.trim())
      .filter((tag) => tag !== '');
    const uniqueTags: string[] = [];
    const seenTags = new Set<string>();
    rawTags.forEach((tag) => {
      const key = tag.toLowerCase();
      if (!seenTags.has(key)) {
        seenTags.add(key);
        uniqueTags.push(tag);
      }
    });

    setIsSaving(true);
    setSaveError(null);

    const recipeDataToSave = {
      user_id: user.id,
      title: trimmedTitle,
      description: description.trim() || null,
      instructions: cleanedInstructions,
      prep_time_minutes: prepMinutes,
      cook_time_minutes: cookMinutes,
      servings: servingsValue,
      ingredients: cleanedIngredients,
      image_url: imageUrl,
      tags: uniqueTags,
    };

    try {
      if (recipeId) {
        await updateRecipe(recipeId, recipeDataToSave);
        notifySuccess('Actualizamos la receta.');
      } else {
        await addRecipe(recipeDataToSave);
        notifySuccess('Guardamos la receta.');
      }
      navigate('/app/recipes');
    } catch (error: any) {
      console.error("Error al guardar receta:", error);
      const message = error?.message || "Ocurrió un error desconocido al guardar.";
      setSaveError(message);
      notifyError(`No pudimos guardar la receta: ${message}`);
    } finally {
      setIsSaving(false);
    }
  }, [
    user,
    title,
    description,
    ingredients,
    instructions,
    prepTime,
    cookTime,
    servings,
    imageUrl,
    tags,
    recipeId,
    navigate,
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
    <div className="container mx-auto p-4 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6 text-slate-900">
        {recipeId ? 'Editar Receta' : 'Crear Nueva Receta'}
      </h1>
      <Card className="mb-6 bg-white border border-slate-200 shadow-md rounded-lg">
        <CardHeader>
          <CardTitle className="text-slate-900">Información General</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Título */}
            <div className="space-y-1">
              <Label htmlFor="title" className="text-slate-700">Título</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ej: Tarta de Manzana Simple"
                disabled={isSaving}
                className="border-slate-300 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>

            {/* Descripción */}
            <div className="space-y-1">
              <Label htmlFor="description" className="text-slate-700">Descripción</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Una breve descripción de la receta..."
                disabled={isSaving}
                className="border-slate-300 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>

            {/* Tiempos y Porciones */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <Label htmlFor="prepTimeMinutes" className="text-slate-700">Tiempo Prep. (min)</Label>
                <Input
                  id="prepTimeMinutes"
                  type="number"
                  value={prepTime}
                  onChange={(e) => setPrepTime(e.target.value)}
                  placeholder="Ej: 15"
                  disabled={isSaving}
                  min="0"
                  className="border-slate-300 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="cookTimeMinutes" className="text-slate-700">Tiempo Cocción (min)</Label>
                <Input
                  id="cookTimeMinutes"
                  type="number"
                  value={cookTime}
                  onChange={(e) => setCookTime(e.target.value)}
                  placeholder="Ej: 30"
                  disabled={isSaving}
                   min="0"
                   className="border-slate-300 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="servings" className="text-slate-700">Porciones</Label>
                <Input
                  id="servings"
                  type="number"
                  value={servings}
                  onChange={(e) => setServings(e.target.value)}
                  placeholder="Ej: 4"
                  disabled={isSaving}
                   min="1"
                   className="border-slate-300 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Card para Imagen */}
      <Card className="mb-6 bg-white border border-slate-200 shadow-md rounded-lg">
        <CardHeader>
          <CardTitle className="text-slate-900">Imagen de la Receta</CardTitle>
        </CardHeader>
        <CardContent>
          <ImageUpload
            bucketName="recipe_images" // Nombre del bucket definido en la migración
            initialImageUrl={imageUrl}
            onUploadSuccess={(url) => {
              console.log("Imagen subida, URL:", url);
              setImageUrl(url);
            }}
            onRemoveImage={() => {
              console.log("Imagen eliminada");
              setImageUrl(null);
            }}
            onUploadError={(error) => {
              console.error("Error en ImageUpload:", error);
              // El toast de error ya se muestra dentro del componente ImageUpload
            }}
            disabled={isSaving}
            label="Selecciona o arrastra una imagen"
          />
        </CardContent>
      </Card>

      {/* Card para Ingredientes (Nueva UI) */}
      <Card className="mb-6 bg-white border border-slate-200 shadow-md rounded-lg">
        <CardHeader>
          <CardTitle id="ingredients-heading" className="text-slate-900">Ingredientes</CardTitle> {/* Añadir ID */}
        </CardHeader>
        <CardContent>
          <div className="space-y-3" aria-labelledby="ingredients-heading"> {/* Asociar con heading */}
            {ingredients.map((ingredient, index) => (
              <div key={ingredient.localId} className="flex items-center space-x-2">
                {/* Combobox para Nombre/ID */}
                <div className="flex-grow">
                   <IngredientCombobox
                     value={ingredient.ingredient_id ? { id: ingredient.ingredient_id, name: ingredient.name } as Ingredient : null}
                     onChange={(selected) => handleIngredientChange(index, 'ingredient_id', selected)}
                     placeholder="Buscar o escribir nombre..."
                     disabled={isSaving}
                   />
                   {/* Input oculto o lógica para manejar nombre si no se selecciona ID */}
                   {/* Input para nombre manual si no se selecciona del combobox */}
                   {!ingredient.ingredient_id && (
                     <>
                       <Label htmlFor={`ingredient-name-${ingredient.localId}`} className="sr-only">Nombre del ingrediente (manual)</Label>
                       <Input
                         id={`ingredient-name-${ingredient.localId}`}
                         type="text"
                         value={ingredient.name}
                         onChange={(e) => handleIngredientChange(index, 'name', e.target.value)}
                         placeholder="Nombre (si no se selecciona)"
                         className="mt-1 text-xs border-slate-300 focus:ring-emerald-500 focus:border-emerald-500"
                         disabled={isSaving}
                         aria-label="Nombre del ingrediente (manual)" // Aria-label como alternativa si el label oculto falla
                       />
                     </>
                   )}
                </div>

                {/* Input para Cantidad */}
                {/* Input para Cantidad */}
                <div> {/* Contenedor para Label + Input */}
                  <Label htmlFor={`ingredient-quantity-${ingredient.localId}`} className="sr-only">Cantidad</Label>
                  <Input
                    id={`ingredient-quantity-${ingredient.localId}`}
                    type="text" // Usar text para permitir fracciones o rangos como "1/2" o "1-2"
                    value={ingredient.quantity ?? ''}
                    onChange={(e) => handleIngredientChange(index, 'quantity', e.target.value)}
                    placeholder="Cant."
                    className="w-20 border-slate-300 focus:ring-emerald-500 focus:border-emerald-500"
                    disabled={isSaving}
                    aria-label={`Cantidad para ${ingredient.name || 'ingrediente'}`} // Aria-label más específico
                  />
                </div>

                {/* Input para Unidad */}
                {/* Input para Unidad */}
                 <div> {/* Contenedor para Label + Input */}
                   <Label htmlFor={`ingredient-unit-${ingredient.localId}`} className="sr-only">Unidad</Label>
                   <Input
                    id={`ingredient-unit-${ingredient.localId}`}
                    type="text"
                    value={ingredient.unit ?? ''}
                    onChange={(e) => handleIngredientChange(index, 'unit', e.target.value)}
                    placeholder="Unidad"
                    className="w-24 border-slate-300 focus:ring-emerald-500 focus:border-emerald-500"
                    disabled={isSaving}
                    aria-label={`Unidad para ${ingredient.name || 'ingrediente'}`} // Aria-label más específico
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
           <CardTitle id="instructions-heading" className="text-slate-900">Instrucciones</CardTitle> {/* Añadir ID */}
         </CardHeader>
         <CardContent>
            <InstructionsEditor
              value={instructions}
              onChange={setInstructions} // Pasar directamente el setter del estado
              disabled={isSaving}
              aria-labelledby="instructions-heading" // Asociar con heading
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
              onChange={(e) => setTags(e.target.value)}
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
         <Button variant="outline" onClick={() => navigate('/app/recipes')} disabled={isSaving} className="border-slate-300 text-slate-700 hover:bg-slate-50">
           Cancelar
         </Button>
         <Button onClick={handleSaveRecipe} disabled={isSaving || !title.trim()} className="bg-emerald-600 hover:bg-emerald-700 text-white">
           {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
           {recipeId ? 'Actualizar Receta' : 'Guardar Receta'}
         </Button>
      </div>

    </div>
  );
};

const AddEditRecipePage: React.FC = () => {
  return <RecipePageContent />;
};

export default AddEditRecipePage;
