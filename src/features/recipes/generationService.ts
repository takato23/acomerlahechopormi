import { getUserProfile } from '@/features/user/userService';
import type { UserProfile } from '@/features/user/userTypes';
import { getPantryItems } from '@/features/pantry/pantryService';
import type { PantryItem } from '@/features/pantry/types';
import type { Recipe, RecipeIngredient } from '@/types/recipeTypes'; // RecipeIngredient añadido

// Definición temporal de GeneratedRecipeData basada en su uso
// Idealmente, esto debería estar en @/types/recipeTypes.ts si se usa globalmente
interface GeneratedRecipeData {
  title: string;
  description: string | null;
  ingredients: Array<{ name: string; quantity: number | null; unit: string | null }>;
  instructions: string[];
  prepTimeMinutes: number | null;
  cookTimeMinutes: number | null;
  servings: number | null;
  mainIngredients?: string[]; // Mantener opcional por si acaso
  // Añadir otras propiedades si son usadas por parseGeminiResponse
  cookingMethods?: any;
  difficultyLevel?: any;
  cuisineType?: any;
  estimatedTime?: any;
  nutritionalInfo?: any;
  seasonalFlags?: any;
  equipmentNeeded?: any;
  tags?: string[] | null; // Añadido basado en uso posterior
}
import { preferencesService } from '@/features/user/services/PreferencesService';
import { recipeHistoryService } from './services/RecipeHistoryService';
// import { RecipeHistoryEntryWithDetails } from './services/RecipeHistoryService'; // Comentado - Tipo no exportado
import { recipeFilterService } from './services/RecipeFilterService';
import { recipeDataService } from './services/RecipeDataService';
import { RecipeSearchCriteria } from '@/types/recipeRecommendationTypes';
import { UserPreferences, DEFAULT_USER_PREFERENCES, CuisineType } from '@/types/userPreferences'; // Importar UserPreferences y defaults

// --- Tipos para Estrategias y Contexto ---
export type BaseStrategy = 'foco-despensa' | 'creacion-equilibrada' | 'variedad-maxima';
export type StyleModifier = 'rapido' | 'saludable' | 'creativo' | 'cocina-especifica' | null;
export type MealType = 'Desayuno' | 'Almuerzo' | 'Cena' | 'Merienda';

export interface PreviousRecipeContext {
  title: string;
  mainIngredients?: string[];
  mealType: MealType;
  recipeId: string;
}

/**
 * Normaliza una lista de ingredientes
 */
const normalizeIngredients = (ingredients: string[]): string[] => {
  const normalizedSet = new Set(
    ingredients
      .map(ing => ing.toLowerCase().trim())
      .map(ing => ing.endsWith('s') && ing.length > 3 ? ing.slice(0, -1) : ing)
  );
  return [...normalizedSet];
};

/**
 * Valida y filtra el contexto de recetas previas
 */
const validatePreviousContext = (context: PreviousRecipeContext[]): PreviousRecipeContext[] => {
  return context.filter(recipe =>
    recipe && recipe.recipeId && recipe.title && recipe.mealType
  );
};

/**
 * Construye el prompt para la generación de recetas (ENFOCADO EN CREATIVIDAD/ADAPTACIÓN)
 */
