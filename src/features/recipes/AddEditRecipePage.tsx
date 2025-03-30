import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Spinner } from '@/components/ui/Spinner';
import { Trash2, PlusCircle } from 'lucide-react';
import { getRecipeById } from './recipeService'; // Solo necesitamos getById para cargar datos iniciales
import { useRecipeStore } from '@/stores/recipeStore'; // Importar tienda Zustand
import { toast } from 'sonner'; // Para notificaciones

// Esquema de validación Zod
const ingredientSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  quantity: z.preprocess(
    (val) => (val === '' || val === null ? null : Number(val)), // Convertir a número o null
    z.number().nullable().optional()
  ),
  unit: z.string().optional().nullable(),
});

const recipeSchema = z.object({
  name: z.string().min(3, 'El nombre debe tener al menos 3 caracteres'),
  description: z.string().optional(),
  instructions: z.string().optional(),
  prep_time: z.preprocess(
    (val) => (val === '' ? null : Number(val)), // Convertir a número o null
    z.number().positive('Debe ser positivo').nullable().optional()
  ),
  // Añadir otros campos si existen en tu modelo: cook_time, servings, etc.
  ingredients: z.array(ingredientSchema).min(1, 'Añade al menos un ingrediente'),
});

type RecipeFormData = z.infer<typeof recipeSchema>;

