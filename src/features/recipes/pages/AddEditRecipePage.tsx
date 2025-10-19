import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { RecipeForm, RecipeFormSubmit } from '../components/RecipeForm';
import { createRecipe, getRecipeById, updateRecipe } from '../services/recipeService';
import type { Recipe, GeneratedRecipeData } from '@/types/recipeTypes';
import { useAuth } from '@/features/auth/AuthContext';
import { toast } from 'sonner';
import { Spinner } from '@/components/ui/Spinner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const normalizeInstructions = (
  value: Recipe['instructions'] | string | null | undefined,
): string[] => {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value.filter((step) => step && step.trim().length > 0);
  }
  if (typeof value === 'string') {
    return value
      .split('\n')
      .map((step) => step.trim())
      .filter(Boolean);
  }
  return [];
};

const mapRecipeToDefaults = (recipe: Recipe): RecipeFormSubmit => ({
  title: recipe.title,
  description: recipe.description ?? '',
  ingredients: recipe.recipe_ingredients.map((ing) => ({
    name: ing.ingredient_name,
    quantity: ing.quantity ?? null,
    unit: ing.unit ?? null,
  })),
  instructions: normalizeInstructions(recipe.instructions),
  prep_time_minutes: recipe.prep_time_minutes ?? null,
  cook_time_minutes: recipe.cook_time_minutes ?? null,
  servings: recipe.servings ?? null,
  tags: recipe.tags ?? [],
  importUrl: '',
  mainIngredients: recipe.mainIngredients ?? [],
  image_url: recipe.image_url ?? null,
  nutritional_info: recipe.nutritional_info,
});

const mapGeneratedToDefaults = (generated: GeneratedRecipeData): RecipeFormSubmit => ({
  title: generated.title ?? '',
  description: generated.description ?? '',
  ingredients:
    generated.ingredients?.map((ing) => ({
      name: ing.name ?? '',
      quantity:
        typeof ing.quantity === 'number' || typeof ing.quantity === 'string' ? ing.quantity : null,
      unit: ing.unit ?? null,
    })) ?? [],
  instructions: normalizeInstructions(generated.instructions),
  prep_time_minutes: generated.prepTimeMinutes ?? null,
  cook_time_minutes: generated.cookTimeMinutes ?? null,
  servings: generated.servings ?? null,
  tags: generated.tags ?? [],
  importUrl: '',
  mainIngredients: generated.mainIngredients ?? [],
  image_url: generated.image_url ?? null,
  nutritional_info: generated.nutritionalInfo ?? null,
});

const AddEditRecipePage = () => {
  const { recipeId } = useParams<{ recipeId?: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const [isLoading, setIsLoading] = useState<boolean>(Boolean(recipeId));
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [recipeDefaults, setRecipeDefaults] = useState<RecipeFormSubmit | null>(null);

  const generatedRecipe = location.state?.generatedRecipe as GeneratedRecipeData | undefined;

  useEffect(() => {
    let isMounted = true;

    const loadRecipe = async () => {
      if (!recipeId) return;
      setIsLoading(true);
      try {
        const data = await getRecipeById(recipeId);
        if (data && isMounted) {
          setRecipeDefaults(mapRecipeToDefaults(data));
        } else if (!data) {
          toast.error('No se encontró la receta solicitada.');
          navigate('/app/recipes');
        }
      } catch (error) {
        console.error('[AddEditRecipePage] Error fetching recipe', error);
        toast.error('No se pudo cargar la receta.');
        navigate('/app/recipes');
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    if (recipeId) {
      loadRecipe();
    } else if (generatedRecipe) {
      setRecipeDefaults(mapGeneratedToDefaults(generatedRecipe));
    } else {
      setRecipeDefaults(null);
    }

    return () => {
      isMounted = false;
    };
  }, [recipeId, generatedRecipe, navigate]);

  const defaults = useMemo(() => {
    if (recipeDefaults) return recipeDefaults;
    if (generatedRecipe && !recipeId) return mapGeneratedToDefaults(generatedRecipe);
    return null;
  }, [recipeDefaults, generatedRecipe, recipeId]);

  const handleSubmit = async (values: RecipeFormSubmit) => {
    if (!user) {
      toast.error('Debes iniciar sesión para gestionar recetas.');
      return;
    }

    setIsSubmitting(true);

    try {
      if (recipeId) {
        const updated = await updateRecipe(recipeId, {
          title: values.title,
          description: values.description,
          ingredients: values.ingredients,
          instructions: values.instructions,
          prep_time_minutes: values.prep_time_minutes,
          cook_time_minutes: values.cook_time_minutes,
          servings: values.servings,
          tags: values.tags ?? [],
          mainIngredients: values.mainIngredients,
          nutritional_info: values.nutritional_info as any,
        });
        toast.success('Receta actualizada correctamente.');
        navigate(`/app/recipes/${updated.id}`);
      } else {
        const created = await createRecipe({
          user_id: user.id,
          title: values.title,
          description: values.description,
          ingredients: values.ingredients,
          instructions: values.instructions,
          prep_time_minutes: values.prep_time_minutes,
          cook_time_minutes: values.cook_time_minutes,
          servings: values.servings,
          tags: values.tags ?? [],
          mainIngredients: values.mainIngredients,
          nutritional_info: values.nutritional_info as any,
          image_url: values.image_url ?? null,
          is_public: false,
          is_archived: false,
          isBaseRecipe: false,
        });
        toast.success('Receta creada correctamente.');
        navigate(`/app/recipes/${created.id}`);
      }
    } catch (error) {
      console.error('[AddEditRecipePage] Error saving recipe', error);
      toast.error(error instanceof Error ? error.message : 'No se pudo guardar la receta.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const pageTitle = recipeId ? 'Editar receta' : 'Crear nueva receta';

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{pageTitle}</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Spinner />
            </div>
          ) : (
            <RecipeForm
              mode={recipeId ? 'edit' : 'create'}
              defaultValues={defaults ?? undefined}
              isSubmitting={isSubmitting}
              onSubmit={handleSubmit}
              onCancel={() => navigate(-1)}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AddEditRecipePage;
