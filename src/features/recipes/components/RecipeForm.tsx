import { useMemo } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Trash2, Plus, Upload } from 'lucide-react';
import { normalizeQuantity, normalizeUnit, parseIntegerOrNull } from '@/utils/units';

const ingredientSchema = z.object({
  name: z.string().min(1, 'El nombre del ingrediente es obligatorio'),
  quantity: z.string().optional(),
  unit: z.string().optional(),
});

const recipeFormSchema = z.object({
  title: z.string().min(1, 'El título es obligatorio'),
  description: z.string().optional(),
  ingredients: z.array(ingredientSchema).min(1, 'Añade al menos un ingrediente'),
  instructions: z
    .array(z.string().min(1, 'Cada paso debe contener texto'))
    .min(1, 'Añade al menos una instrucción'),
  prep_time_minutes: z.string().optional(),
  cook_time_minutes: z.string().optional(),
  servings: z.string().optional(),
  tags: z.string().optional(),
  importUrl: z.string().url('Introduce una URL válida').optional().or(z.literal('')),
});

type RecipeFormSchema = z.infer<typeof recipeFormSchema>;

type IngredientInput = {
  name: string;
  quantity: string | number | null;
  unit?: string | null;
};

export type RecipeFormSubmit = {
  title: string;
  description: string | null;
  ingredients: Array<{
    name: string;
    quantity: number | null;
    unit: string | null;
  }>;
  instructions: string[];
  prep_time_minutes: number | null;
  cook_time_minutes: number | null;
  servings: number | null;
  tags: string[] | null;
  importUrl?: string;
  mainIngredients?: string[];
  image_url?: string | null;
  nutritional_info?: unknown;
};

export interface RecipeFormProps {
  mode: 'create' | 'edit';
  defaultValues?: Partial<RecipeFormSubmit> & {
    ingredients?: IngredientInput[];
    instructions?: string[];
    tags?: string[] | null;
    importUrl?: string;
  };
  isSubmitting?: boolean;
  submitLabel?: string;
  onSubmit: (values: RecipeFormSubmit) => Promise<void> | void;
  onCancel?: () => void;
}

const sanitizeIngredients = (ingredients: RecipeFormSchema['ingredients']) =>
  ingredients.map((ing) => ({
    name: ing.name.trim(),
    quantity: normalizeQuantity(ing.quantity ?? null),
    unit: normalizeUnit(ing.unit),
  }));

const sanitizeInstructions = (instructions: RecipeFormSchema['instructions']) =>
  instructions.map((step) => step.trim()).filter(Boolean);

const buildDefaultFormValues = (defaults?: RecipeFormProps['defaultValues']): RecipeFormSchema => {
  const ingredientDefaults: IngredientInput[] =
    defaults?.ingredients && defaults.ingredients.length > 0
      ? defaults.ingredients
      : [{ name: '', quantity: null, unit: '' }];

  return {
    title: defaults?.title ?? '',
    description: defaults?.description ?? '',
    ingredients: ingredientDefaults.map((ing) => ({
      name: ing.name ?? '',
      quantity:
        typeof ing.quantity === 'number' && !Number.isNaN(ing.quantity)
          ? String(ing.quantity)
          : ((ing.quantity as string | null) ?? ''),
      unit: ing.unit ?? '',
    })),
    instructions:
      defaults?.instructions && defaults.instructions.length > 0 ? defaults.instructions : [''],
    prep_time_minutes:
      defaults?.prep_time_minutes != null && !Number.isNaN(defaults.prep_time_minutes)
        ? String(defaults.prep_time_minutes)
        : '',
    cook_time_minutes:
      defaults?.cook_time_minutes != null && !Number.isNaN(defaults.cook_time_minutes)
        ? String(defaults.cook_time_minutes)
        : '',
    servings:
      defaults?.servings != null && !Number.isNaN(defaults.servings)
        ? String(defaults.servings)
        : '',
    tags: defaults?.tags ? defaults.tags.join(', ') : '',
    importUrl: defaults?.importUrl ?? '',
  };
};