export function AddEditRecipePage() {
  const { recipeId } = useParams<{ recipeId?: string }>();
  const navigate = useNavigate();
  const isEditMode = Boolean(recipeId);
  
  // Obtener acciones de la tienda Zustand
  const { addRecipe, updateRecipe } = useRecipeStore(); 

  const [isLoadingData, setIsLoadingData] = useState(isEditMode); // Cargar solo si es modo edición
  const [errorLoading, setErrorLoading] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, handleSubmit, control, reset, formState: { errors } } = useForm<RecipeFormData>({
    resolver: zodResolver(recipeSchema),
    defaultValues: {
      name: '',
      description: '',
      instructions: '',
      prep_time: null,
      ingredients: [{ name: '', quantity: null, unit: '' }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'ingredients',
  });

  // Cargar datos de la receta si estamos en modo edición
  useEffect(() => {
    if (isEditMode && recipeId) {
      setIsLoadingData(true);
      setErrorLoading(null);
      getRecipeById(recipeId)
        .then(recipe => {
          if (recipe) {
            // Mapear datos al formulario
            reset({
              name: recipe.name || '',
              description: recipe.description || '',
              instructions: recipe.instructions || '',
              prep_time: recipe.prep_time || null,
              ingredients: recipe.recipe_ingredients?.map((ing: any) => ({ // Usar any temporalmente
                name: ing.name || '',
                quantity: ing.quantity ?? null, // Asegurar null si no existe
                unit: ing.unit || '',
              })) || [{ name: '', quantity: null, unit: '' }], // Default si no hay ingredientes
            });
          } else {
            setErrorLoading('Receta no encontrada.');
          }
        })
        .catch(err => {
          console.error("Error loading recipe for edit:", err);
          setErrorLoading('Error al cargar la receta.');
        })
        .finally(() => setIsLoadingData(false));
    }
  }, [recipeId, isEditMode, reset]);

  const onSubmit = async (data: RecipeFormData) => {
    setIsSubmitting(true);
    
    // Preparar datos para el servicio (separar ingredientes)
    const { ingredients, ...recipeCoreData } = data;
    const ingredientsData = ingredients.map(ing => ({
        name: ing.name,
        quantity: ing.quantity,
        unit: ing.unit || null // Asegurar null si está vacío
    }));

    try {
      let savedRecipe = null;
      if (isEditMode && recipeId) {
        // Llamar a la acción de la tienda para actualizar
        savedRecipe = await updateRecipe(recipeId, recipeCoreData, ingredientsData); 
        if (savedRecipe) {
           toast.success('Receta actualizada con éxito!');
           navigate(`/app/recipes/${recipeId}`); // Volver al detalle
        } else {
           toast.error('Error al actualizar la receta.');
        }
      } else {
        // Llamar a la acción de la tienda para añadir
        savedRecipe = await addRecipe(recipeCoreData, ingredientsData);
         if (savedRecipe) {
           toast.success('Receta creada con éxito!');
           navigate(`/app/recipes/${savedRecipe.id}`); // Ir al detalle de la nueva receta
         } else {
            toast.error('Error al crear la receta.');
         }
      }
    } catch (error) {
       // El error ya se maneja en la tienda, pero podemos mostrar un toast genérico
       console.error("Submission error:", error);
       toast.error('Ocurrió un error inesperado al guardar.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoadingData) {
    return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;
  }

  if (errorLoading) {
     return <p className="text-center text-destructive py-10">{errorLoading}</p>;
  }

  return (
    <div className="container mx-auto max-w-3xl py-8 px-4">
      <h1 className="text-3xl font-bold mb-6">
        {isEditMode ? 'Editar Receta' : 'Añadir Nueva Receta'}
      </h1>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Información General</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Nombre */}
            <div className="space-y-1">
              <Label htmlFor="name">Nombre de la Receta</Label>
              <Input id="name" {...register('name')} />
              {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
            </div>
            {/* Descripción */}
            <div className="space-y-1">
              <Label htmlFor="description">Descripción (Opcional)</Label>
              <Textarea id="description" {...register('description')} rows={3} />
              {errors.description && <p className="text-sm text-destructive">{errors.description.message}</p>}
            </div>
             {/* Tiempo de Preparación */}
             <div className="space-y-1">
              <Label htmlFor="prep_time">Tiempo de Preparación (minutos, opcional)</Label>
              <Input id="prep_time" type="number" {...register('prep_time')} />
              {errors.prep_time && <p className="text-sm text-destructive">{errors.prep_time.message}</p>}
            </div>
            {/* Instrucciones */}
            <div className="space-y-1">
              <Label htmlFor="instructions">Instrucciones (Opcional)</Label>
              <Textarea id="instructions" {...register('instructions')} rows={6} />
              {errors.instructions && <p className="text-sm text-destructive">{errors.instructions.message}</p>}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Ingredientes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {fields.map((field, index) => (
              <div key={field.id} className="flex items-end gap-2 border-b pb-3">
                {/* Cantidad */}
                <div className="flex-1 space-y-1">
                  <Label htmlFor={`ingredients.${index}.quantity`}>Cantidad</Label>
                  <Input 
                    id={`ingredients.${index}.quantity`}
                    type="number" 
                    step="any" // Permitir decimales
                    {...register(`ingredients.${index}.quantity`)} 
                    placeholder="Ej: 100"
                  />
                   {errors.ingredients?.[index]?.quantity && <p className="text-sm text-destructive">{errors.ingredients[index]?.quantity?.message}</p>}
                </div>
                 {/* Unidad */}
                 <div className="flex-1 space-y-1">
                  <Label htmlFor={`ingredients.${index}.unit`}>Unidad</Label>
                  <Input 
                    id={`ingredients.${index}.unit`}
                    {...register(`ingredients.${index}.unit`)} 
                    placeholder="Ej: gr, ml, unidad"
                  />
                   {errors.ingredients?.[index]?.unit && <p className="text-sm text-destructive">{errors.ingredients[index]?.unit?.message}</p>}
                </div>
                {/* Nombre */}
                <div className="flex-[2] space-y-1">
                  <Label htmlFor={`ingredients.${index}.name`}>Nombre</Label>
                  <Input 
                    id={`ingredients.${index}.name`}
                    {...register(`ingredients.${index}.name`)} 
                    placeholder="Ej: Harina de trigo"
                  />
                   {errors.ingredients?.[index]?.name && <p className="text-sm text-destructive">{errors.ingredients[index]?.name?.message}</p>}
                </div>
                {/* Botón Eliminar */}
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => remove(index)}
                  disabled={fields.length <= 1} // No eliminar si es el último
                  className="h-9 w-9 text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
             {errors.ingredients?.root && <p className="text-sm text-destructive pt-2">{errors.ingredients.root.message}</p>}
             {/* Botón Añadir Ingrediente */}
            <Button 
              type="button" 
              variant="outline" 
              size="sm" 
              onClick={() => append({ name: '', quantity: null, unit: '' })}
              className="mt-2"
            >
              <PlusCircle className="mr-2 h-4 w-4" /> Añadir Ingrediente
            </Button>
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={isSubmitting} className="ml-auto">
              {isSubmitting ? <Spinner size="sm" className="mr-2" /> : null}
              {isEditMode ? 'Actualizar Receta' : 'Crear Receta'}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}