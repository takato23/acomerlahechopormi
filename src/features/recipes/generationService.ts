import { getUserProfile } from '@/features/user/userService';
import type { UserProfile } from '@/features/user/userTypes';
import { getPantryItems } from '@/features/pantry/pantryService';
import type { PantryItem } from '@/features/pantry/types';
import type { Recipe, RecipeIngredient, GeneratedRecipeData, IngredientWithAmount, NutritionalInfo } from '@/types/recipeTypes'; // RecipeIngredient añadido
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
  preferences: UserPreferences,
  requestContext?: string,
  mealType?: MealType,
  styleModifier: StyleModifier = null,
  previousRecipesContext: PreviousRecipeContext[] = []
): string => {
  const exampleRecipe = {
    title: "Tostadas con Aguacate", description: "Desayuno rápido y nutritivo",
    ingredients: [ { name: "Pan integral", quantity: 2, unit: "rebanadas" }, { name: "Aguacate", quantity: 1, unit: "unidad" } ],
    instructions: [ "Tostar el pan hasta que esté dorado", "Machacar el aguacate y untarlo sobre el pan" ],
    prepTimeMinutes: 5, cookTimeMinutes: 3, servings: 1, mainIngredients: ["pan", "aguacate"],
    nutritionalInfo: {
        calories: 300, // Estimado por porción
        protein: 10, // en gramos
        carbs: 30, // en gramos
        fat: 15, // en gramos
        fiber: 5, // en gramos (opcional)
        sugar: 2 // en gramos (opcional)
    }
  };

  let prompt = `
INSTRUCCIONES:
Genera una receta ${styleModifier ? `con estilo '${styleModifier}' ` : ''}para ${mealType || 'una comida'} ${requestContext ? `(${requestContext})` : ''} en formato JSON siguiendo EXACTAMENTE esta estructura (incluyendo el campo nutritionalInfo):
${JSON.stringify(exampleRecipe, null, 2)}

REGLAS:
1. SOLO JSON VÁLIDO. Sin texto adicional.
2. SÉ CREATIVO y VARIADO.
3. USA comillas dobles. Campos numéricos sin comillas.
4. TODOS los campos son OBLIGATORIOS, incluyendo una estimación para cada campo dentro de nutritionalInfo (calories, protein, carbs, fat, fiber, sugar).
5. Proporciona una estimación RAZONABLE para nutritionalInfo por porción.
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

// Array de imágenes de recetas por defecto para fallback
const DEFAULT_RECIPE_IMAGES = [
  'https://images.unsplash.com/photo-1466637574441-749b8f19452f?w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1518779578993-ec3579fee39f?w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1547592180-85f173990554?w=800&auto=format&fit=crop'
];

// Helper para obtener una imagen de fallback por categoría o random
const getFallbackImage = (category?: string): string => {
  // Si no hay categoría o no la encontramos, usamos una imagen aleatoria
  return DEFAULT_RECIPE_IMAGES[Math.floor(Math.random() * DEFAULT_RECIPE_IMAGES.length)];
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
      image_url: data.image_url,
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

// Helper para verificar si una URL de imagen es válida
const isValidImageUrl = async (url: string): Promise<boolean> => {
  try {
    const response = await fetch(url, { method: 'HEAD', cache: 'no-cache' });
    const contentType = response.headers.get('content-type');
    return response.ok && (contentType ? contentType.startsWith('image/') : false);
  } catch (error) {
    console.error(`Error validando URL de imagen: ${url}`, error);
    return false;
  }
};

// Helper para optimizar URL de imagen añadiendo parámetros
const optimizeImageUrl = (url: string): string => {
  try {
    // Parsear la URL para añadir parámetros de optimización
    const parsedUrl = new URL(url);
    
    // Si es una URL de Spoonacular, ya está optimizada
    if (parsedUrl.hostname.includes('spoonacular.com')) {
      return url;
    }
    
    // Si es Unsplash, podemos añadir parámetros de optimización
    if (parsedUrl.hostname.includes('unsplash.com')) {
      if (!url.includes('w=')) {
        return `${url}${url.includes('?') ? '&' : '?'}w=800&auto=format&fit=crop`;
      }
    }
    
    return url;
  } catch (error) {
    console.error('Error optimizando URL de imagen:', error);
    return url; // Devolver la URL original si hay error
  }
};

// Helper function to search for recipe image on Spoonacular with fallback
const fetchRecipeImage = async (title: string, category?: string): Promise<{imageUrl: string | null, nutritionalInfo?: NutritionalInfo | null}> => {
  if (!title) return { imageUrl: getFallbackImage(category) };
  
  // API key proporcionada por el usuario
  const SPOONACULAR_API_KEY = '59dd87d383354faa97641d5b9e97e5c6';
  
  try {
    // 1. Intentar primero con Spoonacular
    const searchUrl = `https://api.spoonacular.com/recipes/complexSearch?apiKey=${SPOONACULAR_API_KEY}&query=${encodeURIComponent(title)}&number=1&addNutrition=true`;
    console.log(`[fetchRecipeImage] Buscando imagen e info nutricional para "${title}" en Spoonacular`);
    
    const response = await fetch(searchUrl);
    if (response.ok) {
      const data = await response.json();
      if (data.results && data.results.length > 0) {
        const recipeData = data.results[0];
        let nutritionalInfo: NutritionalInfo | null = null;
        
        // Extraer información nutricional si está disponible
        if (recipeData.nutrition && recipeData.nutrition.nutrients) {
          const nutrients = recipeData.nutrition.nutrients;
          nutritionalInfo = {
            calories: nutrients.find((n: any) => n.name === "Calories")?.amount || 0,
            protein: nutrients.find((n: any) => n.name === "Protein")?.amount || 0,
            carbs: nutrients.find((n: any) => n.name === "Carbohydrates")?.amount || 0,
            fat: nutrients.find((n: any) => n.name === "Fat")?.amount || 0,
            fiber: nutrients.find((n: any) => n.name === "Fiber")?.amount || 0,
            sugar: nutrients.find((n: any) => n.name === "Sugar")?.amount || 0
          };
        }

        // Si tenemos imagen, prepararla
        if (recipeData.image) {
          const imageUrl = `https://spoonacular.com/recipeImages/${recipeData.image}`;
          console.log(`[fetchRecipeImage] Imagen e info nutricional encontradas en Spoonacular`);
          return { 
            imageUrl, 
            nutritionalInfo 
          };
        }
        
        // Si tenemos nutrientes pero no imagen
        if (nutritionalInfo) {
          return {
            imageUrl: getFallbackImage(category),
            nutritionalInfo
          };
        }
      }
    }
    
    // 2. Fallback: Buscar en Unsplash
    console.log(`[fetchRecipeImage] No se encontró imagen en Spoonacular, buscando en Unsplash...`);
    const unsplashUrl = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(title + " food")}&per_page=1&client_id=YOUR_UNSPLASH_KEY`;
    
    // NOTA: Para producción, deberías usar una API key de Unsplash
    // Como este es un fallback secundario, usamos imágenes por defecto si no tienes una key
    
    // Incluso sin API key, usamos una selección de imágenes predefinidas
    return { imageUrl: getFallbackImage(category) };
    
  } catch (error) {
    console.error('Error buscando imagen de receta:', error);
    // 3. Fallback final: Imagen por defecto
    return { imageUrl: getFallbackImage(category) };
  }
};

/**
 * Llama a la API de Gemini y luego busca imagen en TheMealDB
 */
const callGeminiAndFetchImage = async (apiKey: string, prompt: string): Promise<GeneratedRecipeData | { error: string }> => {
  const model = 'gemini-1.5-flash'; // Cambiado según sugerencia del usuario
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
            // stopSequences: [\"\\n\\n\", \"```\"], // Comentado para simplificar
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
        // Devolver error estructurado
        return { error: `Error API Google (${geminiResponse.status}): ${errorText.substring(0, 200)}` };
    }
    const geminiResult = await geminiResponse.json();
    let responseText: string | undefined;

    // Check for errors in the response structure itself
    if (geminiResult.error) {
       console.error("Error in Gemini Response:", geminiResult.error);
       return { error: `Error from Gemini API: ${geminiResult.error.message || JSON.stringify(geminiResult.error)}` };
    }
     if (!geminiResult.candidates || geminiResult.candidates.length === 0) {
        // Check for promptFeedback if no candidates
        if (geminiResult.promptFeedback?.blockReason) {
             console.error("Prompt blocked by Gemini:", geminiResult.promptFeedback.blockReason, geminiResult.promptFeedback.safetyRatings);
             return { error: `Prompt bloqueado por Gemini: ${geminiResult.promptFeedback.blockReason}` };
         } else {
            console.error("Respuesta inválida (sin candidatos):", JSON.stringify(geminiResult, null, 2));
            return { error: "Respuesta inválida de Gemini (sin candidatos)" };
         }
    }


    const candidate = geminiResult.candidates[0];

     // Check for finishReason
     if (candidate.finishReason && candidate.finishReason !== 'STOP') {
         console.warn(`Gemini finish reason: ${candidate.finishReason}`);
         // Optionally return an error or handle specific reasons like 'SAFETY'
         if (candidate.finishReason === 'SAFETY') {
              console.error("Generación detenida por seguridad:", candidate.safetyRatings);
              return { error: "Contenido bloqueado por políticas de seguridad." };
         }
         // Consider other reasons potentially problematic
     }


    if (candidate?.content?.parts?.[0]?.text) {
      responseText = candidate.content.parts[0].text;
    } else {
       console.error("No se pudo extraer texto de la respuesta válida:", JSON.stringify(geminiResult, null, 2));
       return { error: "Respuesta válida pero sin texto extraíble." }; // More specific error
    }

    if (!responseText) {
        // This case should ideally be covered above, but as a fallback
        console.error("No se pudo extraer texto (fallback):", JSON.stringify(geminiResult, null, 2));
        return { error: "Respuesta inválida (sin texto - fallback)" };
    }

    const parsedRecipe = parseGeminiResponse(responseText);
    if (!parsedRecipe) {
        console.error("No se pudo parsear el JSON de la receta:", responseText);
        // Intentar extraer un mensaje de error si el JSON es inválido pero no vacío
        let parseErrorMsg = "No se pudo parsear la respuesta como JSON válido.";
         try {
             JSON.parse(responseText); // Try parsing again to see if it throws
         } catch (e: any) {
             parseErrorMsg += ` Detalles: ${e.message}`;
         }
        return { error: parseErrorMsg };
    }

     // --- Búsqueda de imagen en Spoonacular y datos nutricionales ---
     // Usar solo el primer tipo de cocina, si existe, como categoría para la búsqueda de imagen
     const categoryForImageSearch = parsedRecipe.cuisineType?.[0]; 
     const { imageUrl, nutritionalInfo } = await fetchRecipeImage(parsedRecipe.title, categoryForImageSearch);
     if (imageUrl) {
       parsedRecipe.image_url = imageUrl; // Añadir la URL al objeto
     }
     // Sobrescribir la info nutricional de Gemini SOLO si Spoonacular la devuelve y es válida
     // Podrías añadir más validaciones aquí (ej. que calories > 0)
     if (nutritionalInfo) { 
       console.log("[callGeminiAndFetchImage] Usando info nutricional de Spoonacular.")
       parsedRecipe.nutritionalInfo = nutritionalInfo; 
     } else {
       console.log("[callGeminiAndFetchImage] Usando info nutricional (si existe) de Gemini.")
       // Si Spoonacular no devolvió nada, mantenemos lo que sea que Gemini haya generado (puede ser null o un objeto)
     }
     // --------------------------------------

    return parsedRecipe;
  } catch (error: any) { // Catch specific error type if possible
    console.error('Error general en llamada a Gemini/TheMealDB:', error);
     // Provide a more generic error message for unexpected issues
     return { error: `Error inesperado durante la generación: ${error.message || 'Error desconocido'}` };
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
        const adaptationResult = await callGeminiAndFetchImage(apiKey, creativePrompt);
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
    const generationResult = await callGeminiAndFetchImage(apiKey, generationPrompt);
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
): Promise<GeneratedRecipeData | { error: string }> => {
  console.log(`[generateRecipeVariation] Iniciando para receta: ${baseRecipe.title}`);

  // 1. Obtener perfil y clave API
  let apiKey: string | null = null;
  let userId: string = baseRecipe.user_id; // Obtener userId de la receta base
  try {
    // Pasar el userId a getUserProfile
    const profile = await getUserProfile(userId);
    // Usar gemini_api_key y verificar si existe
    if (!profile || !profile.gemini_api_key) {
      return { error: 'Perfil de usuario o clave API de Gemini no encontrados.' };
    }
    apiKey = profile.gemini_api_key;
    // userId ya está asignado
  } catch (error) {
    console.error("Error obteniendo perfil:", error);
    return { error: 'Error al obtener el perfil del usuario.' };
  }

  if (!apiKey) { // Solo necesitamos verificar apiKey aquí
     return { error: 'Falta información clave del usuario (API Key).' };
  }

  // 2. Obtener Preferencias y Despensa (opcional pero recomendado para contexto)
   let preferences: UserPreferences = DEFAULT_USER_PREFERENCES;
   let pantryItems: PantryItem[] = [];
   try {
       const prefPromise = preferencesService.getUserPreferences(userId);
       // Obtener todos los items, el servicio interno filtrará por usuario si es necesario
       const pantryPromise = getPantryItems();
       const [prefResult, pantryResult] = await Promise.allSettled([prefPromise, pantryPromise]);

       if (prefResult.status === 'fulfilled') {
           preferences = prefResult.value;
       } else {
           console.warn("Error obteniendo preferencias para variación:", prefResult.reason);
       }
       if (pantryResult.status === 'fulfilled') {
           // Asumiendo que getPantryItems() devuelve PantryItem[] directamente
           pantryItems = pantryResult.value;
       } else {
           console.warn("Error obteniendo despensa para variación:", pantryResult.reason);
       }
   } catch (error) {
       console.error("Error obteniendo contexto para variación:", error);
       // Continuar sin contexto si falla, pero loguear el error
   }

   // Corregir acceso al nombre del ingrediente
   const pantryIngredientNames = pantryItems
       .map(item => item.ingredient?.name) // Usar optional chaining y acceder a la propiedad correcta
       .filter((name): name is string => !!name); // Filtrar nombres nulos o undefined y asegurar tipo string


  // 3. Construir Prompt Específico para Variación
  const prompt = buildVariationPrompt(baseRecipe, requestText, preferences, pantryIngredientNames);

  // 4. Llamar a Gemini (y ahora buscar imagen)
  const generatedData = await callGeminiAndFetchImage(apiKey, prompt);

  if ('error' in generatedData) {
    console.error(`[generateRecipeVariation] Error de Gemini: ${generatedData.error}`);
    return { error: generatedData.error };
  }

  // Devolver los datos generados (que ahora incluyen image_url si se encontró)
  return generatedData;
};

