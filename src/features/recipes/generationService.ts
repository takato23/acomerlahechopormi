import { getUserProfile } from '@/features/user/userService';
import type { UserProfile } from '@/features/user/userTypes';
import { getPantryItems } from '@/features/pantry/pantryService';
import type { PantryItem } from '@/features/pantry/types';
import type { GeneratedRecipeData } from '@/types/recipeTypes';
import type { Recipe } from '@/types/recipeTypes';

/**
 * Construye el prompt detallado para la API de Google Gemini.
 * Incluye las preferencias del usuario si están disponibles.
 * Añade una instrucción para variar ligeramente si se generan múltiples recetas.
 */
const buildRecipePrompt = (
  pantryIngredients: string[],
  preferences?: Partial<UserProfile>,
  requestContext?: string, // Ej. "para la cena del lunes", "una opción diferente"
  mealType?: string, // Añadir mealType como parámetro opcional
  mode: 'optimize' | 'flexible' = 'flexible' // Añadir modo con valor por defecto
): string => {
  let prompt = '';
  const ingredientsList = pantryIngredients.length > 0 ? pantryIngredients.join(', ') : 'ninguno especificado';

  if (mode === 'optimize') {
    prompt = `Genera una receta de cocina utilizando **estrictamente y únicamente** los siguientes ingredientes disponibles: ${ingredientsList}. **No uses ningún otro ingrediente que no esté en esta lista.** Si no es posible crear una receta coherente solo con estos ingredientes, indica que no es posible en lugar de inventar una receta con otros. `;
  } else { // mode === 'flexible'
    prompt = `Genera una receta de cocina creativa. **Inspírate** en los siguientes ingredientes que tengo disponibles: ${ingredientsList}, pero **no te limites estrictamente** a ellos si necesitas otros ingredientes comunes para completar la receta. `;
  }

  if (requestContext) {
    prompt += `Contexto adicional: ${requestContext}. `;
  }
  // Añadir el tipo de comida al contexto si se proporciona
  // Instrucciones más específicas sobre el tipo de comida y variedad
  if (mealType) {
    prompt += `Genera una receta **típica y apropiada** para un **${mealType}**. Considera que un desayuno suele ser más ligero que un almuerzo o cena. `;
  } else {
     prompt += "Intenta que sea una receta interesante. ";
  }
  prompt += "Intenta **variar los ingredientes principales** y el tipo de plato respecto a otras recetas que podrías haber generado recientemente. ";

  prompt += "Si los ingredientes disponibles no son suficientes o adecuados para crear una receta variada y apropiada para el tipo de comida, **siéntete libre de usar otros ingredientes comunes**.\n\n";

  if (preferences) {
    prompt += "Considera las siguientes preferencias del usuario:\n";
    if (preferences.dietary_preference) {
      prompt += `- Preferencia dietética: ${preferences.dietary_preference}\n`;
    }
    if (preferences.allergies_restrictions) {
      prompt += `- Alergias/Restricciones: ${preferences.allergies_restrictions}\n`;
    }
    if (preferences.difficulty_preference) {
        prompt += `- Dificultad preferida: ${preferences.difficulty_preference}\n`;
    }
     if (preferences.max_prep_time) {
        prompt += `- Tiempo máximo de preparación: ${preferences.max_prep_time} minutos\n`;
    }
    // Añadir ingredientes excluidos si existen
    if (preferences.excluded_ingredients && preferences.excluded_ingredients.length > 0) {
       prompt += `- Ingredientes a evitar estrictamente: ${preferences.excluded_ingredients.join(', ')}\n`;
    }
    // Añadir equipamiento disponible si existe
    if (preferences.available_equipment && preferences.available_equipment.length > 0) {
       prompt += `- Equipamiento de cocina disponible: ${preferences.available_equipment.join(', ')}\n`;
    }
    prompt += "\n";
  }

  // Instrucciones de formato JSON (actualizadas para coincidir con GeneratedRecipeData)
  prompt += "Formatea la respuesta completa como un único objeto JSON válido contenido dentro de un bloque de código JSON (\`\`\`json ... \`\`\`). El objeto JSON debe tener las siguientes claves: 'title' (string), 'description' (string), 'prepTimeMinutes' (number), 'cookTimeMinutes' (number), 'servings' (number), 'ingredients' (array of objects with 'quantity' (string o number), 'unit' (string, puede ser null o vacío), 'name' (string)), y 'instructions' (array of strings). Asegúrate que el JSON sea válido y completo.";

  return prompt;
};

