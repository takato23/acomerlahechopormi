import { getUserProfile } from '@/features/user/userService';
import type { UserProfile } from '@/features/user/userTypes';
import { getPantryItems } from '@/features/pantry/pantryService';
import type { PantryItem } from '@/features/pantry/types';
import type { GeneratedRecipeData, Recipe } from '@/types/recipeTypes';
import { preferencesService } from '@/features/user/services/PreferencesService';
import { recipeFilterService } from './services/RecipeFilterService';
import { recipeDataService } from './services/RecipeDataService';
import { RecipeSearchCriteria } from '@/types/recipeRecommendationTypes';
import { recipeImageProvider } from '@/features/planning/services/recipeImageProvider';
import {
  UserPreferences,
  DEFAULT_USER_PREFERENCES,
  CuisineType,
} from '@/types/userPreferences';

export type BaseStrategy = 'foco-despensa' | 'creacion-equilibrada' | 'variedad-maxima';
export type StyleModifier = 'rapido' | 'saludable' | 'creativo' | 'cocina-especifica' | null;
export type MealType = 'Desayuno' | 'Almuerzo' | 'Cena' | 'Merienda';

export interface PreviousRecipeContext {
  title: string;
  mainIngredients?: string[];
  mealType: MealType;
  recipeId: string;
}

export interface NutritionalSlotContext {
  dayOfWeek: string;
  mealType: string;
  calorieTarget?: number;
  macroTargets?: { protein: number; carbs: number; fat: number };
  dietaryRestrictions?: string[];
  allergies?: string[];
  maxPrepTime?: number;
  budgetLevel?: 'low' | 'medium' | 'high';
  availableEquipment?: string[];
  seasonalIngredients?: string[];
  expiringIngredients?: string[];
}

export interface PantrySlotContext {
  available: string[];
  prioritized: string[];
  expiringSoon: string[];
  autoUsePantryOnly?: boolean;
}

export interface ObjectiveSlotContext {
  specificObjective?: string;
  summary?: string;
  creativityLevel?: number;
  avoidRepeatingMainIngredients?: boolean;
  considerSeason?: boolean;
}

export interface GenerateRecipeForSlotOptions {
  userId: string;
  mealType: MealType;
  baseStrategy: BaseStrategy;
  styleModifier: StyleModifier;
  nutritionalContext: NutritionalSlotContext;
  pantryContext: PantrySlotContext;
  objectiveContext: ObjectiveSlotContext;
  previousRecipesContext?: PreviousRecipeContext[];
  availableEquipment?: string[];
  calorieTarget?: number;
  maxPrepTime?: number;
  specificObjective?: string;
  avoidIngredients?: string[];
  prioritizeIngredients?: string[];
  expiringIngredients?: string[];
  dietaryMode?: string;
  allergies?: string[];
  dayOfWeek?: string;
  budgetLevel?: 'low' | 'medium' | 'high';
  cuisinePreferences?: string[];
  season?: 'spring' | 'summer' | 'fall' | 'winter';
}

const normalizeList = (items?: string[]) =>
  items?.filter(Boolean).map((item) => item.trim()).filter((item) => item.length > 0) ?? [];

const normalizeIngredients = (ingredients: string[]): string[] => {
  const normalizedSet = new Set(
    ingredients
      .map((ing) => ing.toLowerCase().trim())
      .map((ing) => (ing.endsWith('s') && ing.length > 3 ? ing.slice(0, -1) : ing)),
  );
  return [...normalizedSet];
};

const validatePreviousContext = (context: PreviousRecipeContext[] = []): PreviousRecipeContext[] =>
  context.filter((recipe) => recipe && recipe.recipeId && recipe.title && recipe.mealType);