export const buildCreativePrompt = (
  baseRecipe: Recipe | null,
  pantryIngredients: string[],
  preferences: UserPreferences, // Asegurar que no sea null aquí
  requestContext?: string,
  mealType?: MealType,
  styleModifier: StyleModifier = null,
  previousRecipesContext: PreviousRecipeContext[] = []
): string => {
  const exampleRecipe = {
    title: "Tostadas con Aguacate", description: "Desayuno rápido y nutritivo",
    ingredients: [ { name: "Pan integral", quantity: 2, unit: "rebanadas" }, { name: "Aguacate", quantity: 1, unit: "unidad" } ],
    instructions: [ "Tostar el pan hasta que esté dorado", "Machacar el aguacate y untarlo sobre el pan" ],
    prepTimeMinutes: 5, cookTimeMinutes: 3, servings: 1, mainIngredients: ["pan", "aguacate"]
  };

  let prompt = `
INSTRUCCIONES:
Genera una receta ${styleModifier ? `con estilo '${styleModifier}' ` : ''}para ${mealType || 'una comida'} ${requestContext ? `(${requestContext})` : ''} en formato JSON siguiendo EXACTAMENTE esta estructura:
${JSON.stringify(exampleRecipe, null, 2)}

REGLAS:
1. SOLO JSON VÁLIDO. Sin texto adicional.
2. SÉ CREATIVO y VARIADO.
3. USA comillas dobles. Campos numéricos sin comillas.
4. TODOS los campos son OBLIGATORIOS.
`;

  if (baseRecipe) {
    prompt += `\nADAPTACIÓN:\nAdapta la siguiente receta base:\nTitulo: ${baseRecipe.title}\n`; // main_ingredients no existe en el tipo Recipe actual
  } else {
    prompt += `\nGENERACIÓN:\nGenera una nueva receta.\n`;
  }

  if (pantryIngredients.length > 0) {
    prompt += `Ingredientes disponibles: ${pantryIngredients.join(', ')}. Intenta usarlos.\n`;
  }

  // Añadir preferencias (ahora sabemos que 'preferences' no es null)
  if (preferences.dietaryRestrictions?.length > 0) {
     prompt += `Restricciones dietéticas: ${preferences.dietaryRestrictions.join(', ')}.\n`;
  }
  if (preferences.dislikedIngredients?.length > 0) {
     prompt += `Evitar ingredientes: ${preferences.dislikedIngredients.join(', ')}.\n`;
  }
  if (preferences.cuisinePreferences?.length > 0) {
     prompt += `Preferencias de cocina: ${preferences.cuisinePreferences.join(', ')}.\n`;
  }
  prompt += `Preferencia de complejidad: ${preferences.complexityPreference}.\n`;

  // Contexto previo
  if (previousRecipesContext.length > 0) {
    const previousTitles = previousRecipesContext.map(r => r.title).join(', ');
    prompt += `\nCONTEXTO: Evita recetas muy similares a: ${previousTitles}.\n`;
  }

  prompt += '\nIMPORTANTE: RETORNA SOLO JSON VÁLIDO.\n';
  return prompt;
};

/**
 * Parsea la respuesta JSON de Gemini
 */
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
      ingredients: Array.isArray(data.ingredients) ? data.ingredients.map(normalizeIngredient) : [],
      instructions: Array.isArray(data.instructions) ? data.instructions.map(String) : [],
      prepTimeMinutes: typeof data.prepTimeMinutes === 'number' ? data.prepTimeMinutes : null,
      cookTimeMinutes: typeof data.cookTimeMinutes === 'number' ? data.cookTimeMinutes : null,
      servings: typeof data.servings === 'number' ? data.servings : null,
      mainIngredients: Array.isArray(data.mainIngredients) ? data.mainIngredients.map(String) : [],
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
  quantity: typeof ing.quantity === 'number' ? ing.quantity :
           typeof ing.quantity === 'string' ? parseFloat(ing.quantity) || null : null,
  unit: ing.unit ? String(ing.unit).trim() : null
});

const isValidRecipeData = (data: any): data is GeneratedRecipeData => {
  return (
    typeof data === 'object' &&
    typeof data.title === 'string' &&
    Array.isArray(data.ingredients) &&
    Array.isArray(data.instructions) &&
    data.ingredients.every((ing: any) =>
      typeof ing === 'object' && typeof ing.name === 'string'
    )
  );
};


/**
 * Llama a la API de Gemini
 */