/**
 * Parsea la respuesta JSON de Gemini, esperando el formato GeneratedRecipeData.
 * Realiza validaciones básicas.
 */
const parseGeminiResponse = (responseText: string): GeneratedRecipeData | null => {
  let recipeData: any;
  let cleanedText = responseText;
  console.log("Texto original recibido:", responseText);

  // 1. Extraer JSON de bloques de código si existen
  const jsonBlockMatch = cleanedText.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonBlockMatch) {
    cleanedText = jsonBlockMatch[1].trim();
    console.log("JSON extraído del bloque de código:", cleanedText);
  }

  // Función para intentar parsear
  const tryParse = (text: string): any | null => {
    try {
      return JSON.parse(text);
    } catch (error) {
      console.log("Error de parseo:", (error as Error).message);
      return null;
    }
  };

  // 2. Primer intento de parseo con el texto limpio
  recipeData = tryParse(cleanedText);

  // 3. Si falla, intentar limpiar el texto
  if (!recipeData) {
    console.log("Primer parseo falló, iniciando limpieza...");
    try {
      // Eliminar espacios extra y caracteres no imprimibles
      cleanedText = cleanedText.trim().replace(/\s+/g, ' ');

      // Asegurar que las comillas sean correctas
      cleanedText = cleanedText.replace(/[""]/g, '"');

      // Reemplazar fracciones con formato "X/Y"
      cleanedText = cleanedText.replace(/"quantity"\s*:\s*"?(\d+)\s*\/\s*(\d+)"?/g, (match, num, den) => {
        const numerator = parseInt(num, 10);
        const denominator = parseInt(den, 10);
        return `"quantity": ${denominator !== 0 ? (numerator / denominator).toFixed(2) : 0}`;
      });

      // Reemplazar fracciones mixtas como "1 1/2"
      cleanedText = cleanedText.replace(/"quantity"\s*:\s*"?(\d+)\s+(\d+)\s*\/\s*(\d+)"?/g, (match, whole, num, den) => {
        const wholeNum = parseInt(whole, 10);
        const numerator = parseInt(num, 10);
        const denominator = parseInt(den, 10);
        return `"quantity": ${denominator !== 0 ? (wholeNum + numerator / denominator).toFixed(2) : wholeNum}`;
      });

      console.log("Texto después de limpieza:", cleanedText);
      recipeData = tryParse(cleanedText);
    } catch (cleanError) {
      console.error("Error durante la limpieza:", cleanError);
    }
  }

  // 4. Si sigue sin funcionar, último intento con escape agresivo
  if (!recipeData) {
    try {
      // Escapar caracteres problemáticos en strings
      cleanedText = cleanedText.replace(/(?<=:\s*")(.*?)(?=")/g, (match) => {
        return match.replace(/[\\/"]/g, '\\$&');
      });
      
      console.log("Texto después de escape agresivo:", cleanedText);
      recipeData = tryParse(cleanedText);
    } catch (escapeError) {
      console.error("Error durante escape agresivo:", escapeError);
    }
  }

  // 5. Si todavía no tenemos datos válidos, reportar error
  if (!recipeData) {
    console.error("No se pudo parsear el JSON después de múltiples intentos. Texto final:", cleanedText);
    return null;
  }

  // 6. Validación y limpieza de datos
  try {
    if (
      !recipeData ||
      typeof recipeData.title !== 'string' ||
      !Array.isArray(recipeData.ingredients) ||
      !Array.isArray(recipeData.instructions)
    ) {
      console.error("JSON parseado pero con estructura inválida:", recipeData);
      return null;
    }

    // Asegurar tipos numéricos
    recipeData.prepTimeMinutes = Number(recipeData.prepTimeMinutes) || 30;
    recipeData.cookTimeMinutes = Number(recipeData.cookTimeMinutes) || 30;
    recipeData.servings = Number(recipeData.servings) || 4;

    // Limpiar ingredientes
    recipeData.ingredients = recipeData.ingredients.map((ing: any) => ({
      quantity: ing.quantity ?? '',
      unit: ing.unit ?? '',
      name: ing.name ?? 'Ingrediente desconocido'
    })).filter((ing: { name: string; }) => ing.name !== 'Ingrediente desconocido' && ing.name.trim() !== '');

    // Limpiar instrucciones
    recipeData.instructions = recipeData.instructions
      .map((inst: any) => typeof inst === 'string' ? inst : String(inst))
      .filter((inst: string) => inst.trim() !== '');

    if (recipeData.ingredients.length === 0 || recipeData.instructions.length === 0) {
      console.error("Receta sin ingredientes o instrucciones después de limpiar:", recipeData);
      return null;
    }

    return recipeData as GeneratedRecipeData;
  } catch (validationError) {
    console.error("Error durante la validación final:", validationError);
    return null;
  }
};


/**
 * Llama a la API de Google Gemini para generar una única receta.
 */
const callGeminiApi = async (apiKey: string, prompt: string): Promise<GeneratedRecipeData | { error: string }> => {
  console.log("Llamando a la API de Gemini...");
  const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

  try {
    const geminiResponse = await fetch(geminiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: "application/json" },
        // safetySettings: [...] // Opcional: Configurar niveles de seguridad
      }),
    });

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text();
      let errorData = {};
      try { errorData = JSON.parse(errorText); } catch (e) { /* Ignorar si no es JSON */ }
      const errorMessage = (errorData as any)?.error?.message || `Error API Google (${geminiResponse.status}): ${geminiResponse.statusText}`;
      console.error("Error API Google:", geminiResponse.status, errorData);
      return { error: errorMessage };
    }

    const geminiResult = await geminiResponse.json();
    console.log("Respuesta cruda de Gemini:", geminiResult);

    // Verificar bloqueos de seguridad
    if (geminiResult.promptFeedback?.blockReason) {
      console.error("Respuesta bloqueada por Google:", geminiResult.promptFeedback);
      return { error: `Solicitud bloqueada por seguridad: ${geminiResult.promptFeedback.blockReason}` };
    }

    // Verificar contenido válido
    if (!geminiResult.candidates || geminiResult.candidates.length === 0 || !geminiResult.candidates[0].content?.parts?.[0]?.text) {
      const finishReason = geminiResult.candidates?.[0]?.finishReason;
       if (finishReason && finishReason !== 'STOP') {
           console.error(`Generación detenida por razón: ${finishReason}`, geminiResult);
           return { error: `La generación falló o fue detenida (${finishReason}).` };
       }
      console.error("Respuesta inesperada de Google (sin contenido válido):", geminiResult);
      return { error: "No se recibió contenido de receta válido en la respuesta de la API." };
    }

    const responseText = geminiResult.candidates[0].content.parts[0].text;
    const parsedRecipe = parseGeminiResponse(responseText);

    if (!parsedRecipe) {
      console.error("Fallo al parsear la respuesta de Gemini:", responseText);
      return { error: "La respuesta de la API no contenía un JSON de receta válido." };
    }

    console.log("Receta generada y parseada con éxito.");
    return parsedRecipe;

  } catch (error: any) {
    console.error("Error inesperado llamando a Gemini:", error);
    return { error: error.message || "Error inesperado durante la llamada a la API." };
  }
};

