import { z } from 'zod';
import type { ComplexityLevel, MealTimeKey, PantryDraftItem, PrimaryGoal } from './types';

const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

const goalValues = ['eat_better', 'save_time', 'save_money', 'learn_cook', 'other'] as const satisfies Readonly<PrimaryGoal[]>;
const complexityValues = ['simple', 'medium', 'complex'] as const satisfies Readonly<ComplexityLevel[]>;

export const primaryGoalSchema = z.object({
  primaryGoal: z.enum(goalValues, {
    required_error: 'Selecciona un objetivo para continuar.'
  })
});

const stringListSchema = z
  .array(
    z
      .string()
      .min(2, 'Debe tener al menos 2 caracteres')
      .max(60, 'Máximo 60 caracteres por elemento')
  )
  .max(20, 'Máximo 20 elementos');

export const dietarySchema = z.object({
  dietaryPreferences: stringListSchema.optional().default([]),
  allergies: stringListSchema.optional().default([]),
  dislikedIngredients: stringListSchema.optional().default([])
});

const timeFieldSchema = z
  .string()
  .trim()
  .superRefine((value, ctx) => {
    if (!value) return;
    if (!timeRegex.test(value)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Usa formato HH:MM (24h)'
      });
    }
  });

const mealTimeSchema = z.object({
  breakfast: timeFieldSchema.optional(),
  lunch: timeFieldSchema.optional(),
  snack: timeFieldSchema.optional(),
  dinner: timeFieldSchema.optional()
});

export const habitsSchema = z
  .object({
    preferredMealTimes: mealTimeSchema
      .transform((value) => {
        const normalized: Partial<Record<MealTimeKey, string>> = {};
        (Object.entries(value) as Array<[MealTimeKey, string | undefined]>).forEach(([key, raw]) => {
          if (raw) {
            normalized[key] = raw;
          }
        });
        return normalized;
      })
      .refine(
        (value) => Object.keys(value).length > 0,
        'Elige al menos un horario para tus comidas.'
      ),
    preferredComplexity: z.enum(complexityValues, {
      required_error: 'Selecciona un nivel de complejidad.'
    }),
    maxCookingMinutes: z
      .union([
        z.coerce
          .number({
            invalid_type_error: 'Introduce un número entero'
          })
          .int()
          .positive('Debe ser mayor a 0')
          .max(240, 'Máximo 240 minutos'),
        z.literal('').transform(() => null),
        z.null(),
        z.undefined()
      ])
      .transform((value) => (typeof value === 'number' ? value : null))
  })
  .transform((value) => ({
    ...value,
    preferredMealTimes: value.preferredMealTimes
  }));

const pantryItemSchema = z.object({
  id: z.string(),
  ingredient_name: z
    .string({
      required_error: 'Indica el ingrediente'
    })
    .min(2, 'Nombre demasiado corto'),
  quantity: z
    .union([
      z.coerce
        .number({
          invalid_type_error: 'Debe ser numérico'
        })
        .nonnegative('No puede ser negativo'),
      z.literal(''),
      z.null(),
      z.undefined()
    ])
    .transform((value) => (typeof value === 'number' ? value : null)),
  unit: z
    .union([
      z
        .string()
        .trim()
        .max(15, 'Máximo 15 caracteres'),
      z.literal(''),
      z.null(),
      z.undefined()
    ])
    .transform((value) => (value ? value : null)),
  category_id: z.union([z.string().trim().min(1), z.literal(''), z.null(), z.undefined()]).transform((value) =>
    value ? value : null
  ),
  notes: z
    .union([z.string().trim().max(120), z.literal(''), z.null(), z.undefined()])
    .transform((value) => (value ? value : null))
});

export const inventorySchema = z.object({
  initialPantryItems: z.array(pantryItemSchema).max(200, 'Máximo 200 ingredientes para el arranque')
});

export const quantObjectivesSchema = z.object({
  calorieTarget: z
    .union([
      z.coerce
        .number({
          invalid_type_error: 'Debe ser un número'
        })
        .int()
        .positive('Debe ser mayor que cero')
        .max(6000, 'Valor demasiado alto'),
      z.literal(''),
      z.null(),
      z.undefined()
    ])
    .transform((value) => (typeof value === 'number' ? value : null)),
  weeklyBudget: z
    .union([
      z.coerce
        .number({
          invalid_type_error: 'Debe ser un número'
        })
        .nonnegative('No puede ser negativo')
        .max(1000000, 'Valor demasiado alto'),
      z.literal(''),
      z.null(),
      z.undefined()
    ])
    .transform((value) => (typeof value === 'number' ? value : null)),
  householdSize: z
    .union([
      z.coerce
        .number({
          invalid_type_error: 'Debe ser un número'
        })
        .int()
        .positive('Debe ser mayor que cero')
        .max(12, 'Máximo 12 personas'),
      z.literal(''),
      z.null(),
      z.undefined()
    ])
    .transform((value) => (typeof value === 'number' ? value : null))
});

export const confirmationSchema = z.object({
  acceptTerms: z.literal(true, {
    errorMap: () => ({ message: 'Debes confirmar para continuar.' })
  })
});

export type PantryItemSchema = z.infer<typeof pantryItemSchema>;