export const RecipeForm = ({
  mode,
  defaultValues,
  isSubmitting = false,
  submitLabel,
  onSubmit,
  onCancel,
}: RecipeFormProps) => {
  const memoizedDefaults = useMemo(() => buildDefaultFormValues(defaultValues), [defaultValues]);

  const form = useForm<RecipeFormSchema>({
    resolver: zodResolver(recipeFormSchema),
    defaultValues: memoizedDefaults,
    mode: 'onBlur',
  });

  const {
    control,
    register,
    handleSubmit,
    formState: { errors },
  } = form;

  const ingredientArray = useFieldArray({ control, name: 'ingredients' });
  const instructionsArray = useFieldArray({ control, name: 'instructions' });
  const ingredientRootError = (errors.ingredients as unknown as { message?: string })?.message;
  const instructionsRootError = (errors.instructions as unknown as { message?: string })?.message;

  const submitText = submitLabel ?? (mode === 'edit' ? 'Guardar cambios' : 'Crear receta');

  const onValidSubmit = (values: RecipeFormSchema) => {
    const tagList = values.tags
      ? values.tags
          .split(',')
          .map((tag) => tag.trim())
          .filter(Boolean)
      : (defaultValues?.tags ?? []);

    const sanitized: RecipeFormSubmit = {
      title: values.title.trim(),
      description: values.description?.trim() || null,
      ingredients: sanitizeIngredients(values.ingredients),
      instructions: sanitizeInstructions(values.instructions),
      prep_time_minutes: parseIntegerOrNull(values.prep_time_minutes ?? null),
      cook_time_minutes: parseIntegerOrNull(values.cook_time_minutes ?? null),
      servings: parseIntegerOrNull(values.servings ?? null),
      tags: tagList.length ? tagList : null,
      importUrl: values.importUrl?.trim() || undefined,
      mainIngredients: defaultValues?.mainIngredients,
      image_url: defaultValues?.image_url ?? null,
      nutritional_info: defaultValues?.nutritional_info,
    };

    return onSubmit(sanitized);
  };

  return (
    <form onSubmit={handleSubmit(onValidSubmit)} className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground" htmlFor="title">
            Título
          </label>
          <Input
            id="title"
            placeholder="Ej. Pasta con pesto"
            disabled={isSubmitting}
            {...register('title')}
          />
          {errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground" htmlFor="tags">
            Etiquetas (separadas por comas)
          </label>
          <Input
            id="tags"
            placeholder="rápida, vegetariana"
            disabled={isSubmitting}
            {...register('tags')}
          />
          {errors.tags && <p className="text-sm text-destructive">{errors.tags.message}</p>}
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground" htmlFor="prep_time_minutes">
            Tiempo de preparación (min)
          </label>
          <Input
            id="prep_time_minutes"
            type="number"
            min={0}
            disabled={isSubmitting}
            {...register('prep_time_minutes')}
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground" htmlFor="cook_time_minutes">
            Tiempo de cocción (min)
          </label>
          <Input
            id="cook_time_minutes"
            type="number"
            min={0}
            disabled={isSubmitting}
            {...register('cook_time_minutes')}
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground" htmlFor="servings">
            Porciones
          </label>
          <Input
            id="servings"
            type="number"
            min={1}
            disabled={isSubmitting}
            {...register('servings')}
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground" htmlFor="importUrl">
            Importar desde URL
          </label>
          <div className="flex items-center gap-2">
            <Input
              id="importUrl"
              placeholder="https://ejemplo.com/mi-receta"
              disabled={isSubmitting}
              {...register('importUrl')}
            />
            <Button type="button" variant="outline" disabled className="whitespace-nowrap">
              <Upload className="mr-2 h-4 w-4" />
              Próximamente
            </Button>
          </div>
          {errors.importUrl && (
            <p className="text-sm text-destructive">{errors.importUrl.message}</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-muted-foreground" htmlFor="description">
          Descripción / Notas
        </label>
        <Textarea
          id="description"
          rows={4}
          placeholder="Notas adicionales, trucos o recordatorios"
          disabled={isSubmitting}
          {...register('description')}
        />
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Ingredientes</h3>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              ingredientArray.append({
                name: '',
                quantity: '',
                unit: '',
              })
            }
            disabled={isSubmitting}
          >
            <Plus className="mr-2 h-4 w-4" /> Añadir ingrediente
          </Button>
        </div>
        {ingredientArray.fields.map((field, index) => (
          <div
            key={field.id}
            className="grid gap-3 rounded-md border p-4 md:grid-cols-[2fr_1fr_1fr_auto]"
          >
            <div className="space-y-1">
              <label
                className="text-xs font-medium text-muted-foreground"
                htmlFor={`ingredient-name-${index}`}
              >
                Nombre
              </label>
              <Input
                id={`ingredient-name-${index}`}
                placeholder="Ingrediente"
                disabled={isSubmitting}
                {...register(`ingredients.${index}.name` as const)}
              />
              {errors.ingredients?.[index]?.name && (
                <p className="text-sm text-destructive">
                  {errors.ingredients[index]?.name?.message}
                </p>
              )}
            </div>
            <div className="space-y-1">
              <label
                className="text-xs font-medium text-muted-foreground"
                htmlFor={`ingredient-quantity-${index}`}
              >
                Cantidad
              </label>
              <Input
                id={`ingredient-quantity-${index}`}
                placeholder="Ej. 1.5"
                disabled={isSubmitting}
                {...register(`ingredients.${index}.quantity` as const)}
              />
            </div>
            <div className="space-y-1">
              <label
                className="text-xs font-medium text-muted-foreground"
                htmlFor={`ingredient-unit-${index}`}
              >
                Unidad
              </label>
              <Input
                id={`ingredient-unit-${index}`}
                placeholder="Ej. g, ml, taza"
                disabled={isSubmitting}
                {...register(`ingredients.${index}.unit` as const)}
              />
            </div>
            <div className="flex items-end justify-end">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => ingredientArray.remove(index)}
                disabled={isSubmitting || ingredientArray.fields.length === 1}
                aria-label={`Eliminar ingrediente ${index + 1}`}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
        {ingredientRootError && <p className="text-sm text-destructive">{ingredientRootError}</p>}
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Instrucciones</h3>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => instructionsArray.append('')}
            disabled={isSubmitting}
          >
            <Plus className="mr-2 h-4 w-4" /> Añadir paso
          </Button>
        </div>
        {instructionsArray.fields.map((field, index) => (
          <div key={field.id} className="flex items-start gap-3">
            <span className="mt-2 text-sm font-medium text-muted-foreground">{index + 1}.</span>
            <Controller
              control={control}
              name={`instructions.${index}` as const}
              render={({ field: controllerField }) => (
                <Input
                  {...controllerField}
                  disabled={isSubmitting}
                  placeholder={`Describe el paso ${index + 1}`}
                />
              )}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => instructionsArray.remove(index)}
              disabled={isSubmitting || instructionsArray.fields.length === 1}
              aria-label={`Eliminar paso ${index + 1}`}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
        {instructionsRootError && (
          <p className="text-sm text-destructive">{instructionsRootError}</p>
        )}
      </div>

      <div className="flex items-center justify-end gap-3">
        {onCancel && (
          <Button type="button" variant="ghost" onClick={onCancel} disabled={isSubmitting}>
            Cancelar
          </Button>
        )}
        <Button type="submit" disabled={isSubmitting}>
          {submitText}
        </Button>
      </div>
    </form>
  );
};

export default RecipeForm;