/**
 * Genera una única receta utilizando ingredientes de la despensa y preferencias del usuario.
 *
 * @param userId ID del usuario para obtener perfil y despensa.
 * @param context Opcional: Contexto adicional para el prompt (ej. "algo rápido para hoy").
 * @returns Una promesa que resuelve a la receta generada o un objeto de error.
 */
export const generateSingleRecipe = async (
  userId: string,
  context?: string
): Promise<GeneratedRecipeData | { error: string }> => {
  console.log(`Iniciando generación de una receta para el usuario ${userId}`);

  // 1. Obtener API Key y Preferencias (similar a generateRecipesFromPantry)
  let apiKey: string | undefined;
  let userProfile: UserProfile | null = null;
  try {
    userProfile = await getUserProfile(userId);
    apiKey = userProfile?.gemini_api_key ?? undefined;
    if (apiKey) console.log("[generateSingleRecipe] API Key obtenida del perfil.");
  } catch (profileError) {
    console.warn("[generateSingleRecipe] No se pudo obtener el perfil del usuario:", profileError);
  }
  if (!apiKey) {
    apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (apiKey) console.log("[generateSingleRecipe] API Key obtenida de VITE_GEMINI_API_KEY.");
  }
  if (!apiKey) {
    console.error('[generateSingleRecipe] No API key available.');
    return { error: 'No se encontró API Key para Gemini.' };
  }
  const userPreferences = userProfile; // Puede ser null

  // 2. Obtener Ingredientes de la Despensa (similar a generateRecipesFromPantry)
  let pantryIngredientNames: string[] = [];
  try {
    const pantryItems: PantryItem[] = await getPantryItems(); // Asume que usa usuario autenticado
    if (pantryItems && pantryItems.length > 0) {
      pantryIngredientNames = pantryItems
        .map((item: PantryItem) => item.ingredient?.name)
        .filter((name?: string | null): name is string => !!name && name.trim() !== '');

      if (pantryIngredientNames.length === 0) {
        console.warn("[generateSingleRecipe] La despensa tiene items pero sin nombres válidos. Generando receta más genérica.");
        pantryIngredientNames = []; // Continuar sin ingredientes de despensa
      }
       console.log(`[generateSingleRecipe] Ingredientes de despensa (${pantryIngredientNames.length}):`, pantryIngredientNames);
    } else {
      console.log("[generateSingleRecipe] La despensa está vacía. Generando receta genérica.");
      pantryIngredientNames = []; // Continuar sin ingredientes de despensa
    }
  } catch (pantryError: any) {
    console.error("[generateSingleRecipe] Error al obtener ingredientes de la despensa:", pantryError);
    // No devolver error aquí, intentar generar receta genérica
    pantryIngredientNames = [];
  }

  // 3. Construir Prompt
  // Usar pantryIngredientNames (puede estar vacío) y preferencias
  const prompt = buildRecipePrompt(
    pantryIngredientNames, // Pasamos el array (puede estar vacío)
    userPreferences ?? undefined,
    context ?? "una sugerencia de receta para hoy" // Contexto por defecto
  );

  // 4. Llamar a la API
  console.log("[generateSingleRecipe] Llamando a callGeminiApi...");
  return callGeminiApi(apiKey, prompt);
};


