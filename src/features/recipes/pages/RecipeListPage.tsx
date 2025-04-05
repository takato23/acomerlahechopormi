import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Filter, Sparkles, PlusCircle, ClipboardList, LayoutGrid, List } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/Spinner';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
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
import { useRecipeStore } from '@/stores/recipeStore';
import { getPantryItems } from '@/features/pantry/pantryService';
import { useAuth } from '@/features/auth/AuthContext';
import { getUserProfile } from '@/features/user/userService';
import type { GeneratedRecipeData } from '@/types/recipeTypes';
import type { UserProfile } from '@/features/user/userTypes';
import type { PantryItem } from '@/features/pantry/types';
import RecipeCard from '../components/RecipeCard';
import RecipeList from '../components/RecipeList'; // Importar RecipeList
import { toast } from 'sonner';
import { suggestSingleRecipeFromPantry } from '../generationService';
import { EmptyState } from '@/components/common/EmptyState';

// --- Helper Functions (buildRecipePrompt, extractAndParseRecipe - sin cambios) ---
const buildRecipePrompt = (
  userPrompt: string,
  preferences?: Partial<UserProfile>,
  pantryIngredients?: string[]
): string => {
  let prompt = "";
  if (pantryIngredients && pantryIngredients.length > 0) {
    prompt = `Genera una receta de cocina creativa utilizando principalmente los siguientes ingredientes que tengo disponibles: ${pantryIngredients.join(', ')}. `;
    if (userPrompt.trim()) {
      prompt += `Considera también esta descripción adicional: "${userPrompt}". `;
    }
    prompt += "Puedes usar otros ingredientes comunes si es necesario.\n\n";
  } else {
    prompt = `Genera una receta de cocina basada en la siguiente descripción: "${userPrompt}".\n\n`;
  }
  if (preferences) {
    prompt += "Considera las siguientes preferencias del usuario:\n";
    if (preferences.dietary_preference) prompt += `- Preferencia dietética: ${preferences.dietary_preference}\n`;
    if (preferences.allergies_restrictions) prompt += `- Alergias/Restricciones: ${preferences.allergies_restrictions}\n`;
    if (preferences.difficulty_preference) prompt += `- Dificultad preferida: ${preferences.difficulty_preference}\n`;
    if (preferences.max_prep_time) prompt += `- Tiempo máximo de preparación: ${preferences.max_prep_time} minutos\n`;
    prompt += "\n";
  }
  prompt += "Formatea la respuesta completa como un único objeto JSON válido contenido dentro de un bloque de código JSON (\`\`\`json ... \`\`\`). El objeto JSON debe tener las siguientes claves: 'title' (string), 'description' (string), 'prepTimeMinutes' (number), 'cookTimeMinutes' (number), 'servings' (number), 'ingredients' (array of objects with 'quantity' (número decimal, sin fracciones como 1/2), 'unit' (string, puede ser null o vacío), 'name' (string)), y 'instructions' (array of strings). Importante: las cantidades deben ser números decimales (ej: 0.5 en lugar de 1/2).";
  return prompt;
};

