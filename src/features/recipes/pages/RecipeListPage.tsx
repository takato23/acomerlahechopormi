import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Filter } from 'lucide-react';
import { Sparkles, PlusCircle, ClipboardList } from 'lucide-react'; // Mantener una sola importación
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/Spinner';
import { Input } from '@/components/ui/input'; // Importar Input
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'; // Asumiendo ruta correcta
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'; // Importar componentes Select
import { Checkbox } from '@/components/ui/checkbox';
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
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Switch } from '@/components/ui/switch';
import { useRecipeStore } from '@/stores/recipeStore'; // Asumiendo ruta correcta
import { getPantryItems } from '@/features/pantry/pantryService'; // Corregido: Importar función específica
import { useAuth } from '@/features/auth/AuthContext'; // Corregida ruta
import { getUserProfile } from '@/features/user/userService'; // Importación corregida
import type { GeneratedRecipeData } from '@/types/recipeTypes'; // Asumiendo ruta correcta para GeneratedRecipeData
import type { UserProfile } from '@/features/user/userTypes';
import type { PantryItem } from '@/features/pantry/types'; // Importar PantryItem
import RecipeCard from '../components/RecipeCard'; // Importar RecipeCard (default export)
import { toast } from 'sonner'; // Asumiendo que se usa sonner para toasts
import { suggestSingleRecipeFromPantry } from '../generationService'; // Importar la nueva función (ruta corregida)
import { EmptyState } from '@/components/common/EmptyState'; // Importar EmptyState

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
  prompt += "Formatea la respuesta completa como un único objeto JSON válido contenido dentro de un bloque de código JSON (\`\`\`json ... \`\`\`). El objeto JSON debe tener las siguientes claves: 'title' (string), 'description' (string), 'prepTimeMinutes' (number), 'cookTimeMinutes' (number), 'servings' (number), 'ingredients' (array of objects with 'quantity' (número decimal, sin fracciones como 1/2), 'unit' (string, puede ser null o vacío), 'name' (string)), y 'instructions' (array of strings). Importante: las cantidades deben ser números decimales (ej: 0.5 en lugar de 1/2).";


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
  // Obtener acciones y estado del store
  // Obtener estado y acciones del store, incluyendo filtros
  const {
    recipes,
    isLoading,
    error,
    fetchRecipes,
    toggleFavorite,
    deleteRecipe,
    showOnlyFavorites,
    toggleFavoriteFilter,
    searchTerm,
    setSearchTerm,
    fetchNextPage, // Añadir acción para cargar más
    hasMore, // Añadir estado para saber si hay más páginas
    isLoadingMore, // Añadir estado para carga de siguientes páginas
    sortOption, // Añadir estado de ordenamiento
    setSortOption, // Añadir acción para cambiar ordenamiento
    selectedIngredients, // Filtro ingredientes
    selectedTags, // Filtro tags
    setSelectedIngredients, // Acción filtro ingredientes
    setSelectedTags, // Acción filtro tags
  } = useRecipeStore();

  const [usePantryIngredients, setUsePantryIngredients] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [promptText, setPromptText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);

  const [isSuggesting, setIsSuggesting] = useState(false);
  const [suggestionError, setSuggestionError] = useState<string | null>(null);

  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);
  const [tempSelectedIngredients, setTempSelectedIngredients] = useState<string[]>([]);
  const [tempSelectedTags, setTempSelectedTags] = useState<string[]>([]);

  // Datos de ejemplo (reemplazar con datos reales de la API)
  const availableIngredients = ['Pollo', 'Arroz', 'Tomate', 'Cebolla', 'Ajo', 'Pimiento', 'Carne Picada', 'Pasta'];
  const availableTags = ['Rápido', 'Fácil', 'Vegetariano', 'Vegano', 'Sin Gluten', 'Postre', 'Principal'];
// Opciones de ordenamiento disponibles
const sortOptions = [
  { value: 'created_at_desc', label: 'Más recientes' },
  { value: 'created_at_asc', label: 'Más antiguas' },
  { value: 'title_asc', label: 'Título (A-Z)' },
  { value: 'title_desc', label: 'Título (Z-A)' },
];

// --- Funciones para manejar el Sheet de Filtros ---

const handleIngredientChange = (ingredient: string, checked: boolean) => {
  setTempSelectedIngredients(prev =>
    checked ? [...prev, ingredient] : prev.filter(item => item !== ingredient)
  );
};

