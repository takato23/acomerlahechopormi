import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";
import type { MealAlternativeRequestContext, MealAlternative } from '../planning/types';
import type { MealType } from '../planning/types'; // Importar MealType
import type { UserProfile } from '../user/userTypes'; // Asumiendo que necesitaremos el perfil

// Leer la API Key desde las variables de entorno (Vite)
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

if (!API_KEY) {
  console.error("VITE_GEMINI_API_KEY no está definida en las variables de entorno.");
  // Podríamos lanzar un error o tener un modo fallback
}

const genAI = new GoogleGenerativeAI(API_KEY || "MISSING_API_KEY"); // Usar || para evitar error si falta

const model = genAI.getGenerativeModel({
  model: "gemini-1.5-flash", // O el modelo que prefieras/tengas acceso
});

const generationConfig = {
  temperature: 0.8, // Un poco más creativo
  topP: 0.95,
  topK: 64,
  maxOutputTokens: 150, // Limitar tokens para respuestas cortas
  responseMimeType: "text/plain", // Esperamos texto plano por ahora
};

// Configuraciones de seguridad (ajustar según necesidad)
const safetySettings = [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
];

/**
 * Llama a la IA de Gemini para obtener alternativas de comida.
 */
export async function getMealAlternatives(
  context: MealAlternativeRequestContext,
  userProfile: UserProfile | null // Añadir perfil de usuario para contexto
): Promise<MealAlternative[] | null> {
  if (!API_KEY) {
    console.warn("No se puede llamar a Gemini sin API Key. Devolviendo null.");
    return null; // O devolver un error o alternativas dummy si prefieres
  }

  // Usar los valores exactos del enum como claves y valores
  const mealTypeLabels: { [key in MealType]: string } = {
    'Desayuno': 'desayuno', // Usar valor DB como clave, valor en minúscula para prompt
    'Almuerzo': 'almuerzo',
    'Merienda': 'merienda',
    'Cena': 'cena'
  };

  // --- Construcción del Prompt Mejorado ---
  // Usar el label en minúscula o el valor original si no se encuentra
  const mealTypePrompt = mealTypeLabels[context.meal_type] ?? context.meal_type;
  let prompt = `Actúa como un experto en gastronomía argentina y latina.
Necesito sugerencias de platos alternativos para ${mealTypePrompt}.`;

  if (context.recipe_id) {
    prompt += ` La comida actual es una receta específica.`;
  } else if (context.custom_meal_name) {
    prompt += `\n\nLa comida actual es "${context.custom_meal_name}".
Sugiere 3 alternativas similares que:
- Sean apropiadas para ${mealTypePrompt}
- Tengan un nivel de elaboración similar
- Usen ingredientes parecidos o complementarios`;
  }

  // Añadir contexto del perfil (si existe)
  if (userProfile?.dietary_preference) {
    prompt += `\nConsidera que la preferencia dietética es: ${userProfile.dietary_preference}.`;
  }

  prompt += `\n\nResponde SOLO con los nombres de los platos, separados por punto y coma (;).
Por ejemplo: "Pollo al horno con papas; Carne al horno con vegetales; Pescado a la parrilla con puré"`;
  // --- Fin Construcción del Prompt ---

  console.log("[suggestionService] Prompt para Gemini:", prompt);

  try {
    const chatSession = model.startChat({
      generationConfig,
      safetySettings,
      history: [], // Podríamos añadir historial si quisiéramos una conversación
    });

    const result = await chatSession.sendMessage(prompt);
    const responseText = result.response.text().trim();

    console.log("[suggestionService] Respuesta de Gemini:", responseText);

    if (!responseText) {
      return []; // No hubo respuesta o estaba vacía
    }

    // Parsear la respuesta (asumiendo nombres separados por ';')
    const suggestions = responseText.split(';').map(s => s.trim()).filter(Boolean);

    // Convertir a formato MealAlternative (asumiendo todas son 'custom' por ahora)
    const alternatives: MealAlternative[] = suggestions.map(text => ({
      type: 'custom',
      text: text,
    }));

    // TODO: Mejorar el parsing si la IA devuelve recetas existentes o más estructura

    return alternatives;

  } catch (error) {
    console.error("Error llamando a la API de Gemini:", error);
    // Podríamos intentar extraer información del error si es específico de Gemini (ej. bloqueo de seguridad)
    // if (error instanceof GoogleGenerativeAIError) { ... } 
    return null; // Devolver null en caso de error
  }
}