/**
 * Resultado de la generación de múltiples recetas.
 */
export interface GenerateRecipesResult {
  successfulRecipes: GeneratedRecipeData[];
  errors: { index: number; message: string }[];
}

/**
 * Genera múltiples recetas utilizando ingredientes de la despensa y preferencias del usuario.
 * Realiza llamadas paralelas a la API de Gemini.
 *
 * @param count El número de recetas a generar.
 * @param userId ID del usuario para obtener perfil y despensa.
 * @returns Un objeto con las recetas generadas exitosamente y los errores ocurridos.
 */
export const generateRecipesFromPantry = async (count: number, userId: string): Promise<GenerateRecipesResult> => {
  console.log(`Iniciando generación de ${count} recetas para el usuario ${userId}`);
  const result: GenerateRecipesResult = { successfulRecipes: [], errors: [] };

  // 1. Obtener API Key y Preferencias
  let apiKey: string | undefined;
  let userProfile: UserProfile | null = null;
  try {
    userProfile = await getUserProfile(userId);
    apiKey = userProfile?.gemini_api_key ?? undefined;
    if (apiKey) console.log("API Key obtenida del perfil.");
  } catch (profileError) {
    console.warn("No se pudo obtener el perfil del usuario:", profileError);
  }
  if (!apiKey) {
    apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (apiKey) console.log("API Key obtenida de VITE_GEMINI_API_KEY.");
  }
  if (!apiKey) {
    console.error('No API key available.');
    // Devolver error general si no hay API key
    return { successfulRecipes: [], errors: Array(count).fill(0).map((_, i) => ({ index: i, message: 'No se encontró API Key para Gemini.' })) };
  }
  const userPreferences = userProfile; // Puede ser null

  // 2. Obtener Ingredientes de la Despensa
  let pantryIngredientNames: string[] = [];
  try {
    const pantryItems: PantryItem[] = await getPantryItems(); // Asume que getPantryItems usa el usuario autenticado internamente o recibe userId
    if (pantryItems && pantryItems.length > 0) {
      pantryIngredientNames = pantryItems
        .map((item: PantryItem) => item.ingredient?.name)
        .filter((name?: string | null): name is string => !!name && name.trim() !== '');

      if (pantryIngredientNames.length === 0) {
        console.warn("La despensa tiene items pero sin nombres válidos.");
        return { successfulRecipes: [], errors: Array(count).fill(0).map((_, i) => ({ index: i, message: 'No se encontraron nombres válidos en los ingredientes de tu despensa.' })) };
      }
      console.log(`Ingredientes de despensa (${pantryIngredientNames.length}):`, pantryIngredientNames);
    } else {
      console.log("La despensa está vacía.");
       return { successfulRecipes: [], errors: Array(count).fill(0).map((_, i) => ({ index: i, message: 'Tu despensa está vacía. No se pueden generar recetas basadas en ella.' })) };
    }
  } catch (pantryError: any) {
    console.error("Error al obtener ingredientes de la despensa:", pantryError);
     return { successfulRecipes: [], errors: Array(count).fill(0).map((_, i) => ({ index: i, message: `Error al obtener la despensa: ${pantryError.message || 'Error desconocido'}` })) };
  }

  // 3. Construir Prompts y Realizar Llamadas en Paralelo
  const generationPromises: Promise<GeneratedRecipeData | { error: string }>[] = [];
  for (let i = 0; i < count; i++) {
    // Añadir contexto simple para intentar variar
    const context = `Receta ${i + 1} de ${count} para la planificación semanal.`;
    const prompt = buildRecipePrompt(pantryIngredientNames, userPreferences ?? undefined, context);
    generationPromises.push(callGeminiApi(apiKey, prompt));
  }

  console.log(`Realizando ${count} llamadas a Gemini en paralelo...`);
  const settledResults = await Promise.allSettled(generationPromises);
  console.log("Resultados de las llamadas a Gemini:", settledResults);

  // 4. Procesar Resultados
  settledResults.forEach((settledResult, index) => {
    if (settledResult.status === 'fulfilled') {
      const recipeOrError = settledResult.value;
      if ('error' in recipeOrError) {
        // Error devuelto por callGeminiApi
        console.error(`Error generando receta ${index + 1}: ${recipeOrError.error}`);
        result.errors.push({ index, message: recipeOrError.error });
      } else {
        // Receta generada con éxito
        result.successfulRecipes.push(recipeOrError);
      }
    } else {
      // Error en la promesa (inesperado, ej. error de red no capturado en callGeminiApi)
      console.error(`Error inesperado en la promesa de generación ${index + 1}:`, settledResult.reason);
      result.errors.push({ index, message: settledResult.reason?.message || 'Error desconocido en la promesa de generación.' });
    }
  });

  console.log(`Generación completada. Éxitos: ${result.successfulRecipes.length}, Errores: ${result.errors.length}`);
  return result;
};