const handleTagChange = (tag: string, checked: boolean) => {
  setTempSelectedTags(prev =>
    checked ? [...prev, tag] : prev.filter(item => item !== tag)
  );
};

const handleApplyFilters = () => {
  if (user?.id) {
    setSelectedIngredients(tempSelectedIngredients, user.id);
    setSelectedTags(tempSelectedTags, user.id);
    setIsFilterSheetOpen(false);
  }
};

const handleClearFilters = () => {
  setTempSelectedIngredients([]);
  setTempSelectedTags([]);
  // Opcionalmente, aplicar inmediatamente o esperar a 'Aplicar'
  if (user?.id) {
    setSelectedIngredients([], user.id);
    setSelectedTags([], user.id);
    // No cerrar el sheet automáticamente al limpiar
    // setIsFilterSheetOpen(false);
  }
};

// Sincronizar estado temporal con el global al abrir el sheet
useEffect(() => {
  if (isFilterSheetOpen) {
    setTempSelectedIngredients(selectedIngredients);
    setTempSelectedTags(selectedTags);
  }
}, [isFilterSheetOpen, selectedIngredients, selectedTags]);

  useEffect(() => {
    if (user?.id) {
      // Cargar la primera página al montar o cuando cambian filtros/usuario
      // Usar reset: true para limpiar recetas anteriores al cambiar filtros/usuario
      fetchRecipes({
        userId: user.id,
        filters: { searchTerm, showOnlyFavorites, sortOption, selectedIngredients, selectedTags }, // Incluir todos los filtros
        page: 1,
        reset: true
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, fetchRecipes]); // Depender solo de user.id y fetchRecipes para la carga inicial/cambio de usuario
                                // Los filtros se aplican a través de sus propias acciones (setSearchTerm, toggleFavoriteFilter, setSortOption, etc.)
                                // que ya llaman a fetchRecipes con reset=true.
                                // Esto evita recargas múltiples si varios filtros cambian a la vez.
                                // Si se quiere recargar al cambiar CUALQUIER filtro desde fuera (ej. URL), se añadirían aquí.

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
            // Asegurar que pantryItems sea del tipo correcto
            pantryIngredientNames = (pantryItems as PantryItem[])
              // Corregido: Acceder a item.ingredient.name y añadir tipo explícito
              .map((item) => item.ingredient?.name) // No es necesario el tipo explícito aquí si el map anterior funciona
              .filter((name): name is string => !!name && name.trim() !== ''); // Simplificar filtro

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
      // Pasar userPreferences asegurando que sea Partial<UserProfile> o undefined
      const fullPrompt = buildRecipePrompt(promptText, userPreferences ?? undefined, pantryIngredientNames);
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
      console.log("Texto JSON original:", responseText);

      let recipeData: GeneratedRecipeData | null = null;
      try {
          // Reemplazar fracciones comunes por decimales antes de parsear
          const sanitizedText = responseText
              .replace(/"quantity":\s*1\/2\b/g, '"quantity": 0.5')
              .replace(/"quantity":\s*1\/3\b/g, '"quantity": 0.33')
              .replace(/"quantity":\s*2\/3\b/g, '"quantity": 0.67')
              .replace(/"quantity":\s*1\/4\b/g, '"quantity": 0.25')
              .replace(/"quantity":\s*3\/4\b/g, '"quantity": 0.75');
          
          console.log("Texto JSON sanitizado:", sanitizedText);
          recipeData = JSON.parse(sanitizedText);
          console.log("Receta parseada exitosamente:", recipeData);
          // Validación más robusta
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



  // --- Nueva Función Handler: Sugerir desde Despensa ---
  const handleSuggestFromPantry = async () => {
    if (!user?.id || !session) {
      toast.error("Necesitas iniciar sesión para obtener sugerencias.");
      return;
    }

    setIsSuggesting(true);
    setSuggestionError(null);

    try {
      console.log("Solicitando sugerencia de receta desde la despensa...");
      const suggestedRecipe = await suggestSingleRecipeFromPantry(user.id);

      if (suggestedRecipe) {
        console.log("Receta sugerida recibida, navegando a edición:", suggestedRecipe);
        navigate('/app/recipes/new', { state: { generatedRecipe: suggestedRecipe } });
      } else {
        console.log("No se pudo obtener una sugerencia de receta.");
        // Podríamos mostrar un toast más específico si el servicio devuelve null intencionalmente
        toast.info("No pudimos generar una sugerencia con tus ingredientes actuales.");
        setSuggestionError("No se pudo generar una sugerencia con los ingredientes de tu despensa.");
      }
    } catch (error: any) {
      console.error("Error al sugerir receta desde la despensa:", error);
      const errorMessage = error.message || "Ocurrió un error inesperado al obtener la sugerencia.";
      setSuggestionError(errorMessage);
      toast.error(`Error: ${errorMessage}`);
    } finally {
      setIsSuggesting(false);
    }
  };
  // --- Fin Nueva Función Handler ---
  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8"> {/* Revertido a container mx-auto */}
      <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-200"> {/* Añadir padding y borde inferior */}
        <h1 className="text-3xl md:text-4xl font-bold mb-8">Mis Recetas</h1> {/* Aumentar tamaño y margen inferior */}
        <div className="flex gap-2">
           <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="default">
                <Sparkles className="mr-2 h-4 w-4" /> Generar desde Descripción
              </Button>
            </DialogTrigger>
          {/* --- Nuevo Botón: Sugerir desde Despensa --- */}
          <Button variant="secondary" onClick={handleSuggestFromPantry} disabled={isSuggesting || isLoading || isGenerating}>
            {isSuggesting ? <Spinner size="sm" className="mr-2" /> : <ClipboardList className="mr-2 h-4 w-4" />}
            Sugerir desde Despensa
          </Button>
          {/* --- Fin Nuevo Botón --- */}
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Generar Receta desde Descripción</DialogTitle>
                <DialogDescription>
                  Describe la receta que buscas o activa la opción para usar tu despensa.
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

      {/* Controles de Filtro/Búsqueda */}
      <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-4">
        {/* Input de Búsqueda */}
        <div className="w-full sm:w-auto sm:flex-grow sm:max-w-xs">
          <Input
            placeholder="Buscar por título..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)} // Actualizar store
            className="w-full"
          />
        </div>
        {/* Filtro Favoritos */}
        {/* Filtro Favoritos */}
        <div className="flex items-center space-x-2 flex-shrink-0">
          <Switch
            id="favorites-filter"
            checked={showOnlyFavorites}
            onCheckedChange={() => user?.id && toggleFavoriteFilter(user.id)} // Pasar userId
          />
          <Label htmlFor="favorites-filter">Solo Favoritos</Label>
        </div>
        {/* Selector de Ordenamiento */}
        <div className="w-full sm:w-auto">
          <Select
            value={sortOption}
            onValueChange={(value) => {
              if (user?.id) {
                setSortOption(value, user.id);
              }
            }}
          >
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Ordenar por..." />
            </SelectTrigger>
            <SelectContent>
              {sortOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {/* --- Botón y Sheet para Filtros Avanzados --- */}
        <Sheet open={isFilterSheetOpen} onOpenChange={setIsFilterSheetOpen}>
          <SheetTrigger asChild>
            {/* Ajustar clase para que no se pegue a la derecha si hay espacio */}
            <Button variant="outline" className="flex-shrink-0" aria-label="Abrir filtros avanzados de recetas"> {/* Añadido aria-label descriptivo */}
              <Filter className="mr-2 h-4 w-4" /> Filtros
            </Button>
          </SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Filtros Avanzados</SheetTitle>
              <SheetDescription>
                Selecciona ingredientes y tags para refinar tu búsqueda.
              </SheetDescription>
            </SheetHeader>
            <div className="grid gap-6 py-4">
              {/* Filtro por Ingredientes */}
              <div>
                <h4 className="mb-2 font-medium text-sm" id="filter-ingredients-heading">Por Ingredientes (contiene al menos uno)</h4> {/* Añadido id al heading */}
                <ul aria-labelledby="filter-ingredients-heading" className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-2 space-y-0"> {/* Usar lista semántica y ajustar clases */}
                  {availableIngredients.map((ingredient) => (
                    <li key={ingredient} className="flex items-center space-x-2"> {/* Usar item de lista */}
                      <Checkbox
                        id={`filter-ingredient-${ingredient.toLowerCase().replace(/\s+/g, '-')}`} // Usar id consistente
                        checked={tempSelectedIngredients.includes(ingredient)}
                        onCheckedChange={(checked) => handleIngredientChange(ingredient, !!checked)}
                        aria-labelledby={`filter-ingredient-label-${ingredient.toLowerCase().replace(/\s+/g, '-')}`} // Usar aria-labelledby
                      />
                      <Label htmlFor={`filter-ingredient-${ingredient.toLowerCase().replace(/\s+/g, '-')}`} id={`filter-ingredient-label-${ingredient.toLowerCase().replace(/\s+/g, '-')}`} className="text-sm font-normal"> {/* Usar id consistente */}
                        {ingredient}
                      </Label>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Filtro por Tags */}
              <div>
                <h4 className="mb-2 font-medium text-sm" id="filter-tags-heading">Por Tags (contiene todos)</h4> {/* Añadido id al heading */}
                <ul aria-labelledby="filter-tags-heading" className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-2 space-y-0"> {/* Usar lista semántica y ajustar clases */}
                  {availableTags.map((tag) => (
                    <li key={tag} className="flex items-center space-x-2"> {/* Usar item de lista */}
                      <Checkbox
                        id={`filter-tag-${tag.toLowerCase().replace(/\s+/g, '-')}`} // Usar id consistente
                        checked={tempSelectedTags.includes(tag)}
                        onCheckedChange={(checked) => handleTagChange(tag, !!checked)}
                        aria-labelledby={`filter-tag-label-${tag.toLowerCase().replace(/\s+/g, '-')}`} // Usar aria-labelledby
                      />
                      <Label htmlFor={`filter-tag-${tag.toLowerCase().replace(/\s+/g, '-')}`} id={`filter-tag-label-${tag.toLowerCase().replace(/\s+/g, '-')}`} className="text-sm font-normal"> {/* Usar id consistente */}
                        {tag}
                      </Label>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <SheetFooter className="mt-4">
              <Button variant="outline" onClick={handleClearFilters}>Limpiar</Button>
              <SheetClose asChild>
                <Button type="button" onClick={handleApplyFilters}>Aplicar Filtros</Button>
              </SheetClose>
            </SheetFooter>
          </SheetContent>
        </Sheet>
        {/* --- Fin Sheet Filtros --- */}
      </div>


      {isLoading && <div className="flex justify-center mt-10"><Spinner size="lg" /></div>}

      {error && <p className="text-red-500 text-center mt-10">Error al cargar recetas: {error}</p>}

      {!isLoading && !error && recipes.length === 0 && (
        <EmptyState
          icon={<ClipboardList className="h-16 w-16" />} // Icono más grande
          title="Aún no has añadido ninguna receta"
          description="¡Empieza creando una manualmente o generando una con IA!"
          action={
            <Link to="/app/recipes/new">
              <Button>
      {/* Grid de Recetas */}
                 <PlusCircle className="mr-2 h-4 w-4" /> Añadir Receta Manualmente
              </Button>
            </Link>
          }
          className="mt-10" // Mantener margen superior
        />
      )}

      {!isLoading && !error && recipes.length > 0 && (
        <> {/* Fragmento para añadir el log sin afectar la estructura */}
        {console.log("[RecipeListPage] Rendering recipes data:", JSON.stringify(recipes, null, 2))} {/* LOG DE DATOS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"> {/* Reducido número de columnas en XL */}
          {/* Mapeo de recetas usando RecipeCard */}
          {/* Filtrar recetas localmente basado en showOnlyFavorites */}
          {/* El filtrado ahora se hace en el store/fetch, no aquí */}
          {recipes.map((recipe) => (
            <RecipeCard
              recipe={recipe}
              key={recipe.id}
              onToggleFavorite={toggleFavorite} // Pasar acción del store
              onDelete={deleteRecipe} // Pasar acción del store
            />
          ))}
        </div>
        </>
      )}

      {/* Botón Cargar Más y Spinner */}
      {!isLoading && hasMore && (
        <div className="flex justify-center mt-8">
          <Button
            onClick={() => user?.id && fetchNextPage(user.id)}
            disabled={isLoadingMore}
            variant="outline"
          >
            {isLoadingMore ? <Spinner size="sm" className="mr-2" /> : null}
            Cargar más recetas
          </Button>
        </div>
      )}
      {/* Mostrar spinner general si isLoadingMore es true pero no hay botón (caso raro) */}
      {isLoadingMore && !hasMore && (
         <div className="flex justify-center mt-8">
             <Spinner size="lg" />
         </div>
      )}

    </div>
  );
};

// Exportar por defecto si es la convención del proyecto
// export default RecipeListPage;