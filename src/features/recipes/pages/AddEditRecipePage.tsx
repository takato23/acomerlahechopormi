// src/features/recipes/pages/AddEditRecipePage.tsx
import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/features/auth/AuthContext';
import { addRecipe } from '@/features/recipes/services/recipeService';
import type { GeneratedRecipeData, RecipeIngredient } from '@/types/recipeTypes';

// Interfaz para los ingredientes en el estado local
interface IngredientState {
  name: string;
  quantity: string | null; // Simplificado a string | null
  unit: string | null;     // Hacerlo no opcional, explícitamente null si no existe
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
  const [ingredients, setIngredients] = useState<IngredientState[]>([]);
  const [instructions, setInstructions] = useState<string[]>([]);
  const [prepTime, setPrepTime] = useState('');
  const [cookTime, setCookTime] = useState('');
  const [servings, setServings] = useState<number | string>('');

  // --- Lógica de Carga Inicial ---
  useEffect(() => {
    const recipeData = location.state?.generatedRecipe as GeneratedRecipeData | undefined;
    if (recipeData && !recipeId) {
      console.log("Receta generada recibida, poblando formulario:", recipeData);
      setTitle(recipeData.title || '');
      setDescription(recipeData.description || '');
      // Mapear ingredientes de GeneratedRecipeData a IngredientState (asegurando que quantity sea string)
      setIngredients(recipeData.ingredients?.map(ing => ({
        name: ing.name || '',
        quantity: String(ing.quantity ?? ''), // Convertir a string explícitamente
        unit: ing.unit || '', // unit es string | null
      })) || []);
      setInstructions(recipeData.instructions || []);
      setPrepTime(String(recipeData.prepTimeMinutes ?? ''));
      setCookTime(String(recipeData.cookTimeMinutes ?? ''));
      setServings(recipeData.servings ?? '');

      window.history.replaceState({}, document.title)

    } else if (recipeId) {
      console.log("Modo Edición - ID:", recipeId);
      // TODO: Lógica para cargar receta existente
    }
  }, [location.state, recipeId]);

  // --- Helpers para Textarea (simplificado) ---
  const formatIngredientsForTextarea = (ings: IngredientState[]): string => {
    return ings.filter(ing => ing.name && ing.name.trim() !== '')
               .map(ing => `${ing.quantity || ''} ${ing.unit || ''} ${ing.name}`.trim()).join('\n');
  };

   // Función para parsear ingredientes desde textarea (CORREGIDA)
   const parseIngredientsFromTextarea = (text: string): IngredientState[] => {
     const ingredientsResult: IngredientState[] = [];
     const lines = text.split('\n');

     for (const line of lines) {
       const trimmedLine = line.trim();
       if (!trimmedLine) continue;

       const parts = trimmedLine.split(' ');
       let quantity: string | null = null;
       let unit: string | null = null;
       let name = '';

       // Heurística simple (mejorable con regex o parseo más robusto)
       if (parts.length >= 3 && !isNaN(parseFloat(parts[0].replace(',', '.')))) {
           quantity = parts[0]; // quantity es string
           if (isNaN(parseFloat(parts[1].replace(',', '.')))) {
               unit = parts[1];
               name = parts.slice(2).join(' ');
           } else {
               unit = null;
               name = parts.slice(1).join(' ');
           }
       } else if (parts.length >= 2 && isNaN(parseFloat(parts[0].replace(',', '.')))) {
            quantity = null;
            unit = parts[0];
            name = parts.slice(1).join(' ');
       } else {
           quantity = null;
           unit = null;
           name = trimmedLine;
       }

       if (name.trim()) {
         ingredientsResult.push({
           quantity: quantity, // quantity es string | null
           unit: unit,         // unit es string | null
           name: name.trim(),
         });
       }
     }
     return ingredientsResult; // Devolver directamente el array filtrado y tipado
   };


  const formatInstructionsForTextarea = (insts: string[]): string => {
    return insts.map((inst, index) => `${index + 1}. ${inst}`).join('\n');
  };