/**
 * Genera una única receta para un slot específico (día/tipo de comida).
 * Utiliza ingredientes de la despensa y preferencias del usuario.
 *
 * @param userId ID del usuario.
 * @param mealType Tipo de comida para el que se genera la receta.
 * @param context Contexto adicional (ej. día de la semana).
 * @returns Una promesa que resuelve a la receta generada o un objeto de error.
 */
export const generateRecipeForSlot = async (
  userId: string,
  mealType: string, // Usar string genérico por si acaso
  context: string,
  mode: 'optimize' | 'flexible' // Añadir parámetro mode
): Promise<GeneratedRecipeData | { error: string }> => {
  console.log(`[generateRecipeForSlot] Iniciando generación para usuario ${userId}, Slot: ${context}, MealType: ${mealType}`);

  // 1. Obtener API Key y Preferencias (similar a generateSingleRecipe)
  let apiKey: string | undefined;
  let userProfile: UserProfile | null = null;
  try {
    userProfile = await getUserProfile(userId);
    apiKey = userProfile?.gemini_api_key ?? undefined;
    if (apiKey) console.log("[generateRecipeForSlot] API Key obtenida del perfil.");
  } catch (profileError) {
    console.warn("[generateRecipeForSlot] No se pudo obtener el perfil del usuario:", profileError);
  }
  if (!apiKey) {
    apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (apiKey) console.log("[generateRecipeForSlot] API Key obtenida de VITE_GEMINI_API_KEY.");
  }
  if (!apiKey) {
    console.error('[generateRecipeForSlot] No API key available.');
    return { error: 'No se encontró API Key para Gemini.' };
  }
  const userPreferences = userProfile; // Puede ser null

  // 2. Obtener Ingredientes de la Despensa (similar a generateSingleRecipe)
  let pantryIngredientNames: string[] = [];
  try {
    const pantryItems: PantryItem[] = await getPantryItems(); // Asume que usa usuario autenticado
    if (pantryItems && pantryItems.length > 0) {
      pantryIngredientNames = pantryItems
        .map((item: PantryItem) => item.ingredient?.name)
        .filter((name?: string | null): name is string => !!name && name.trim() !== '');

      if (pantryIngredientNames.length === 0) {
        console.warn("[generateRecipeForSlot] La despensa tiene items pero sin nombres válidos. Generando receta más genérica.");
        pantryIngredientNames = [];
      }
       console.log(`[generateRecipeForSlot] Ingredientes de despensa (${pantryIngredientNames.length}):`, pantryIngredientNames);
    } else {
      console.log("[generateRecipeForSlot] La despensa está vacía. Generando receta genérica.");
      pantryIngredientNames = [];
    }
  } catch (pantryError: any) {
    console.error("[generateRecipeForSlot] Error al obtener ingredientes de la despensa:", pantryError);
    // No devolver error aquí, intentar generar receta genérica
    pantryIngredientNames = [];
  }

  // 3. Construir Prompt específico para el slot
  const prompt = buildRecipePrompt(
    pantryIngredientNames,
    userPreferences ?? undefined,
    context, // Usar el contexto proporcionado (ej. "Receta para lunes - Desayuno")
    mealType, // Pasar el tipo de comida explícitamente
    mode // Pasar el modo
  );

  // 4. Llamar a la API
  console.log("[generateRecipeForSlot] Llamando a callGeminiApi...");
  return callGeminiApi(apiKey, prompt);
};