export const ensureRecipeHasImage = async (
  recipe: GeneratedRecipeData,
): Promise<GeneratedRecipeData> => {
  if (recipe.imageUrl) {
    return recipe;
  }

  try {
    const imageUrl = await recipeImageProvider.getImageUrl({
      title: recipe.title,
      ingredients: recipe.ingredients?.map((ingredient) => ingredient.name),
    });

    if (imageUrl) {
      recipe.imageUrl = imageUrl;
    }
  } catch (error) {
    console.warn('[generationService] No se pudo obtener imagen para receta generada', error);
  }

  return recipe;
};

interface CreativePromptParams {
  baseRecipe: Recipe | null;
  pantryIngredients: string[];
  preferences: UserPreferences;
  options: GenerateRecipeForSlotOptions;
}

const buildCreativePrompt = ({
  baseRecipe,
  pantryIngredients,
  preferences,
  options,
}: CreativePromptParams): string => {
  const {
    mealType,
    nutritionalContext,
    pantryContext,
    objectiveContext,
    cuisinePreferences,
  } = options;

  const equipmentAvailable = normalizeList(
    nutritionalContext.availableEquipment ?? options.availableEquipment,
  );
  const allergies = normalizeList([
    ...(nutritionalContext.allergies ?? []),
    ...(options.allergies ?? []),
    ...(preferences.dietaryRestrictions ?? []),
  ]);

  const avoidIngredients = normalizeList([
    ...(preferences.dislikedIngredients ?? []),
    ...(options.avoidIngredients ?? []),
  ]);

  const prioritizedIngredients = normalizeList([
    ...(pantryContext.prioritized ?? []),
    ...(options.prioritizeIngredients ?? []),
  ]);

  const expiringIngredients = normalizeList([
    ...(pantryContext.expiringSoon ?? []),
    ...(options.expiringIngredients ?? []),
    ...(nutritionalContext.expiringIngredients ?? []),
  ]);

  const availablePantryList = normalizeList(
    pantryContext.autoUsePantryOnly ? pantryContext.available : pantryIngredients,
  );

  const macroTargets = nutritionalContext.macroTargets;
  const creativityLevel = objectiveContext.creativityLevel ?? 50;
  const creativityDescriptor =
    creativityLevel >= 70
      ? 'Sé altamente creativo, pero mantén la coherencia nutricional y cultural.'
      : creativityLevel <= 30
        ? 'Prioriza recetas probadas y simples, con variaciones mínimas.'
        : 'Equilibra creatividad con practicidad y consistencia culinaria.';

  const objectiveSummary = objectiveContext.summary
    ? `Objetivo específico: ${objectiveContext.summary}`
    : objectiveContext.specificObjective
      ? `Objetivo específico: ${objectiveContext.specificObjective}`
      : 'Objetivo específico: Alimentación equilibrada y sabor agradable.';

  const macroSection = macroTargets
    ? `Proteínas objetivo: ${macroTargets.protein}g | Carbohidratos objetivo: ${macroTargets.carbs}g | Grasas objetivo: ${macroTargets.fat}g.`
    : 'Balancea macronutrientes dentro de rangos saludables.';

  const cuisineHint =
    cuisinePreferences?.length && options.styleModifier === 'cocina-especifica'
      ? `Inspírate en cocina(s): ${cuisinePreferences.join(', ')}.`
      : '';

  const exampleRecipe = {
    title: 'Receta ejemplo',
    description: 'Descripción breve',
    ingredients: [
      { name: 'Ingrediente 1', quantity: 100, unit: 'g' },
      { name: 'Ingrediente 2', quantity: 1, unit: 'unidad' },
    ],
    instructions: ['Paso 1', 'Paso 2'],
    prepTimeMinutes: 20,
    cookTimeMinutes: 15,
    servings: 2,
    mainIngredients: ['Ingrediente 1'],
  };

  const prompt = `
INSTRUCCIONES:
- Genera una receta para ${mealType} con formato JSON válido, sin texto adicional.
- ${creativityDescriptor}
- Si reutilizas una receta base, adáptala para cumplir las restricciones.
- Usa comillas dobles y respeta el esquema del ejemplo. Todos los campos son obligatorios.
- SOLO usa métodos de cocción compatibles con el equipamiento disponible (${equipmentAvailable.join(', ') || 'sin restricciones declaradas'}).

CONTEXTO DEL USUARIO:
Equipamiento disponible: ${equipmentAvailable.join(', ') || 'sin especificar'}.
Tiempo máximo de preparación: ${nutritionalContext.maxPrepTime ?? options.maxPrepTime ?? 45} minutos. La receta DEBE completarse en ese tiempo.
Objetivo calórico: ${nutritionalContext.calorieTarget ?? options.calorieTarget ?? 550} kcal por porción. Ajusta porciones si es necesario.
${macroSection}
${objectiveSummary}

RESTRICCIONES CRÍTICAS:
Alergias (CRÍTICO): ${allergies.length ? allergies.join(', ') : 'ninguna conocida'}. NUNCA los incluyas.
Restricciones dietéticas: ${options.dietaryMode ? normalizeList([options.dietaryMode]).join(', ') : 'ninguna específica'}.
Ingredientes a evitar: ${avoidIngredients.length ? avoidIngredients.join(', ') : 'ninguno'}.

INGREDIENTES:
Disponibles en despensa: ${availablePantryList.slice(0, 20).join(', ') || 'sin datos'}.
Próximos a vencer (PRIORIZAR): ${expiringIngredients.join(', ') || 'ninguno'}.
Ingredientes a priorizar: ${prioritizedIngredients.join(', ') || 'libre elección'}.

CONTEXTO ADICIONAL:
Estación del año: ${options.season ?? 'no especificada'}.
Día de la semana: ${options.dayOfWeek ?? nutritionalContext.dayOfWeek}.
Nivel de presupuesto: ${options.budgetLevel ?? nutritionalContext.budgetLevel ?? 'medio'}.
${cuisineHint}

${baseRecipe ? `Referencia base: ${baseRecipe.title}.` : 'Genera una receta original.'}
Evita repeticiones recientes y considera ${objectiveContext.avoidRepeatingMainIngredients ? 'no repetir ingredientes principales consecutivamente.' : 'puedes repetir ingredientes si aportan valor.'}
Considera la estación del año: ${objectiveContext.considerSeason !== false ? 'sí, usa ingredientes de temporada' : 'no es necesario priorizar temporada'}.

EJEMPLO DE FORMATO (usa la misma estructura, pero crea contenido nuevo):
${JSON.stringify(exampleRecipe, null, 2)}
`;

  return prompt;
};

