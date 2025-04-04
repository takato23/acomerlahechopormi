import { getUserProfile } from '@/features/user/userService';
import type { UserProfile } from '@/features/user/userTypes';
import { getPantryItems } from '@/features/pantry/pantryService';
import type { PantryItem } from '@/features/pantry/types';
import type { GeneratedRecipeData } from '@/types/recipeTypes';

/**
 * Construye el prompt detallado para la API de Google Gemini.
 * Incluye las preferencias del usuario si están disponibles.
 * Añade una instrucción para variar ligeramente si se generan múltiples recetas.
 */
const buildRecipePrompt = (
  pantryIngredients: string[],
  preferences?: Partial<UserProfile>,
  requestContext?: string // Ej. "para la cena del lunes", "una opción diferente"
): string => {
  let prompt = `Genera una receta de cocina creativa utilizando principalmente los siguientes ingredientes que tengo disponibles: ${pantryIngredients.join(', ')}. `;

  if (requestContext) {
    prompt += `Contexto adicional: ${requestContext}. Intenta que sea algo diferente a otras recetas generadas recientemente si es posible. `;
  } else {
    prompt += "Intenta que sea una receta interesante y variada. ";
  }

  prompt += "Puedes usar otros ingredientes comunes si es necesario.\n\n";

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
  try {
    const recipeData = JSON.parse(responseText);

    // Validación más robusta
    if (
      !recipeData ||
      typeof recipeData.title !== 'string' ||
      !Array.isArray(recipeData.ingredients) ||
      !Array.isArray(recipeData.instructions) ||
      typeof recipeData.prepTimeMinutes !== 'number' ||
      typeof recipeData.cookTimeMinutes !== 'number' ||
      typeof recipeData.servings !== 'number'
    ) {
      console.error("JSON parseado pero con formato inválido o tipos incorrectos:", recipeData);
      return null; // Formato inválido
    }

    // Limpiar ingredientes (asegurar que quantity/unit no sean undefined y name exista)
    recipeData.ingredients = recipeData.ingredients.map((ing: any) => ({
        quantity: ing.quantity ?? '', // Default a string vacía si es null/undefined
        unit: ing.unit ?? '',       // Default a string vacía si es null/undefined
        name: ing.name ?? 'Ingrediente desconocido' // Default si falta el nombre
    })).filter((ing: { name: string; }) => ing.name !== 'Ingrediente desconocido' && ing.name.trim() !== ''); // Opcional: filtrar ingredientes sin nombre

     // Asegurar que las instrucciones sean strings
     recipeData.instructions = recipeData.instructions
        .map((inst: any) => typeof inst === 'string' ? inst : String(inst))
        .filter((inst: string) => inst.trim() !== '');


    // Validar que aún tengamos ingredientes e instrucciones después de limpiar
    if (recipeData.ingredients.length === 0 || recipeData.instructions.length === 0) {
        console.error("Receta parseada pero sin ingredientes o instrucciones válidos después de limpiar:", recipeData);
        return null;
    }


    return recipeData as GeneratedRecipeData;
  } catch (parseError) {
    console.error("Error al parsear la respuesta JSON de la API:", parseError, responseText);
    return null; // Error de parseo
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