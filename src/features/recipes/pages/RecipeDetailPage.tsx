import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Spinner } from '@/components/ui/Spinner';
import { toast } from 'sonner';
import {
  archiveRecipe,
  deleteRecipe,
  duplicateRecipe,
  getRecipeById,
  updateRecipe,
} from '../services/recipeService';
import { RecipeForm, RecipeFormSubmit } from '../components/RecipeForm';
import type { Recipe } from '@/types/recipeTypes';
import { useAuth } from '@/features/auth/AuthContext';
import { Pencil, Archive, ArchiveRestore, Copy, Trash2 } from 'lucide-react';

const mapRecipeToFormDefaults = (recipe: Recipe): RecipeFormSubmit => ({
  title: recipe.title,
  description: recipe.description ?? '',
  ingredients: recipe.recipe_ingredients.map(ing => ({
    name: ing.ingredient_name,
    quantity: ing.quantity ?? null,
    unit: ing.unit ?? null,
  })),
  instructions: recipe.instructions ?? [],
  prep_time_minutes: recipe.prep_time_minutes ?? null,
  cook_time_minutes: recipe.cook_time_minutes ?? null,
  servings: recipe.servings ?? null,
  tags: recipe.tags ?? [],
  importUrl: '',
  mainIngredients: recipe.mainIngredients ?? [],
  image_url: recipe.image_url ?? null,
  nutritional_info: recipe.nutritional_info,
});