// --- Nueva función para construir prompt de variación ---
const buildVariationPrompt = (
  baseRecipe: Recipe,
  requestText: string,
  preferences: UserPreferences,
  pantryIngredients: string[]
): string => {
   // Actualizar el ejemplo para incluir nutritionalInfo
   const exampleFormat = `{
    "title": "Título de la variación",
    "description": "Descripción breve",
    "ingredients": [
      {"name": "Ingrediente 1", "quantity": 2, "unit": "unidades"}
    ],
    "instructions": [
      "Paso 1"
    ],
    "prepTimeMinutes": 10,
    "cookTimeMinutes": 15,
    "servings": 2,
    "mainIngredients": ["principal1"],
    "image_url": null,
    "nutritionalInfo": {
        "calories": 350, "protein": 12, "carbs": 35, "fat": 18, "fiber": 6, "sugar": 4
    }
  }`;

   let prompt = `INSTRUCCIONES:
Genera una VARIACIÓN de la siguiente receta base, incorporando la petición del usuario: "${requestText}".
Formato de salida: JSON EXACTAMENTE como este ejemplo (incluyendo el campo nutritionalInfo):
${exampleFormat}

RECETA BASE:
Título: ${baseRecipe.title}
Descripción: ${baseRecipe.description || 'N/A'}
Ingredientes Base: ${baseRecipe.recipe_ingredients?.map(i => `${i.ingredient_name} (${i.quantity ?? ''} ${i.unit || ''})`).join(', ') || 'N/A'}
Instrucciones Base:
${baseRecipe.instructions?.join('\n') || 'N/A'}

PETICIÓN DE VARIACIÓN: "${requestText}"

REGLAS:
1. SOLO JSON VÁLIDO. Sin texto antes o después.
2. Mantén la esencia de la receta base pero aplica la variación solicitada.
3. USA comillas dobles. Campos numéricos sin comillas.
4. TODOS los campos del ejemplo JSON son OBLIGATORIOS, incluyendo una estimación RAZONABLE para cada campo dentro de nutritionalInfo.
5. El nuevo título debe reflejar la variación.
`;

  // Contexto adicional
  if (pantryIngredients.length > 0) {
    prompt += `\nCONTEXTO DESPENSA: Ingredientes disponibles: ${pantryIngredients.join(', ')}. Úsalos si encajan.\n`;
  }
  if (preferences.dietaryRestrictions?.length > 0) {
     prompt += `Restricciones dietéticas: ${preferences.dietaryRestrictions.join(', ')}.\n`;
  }
  if (preferences.dislikedIngredients?.length > 0) {
     prompt += `Evitar ingredientes: ${preferences.dislikedIngredients.join(', ')}.\n`;
  }
   if (preferences.cuisinePreferences?.length > 0) {
     prompt += `Preferencias de cocina: ${preferences.cuisinePreferences.join(', ')}.\n`;
  }

  prompt += '\nIMPORTANTE: RETORNA SOLO EL JSON VÁLIDO DE LA NUEVA RECETA VARIADA.\n';
  return prompt;

};