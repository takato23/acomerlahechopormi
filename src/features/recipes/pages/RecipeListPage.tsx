import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Sparkles, PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/Spinner'; // Asumiendo ruta correcta
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'; // Asumiendo ruta correcta
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'; // Asumiendo ruta correcta
import { Textarea } from '@/components/ui/textarea'; // Asumiendo ruta correcta
import { Label } from '@/components/ui/label'; // Asumiendo ruta correcta
import { Switch } from '@/components/ui/switch';
import { useRecipeStore } from '@/stores/recipeStore'; // Asumiendo ruta correcta
import { getPantryItems } from '@/features/pantry/pantryService'; // Corregido: Importar función específica
import { useAuth } from '@/features/auth/AuthContext'; // Corregida ruta
import { getUserProfile } from '@/features/user/userService'; // Importación corregida
import type { GeneratedRecipeData } from '@/types/recipeTypes'; // Asumiendo ruta correcta para GeneratedRecipeData
import type { UserProfile } from '@/features/user/userTypes'; // Corregida ruta para UserProfile
import RecipeCard from '../components/RecipeCard'; // Importar RecipeCard (default export)

// --- Helper Functions ---

/**
 * Construye el prompt detallado para la API de Google Gemini.
 * Incluye las preferencias del usuario si están disponibles.
 */
const buildRecipePrompt = (
  userPrompt: string,
  // Corregido: Aceptar UserProfile parcial directamente
  preferences?: Partial<UserProfile>,
  pantryIngredients?: string[] // Tarea 2.4: Añadir ingredientes de despensa opcionales
): string => {
  let prompt = "";

  if (pantryIngredients && pantryIngredients.length > 0) {
    // Tarea 2.4: Prompt específico para despensa
    prompt = `Genera una receta de cocina creativa utilizando principalmente los siguientes ingredientes que tengo disponibles: ${pantryIngredients.join(', ')}. `;
    if (userPrompt.trim()) {
      prompt += `Considera también esta descripción adicional: "${userPrompt}". `;
    }
    prompt += "Puedes usar otros ingredientes comunes si es necesario.\n\n";
  } else {
    // Prompt genérico si no se usa la despensa o está vacía
    prompt = `Genera una receta de cocina basada en la siguiente descripción: "${userPrompt}".\n\n`;
  }


  // Corregido: Acceder a propiedades directas de UserProfile
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
    // Añadir más preferencias si es necesario (ej. dislikedIngredients si se añade a UserProfile)
    prompt += "\n";
  }

  // Instrucciones de formato JSON (actualizadas para coincidir con GeneratedRecipeData)
  // Asegúrate que GeneratedRecipeData tenga prepTimeMinutes, cookTimeMinutes, etc.
  prompt += "Formatea la respuesta completa como un único objeto JSON válido contenido dentro de un bloque de código JSON (\`\`\`json ... \`\`\`). El objeto JSON debe tener las siguientes claves: 'title' (string), 'description' (string), 'prepTimeMinutes' (number), 'cookTimeMinutes' (number), 'servings' (number), 'ingredients' (array of objects with 'quantity' (string o number), 'unit' (string, puede ser null o vacío), 'name' (string)), y 'instructions' (array of strings).";


  return prompt;
};

/**
 * Extrae y parsea el bloque JSON de la respuesta de texto de la API.
 */
const extractAndParseRecipe = (responseText: string): GeneratedRecipeData | null => {
  try {
    // Busca el bloque de código JSON
    const jsonMatch = responseText.match(/```json\s*([\s\S]*?)\s*```/);
    if (jsonMatch && jsonMatch[1]) {
      const jsonString = jsonMatch[1];
      const parsedData = JSON.parse(jsonString);

      // Validación básica de la estructura
      if (
        parsedData &&
        typeof parsedData.title === 'string' &&
        typeof parsedData.description === 'string' &&
        Array.isArray(parsedData.ingredients) &&
        Array.isArray(parsedData.instructions)
        // Añadir más validaciones si es necesario (prepTime, cookTime, servings)
      ) {
        // Asegurarse de que los ingredientes tengan el formato correcto
        const validIngredients = parsedData.ingredients.every(
          (ing: any) => typeof ing.name === 'string' && typeof ing.quantity === 'string'
        );
        const validInstructions = parsedData.instructions.every(
          (inst: any) => typeof inst === 'string'
        );

        if (validIngredients && validInstructions) {
           // Mapear a GeneratedRecipeData si es necesario o si los tipos coinciden directamente
           return parsedData as GeneratedRecipeData;
        }
      }
    }
    console.error("No se encontró un bloque JSON válido en la respuesta:", responseText);
    return null;
  } catch (error) {
    console.error("Error al parsear la respuesta JSON:", error, responseText);
    return null;
  }
};