const parseGeminiResponse = (responseText: string): GeneratedRecipeData | null => {
  try {
    const cleanText = responseText
      .replace(/```json\s*|\s*```/g, '')
      .replace(/[\u201C\u201D]/g, '"')
      .trim();
    const jsonMatch = cleanText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;
    const data = JSON.parse(jsonMatch[0]);
    if (!isValidRecipeData(data)) return null;
    return {
      title: String(data.title),
      description: data.description ? String(data.description) : null,
      ingredients: Array.isArray(data.ingredients)
        ? data.ingredients.map(normalizeIngredient)
        : [],
      instructions: Array.isArray(data.instructions) ? data.instructions.map(String) : [],
      prepTimeMinutes: typeof data.prepTimeMinutes === 'number' ? data.prepTimeMinutes : null,
      cookTimeMinutes: typeof data.cookTimeMinutes === 'number' ? data.cookTimeMinutes : null,
      servings: typeof data.servings === 'number' ? data.servings : null,
      mainIngredients: Array.isArray(data.mainIngredients)
        ? data.mainIngredients.map(String)
        : [],
      cookingMethods: data.cookingMethods,
      difficultyLevel: data.difficultyLevel,
      cuisineType: data.cuisineType,
      estimatedTime: data.estimatedTime,
      nutritionalInfo: data.nutritionalInfo,
      seasonalFlags: data.seasonalFlags,
      equipmentNeeded: data.equipmentNeeded,
    };
  } catch (error) {
    console.error('Error parseando respuesta:', error);
    return null;
  }
};

