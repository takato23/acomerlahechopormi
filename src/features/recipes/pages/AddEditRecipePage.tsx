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
import { addRecipe, updateRecipe, getRecipeById } from '@/features/recipes/services/recipeService'; // Importar getRecipeById
import type { GeneratedRecipeData, RecipeIngredient, Recipe } from '@/types/recipeTypes'; // Importar Recipe
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
      // Mapear ingredientes de GeneratedRecipeData a RecipeIngredientInput
      setIngredients(recipeData.ingredients?.map((ing, index) => ({
        localId: crypto.randomUUID(), // Generar ID local único
        ingredient_id: null, // No tenemos ID maestro aquí
        name: ing.name || '',
        quantity: String(ing.quantity ?? ''),
        unit: ing.unit || null, // Asegurar que sea string | null
      })) || []);
      setInstructions(recipeData.instructions || []);
      setPrepTime(String(recipeData.prepTimeMinutes ?? ''));
      setCookTime(String(recipeData.cookTimeMinutes ?? ''));
      setServings(recipeData.servings ?? '');
      setImageUrl(null); // No hay imagen en receta generada inicialmente
      setTags(recipeData.tags?.join(', ') || ''); // Unir tags si existen

      // Limpiar el estado de location para evitar repoblar si se navega atrás/adelante
      window.history.replaceState({}, document.title)

    } else if (recipeId) {
      // --- Lógica para cargar receta existente (simplificada) ---
      // TODO: Implementar carga real desde el servicio getRecipeById(recipeId).
      // Cuando se haga, asegurar que recipe.instructions (string con \n) se convierta a string[]:
      // const loadedInstructions = loadedRecipe.instructions ? loadedRecipe.instructions.split('\n').filter(line => line.trim() !== '') : [];
      // setInstructions(loadedInstructions);
      console.log("Modo Edición - ID:", recipeId);
      setIsLoading(true);
      // Simulación de carga - Reemplazar con llamada a getRecipeById(recipeId)
      setTimeout(() => {
        const mockRecipe: Partial<Recipe> = { // Usar Partial<Recipe> para simulación
            id: recipeId,
            title: "Receta de Ejemplo Cargada",
            description: "Esta es una descripción cargada.",
            // Usar la estructura de RecipeIngredient para el mock
            ingredients: [{ id: 'mock-ing-1', recipe_id: recipeId, ingredient_id: 'mock-ing-id-1', ingredient_name: "Ingrediente Mock 1", quantity: 1, unit: "unidad" }],
            instructions: ["Paso 1 cargado", "Paso 2 cargado"], // Esto ya es string[]
            prep_time_minutes: 10,
            cook_time_minutes: 25,
            servings: 2,
            image_url: 'https://via.placeholder.com/150', // URL de ejemplo
            tags: ['cargada', 'ejemplo'],
        };
        setTitle(mockRecipe.title || '');
        setDescription(mockRecipe.description || '');
        // Mapear correctamente de RecipeIngredient (mock) a RecipeIngredientInput (local)
        setIngredients(mockRecipe.ingredients?.map(ing => ({
            localId: crypto.randomUUID(), // Generar ID local único
            ingredient_id: ing.ingredient_id || null, // Usar el ID del mock si existe
            name: ing.ingredient_name || '',
            quantity: String(ing.quantity ?? ''),
            unit: ing.unit || null,
        })) || []);
        setInstructions(mockRecipe.instructions || []); // mockRecipe.instructions ya es string[]
        setPrepTime(String(mockRecipe.prep_time_minutes ?? ''));
        setCookTime(String(mockRecipe.cook_time_minutes ?? ''));
        setServings(mockRecipe.servings ?? '');
        setImageUrl(mockRecipe.image_url || null);
        setTags(mockRecipe.tags?.join(', ') || '');
        setIsLoading(false);
      }, 1000);
    }
  }, [location.state, recipeId]);

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
    } else {
        // @ts-ignore // Permitir asignación dinámica, TypeScript puede quejarse aquí
        newIngredients[index][field] = value;
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

    const recipeDataToSave = {
      user_id: user.id,
      title: title.trim(),
      description: description.trim() || null,
      // Mantener instrucciones como array, el servicio se encargará de convertir si es necesario
      // Pasar el array de instrucciones directamente (el servicio se encarga de la conversión a string para la BD)
      // Filtrar pasos vacíos antes de enviar
      instructions: Array.isArray(instructions) ? instructions.filter(inst => inst.trim() !== '') : [],
      prep_time_minutes: prepTime ? parseInt(prepTime, 10) || null : null,
      cook_time_minutes: cookTime ? parseInt(cookTime, 10) || null : null,
      servings: servings ? parseInt(String(servings), 10) || null : null,
      // Mapeo de ingredientes usando la nueva estructura RecipeIngredientInput
      ingredients: ingredients
        .filter(ing => ing.ingredient_id || (ing.name && ing.name.trim() !== '')) // Guardar si tiene ID o nombre
        .map(ing => ({
          // El servicio usará findOrCreateIngredient, así que solo necesitamos el nombre si no hay ID
          name: ing.name.trim(),
          quantity: ing.quantity, // El servicio parseará esto
          unit: ing.unit || null,
          // ingredient_id se manejará en el servicio al llamar a findOrCreateIngredient
          // No necesitamos pasarlo explícitamente aquí si el servicio lo deriva del nombre.
          // Sin embargo, el servicio actual SÍ espera el ID si lo tenemos, así que lo pasamos.
          // CORRECCIÓN: El servicio NO espera el ID, usa findOrCreate. Solo pasamos name, quantity, unit.
      })),
      image_url: imageUrl, // Usar el estado imageUrl
      tags: tags.split(',').map(tag => tag.trim()).filter(tag => tag !== ''),
      is_favorite: false, // Añadir valor por defecto para nueva receta
    };

    try {
      let savedRecipe: Recipe | null = null;
      if (recipeId) {
        // Usar updateRecipe (asegúrate que esté importado y exista en el servicio)
        // El tipo recipeDataToSave ahora debería coincidir con Partial<RecipeInputData>
        // (asumiendo que updateRecipe maneja la conversión de quantity string a number si es necesario)
        savedRecipe = await updateRecipe(recipeId, recipeDataToSave);
        toast.success("Receta actualizada con éxito!");
      } else {
        // Usar addRecipe
        // El tipo recipeDataToSave ahora debería coincidir con RecipeInputData
        savedRecipe = await addRecipe(recipeDataToSave);
        toast.success("Receta guardada con éxito!");
      }
      navigate('/app/recipes');

    } catch (error: any) {
      console.error("Error al guardar receta:", error);
      setSaveError(error.message || "Ocurrió un error desconocido al guardar.");
      toast.error(`Error al guardar: ${error.message || "desconocido"}`);
    } finally {
      setIsSaving(false);
    }
  }, [
    user, title, description, ingredients, instructions, prepTime, cookTime, servings, imageUrl, tags, recipeId, navigate // Añadir imageUrl y tags a dependencias
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
