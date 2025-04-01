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
import { useRecipeStore } from '@/stores/recipeStore'; // Asumiendo ruta correcta
import { useAuth } from '@/features/auth/AuthContext'; // Corregida ruta
import { getUserProfile } from '@/features/user/userService'; // Importación corregida
import type { GeneratedRecipeData } from '@/types/recipeTypes'; // Asumiendo ruta correcta para GeneratedRecipeData
import type { UserProfile } from '@/features/user/userTypes'; // Corregida ruta para UserProfile

// --- Helper Functions ---

/**
 * Construye el prompt detallado para la API de Google Gemini.
 * Incluye las preferencias del usuario si están disponibles.
 */
const buildRecipePrompt = (userPrompt: string, preferences?: Partial<UserProfile['preferences']>): string => {
  let prompt = `Genera una receta de cocina basada en la siguiente descripción: "${userPrompt}".\n\n`;

  if (preferences) {
    prompt += "Considera las siguientes preferencias del usuario:\n";
    if (preferences.dietaryRestrictions?.length) {
      prompt += `- Restricciones dietéticas: ${preferences.dietaryRestrictions.join(', ')}\n`;
    }
    if (preferences.allergies?.length) {
      prompt += `- Alergias: ${preferences.allergies.join(', ')}\n`;
    }
    if (preferences.preferredCuisine?.length) {
      prompt += `- Cocinas preferidas: ${preferences.preferredCuisine.join(', ')}\n`;
    }
    if (preferences.dislikedIngredients?.length) {
      prompt += `- Ingredientes no deseados: ${preferences.dislikedIngredients.join(', ')}\n`;
    }
    // Añadir más preferencias si es necesario
    prompt += "\n";
  }

  prompt += "Formatea la respuesta como un objeto JSON con las siguientes claves: 'title' (string), 'description' (string), 'ingredients' (array of objects with 'name' and 'quantity' strings), 'instructions' (array of strings), 'prepTime' (string, e.g., '15 minutos'), 'cookTime' (string, e.g., '30 minutos'), 'servings' (number). Asegúrate de que el JSON sea válido y esté contenido dentro de un bloque de código JSON (\`\`\`json ... \`\`\`).";

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
    if (!promptText.trim()) {
      setGenerationError("Por favor, introduce una descripción para generar la receta.");
      return;
    }
    if (!session) {
        setGenerationError("Necesitas iniciar sesión para generar recetas.");
        return;
    }

    setIsGenerating(true);
    setGenerationError(null);

    try {
      // 1. Determinar la API Key a usar
      let apiKey: string | undefined;
      let userProfile: UserProfile | null = null; // Inicializar userProfile

      if (user?.id) {
          try {
              userProfile = await getUserProfile(user.id);
              apiKey = userProfile?.gemini_api_key; // Intentar obtener del perfil
              console.log("API Key obtenida del perfil de usuario.");
          } catch (profileError) {
              console.warn("No se pudo obtener el perfil del usuario o la clave API del perfil:", profileError);
              // Continuar para intentar con la variable de entorno
          }
      }

      // Si no se obtuvo del perfil, intentar con la variable de entorno
      if (!apiKey) {
          apiKey = import.meta.env.VITE_GEMINI_API_KEY;
          if (apiKey) {
              console.log("API Key obtenida de las variables de entorno.");
          }
      }

      // Si aún no hay clave, lanzar error
      if (!apiKey) {
        throw new Error('No API key available. Please set it in your profile or configure VITE_GEMINI_API_KEY.');
      }

      // 2. Obtener preferencias del usuario (opcional, manejar si no existen)
      let userPreferences: Partial<UserProfile['preferences']> | undefined;
      if (user?.id) {
          try {
              // Intentar obtener perfil completo si no está en el objeto user inicial
              // o si las preferencias no están cargadas.
              // Esto depende de cómo se carga inicialmente el objeto `user`.
              // Si `user.profile` ya tiene las preferencias, se puede usar directamente.
              const profile = await getUserProfile(user.id);
              userPreferences = profile?.preferences;
          } catch (profileError) {
              console.warn("No se pudieron obtener las preferencias del usuario:", profileError);
              // Continuar sin preferencias si falla
          }
      }


      // 3. Construir el prompt
      const fullPrompt = buildRecipePrompt(promptText, userPreferences);

      // 4. Llamar a la API de Google Gemini
      // Reemplazar con la URL correcta del endpoint de Gemini si es diferente
      const geminiUrl = `https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash-lite-001:generateContent?key=${apiKey}`;
      const geminiResponse = await fetch(geminiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: fullPrompt }] }],
          // Opcional: Configuración de seguridad y generación
          // safetySettings: [...],
          // generationConfig: {...}
        }),
      });

      if (!geminiResponse.ok) {
        const errorData = await geminiResponse.json().catch(() => ({}));
        console.error("Error de la API de Google:", errorData);
        throw new Error(errorData.error?.message || `Error de la API de Google: ${geminiResponse.statusText}`);
      }

      const geminiResult = await geminiResponse.json();

      // Verificar promptFeedback (bloqueos de seguridad)
       if (geminiResult.promptFeedback?.blockReason) {
        console.error("Respuesta bloqueada por Google:", geminiResult.promptFeedback);
        throw new Error(`La solicitud fue bloqueada por razones de seguridad: ${geminiResult.promptFeedback.blockReason}`);
      }

      // Extraer el texto de la respuesta (asumiendo estructura estándar)
      const responseText = geminiResult.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!responseText) {
        console.error("Respuesta inesperada de Google:", geminiResult);
        throw new Error("No se recibió contenido de receta en la respuesta de la API.");
      }

      // 5. Parsear la respuesta
      const recipeData = extractAndParseRecipe(responseText);

      if (!recipeData) {
        throw new Error("No se pudo extraer o parsear la información de la receta generada.");
      }

      // 6. Navegar a la página de nueva receta con los datos generados
      console.log("Receta generada, navegando:", recipeData);
      navigate('/app/recipes/new', { state: { generatedRecipe: recipeData } });
      setIsDialogOpen(false); // Cerrar diálogo al éxito

    } catch (error: any) {
      console.error("Error generando receta:", error);
      setGenerationError(error.message || "Ocurrió un error inesperado al generar la receta.");
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
                </div>
                {generationError && (
                  <p className="text-red-500 text-sm col-span-4 text-center">{generationError}</p>
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {recipes.map((recipe) => (
            // TODO: Usar un componente RecipeCard real cuando esté disponible
            <Card key={recipe.id} className="overflow-hidden"> {/* Añadir overflow-hidden */}
              {/* Mostrar imagen si existe */}
              {recipe.image_url && (
                <img
                  src={recipe.image_url}
                  alt={`Imagen de ${recipe.title}`}
                  className="w-full h-40 object-cover" // Ajustar altura y object-fit según necesidad
                />
              )}
              <CardHeader>
                <CardTitle>{recipe.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 line-clamp-3">
                    {recipe.description || 'Sin descripción.'}
                </p>
                 {/* Añadir Link para ver detalles cuando la página de detalle exista */}
                 {/* <Button variant="link" asChild className="mt-2">
                    <Link to={`/app/recipes/${recipe.id}`}>Ver detalles</Link>
                 </Button> */}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

// Exportar por defecto si es la convención del proyecto
// export default RecipeListPage;