/**
 * Sugiere una única receta basada únicamente en los ingredientes de la despensa del usuario.
 * Devuelve la receta generada o null si no se puede generar (despensa vacía, error API, etc.).
 *
 * @param userId ID del usuario para obtener perfil y despensa.
 * @returns Una promesa que resuelve a la receta generada (GeneratedRecipeData) o null.
 */
export const suggestSingleRecipeFromPantry = async (
  userId: string
): Promise<GeneratedRecipeData | null> => {
  console.log(`[suggestSingleRecipeFromPantry] Iniciando sugerencia para usuario ${userId}`);

  // 1. Obtener API Key y Preferencias
  let apiKey: string | undefined;
  let userProfile: UserProfile | null = null;
  try {
    userProfile = await getUserProfile(userId);
    apiKey = userProfile?.gemini_api_key ?? undefined;
    if (apiKey) console.log("[suggestSingleRecipeFromPantry] API Key obtenida del perfil.");
  } catch (profileError) {
    console.warn("[suggestSingleRecipeFromPantry] No se pudo obtener el perfil del usuario:", profileError);
    // Continuar sin perfil, pero necesitamos API key
  }
  if (!apiKey) {
    apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (apiKey) console.log("[suggestSingleRecipeFromPantry] API Key obtenida de VITE_GEMINI_API_KEY.");
  }
  if (!apiKey) {
    console.error('[suggestSingleRecipeFromPantry] No API key available.');
    // Lanzar error aquí porque sin API Key no se puede hacer nada. El handler lo capturará.
    throw new Error('No se encontró API Key para Gemini.');
  }
  const userPreferences = userProfile; // Puede ser null

  // 2. Obtener Ingredientes Clave de la Despensa
  let pantryIngredientNames: string[] = [];
  try {
    const pantryItems: PantryItem[] = await getPantryItems(); // Asume que usa usuario autenticado
    if (pantryItems && pantryItems.length > 0) {
      // Filtrar y limitar ingredientes (ej. los primeros 15 o los marcados como favoritos/clave si esa lógica existe)
      // Por ahora, usamos todos los nombres válidos
      pantryIngredientNames = pantryItems
        .map((item: PantryItem) => item.ingredient?.name)
        .filter((name?: string | null): name is string => !!name && name.trim() !== '');

      if (pantryIngredientNames.length === 0) {
        console.log("[suggestSingleRecipeFromPantry] La despensa tiene items pero sin nombres válidos.");
        return null; // No se puede sugerir sin ingredientes
      }
       console.log(`[suggestSingleRecipeFromPantry] Ingredientes de despensa (${pantryIngredientNames.length}):`, pantryIngredientNames);
    } else {
      console.log("[suggestSingleRecipeFromPantry] La despensa está vacía.");
      return null; // No se puede sugerir sin ingredientes
    }
  } catch (pantryError: any) {
    console.error("[suggestSingleRecipeFromPantry] Error al obtener ingredientes de la despensa:", pantryError);
    // Lanzar error para que el handler lo muestre
     throw new Error(`Error al obtener la despensa: ${pantryError.message || 'Error desconocido'}`);
  }

  // 3. Construir Prompt específico para sugerencia única desde despensa
  const promptContext = "Sugiere una única receta creativa utilizando principalmente los ingredientes listados.";
  const prompt = buildRecipePrompt(
    pantryIngredientNames,
    userPreferences ?? undefined,
    promptContext
  );

  // 4. Llamar a la API
  console.log("[suggestSingleRecipeFromPantry] Llamando a callGeminiApi...");
  const result = await callGeminiApi(apiKey, prompt);

  // 5. Procesar resultado
  if ('error' in result) {
    console.error(`[suggestSingleRecipeFromPantry] Error de Gemini: ${result.error}`);
    // Devolver null para que el handler muestre un mensaje genérico o específico si queremos
    return null;
  } else {
    console.log("[suggestSingleRecipeFromPantry] Sugerencia generada con éxito.");
    return result; // Devolver GeneratedRecipeData
  }
}


