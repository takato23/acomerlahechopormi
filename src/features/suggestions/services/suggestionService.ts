import { GoogleGenerativeAI } from "@google/generative-ai";
import { SuggestionRequest, SuggestionResponse, RecipeSuggestion } from '../types';

/**
 * Servicio para manejar las sugerencias de recetas usando IA
 */
class SuggestionService {
  private apiKey: string | null = null;
  private genAI: GoogleGenerativeAI | null = null;

  /**
   * Obtiene la clave API de Gemini desde el servidor
   * @returns La clave API
   * @throws Error si no se puede obtener la clave
   */
  private async fetchGeminiApiKey(): Promise<string> {
    const response = await fetch('/api/get-gemini-key', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('sb-access-token')}`
      }
    });

    if (!response.ok) {
      throw new Error('No se pudo obtener la clave API de Gemini');
    }

    const data = await response.json();
    return data.apiKey;
  }

  /**
   * Construye el prompt para Gemini basado en los ingredientes y preferencias
   */
  private buildPrompt(request: SuggestionRequest): string {
    const { pantryItems, dietary, preferences, mealType } = request;

    let prompt = `Actuá como un chef experto y proponé 3 recetas ideales para ${mealType.toLowerCase()} usando algunos de estos ingredientes disponibles:\n`;

    pantryItems.forEach((item) => {
      const parts = [item.name];
      if (item.quantity) {
        parts.push(`${item.quantity}`);
      }
      if (item.unit) {
        parts.push(item.unit);
      }
      prompt += `- ${parts.join(' ')}\n`;
    });

    if (dietary) {
      if (dietary.vegetarian) prompt += '\nLas recetas deben ser vegetarianas.';
      if (dietary.vegan) prompt += '\nLas recetas deben ser veganas.';
      if (dietary.glutenFree) prompt += '\nLas recetas deben ser sin gluten.';
      if (dietary.restrictions?.length) {
        prompt += `\nEvitá ingredientes como: ${dietary.restrictions.join(', ')}.`;
      }
    }

    if (preferences) {
      if (preferences.maxPrepTime) {
        prompt += `\nEl tiempo de preparación no debe superar los ${preferences.maxPrepTime} minutos.`;
      }
      if (preferences.difficulty) {
        prompt += `\nBuscá recetas de dificultad ${preferences.difficulty}.`;
      }
      if (preferences.avoidIngredients?.length) {
        prompt += `\nEvitá utilizar: ${preferences.avoidIngredients.join(', ')}.`;
      }
      if (preferences.preferredTags?.length) {
        prompt += `\nConsiderá incorporar estilos o etiquetas como: ${preferences.preferredTags.join(', ')}.`;
      }
    }

    prompt += `\n\nPor favor, devuelve las sugerencias en este formato JSON exacto:
{
  "suggestions": [
    {
      "name": "Nombre de la Receta",
      "description": "Breve descripción y pasos principales",
      "estimatedTime": "XX minutos",
      "difficulty": "fácil|media|difícil",
      "ingredients": ["ingrediente 1", "ingrediente 2"]
    }
  ]
}`;

    return prompt;
  }

  /**
   * Inicializa o actualiza el cliente de Gemini
   * @throws Error si no se puede inicializar
   */
  private async initializeGenAI(): Promise<void> {
    if (!this.apiKey) {
      this.apiKey = await this.fetchGeminiApiKey();
      this.genAI = new GoogleGenerativeAI(this.apiKey);
    }
  }

  /**
   * Obtiene sugerencias de recetas basadas en los ingredientes disponibles
   * @param request Detalles de la solicitud de sugerencias
   * @returns Lista de sugerencias de recetas
   */
  public async getSuggestions(request: SuggestionRequest): Promise<SuggestionResponse> {
    try {
      await this.initializeGenAI();
      
      if (!this.genAI) {
        throw new Error('No se pudo inicializar el cliente de Gemini');
      }

      const model = this.genAI.getGenerativeModel({ model: "gemini-pro" });
      
      const prompt = this.buildPrompt(request);
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      // Intentar parsear la respuesta JSON
      try {
        const parsedResponse = JSON.parse(text);
        return parsedResponse as SuggestionResponse;
      } catch (error) {
        console.error('Error parseando respuesta de Gemini:', error);
        throw new Error('La respuesta de IA no tiene el formato esperado');
      }
    } catch (error) {
      console.error('Error en getSuggestions:', error);
      return {
        suggestions: [],
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
    }
  }
}

// Exportamos una única instancia del servicio
export const suggestionService = new SuggestionService();