const normalizeIngredient = (ing: any) => ({
  name: String(ing.name || '').trim(),
  quantity:
    typeof ing.quantity === 'number'
      ? ing.quantity
      : typeof ing.quantity === 'string'
        ? parseFloat(ing.quantity) || null
        : null,
  unit: ing.unit ? String(ing.unit).trim() : null,
});

const isValidRecipeData = (data: any): data is GeneratedRecipeData => {
  return (
    typeof data === 'object' &&
    typeof data.title === 'string' &&
    Array.isArray(data.ingredients) &&
    Array.isArray(data.instructions) &&
    data.ingredients.every((ing: any) => typeof ing === 'object' && typeof ing.name === 'string')
  );
};

const callGeminiApi = async (
  apiKey: string,
  prompt: string,
  creativityLevel: number,
): Promise<GeneratedRecipeData | { error: string }> => {
  const model = 'gemini-1.5-pro';
  const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  const temperature = Math.min(0.9, Math.max(0.2, 0.3 + creativityLevel / 200));
  try {
    const geminiResponse = await fetch(geminiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature,
          topK: 40,
          topP: 0.9,
          maxOutputTokens: 1100,
          stopSequences: ['```'],
        },
        safetySettings: [
          { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
          { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
          { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
          { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
        ],
      }),
    });
    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text();
      return { error: `Error API Google (${geminiResponse.status}): ${errorText}` };
    }
    const geminiResult = await geminiResponse.json();
    const candidate = geminiResult.candidates?.[0];
    const responseText: string | undefined = candidate?.content?.parts?.[0]?.text;
    if (!responseText) {
      return { error: 'Respuesta inválida (sin texto)' };
    }
    const parsedRecipe = parseGeminiResponse(responseText);
    if (!parsedRecipe) {
      return { error: 'No se pudo parsear la respuesta' };
    }
    return parsedRecipe;
  } catch (error) {
    console.error('Error en llamada a Gemini:', error);
    return { error: 'Error procesando solicitud Gemini' };
  }
};

const deriveGamePlan = (options: GenerateRecipeForSlotOptions) => {
  let baseStrategy = options.baseStrategy;
  let styleModifier = options.styleModifier;

  if (options.objectiveContext.specificObjective === 'Ahorrar tiempo') {
    styleModifier = 'rapido';
  }

  if (options.objectiveContext.specificObjective === 'Ahorrar dinero') {
    baseStrategy = 'foco-despensa';
  }

  return { baseStrategy, styleModifier };
};