/**
 * Construye el prompt para solicitar una variación de una receta existente.
 */
const buildVariationPrompt = (originalRecipe: Recipe, variationRequest: string): string => {
  let prompt = `Toma la siguiente receta:\n\n`;
  prompt += `Título: ${originalRecipe.title}\n`;
  if (originalRecipe.description) {
    prompt += `Descripción: ${originalRecipe.description}\n`;
  }

  prompt += `Ingredientes:\n`;
  originalRecipe.ingredients.forEach(ing => {
    const quantityStr = ing.quantity ? `${ing.quantity}` : '';
    const unitStr = ing.unit ? ` ${ing.unit}` : '';
    const nameStr = ing.ingredient_name || 'Ingrediente desconocido';
    prompt += `- ${quantityStr}${unitStr} ${nameStr}\n`.trimStart();
  });

  prompt += `\nInstrucciones:\n`;
  originalRecipe.instructions.forEach((step, index) => {
    prompt += `${index + 1}. ${step}\n`;
  });

  prompt += `\nAhora, genera una variación de esta receta que cumpla con la siguiente petición: "${variationRequest}".\n\n`;

  // Instrucciones de formato JSON actualizadas para incluir tags y permitir nulls
  prompt += "Formatea la respuesta completa como un único objeto JSON válido contenido dentro de un bloque de código JSON (\`\`\`json ... \`\`\`). El objeto JSON debe tener las siguientes claves: 'title' (string), 'description' (string | null), 'prepTimeMinutes' (number | null), 'cookTimeMinutes' (number | null), 'servings' (number | null), 'ingredients' (array of objects with 'quantity' (string | number | null), 'unit' (string | null), 'name' (string)), 'instructions' (array of strings), y 'tags' (array of strings | null). Asegúrate que el JSON sea válido y completo.";

  return prompt;
}; // Punto y coma explícito