// --- Component ---

export const RecipeListPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, session } = useAuth();
  const { recipes, isLoading, error, fetchRecipes } = useRecipeStore();

  const [usePantryIngredients, setUsePantryIngredients] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [promptText, setPromptText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);

  useEffect(() => {
    if (user?.id) {
      fetchRecipes(user.id);
    }
  }, [user?.id, fetchRecipes]);

  const handleGenerateRecipe = async () => {
    // Tarea 2.2: Verificar si se debe usar la despensa
    const usePantry = usePantryIngredients;

    // Validaciones iniciales
    if (!promptText.trim() && !usePantry) { // Si no usa despensa, necesita descripción
      setGenerationError("Por favor, introduce una descripción o selecciona 'Usar ingredientes de mi despensa'.");
      return;
    }
     if (!session || !user?.id) {
        setGenerationError("Necesitas iniciar sesión para generar recetas.");
        return;
    }

    setIsGenerating(true);
    setGenerationError(null);

    try {
      // --- Obtener API Key y Preferencias (Lógica existente) ---
      let apiKey: string | undefined;
      let userProfile: UserProfile | null = null;
      try {
          userProfile = await getUserProfile(user.id);
          // Corregido: Manejar posible null con ?? undefined
          apiKey = userProfile?.gemini_api_key ?? undefined;
          console.log("API Key obtenida del perfil de usuario.");
      } catch (profileError) {
          console.warn("No se pudo obtener el perfil del usuario o la clave API del perfil:", profileError);
      }
      if (!apiKey) {
          apiKey = import.meta.env.VITE_GEMINI_API_KEY;
          if (apiKey) console.log("API Key obtenida de las variables de entorno.");
      }
      if (!apiKey) {
        throw new Error('No API key available. Please set it in your profile or configure VITE_GEMINI_API_KEY.');
      }
      // Corregido: userPreferences es ahora el userProfile parcial o null
      const userPreferences = userProfile;
      // --- Fin Obtener API Key y Preferencias ---


      // --- Tarea 2.3: Obtener Ingredientes Despensa (si aplica) ---
      let pantryIngredientNames: string[] | undefined = undefined;
      if (usePantry) {
        console.log("Intentando obtener ingredientes de la despensa...");
        try {
          // Corregido: Usar getPantryItems directamente (no necesita user.id)
          const pantryItems: PantryItem[] = await getPantryItems();
          if (pantryItems && pantryItems.length > 0) {
            // Extraer solo los nombres, asegurándose de que no sean nulos o vacíos
            pantryIngredientNames = pantryItems
              // Corregido: Acceder a item.ingredient.name y añadir tipo explícito
              .map((item: PantryItem) => item.ingredient?.name)
              // Corregido: Añadir tipo explícito a name y filtrar undefined/null/vacío
              .filter((name?: string | null): name is string => !!name && name.trim() !== '');

            // Corregido: Asegurar que pantryIngredientNames es array antes de .length
            if (pantryIngredientNames && pantryIngredientNames.length === 0) {
                 console.warn("La despensa contiene items pero sin nombres válidos.");
                 // Decidimos mostrar error y detener si no hay nombres válidos para usar
                 setGenerationError("No se encontraron nombres válidos en los ingredientes de tu despensa. Revisa tus items.");
                 setIsGenerating(false);
                 return;
            } else {
                 console.log("Ingredientes de la despensa obtenidos:", pantryIngredientNames);
            }
          } else {
            console.log("La despensa está vacía.");
            setGenerationError("Tu despensa está vacía. Añade ingredientes o desmarca la opción para generar una receta general.");
            setIsGenerating(false); // Detener la generación
            return; // Salir de la función
          }
        } catch (pantryError: any) {
          console.error("Error al obtener ingredientes de la despensa:", pantryError);
          setGenerationError(`Error al obtener la despensa: ${pantryError.message || 'Error desconocido'}`);
          setIsGenerating(false); // Detener la generación
          return; // Salir de la función
        }
      }
      // --- Fin Tarea 2.3 ---


      // --- Tarea 2.4: Construir el Prompt ---
      console.log(`Construyendo prompt ${usePantry && pantryIngredientNames ? 'con' : 'sin'} ingredientes de despensa.`);
      const fullPrompt = buildRecipePrompt(promptText, userPreferences, pantryIngredientNames);
      console.log("Prompt final para Gemini:", fullPrompt); // Log para depuración
      // --- Fin Tarea 2.4 ---


      // --- Tarea 2.5: Llamar a la API de Google Gemini (Lógica existente adaptada) ---
      console.log("Llamando a la API de Gemini...");
      // Asegurarse de usar el endpoint correcto y el modelo adecuado (ej. gemini-1.5-flash)
      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
      const geminiResponse = await fetch(geminiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: fullPrompt }] }],
          generationConfig: { responseMimeType: "application/json" }, // Crucial para obtener JSON
          // safetySettings: [...], // Opcional
        }),
      });

      if (!geminiResponse.ok) {
        const errorText = await geminiResponse.text();
        let errorData = {};
        try { errorData = JSON.parse(errorText); } catch (e) { console.error("Respuesta de error API no es JSON:", errorText); }
        console.error("Error API Google:", geminiResponse.status, geminiResponse.statusText, errorData);
        const errorMessage = (errorData as any)?.error?.message || `Error API Google: ${geminiResponse.statusText}`;
        throw new Error(errorMessage);
      }

      const geminiResult = await geminiResponse.json();
      console.log("Respuesta cruda de Gemini:", geminiResult); // Log para depuración

      // Verificar bloqueos de seguridad en la respuesta
      if (geminiResult.promptFeedback?.blockReason) {
        console.error("Respuesta bloqueada por Google:", geminiResult.promptFeedback);
        throw new Error(`Solicitud bloqueada por seguridad: ${geminiResult.promptFeedback.blockReason}`);
      }
      // Verificar si hay candidatos y contenido
       if (!geminiResult.candidates || geminiResult.candidates.length === 0 || !geminiResult.candidates[0].content?.parts?.[0]?.text) {
         console.error("Respuesta inesperada de Google (sin contenido válido):", geminiResult);
         // Revisar finishReason si existe
         const finishReason = geminiResult.candidates?.[0]?.finishReason;
         if (finishReason && finishReason !== 'STOP') {
           throw new Error(`La generación de la receta falló o fue detenida (${finishReason}).`);
         }
         throw new Error("No se recibió contenido de receta válido en la respuesta de la API.");
       }
      // --- Fin Tarea 2.5 ---


      // --- Tarea 2.6: Procesar Respuesta y Navegar (Lógica existente adaptada) ---
      const responseText = geminiResult.candidates[0].content.parts[0].text;
      console.log("Texto JSON recibido:", responseText); // Log para depuración

      let recipeData: GeneratedRecipeData | null = null;
      try {
          recipeData = JSON.parse(responseText);
          // Validación más robusta (ejemplo)
          if (!recipeData || typeof recipeData.title !== 'string' || !Array.isArray(recipeData.ingredients) || !Array.isArray(recipeData.instructions) || typeof recipeData.prepTimeMinutes !== 'number' || typeof recipeData.cookTimeMinutes !== 'number' || typeof recipeData.servings !== 'number') {
              console.error("JSON parseado pero con formato inválido o tipos incorrectos:", recipeData);
              throw new Error("Formato JSON de receta inválido o incompleto.");
          }

           // Limpiar ingredientes (asegurar que quantity/unit no sean undefined y name exista)
           recipeData.ingredients = recipeData.ingredients.map(ing => ({
               quantity: ing.quantity ?? '', // Default a string vacía si es null/undefined
               unit: ing.unit ?? '',       // Default a string vacía si es null/undefined
               name: ing.name ?? 'Ingrediente desconocido' // Default si falta el nombre
           })).filter(ing => ing.name !== 'Ingrediente desconocido' && ing.name.trim() !== ''); // Opcional: filtrar ingredientes sin nombre


      } catch (parseError) {
          console.error("Error al parsear la respuesta JSON de la API:", parseError, responseText);
          // Incluir parte de la respuesta en el error puede ayudar a depurar
          const snippet = responseText.substring(0, 100);
          throw new Error(`La respuesta de la API no contenía un JSON de receta válido. Inicio: ${snippet}...`);
      }

      console.log("Receta generada y parseada, navegando:", recipeData);
      navigate('/app/recipes/new', { state: { generatedRecipe: recipeData } });
      setIsDialogOpen(false);
      setPromptText(''); // Limpiar prompt
      setUsePantryIngredients(false); // Resetear switch
      // --- Fin Tarea 2.6 ---

    } catch (error: any) {
      console.error("Error generando receta:", error);
      // Mostrar un mensaje de error más descriptivo si es posible
      setGenerationError(error.message || "Ocurrió un error inesperado al generar la receta.");
      // No reseteamos el switch aquí para que el usuario vea qué opción falló
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl md:text-3xl font-bold">Mis Recetas</h1>
        <div className="flex gap-2">
           <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="default">
                <Sparkles className="mr-2 h-4 w-4" /> Generar con IA
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Generar Receta con IA</DialogTitle>
                <DialogDescription>
                  Describe qué tipo de receta te gustaría crear (ingredientes, tipo de plato, etc.).
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                {/* Contenedor para Label y Textarea */}
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="prompt" className="text-right">
                    Descripción
                  </Label>
                  <Textarea
                    id="prompt"
                    value={promptText}
                    onChange={(e) => setPromptText(e.target.value)}
                    className="col-span-3"
                    placeholder="Ej: Una tarta de manzana fácil y rápida"
                    disabled={isGenerating}
                  />
                  {/* El Textarea se cierra aquí correctamente */}
                </div>

                {/* Contenedor para el Switch, fuera del anterior pero dentro del grid principal */}
                <div className="flex items-center space-x-2 mt-2 col-span-4 justify-end"> {/* Ajustado margen y alineación */}
                  <Switch
                    id="use-pantry"
                    checked={usePantryIngredients}
                    onCheckedChange={setUsePantryIngredients}
                    disabled={isGenerating}
                  />
                  <Label htmlFor="use-pantry">Usar ingredientes de mi despensa</Label>
                </div>

                {/* Mensaje de error */}
                {generationError && (
                  <p className="text-red-500 text-sm col-span-4 text-center mt-2">{generationError}</p> // Añadido margen
                )}
              </div>
              <DialogFooter>
                <Button
                    type="button"
                    onClick={handleGenerateRecipe}
                    disabled={isGenerating || !promptText.trim()}
                >
                  {isGenerating ? <Spinner size="sm" className="mr-2" /> : null}
                  Generar Receta
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Button variant="outline" asChild>
            <Link to="/app/recipes/new">
              <PlusCircle className="mr-2 h-4 w-4" /> Añadir Manualmente
            </Link>
          </Button>
        </div>
      </div>

      {isLoading && <div className="flex justify-center mt-10"><Spinner size="lg" /></div>}

      {error && <p className="text-red-500 text-center mt-10">Error al cargar recetas: {error}</p>}

      {!isLoading && !error && recipes.length === 0 && (
        <p className="text-center text-gray-500 mt-10">Aún no tienes recetas guardadas.</p>
      )}

      {!isLoading && !error && recipes.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {/* Mapeo de recetas usando RecipeCard */}
          {recipes.map((recipe) => (
            <RecipeCard recipe={recipe} key={recipe.id} />
          ))}
        </div>
      )}
    </div>
  );
};

// Exportar por defecto si es la convención del proyecto
// export default RecipeListPage;