export const generateRecipeForSlot = async (
  options: GenerateRecipeForSlotOptions,
): Promise<GeneratedRecipeData | { error: string }> => {
  const {
    userId,
    mealType,
    nutritionalContext,
    pantryContext,
    objectiveContext,
    previousRecipesContext = [],
  } = options;

  const sanitizedPreviousContext = validatePreviousContext(previousRecipesContext);

  let preferences: UserPreferences = DEFAULT_USER_PREFERENCES;
  let pantryItems: PantryItem[] = [];
  let apiKeyProfile: UserProfile | null = null;

  try {
    const results = await Promise.allSettled([
      preferencesService.getUserPreferences(userId),
      getPantryItems(),
      getUserProfile(userId),
    ]);

    if (results[0].status === 'fulfilled') {
      preferences = results[0].value;
    }
    if (results[1].status === 'fulfilled') {
      pantryItems = results[1].value;
    }
    if (results[2].status === 'fulfilled') {
      apiKeyProfile = results[2].value;
    }
  } catch (error) {
    console.error('[generateRecipeForSlot] Error obteniendo datos base', error);
  }

  const pantryIngredients =
    pantryContext.available.length > 0
      ? pantryContext.available
      : normalizeIngredients(
          pantryItems
            .map((item) => item.ingredient?.name || item.ingredient_name)
            .filter((name): name is string => !!name),
        );

  const resolveGeminiKey = () => {
    if (typeof process !== 'undefined' && process.env?.VITE_GEMINI_API_KEY) {
      return process.env.VITE_GEMINI_API_KEY;
    }
    try {
      // eslint-disable-next-line no-eval
      return eval('import.meta.env?.VITE_GEMINI_API_KEY');
    } catch {
      return undefined;
    }
  };

  const apiKey = apiKeyProfile?.gemini_api_key || resolveGeminiKey();
  if (!apiKey) {
    return { error: 'No se encontró API Key para Gemini.' };
  }

  const { baseStrategy, styleModifier } = deriveGamePlan(options);

  const searchCriteria: RecipeSearchCriteria = {
    mealType,
    difficulty: preferences.complexityPreference,
    ...(options.maxPrepTime && { maxTime: options.maxPrepTime }),
    ...(options.cuisinePreferences && options.cuisinePreferences.length > 0
      ? { cuisineTypes: options.cuisinePreferences as CuisineType[] }
      : {}),
    excludeIngredients: normalizeList(options.avoidIngredients),
  };

  const candidateRecipes = await recipeDataService.getCandidateRecipes();
  const filteredRecipes = await recipeFilterService.filterRecipes(
    userId,
    candidateRecipes,
    searchCriteria,
  );

  let selectedRecipe: Recipe | null = null;
  let generatedData: GeneratedRecipeData | null = null;

  if (filteredRecipes.length > 0 && (objectiveContext.creativityLevel ?? 50) <= 70) {
    selectedRecipe = filteredRecipes[Math.floor(Math.random() * filteredRecipes.length)];
    generatedData = {
      title: selectedRecipe.title,
      description: selectedRecipe.description,
      ingredients: selectedRecipe.ingredients.map((ing) => ({
        name: ing.ingredient_name ?? 'Desconocido',
        quantity: ing.quantity,
        unit: ing.unit,
      })),
      instructions: selectedRecipe.instructions,
      prepTimeMinutes: selectedRecipe.prep_time_minutes,
      cookTimeMinutes: selectedRecipe.cook_time_minutes,
      servings: selectedRecipe.servings,
      tags: selectedRecipe.tags,
      mainIngredients: selectedRecipe.main_ingredients ?? undefined,
      cookingMethods: selectedRecipe.cooking_methods,
      difficultyLevel: selectedRecipe.difficulty_level,
      cuisineType: selectedRecipe.cuisine_type,
      estimatedTime: selectedRecipe.estimated_time,
      nutritionalInfo: selectedRecipe.nutritional_info,
      seasonalFlags: selectedRecipe.seasonal_flags,
      equipmentNeeded: selectedRecipe.equipment_needed,
      imageUrl: selectedRecipe.image_url ?? null,
    };
  }

  const creativePrompt = buildCreativePrompt({
    baseRecipe: generatedData ? selectedRecipe : null,
    pantryIngredients,
    preferences,
    options,
  });

  const llmResult = await callGeminiApi(
    apiKey,
    creativePrompt,
    objectiveContext.creativityLevel ?? 50,
  );

  if (!('error' in llmResult)) {
    return ensureRecipeHasImage(llmResult);
  }

  if (generatedData) {
    return ensureRecipeHasImage(generatedData);
  }

  return { error: llmResult.error };
};

export interface GenerateRecipesResult {
  recipes: GeneratedRecipeData[];
  success: boolean;
  error?: string;
}

export interface GenerateSingleRecipeParams {
  userId: string;
  mealType?: MealType;
  pantryIngredients?: string[];
  prioritizeIngredients?: string[];
  expiringIngredients?: string[];
  creativityLevel?: number;
  maxPrepTime?: number;
  cuisinePreferences?: string[];
  avoidIngredients?: string[];
  availableEquipment?: string[];
  allergies?: string[];
  dietaryMode?: string;
  dayOfWeek?: string;
  autoUsePantryOnly?: boolean;
}