   const parseInstructionsFromTextarea = (text: string): string[] => {
     return text.split('\n')
       .map(line => line.replace(/^\d+\.\s*/, '').trim())
       .filter(line => line);
   };


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
      instructions: Array.isArray(instructions) ? instructions : [],
      prep_time_minutes: prepTime ? parseInt(prepTime, 10) || null : null,
      cook_time_minutes: cookTime ? parseInt(cookTime, 10) || null : null,
      servings: servings ? parseInt(String(servings), 10) || null : null,
      ingredients: ingredients.filter(ing => ing.name && ing.name.trim() !== '').map(ing => ({
         name: ing.name.trim(),
         quantity: ing.quantity, // Pasar como string | null, el servicio lo parseará
         unit: ing.unit || null,
      })),
      image_url: null,
      tags: null,
    };

    try {
      if (recipeId) {
        console.warn("Actualización de receta no implementada.");
        toast.info("La actualización de recetas aún no está implementada.");
      } else {
        await addRecipe(recipeDataToSave as any);
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
    user, title, description, ingredients, instructions, prepTime, cookTime, servings, recipeId, navigate
  ]);


  // --- Renderizado ---
  // if (isLoading) { ... } // TODO

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">
        {recipeId ? 'Editar Receta' : 'Crear Nueva Receta'}
      </h1>
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Información General</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Título */}
            <div className="space-y-1">
              <Label htmlFor="title">Título</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ej: Tarta de Manzana Simple"
                disabled={isSaving}
              />
            </div>

            {/* Descripción */}
            <div className="space-y-1">
              <Label htmlFor="description">Descripción</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Una breve descripción de la receta..."
                disabled={isSaving}
              />
            </div>

            {/* Tiempos y Porciones */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <Label htmlFor="prepTimeMinutes">Tiempo Prep. (min)</Label>
                <Input
                  id="prepTimeMinutes"
                  type="number"
                  value={prepTime}
                  onChange={(e) => setPrepTime(e.target.value)}
                  placeholder="Ej: 15"
                  disabled={isSaving}
                  min="0"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="cookTimeMinutes">Tiempo Cocción (min)</Label>
                <Input
                  id="cookTimeMinutes"
                  type="number"
                  value={cookTime}
                  onChange={(e) => setCookTime(e.target.value)}
                  placeholder="Ej: 30"
                  disabled={isSaving}
                   min="0"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="servings">Porciones</Label>
                <Input
                  id="servings"
                  type="number"
                  value={servings}
                  onChange={(e) => setServings(e.target.value)}
                  placeholder="Ej: 4"
                  disabled={isSaving}
                   min="1"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Card para Ingredientes */}
      <Card className="mb-6">
         <CardHeader>
           <CardTitle>Ingredientes</CardTitle>
         </CardHeader>
         <CardContent>
            <Textarea
              value={formatIngredientsForTextarea(ingredients)}
              onChange={(e) => {
                 setIngredients(parseIngredientsFromTextarea(e.target.value));
              }}
              rows={8}
              placeholder="Formato: [Cantidad] [Unidad] [Nombre] (uno por línea)&#10;Ej: 2 tazas Harina&#10;1 Huevo"
              disabled={isSaving}
            />
         </CardContent>
      </Card>

       {/* Card para Instrucciones */}
      <Card className="mb-6">
         <CardHeader>
           <CardTitle>Instrucciones</CardTitle>
         </CardHeader>
         <CardContent>
            <Textarea
              value={formatInstructionsForTextarea(instructions)}
               onChange={(e) => {
                 setInstructions(parseInstructionsFromTextarea(e.target.value));
               }}
              rows={10}
              placeholder="Escribe cada paso en una nueva línea..."
              disabled={isSaving}
            />
         </CardContent>
      </Card>

      {/* Mensaje de Error de Guardado */}
       {saveError && (
         <p className="text-red-500 text-sm text-center mb-4">{saveError}</p>
       )}

      {/* Botones */}
      <div className="flex justify-end space-x-2 mt-4">
         <Button variant="outline" onClick={() => navigate('/app/recipes')} disabled={isSaving}>
           Cancelar
         </Button>
         <Button onClick={handleSaveRecipe} disabled={isSaving || !title.trim()}>
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