const extractAndParseRecipe = (responseText: string): GeneratedRecipeData | null => {
  try {
    const jsonMatch = responseText.match(/```json\s*([\s\S]*?)\s*```/);
    if (jsonMatch && jsonMatch[1]) {
      const jsonString = jsonMatch[1];
      const parsedData = JSON.parse(jsonString);
      if (
        parsedData &&
        typeof parsedData.title === 'string' &&
        typeof parsedData.description === 'string' &&
        Array.isArray(parsedData.ingredients) &&
        Array.isArray(parsedData.instructions)
      ) {
        const validIngredients = parsedData.ingredients.every(
          (ing: any) => typeof ing.name === 'string' // Simplificado, la cantidad puede ser número
        );
        const validInstructions = parsedData.instructions.every(
          (inst: any) => typeof inst === 'string'
        );
        if (validIngredients && validInstructions) {
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


// --- Componente para el Switch de Vista ---
const ViewModeSwitch: React.FC<{ currentMode: 'card' | 'list'; onChange: (mode: 'card' | 'list') => void }> = ({ currentMode, onChange }) => (
  <div className="flex items-center gap-1 rounded-md bg-slate-100 p-0.5">
    <Button
      variant={currentMode === 'card' ? 'outline' : 'ghost'}
      size="sm"
      onClick={() => onChange('card')}
      className={`px-2 py-1 h-auto ${currentMode === 'card' ? 'bg-white shadow-sm' : ''}`}
      aria-label="Vista de tarjetas"
    >
      <LayoutGrid className="h-4 w-4" />
    </Button>
    <Button
      variant={currentMode === 'list' ? 'outline' : 'ghost'}
      size="sm"
      onClick={() => onChange('list')}
      className={`px-2 py-1 h-auto ${currentMode === 'list' ? 'bg-white shadow-sm' : ''}`}
      aria-label="Vista de lista"
    >
      <List className="h-4 w-4" />
    </Button>
  </div>
);

// --- Component Principal ---
export const RecipeListPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, session } = useAuth();
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
    fetchNextPage,
    hasMore,
    isLoadingMore,
    sortOption,
    setSortOption,
    selectedIngredients,
    selectedTags,
    setSelectedIngredients,
    setSelectedTags,
    // Nuevos estados y acciones del store
    viewMode,
    availableTags, // Usar este en lugar del hardcodeado
    setViewMode,
    clearTagFilters, // Usado en handleClearFilters
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

  // TODO: Obtener availableIngredients dinámicamente si es necesario, o desde config
  const availableIngredients = ['Pollo', 'Arroz', 'Tomate', 'Cebolla', 'Ajo', 'Pimiento', 'Carne Picada', 'Pasta'];

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
      // Idealmente, el store debería tener una acción para setear múltiples filtros y hacer un solo fetch.
      // Por ahora, llamamos a ambas acciones que dispararán fetches separados.
      setSelectedIngredients(tempSelectedIngredients, user.id);
      setSelectedTags(tempSelectedTags, user.id);
      setIsFilterSheetOpen(false);
    }
  };

  const handleClearFilters = () => {
    setTempSelectedIngredients([]);
    setTempSelectedTags([]);
    // Aplicar limpieza a los filtros globales también
    if (user?.id) {
      // Idealmente, una sola acción en el store para limpiar ambos y hacer un solo fetch.
      setSelectedIngredients([], user.id);
      clearTagFilters(user.id);
      // No cerramos el sheet aquí, el usuario puede querer seguir ajustando.
    }
  };

  // Sincronizar estado temporal con el global al abrir el sheet
  useEffect(() => {
    if (isFilterSheetOpen) {
      setTempSelectedIngredients(selectedIngredients);
      setTempSelectedTags(selectedTags);
    }
  }, [isFilterSheetOpen, selectedIngredients, selectedTags]);

  // Carga inicial de recetas
  useEffect(() => {
    if (user?.id) {
      fetchRecipes({
        userId: user.id,
        filters: { searchTerm, showOnlyFavorites, sortOption, selectedIngredients, selectedTags },
        page: 1,
        reset: true
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, fetchRecipes]); // Dependencias mínimas para carga inicial

  // --- Handlers para Generación y Sugerencia (sin cambios) ---
  const handleGenerateRecipe = async () => {
    const usePantry = usePantryIngredients;
    if (!promptText.trim() && !usePantry) {
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
      let apiKey: string | undefined;
      let userProfile: UserProfile | null = null;
      try {
          userProfile = await getUserProfile(user.id);
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
      const userPreferences = userProfile;
      let pantryIngredientNames: string[] | undefined = undefined;
      if (usePantry) {
        console.log("Intentando obtener ingredientes de la despensa...");
        try {
          const pantryItems: PantryItem[] = await getPantryItems();
          if (pantryItems && pantryItems.length > 0) {
            pantryIngredientNames = (pantryItems as PantryItem[])
              .map((item) => item.ingredient?.name)
              .filter((name): name is string => !!name && name.trim() !== '');
            if (pantryIngredientNames && pantryIngredientNames.length === 0) {
                 console.warn("La despensa contiene items pero sin nombres válidos.");
                 setGenerationError("No se encontraron nombres válidos en los ingredientes de tu despensa. Revisa tus items.");
                 setIsGenerating(false);
                 return;
            } else {
                 console.log("Ingredientes de la despensa obtenidos:", pantryIngredientNames);
            }
          } else {
            console.log("La despensa está vacía.");
            setGenerationError("Tu despensa está vacía. Añade ingredientes o desmarca la opción para generar una receta general.");
            setIsGenerating(false);
            return;
          }
        } catch (pantryError: any) {
          console.error("Error al obtener ingredientes de la despensa:", pantryError);
          setGenerationError(`Error al obtener la despensa: ${pantryError.message || 'Error desconocido'}`);
          setIsGenerating(false);
          return;
        }
      }
      console.log(`Construyendo prompt ${usePantry && pantryIngredientNames ? 'con' : 'sin'} ingredientes de despensa.`);
      const fullPrompt = buildRecipePrompt(promptText, userPreferences ?? undefined, pantryIngredientNames);
      console.log("Prompt final para Gemini:", fullPrompt);
      console.log("Llamando a la API de Gemini...");
      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
      const geminiResponse = await fetch(geminiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: fullPrompt }] }],
          generationConfig: { responseMimeType: "application/json" },
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
      console.log("Respuesta cruda de Gemini:", geminiResult);
      if (geminiResult.promptFeedback?.blockReason) {
        console.error("Respuesta bloqueada por Google:", geminiResult.promptFeedback);
        throw new Error(`Solicitud bloqueada por seguridad: ${geminiResult.promptFeedback.blockReason}`);
      }
       if (!geminiResult.candidates || geminiResult.candidates.length === 0 || !geminiResult.candidates[0].content?.parts?.[0]?.text) {
         console.error("Respuesta inesperada de Google (sin contenido válido):", geminiResult);
         const finishReason = geminiResult.candidates?.[0]?.finishReason;
         if (finishReason && finishReason !== 'STOP') {
           throw new Error(`La generación de la receta falló o fue detenida (${finishReason}).`);
         }
         throw new Error("No se recibió contenido de receta válido en la respuesta de la API.");
       }
      const responseText = geminiResult.candidates[0].content.parts[0].text;
      console.log("Texto JSON original:", responseText);
      let recipeData: GeneratedRecipeData | null = null;
      try {
          const sanitizedText = responseText
              .replace(/"quantity":\s*1\/2\b/g, '"quantity": 0.5')
              .replace(/"quantity":\s*1\/3\b/g, '"quantity": 0.33')
              .replace(/"quantity":\s*2\/3\b/g, '"quantity": 0.67')
              .replace(/"quantity":\s*1\/4\b/g, '"quantity": 0.25')
              .replace(/"quantity":\s*3\/4\b/g, '"quantity": 0.75');
          console.log("Texto JSON sanitizado:", sanitizedText);
          recipeData = JSON.parse(sanitizedText);
          console.log("Receta parseada exitosamente:", recipeData);
          if (!recipeData || typeof recipeData.title !== 'string' || !Array.isArray(recipeData.ingredients) || !Array.isArray(recipeData.instructions) || typeof recipeData.prepTimeMinutes !== 'number' || typeof recipeData.cookTimeMinutes !== 'number' || typeof recipeData.servings !== 'number') {
              console.error("JSON parseado pero con formato inválido o tipos incorrectos:", recipeData);
              throw new Error("Formato JSON de receta inválido o incompleto.");
          }
           recipeData.ingredients = recipeData.ingredients.map(ing => ({
               quantity: ing.quantity ?? '',
               unit: ing.unit ?? '',
               name: ing.name ?? 'Ingrediente desconocido'
           })).filter(ing => ing.name !== 'Ingrediente desconocido' && ing.name.trim() !== '');
      } catch (parseError) {
          console.error("Error al parsear la respuesta JSON de la API:", parseError, responseText);
          const snippet = responseText.substring(0, 100);
          throw new Error(`La respuesta de la API no contenía un JSON de receta válido. Inicio: ${snippet}...`);
      }
      console.log("Receta generada y parseada, navegando:", recipeData);
      navigate('/app/recipes/new', { state: { generatedRecipe: recipeData } });
      setIsDialogOpen(false);
      setPromptText('');
      setUsePantryIngredients(false);
    } catch (error: any) {
      console.error("Error generando receta:", error);
      setGenerationError(error.message || "Ocurrió un error inesperado al generar la receta.");
    } finally {
      setIsGenerating(false);
    }
  };

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

  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8">
      {/* --- Cabecera y Botones Principales --- */}
      <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-200">
        <h1 className="text-3xl md:text-4xl font-bold">Mis Recetas</h1>
        <div className="flex gap-2">
           <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="default">
                <Sparkles className="mr-2 h-4 w-4" /> Generar desde Descripción
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Generar Receta con IA</DialogTitle>
                <DialogDescription>
                  Describe qué tipo de receta quieres generar. Puedes incluir ingredientes, tipo de cocina, dificultad, etc.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="prompt" className="text-right col-span-1">
                    Descripción
                  </Label>
                  <Textarea
                    id="prompt"
                    value={promptText}
                    onChange={(e) => setPromptText(e.target.value)}
                    placeholder="Ej: Una cena rápida y saludable con pollo y verduras"
                    className="col-span-3"
                    rows={3}
                  />
                </div>
                <div className="flex items-center space-x-2 mt-2 col-span-4 justify-end">
                  <Switch
                    id="use-pantry"
                    checked={usePantryIngredients}
                    onCheckedChange={setUsePantryIngredients}
                  />
                  <Label htmlFor="use-pantry">Usar ingredientes de mi despensa</Label>
                </div>
                {generationError && <p className="text-red-500 text-sm col-span-4">{generationError}</p>}
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  onClick={handleGenerateRecipe}
                  disabled={isGenerating || (!promptText.trim() && !usePantryIngredients)}
                >
                  {isGenerating ? <Spinner size="sm" className="mr-2" /> : <Sparkles className="mr-2 h-4 w-4" />}
                  Generar Receta
                </Button>
              </DialogFooter>
            </DialogContent>
           </Dialog>
          <Button variant="secondary" onClick={handleSuggestFromPantry} disabled={isSuggesting || isLoading || isGenerating}>
            {isSuggesting ? <Spinner size="sm" className="mr-2" /> : <ClipboardList className="mr-2 h-4 w-4" />}
            Sugerir desde Despensa
          </Button>
          <Button variant="outline" asChild>
            <Link to="/app/recipes/new">
              <PlusCircle className="mr-2 h-4 w-4" /> Añadir Manualmente
            </Link>
          </Button>
        </div>
      </div>

      {/* --- Controles Principales (Búsqueda, Favoritos, Orden, Filtros, Vista) --- */}
      <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-4">
        {/* Input de Búsqueda */}
        <div className="w-full sm:w-auto sm:flex-grow sm:max-w-xs">
          <Input
            type="search"
            placeholder="Buscar recetas..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              // Disparar búsqueda con debounce o botón
              // Ejemplo simple: buscar al cambiar (puede ser ineficiente)
              if (user?.id) {
                 fetchRecipes({ userId: user.id, filters: { searchTerm: e.target.value }, page: 1, reset: true });
              }
            }}
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap justify-end">
          {/* Toggle Favoritos */}
          <div className="flex items-center space-x-2 flex-shrink-0">
            <Switch
              id="favorite-filter"
              checked={showOnlyFavorites}
              onCheckedChange={() => user?.id && toggleFavoriteFilter(user.id)}
            />
            <Label htmlFor="favorite-filter">Solo Favoritos</Label>
          </div>

          {/* Select Ordenamiento */}
          <div className="w-full sm:w-auto">
            <Select value={sortOption} onValueChange={(value) => user?.id && setSortOption(value, user.id)}>
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

          {/* Botón Filtros (Sheet) */}
          <Sheet open={isFilterSheetOpen} onOpenChange={setIsFilterSheetOpen}>
            <SheetTrigger asChild>
              <Button variant="outline">
                <Filter className="mr-2 h-4 w-4" /> Filtros ({selectedIngredients.length + selectedTags.length})
              </Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Filtros</SheetTitle>
              </SheetHeader>
              <div className="py-4 space-y-4">
                {/* Sección de Filtro por Ingredientes */}
                <div>
                  <h4 className="mb-2 font-medium text-sm">Ingredientes</h4>
                  <ul className="space-y-2 max-h-48 overflow-y-auto pr-2">
                    {availableIngredients.map((ingredient) => (
                      <li key={ingredient} className="flex items-center space-x-2">
                        <Checkbox
                          id={`ingredient-${ingredient}`}
                          checked={tempSelectedIngredients.includes(ingredient)}
                          onCheckedChange={(checked) => handleIngredientChange(ingredient, !!checked)}
                        />
                        <Label htmlFor={`ingredient-${ingredient}`} className="text-sm font-normal cursor-pointer">
                          {ingredient}
                        </Label>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Sección de Filtro por Tags */}
                <div className="mt-4">
                  <h4 className="mb-2 font-medium text-sm">Categorías/Tags</h4>
                  <ul className="space-y-2 max-h-48 overflow-y-auto pr-2">
                    {availableTags.map((tag) => (
                      <li key={tag} className="flex items-center space-x-2">
                        <Checkbox
                          id={`tag-${tag}`}
                          checked={tempSelectedTags.includes(tag)}
                          onCheckedChange={(checked) => handleTagChange(tag, !!checked)}
                        />
                        <Label htmlFor={`tag-${tag}`} className="text-sm font-normal cursor-pointer">
                          {tag}
                        </Label>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              <SheetFooter className="mt-4 flex flex-col sm:flex-row sm:justify-between gap-2">
                 <Button variant="ghost" onClick={handleClearFilters}>Limpiar Filtros</Button>
                 <SheetClose asChild>
                    <Button onClick={handleApplyFilters}>Aplicar Filtros</Button>
                 </SheetClose>
              </SheetFooter>
            </SheetContent>
          </Sheet>

           {/* Switch de Vista */}
           <ViewModeSwitch currentMode={viewMode} onChange={setViewMode} />

        </div>
      </div>

      {/* --- Grid o Lista de Recetas --- */}
      {isLoading && <div className="flex justify-center mt-10"><Spinner size="lg" /></div>}
      {!isLoading && error && <p className="text-red-500 text-center mt-10">Error: {error}</p>}
      {!isLoading && !error && recipes.length === 0 && (
        <EmptyState
          title="No hay recetas"
          description="Parece que no tienes recetas guardadas o ninguna coincide con tus filtros. ¡Intenta generar una o añade la tuya!"
          icon={<PlusCircle className="h-16 w-16 text-slate-400" />}
          action={
            <div className="flex gap-2">
              <Link to="/app/recipes/new">
                <Button>
                  <PlusCircle className="mr-2 h-4 w-4" /> Añadir Receta Manualmente
                </Button>
              </Link>
            </div>
          }
        />
      )}

      {!isLoading && !error && recipes.length > 0 && (
        <>
          {viewMode === 'card' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
              {recipes.map((recipe) => (
                <RecipeCard
                  key={recipe.id}
                  recipe={recipe}
                  onToggleFavorite={() => toggleFavorite(recipe.id)}
                  onDelete={() => deleteRecipe(recipe.id)}
                />
              ))}
            </div>
          ) : (
            // Usar el componente RecipeList real
            <RecipeList recipes={recipes} />
          )}

          {/* Botón Cargar Más */}
          {hasMore && (
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
        </>
      )}
    </div>
  );
};