export const generateSingleRecipe = async (
  params: GenerateSingleRecipeParams,
): Promise<GeneratedRecipeData | { error: string }> => {
  const {
    userId,
    mealType = 'Almuerzo',
    pantryIngredients = [],
    prioritizeIngredients = [],
    expiringIngredients = [],
    creativityLevel = 55,
    maxPrepTime,
    cuisinePreferences,
    avoidIngredients,
    availableEquipment,
    allergies,
    dietaryMode,
    dayOfWeek = 'hoy',
    autoUsePantryOnly = true,
  } = params;

  if (!userId) {
    return { error: 'No hay usuario autenticado para generar la receta.' };
  }

  return generateRecipeForSlot({
    userId,
    mealType,
    baseStrategy: autoUsePantryOnly ? 'foco-despensa' : 'creacion-equilibrada',
    styleModifier: 'creativo',
    nutritionalContext: {
      dayOfWeek,
      mealType,
      calorieTarget: undefined,
      availableEquipment,
      allergies,
      maxPrepTime,
    },
    pantryContext: {
      available: pantryIngredients,
      prioritized: prioritizeIngredients,
      expiringSoon: expiringIngredients,
      autoUsePantryOnly,
    },
    objectiveContext: {
      specificObjective: autoUsePantryOnly
        ? 'Usar ingredientes de despensa'
        : 'Inspirar una receta equilibrada',
      creativityLevel,
    },
    previousRecipesContext: [],
    maxPrepTime,
    cuisinePreferences,
    avoidIngredients,
    availableEquipment,
    allergies,
    dietaryMode,
    expiringIngredients,
    prioritizeIngredients,
  });
};

export const generateRecipesFromPantry = async (
  userId: string,
  count: number = 3,
): Promise<GenerateRecipesResult> => {
  const recipes: GeneratedRecipeData[] = [];
  for (let i = 0; i < count; i++) {
    const result = await generateRecipeForSlot({
      userId,
      mealType: 'Almuerzo',
      baseStrategy: 'foco-despensa',
      styleModifier: 'creativo',
      nutritionalContext: {
        dayOfWeek: 'miércoles',
        mealType: 'Almuerzo',
        calorieTarget: 550,
        availableEquipment: [],
      },
      pantryContext: {
        available: [],
        prioritized: [],
        expiringSoon: [],
        autoUsePantryOnly: true,
      },
      objectiveContext: {
        specificObjective: 'Usar ingredientes de despensa',
        creativityLevel: 60,
      },
      previousRecipesContext: [],
    });

    if (!('error' in result)) {
      recipes.push(result);
    }
  }

  return {
    recipes,
    success: recipes.length > 0,
    error: recipes.length === 0 ? 'No se pudieron generar recetas' : undefined,
  };
};

/**
 * Suggests a single recipe based on pantry ingredients
 */
export const generateRecipeVariation = async (
  recipe: Recipe,
  variationRequest: string
): Promise<GeneratedRecipeData | { error: string }> => {
  // TODO: Implement recipe variation functionality
  return { error: 'Recipe variation feature is not yet implemented' };
};

export const suggestSingleRecipeFromPantry = async (
  userId: string
): Promise<GeneratedRecipeData | null> => {
  try {
    const result = await generateRecipeForSlot({
      userId,
      mealType: 'Almuerzo',
      baseStrategy: 'foco-despensa',
      styleModifier: 'creativo',
      nutritionalContext: {
        dayOfWeek: 'miércoles',
        mealType: 'Almuerzo',
        calorieTarget: 550,
        availableEquipment: [],
      },
      pantryContext: {
        available: [],
        prioritized: [],
        expiringSoon: [],
        autoUsePantryOnly: true,
      },
      objectiveContext: {
        specificObjective: 'Usar ingredientes de despensa',
        creativityLevel: 60,
      },
      previousRecipesContext: [],
    });

    if ('error' in result) {
      console.error('Error generating recipe suggestion:', result.error);
      return null;
    }

    return result;
  } catch (error) {
    console.error('Error in suggestSingleRecipeFromPantry:', error);
    return null;
  }
};