const RecipeDetailPage = () => {
  const { recipeId } = useParams<{ recipeId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isArchiving, setIsArchiving] = useState<boolean>(false);
  const [isDuplicating, setIsDuplicating] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  useEffect(() => {
    const fetchRecipe = async () => {
      if (!recipeId) return;
      setIsLoading(true);
      try {
        const data = await getRecipeById(recipeId);
        setRecipe(data);
      } catch (error) {
        console.error('[RecipeDetailPage] Error fetching recipe', error);
        toast.error('No se pudo cargar la receta.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchRecipe();
  }, [recipeId]);

  const formDefaults = useMemo(() => (recipe ? mapRecipeToFormDefaults(recipe) : null), [recipe]);

  const handleUpdate = async (values: RecipeFormSubmit) => {
    if (!recipeId) return;
    setIsSubmitting(true);
    try {
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
      setRecipe(updated);
      setIsEditing(false);
      toast.success('Receta actualizada correctamente.');
    } catch (error) {
      console.error('[RecipeDetailPage] Error updating recipe', error);
      toast.error(error instanceof Error ? error.message : 'No se pudo actualizar la receta.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDuplicate = async () => {
    if (!recipeId) return;
    setIsDuplicating(true);
    try {
      const duplicated = await duplicateRecipe(recipeId);
      toast.success('Se creó una copia de la receta.');
      navigate(`/app/recipes/${duplicated.id}`);
    } catch (error) {
      console.error('[RecipeDetailPage] Error duplicating recipe', error);
      toast.error(error instanceof Error ? error.message : 'No se pudo duplicar la receta.');
    } finally {
      setIsDuplicating(false);
    }
  };

  const handleArchive = async () => {
    if (!recipeId) return;
    setIsArchiving(true);
    try {
      const archived = await archiveRecipe(recipeId, !(recipe?.is_archived ?? false));
      setRecipe(archived);
      toast.success(archived.is_archived ? 'Receta archivada.' : 'Receta restaurada.');
    } catch (error) {
      console.error('[RecipeDetailPage] Error archiving recipe', error);
      toast.error(error instanceof Error ? error.message : 'No se pudo actualizar el estado de archivo.');
    } finally {
      setIsArchiving(false);
    }
  };

  const handleDelete = async () => {
    if (!recipeId) return;
    if (!window.confirm('¿Seguro que deseas eliminar esta receta?')) {
      return;
    }
    setIsDeleting(true);
    try {
      await deleteRecipe(recipeId);
      toast.success('Receta eliminada.');
      navigate('/app/recipes');
    } catch (error) {
      console.error('[RecipeDetailPage] Error deleting recipe', error);
      toast.error(error instanceof Error ? error.message : 'No se pudo eliminar la receta.');
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner />
      </div>
    );
  }

  if (!recipe) {
    return (
      <Alert variant="destructive">
        <AlertDescription>No se encontró la receta solicitada.</AlertDescription>
      </Alert>
    );
  }

  if (isEditing && formDefaults) {
    return (
      <div className="mx-auto w-full max-w-3xl">
        <Card>
          <CardHeader>
            <CardTitle>Editar receta</CardTitle>
          </CardHeader>
          <CardContent>
            <RecipeForm
              mode="edit"
              defaultValues={formDefaults}
              isSubmitting={isSubmitting}
              onSubmit={handleUpdate}
              onCancel={() => setIsEditing(false)}
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle className="text-2xl font-bold">{recipe.title}</CardTitle>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              {recipe.tags?.map(tag => (
                <Badge key={tag} variant="secondary">
                  {tag}
                </Badge>
              ))}
              {recipe.is_archived && <Badge variant="outline">Archivada</Badge>}
              {recipe.is_public && <Badge variant="outline">Pública</Badge>}
            </div>
          </div>
          {user && (
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                <Pencil className="mr-2 h-4 w-4" /> Editar
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDuplicate}
                disabled={isDuplicating}
              >
                <Copy className="mr-2 h-4 w-4" /> Duplicar
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleArchive}
                disabled={isArchiving}
              >
                {recipe.is_archived ? (
                  <ArchiveRestore className="mr-2 h-4 w-4" />
                ) : (
                  <Archive className="mr-2 h-4 w-4" />
                )}
                {recipe.is_archived ? 'Restaurar' : 'Archivar'}
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDelete}
                disabled={isDeleting}
              >
                <Trash2 className="mr-2 h-4 w-4" /> Eliminar
              </Button>
            </div>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {(recipe.prep_time_minutes || recipe.cook_time_minutes || recipe.servings) && (
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              {recipe.prep_time_minutes ? <span>Prep: {recipe.prep_time_minutes} min</span> : null}
              {recipe.cook_time_minutes ? <span>Cocción: {recipe.cook_time_minutes} min</span> : null}
              {recipe.servings ? <span>Porciones: {recipe.servings}</span> : null}
            </div>
          )}

          <Tabs defaultValue="ingredients" className="w-full">
            <TabsList>
              <TabsTrigger value="ingredients">Ingredientes</TabsTrigger>
              <TabsTrigger value="instructions">Instrucciones</TabsTrigger>
              <TabsTrigger value="notes">Notas</TabsTrigger>
            </TabsList>
            <TabsContent value="ingredients" className="space-y-2 pt-4">
              {recipe.recipe_ingredients.length === 0 ? (
                <p className="text-sm text-muted-foreground">No hay ingredientes registrados.</p>
              ) : (
                <ul className="list-disc space-y-1 pl-5 text-sm">
                  {recipe.recipe_ingredients.map(ingredient => (
                    <li key={ingredient.id}>
                      <span className="font-medium">{ingredient.ingredient_name}</span>
                      {ingredient.quantity != null && (
                        <span>
                          {' '}- {ingredient.quantity}
                          {ingredient.unit ? ` ${ingredient.unit}` : ''}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </TabsContent>
            <TabsContent value="instructions" className="space-y-2 pt-4">
              {recipe.instructions.length === 0 ? (
                <p className="text-sm text-muted-foreground">No hay instrucciones registradas.</p>
              ) : (
                <ol className="list-decimal space-y-2 pl-5 text-sm">
                  {recipe.instructions.map((step, index) => (
                    <li key={index}>{step}</li>
                  ))}
                </ol>
              )}
            </TabsContent>
            <TabsContent value="notes" className="space-y-2 pt-4">
              {recipe.description ? (
                <p className="whitespace-pre-line text-sm text-muted-foreground">{recipe.description}</p>
              ) : (
                <p className="text-sm text-muted-foreground">No hay notas para esta receta.</p>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default RecipeDetailPage;