const callGeminiApi = async (apiKey: string, prompt: string): Promise<GeneratedRecipeData | { error: string }> => {
  const model = 'gemini-2.0-flash'; // Cambiado según sugerencia del usuario
  console.log(`[callGeminiApi] Usando modelo: ${model}`);
  const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  // Loguear el prompt antes de enviarlo
  console.log("[callGeminiApi] Prompt enviado a Gemini:", JSON.stringify(prompt));
  try {
    const geminiResponse = await fetch(geminiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          // Simplificar generationConfig y safetySettings para probar
          generationConfig: {
            temperature: 0.7,
            // topK: 40, // Comentado para simplificar
            // topP: 0.9, // Comentado para simplificar
            maxOutputTokens: 1024,
            // stopSequences: ["\n\n", "```"], // Comentado para simplificar
          },
          // Usar safetySettings mínimos (BLOCK_NONE es lo más permisivo)
           safetySettings: [
             { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
             { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
             { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
             { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" }
           ]
        }),
      });
    if (!geminiResponse.ok) {
        const errorText = await geminiResponse.text();
        console.error("Error API Google:", geminiResponse.status, errorText);
        return { error: `Error API Google (${geminiResponse.status})` };
    }
    const geminiResult = await geminiResponse.json();
    let responseText: string | undefined;
    const candidate = geminiResult.candidates?.[0];
    if (candidate?.content?.parts?.[0]?.text) {
      responseText = candidate.content.parts[0].text;
    } // ... (más lógica de extracción) ...
    if (!responseText) {
        console.error("No se pudo extraer texto:", JSON.stringify(geminiResult, null, 2));
        return { error: "Respuesta inválida (sin texto)" };
    }
    const parsedRecipe = parseGeminiResponse(responseText);
    if (!parsedRecipe) {
        console.error("No se pudo parsear:", responseText);
        return { error: "No se pudo parsear la respuesta" };
    }
    return parsedRecipe;
  } catch (error) {
    console.error('Error en llamada a Gemini:', error);
    return { error: 'Error procesando solicitud Gemini' };
  }
};

/**
 * NUEVA LÓGICA: Genera una receta para un slot usando el sistema híbrido
 */
export const generateRecipeForSlot = async (
  userId: string,
  mealType: MealType,
  context?: string,
  baseStrategy: BaseStrategy = 'creacion-equilibrada',
  styleModifier: StyleModifier = null,
  cocinaEspecificaValue?: string,
  previousRecipesContext: PreviousRecipeContext[] = []
): Promise<GeneratedRecipeData | { error: string }> => {
  console.log(`[generateRecipeForSlot HYBRID] Iniciando para ${userId}, Slot: ${context}, Meal: ${mealType}`);

  // 1. Obtener Contexto Enriquecido
  let preferences: UserPreferences = DEFAULT_USER_PREFERENCES; // Iniciar con defaults
  let pantryItems: PantryItem[] = [];
  let apiKeyProfile: UserProfile | null = null;

  try {
      // Usar Promise.allSettled para manejar errores individuales
      const results = await Promise.allSettled([
          preferencesService.getUserPreferences(userId),
          getPantryItems(),
          getUserProfile(userId)
      ]);

      if (results[0].status === 'fulfilled') {
          preferences = results[0].value;
      } else {
          console.warn("Error obteniendo preferencias, usando defaults:", results[0].reason);
      }
      if (results[1].status === 'fulfilled') {
          pantryItems = results[1].value;
      } else {
          console.warn("Error obteniendo despensa:", results[1].reason);
      }
      if (results[2].status === 'fulfilled') {
          apiKeyProfile = results[2].value;
      } else {
          console.warn("Error obteniendo perfil:", results[2].reason);
      }

  } catch (err) {
      // Catch general por si Promise.allSettled falla (poco probable)
      console.error("Error crítico obteniendo contexto inicial:", err);
      return { error: "Error interno al cargar datos necesarios." };
  }

  const pantryIngredients = normalizeIngredients(
    pantryItems.map(item => item.ingredient?.name).filter((name): name is string => !!name)
  );
  console.log(`[generateRecipeForSlot HYBRID] Ingredientes despensa: ${pantryIngredients.length}`);

  // 2. Obtener API Key
  let apiKey: string | undefined | null = null;
  let apiKeySource: string = 'N/A';

  if (apiKeyProfile?.gemini_api_key) {
      apiKey = apiKeyProfile.gemini_api_key;
      apiKeySource = 'User Profile';
  } else if (import.meta.env.VITE_GEMINI_API_KEY) {
      apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      apiKeySource = 'Environment Variable';
  }

  // Loguear la fuente de la API Key
  console.log(`[generateRecipeForSlot HYBRID] API Key Source: ${apiKeySource}`);

  if (!apiKey) {
    console.error('[generateRecipeForSlot HYBRID] No API Key found from profile or environment variable.');
    return { error: 'No se encontró API Key para Gemini.' };
  }
  // Loguear solo los últimos caracteres para verificación (NUNCA la clave completa)
  console.log(`[generateRecipeForSlot HYBRID] Using API Key ending with: ...${apiKey.slice(-4)}`);

  // 3. Definir Criterios de Búsqueda Iniciales
  const searchCriteria: RecipeSearchCriteria = {
    // @ts-ignore - Sabemos que mealType no es undefined aquí, pero el tipo lo espera opcional.
    mealType: mealType,
    difficulty: preferences.complexityPreference,
    ...(styleModifier === 'rapido' && { maxTime: 45 }),
    ...(styleModifier === 'cocina-especifica' && { cuisineTypes: [cocinaEspecificaValue as CuisineType] }),
    excludeIngredients: preferences.dislikedIngredients,
  };

  // 4. Obtener Recetas Candidatas y Filtrar
  console.log("[generateRecipeForSlot HYBRID] Obteniendo recetas candidatas...");
  const candidateRecipes = await recipeDataService.getCandidateRecipes();
  console.log(`[generateRecipeForSlot HYBRID] ${candidateRecipes.length} candidatas obtenidas.`);

  console.log("[generateRecipeForSlot HYBRID] Filtrando recetas...");
  const filteredRecipes = await recipeFilterService.filterRecipes(
    userId,
    candidateRecipes,
    searchCriteria
  );
  console.log(`[generateRecipeForSlot HYBRID] ${filteredRecipes.length} recetas filtradas.`);

  // 5. Estrategia de Selección/Generación
  let selectedRecipe: Recipe | null = null;
  let generatedData: GeneratedRecipeData | null = null;

  if (filteredRecipes.length > 0) {
    selectedRecipe = filteredRecipes[Math.floor(Math.random() * filteredRecipes.length)];
    console.log(`[generateRecipeForSlot HYBRID] Receta seleccionada: ${selectedRecipe.title}`);
    generatedData = {
        title: selectedRecipe.title,
        description: selectedRecipe.description ?? null, // Convertir undefined a null
        // Usar recipe_ingredients en lugar de ingredients y añadir tipo a 'ing'
        // Convertir undefined a null para quantity y unit
        ingredients: (selectedRecipe.recipe_ingredients || []).map((ing: RecipeIngredient) => ({
            name: ing.ingredient_name ?? 'Desconocido',
            quantity: ing.quantity ?? null,
            unit: ing.unit ?? null
        })),
        instructions: selectedRecipe.instructions,
        prepTimeMinutes: selectedRecipe.prep_time_minutes ?? null, // Convertir undefined a null
        cookTimeMinutes: selectedRecipe.cook_time_minutes ?? null, // Convertir undefined a null
        servings: selectedRecipe.servings ?? null, // Convertir undefined a null
        tags: selectedRecipe.tags,
        // mainIngredients: selectedRecipe.main_ingredients ?? undefined, // No existe
        // cookingMethods: selectedRecipe.cooking_methods, // No existe
        // difficultyLevel: selectedRecipe.difficulty_level, // No existe
        // cuisineType: selectedRecipe.cuisine_type, // No existe
        // estimatedTime: selectedRecipe.estimated_time, // No existe
        // nutritionalInfo: selectedRecipe.nutritional_info, // No existe
        // seasonalFlags: selectedRecipe.seasonal_flags, // No existe
        // equipmentNeeded: selectedRecipe.equipment_needed, // No existe
    };

    if (styleModifier === 'creativo' || baseStrategy === 'creacion-equilibrada') {
        console.log("[generateRecipeForSlot HYBRID] Usando LLM para adaptar...");
        // Pasar 'preferences' que ahora sabemos que no es null
        const creativePrompt = buildCreativePrompt(selectedRecipe, pantryIngredients, preferences, context, mealType, styleModifier, previousRecipesContext);
        const adaptationResult = await callGeminiApi(apiKey, creativePrompt);
        if (!('error' in adaptationResult)) {
            generatedData = adaptationResult;
            console.log(`[generateRecipeForSlot HYBRID] Receta adaptada: ${generatedData.title}`);
        } else {
            console.warn("[generateRecipeForSlot HYBRID] Falló adaptación LLM.");
        }
    }

  } else {
    console.log("[generateRecipeForSlot HYBRID] No hay recetas válidas. Generando con LLM...");
    // Pasar 'preferences' que ahora sabemos que no es null
    const generationPrompt = buildCreativePrompt(null, pantryIngredients, preferences, context, mealType, styleModifier, previousRecipesContext);
    const generationResult = await callGeminiApi(apiKey, generationPrompt);
    if (!('error' in generationResult)) {
      generatedData = generationResult;
      console.log(`[generateRecipeForSlot HYBRID] Receta generada: ${generatedData.title}`);
    } else {
      console.error("[generateRecipeForSlot HYBRID] Falló generación LLM.");
      return { error: "No se encontraron recetas adecuadas y falló la generación con IA." };
    }
  }

  if (!generatedData) {
     return { error: "No se pudo seleccionar ni generar una receta." };
  }

  return generatedData;
};

/**
 * Función anterior (generateSingleRecipe) - DEPRECATED
 */
export const generateSingleRecipe = async (
  userId: string,
  context?: string,
  baseStrategy: BaseStrategy = 'creacion-equilibrada',
  styleModifier: StyleModifier = null
): Promise<GeneratedRecipeData | { error: string }> => {
   console.warn("[generateSingleRecipe] Función obsoleta. Usar generateRecipeForSlot.");
   return generateRecipeForSlot(userId, 'Almuerzo', context, baseStrategy, styleModifier);
};

/**
 * Genera una variación de una receta basada en un texto de solicitud del usuario
 * @param baseRecipe La receta original a variar
 * @param requestText Texto describiendo la variación deseada (ej: "Hacerla vegetariana", "Con menos carbohidratos")
 * @returns La nueva receta variada o un objeto de error
 */
export const generateRecipeVariation = async (
  baseRecipe: Recipe,
  requestText: string
): Promise<Recipe | null> => {
  console.log(`Generando variación para receta "${baseRecipe.title}" con solicitud: "${requestText}"`);
  
  try {
    // Obtener el perfil del usuario actual
    const userProfile = await getUserProfile(baseRecipe.user_id);
    if (!userProfile?.gemini_api_key) {
      console.error('No se encontró API key de Gemini para el usuario');
      return null;
    }
    
    // Obtener preferencias del usuario (o usar defaults si no hay)
    const preferences = await preferencesService.getUserPreferences(baseRecipe.user_id) || DEFAULT_USER_PREFERENCES;
    
    // Construir prompt especial para variación
    const prompt = `
INSTRUCCIONES:
Genera una VARIACIÓN de la siguiente receta basada en esta solicitud: "${requestText}"
Receta original: "${baseRecipe.title}"

Formato JSON requerido:
{
  "title": "Título de la variación",
  "description": "Descripción breve",
  "ingredients": [
    {"name": "Ingrediente 1", "quantity": 2, "unit": "unidades"},
    {"name": "Ingrediente 2", "quantity": 100, "unit": "gramos"}
  ],
  "instructions": [
    "Paso 1 de la preparación",
    "Paso 2 de la preparación"
  ],
  "prepTimeMinutes": 15,
  "cookTimeMinutes": 20,
  "servings": 4,
  "mainIngredients": ["ingrediente principal 1", "ingrediente principal 2"]
}

RECETA ORIGINAL A MODIFICAR:
Título: ${baseRecipe.title}
Descripción: ${baseRecipe.description || ''}
Ingredientes: ${JSON.stringify(baseRecipe.recipe_ingredients || [])}
Instrucciones: ${JSON.stringify(baseRecipe.instructions || [])}
Tiempo de preparación: ${baseRecipe.prep_time_minutes || 0} minutos
Tiempo de cocción: ${baseRecipe.cook_time_minutes || 0} minutos
Porciones: ${baseRecipe.servings || 4}

REQUISITOS DE LA VARIACIÓN:
${requestText}

REGLAS:
1. CAMBIAR la receta según la solicitud, pero mantener su esencia.
2. NO repetir exactamente la receta original.
3. SOLO devolver JSON válido con comillas dobles.
4. Si la solicitud pide reducir/incrementar algo, AJUSTAR cantidades o ingredientes adecuadamente.

IMPORTANTE: RETORNA SOLO JSON VÁLIDO.
`;

    // Llamar a la API de Gemini con el prompt de variación
    const generatedData = await callGeminiApi(userProfile.gemini_api_key, prompt);
    
    // Verificar si hubo error
    if ('error' in generatedData) {
      console.error('Error generando variación:', generatedData.error);
      return null;
    }
    
    // Convertir el resultado a una receta completa
    const newRecipe: Recipe = {
      id: '', // Se generará al guardar
      user_id: baseRecipe.user_id,
      title: generatedData.title,
      description: generatedData.description || '',
      instructions: generatedData.instructions,
      prep_time_minutes: generatedData.prepTimeMinutes || 0,
      cook_time_minutes: generatedData.cookTimeMinutes || 0,
      servings: generatedData.servings || 4,
      image_url: undefined, // La variación no hereda la imagen
      created_at: new Date().toISOString(),
      recipe_ingredients: generatedData.ingredients.map(ing => ({
        id: '', // Se generará al guardar
        recipe_id: '', // Se generará al guardar
        ingredient_name: ing.name,
        quantity: ing.quantity || 0,
        unit: ing.unit || ''
      })),
      is_favorite: false,
      is_public: baseRecipe.is_public,
      tags: generatedData.tags || baseRecipe.tags
    };
    
    return newRecipe;
  } catch (error) {
    console.error('Error generando variación de receta:', error);
    return null;
  }
};