/**
 * Genera una variación de una receta existente utilizando la API de Gemini.
 *
 * @param originalRecipe La receta original completa.
 * @param variationRequest La descripción de la variación solicitada por el usuario.
 * @returns Una promesa que resuelve a la receta variada generada (GeneratedRecipeData) o null si ocurre un error.
 */
export const generateRecipeVariation = async (
  originalRecipe: Recipe,
  variationRequest: string
): Promise<GeneratedRecipeData | null> => {
  console.log(`[generateRecipeVariation] Iniciando variación para receta "${originalRecipe.title}" con petición: "${variationRequest}"`);

  // 1. Obtener API Key (requiere user_id de la receta original)
  const userId = originalRecipe.user_id;
  let apiKey: string | undefined;
  try {
    const userProfile = await getUserProfile(userId);
    apiKey = userProfile?.gemini_api_key ?? undefined;
    if (apiKey) console.log("[generateRecipeVariation] API Key obtenida del perfil.");
  } catch (profileError) {
    console.warn("[generateRecipeVariation] No se pudo obtener el perfil del usuario:", profileError);
    // Continuar para intentar usar la clave de entorno
  }
  if (!apiKey) {
    apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (apiKey) console.log("[generateRecipeVariation] API Key obtenida de VITE_GEMINI_API_KEY.");
  }
  if (!apiKey) {
    console.error('[generateRecipeVariation] No API key available.');
    return null; // Devolver null en caso de error
  }

  // 2. Construir Prompt de Variación
  const prompt = buildVariationPrompt(originalRecipe, variationRequest);

  // 3. Llamar a la API
  console.log("[generateRecipeVariation] Llamando a callGeminiApi...");
  const result = await callGeminiApi(apiKey, prompt);

  // 4. Procesar resultado
  if ('error' in result) {
    console.error(`[generateRecipeVariation] Error de Gemini: ${result.error}`);
    return null; // Devolver null en caso de error
  } else {
    console.log("[generateRecipeVariation] Variación generada con éxito.");
    // Validar que el resultado parseado coincida con la estructura esperada
    if (result && typeof result.title === 'string' && Array.isArray(result.ingredients) && Array.isArray(result.instructions)) {
        // Aquí asumimos que parseGeminiResponse ya hizo una validación inicial
        // Podríamos añadir validaciones más estrictas si fuera necesario
        return result as GeneratedRecipeData;
    } else {
        console.error("[generateRecipeVariation] La respuesta parseada no coincide con GeneratedRecipeData:", result);
        return null;
    }
  }
}; // Punto y coma explícito