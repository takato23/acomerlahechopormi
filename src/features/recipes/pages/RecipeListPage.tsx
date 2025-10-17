// Core imports
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { notifyError, notifyInfo } from '@/lib/notifications';

// Icons
import {
  Filter,
  Sparkles,
  PlusCircle,
  ClipboardList,
  LayoutGrid,
  List,
  Home
} from 'lucide-react';

// Recipe Categories & Icons
import {
  RECIPE_CATEGORIES,
  getCategoryIcon
} from '@/config/recipeTags';
import type { RecipeCategory } from '@/config/recipeTags';

// UI Components
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/Spinner';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Sheet, SheetClose, SheetContent, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { AnimatedTabs } from '@/components/common/AnimatedTabs';
import { EmptyState } from '@/components/common/EmptyState';
import RecipeCard from '../components/RecipeCard';
import RecipeList from '../components/RecipeList';
import { RecipeListSkeleton } from '../components/RecipeListSkeleton';

// Types
import type { TabItem } from '@/components/common/AnimatedTabs';
import type { GeneratedRecipeData } from '@/types/recipeTypes';
import type { UserProfile } from '@/features/user/userTypes';
import type { PantryItem } from '@/features/pantry/types';

// Stores & Services
import { useRecipeStore } from '@/stores/recipeStore';
import { useAuth } from '@/features/auth/AuthContext';
import { getUserProfile } from '@/features/user/userService';
import { getPantryItems } from '@/features/pantry/pantryService';
import { suggestSingleRecipeFromPantry } from '../generationService';
import { debugLogger } from '@/lib/utils';

// Inicialización del logger
const debugLog = debugLogger('[RecipeListPage]');

const resolveGeminiEnvKey = () => {
  if (typeof process !== 'undefined' && process.env?.VITE_GEMINI_API_KEY) {
    return process.env.VITE_GEMINI_API_KEY;
  }
  try {
    // eslint-disable-next-line no-eval
    return eval('import.meta.env?.VITE_GEMINI_API_KEY');
  } catch {
    return undefined;
  }
};

// --- Helper Functions ---
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
  prompt += "Formatea la respuesta completa como un único objeto JSON válido contenido dentro de un bloque de código JSON (```json ... ```). El objeto JSON debe tener las siguientes claves: 'title' (string), 'description' (string), 'prepTimeMinutes' (number), 'cookTimeMinutes' (number), 'servings' (number), 'ingredients' (array of objects with 'quantity' (número decimal, sin fracciones como 1/2), 'unit' (string, puede ser null o vacío), 'name' (string)), y 'instructions' (array of strings). Importante: las cantidades deben ser números decimales (ej: 0.5 en lugar de 1/2).";
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
          (ing: any) => typeof ing.name === 'string'
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
  // Hooks y contexto
  const navigate = useNavigate();
  const { user, session } = useAuth();

  // Estado global de recetas
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
    viewMode,
    availableTags,
    setViewMode,
    clearTagFilters,
    categories, // Usamos las categorías del store si están disponibles
    selectedCategoryId,
    isLoadingCategories,
    fetchCategories,
    setSelectedCategory,
    maxTotalTimeMinutes,
    setMaxTotalTimeMinutes,
  } = useRecipeStore();

  // Estados locales para la UI
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [promptText, setPromptText] = useState('');
  const [usePantryIngredients, setUsePantryIngredients] = useState(false);
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

  const timeFilterOptions = useMemo(() => (
    [
      { value: 'all', label: 'Sin límite' },
      { value: '15', label: '≤ 15 min' },
      { value: '30', label: '≤ 30 min' },
      { value: '45', label: '≤ 45 min' },
      { value: '60', label: '≤ 60 min' },
      { value: '90', label: '≤ 90 min' },
      { value: '120', label: '≤ 120 min' }
    ]
  ), []);

  const handleTimeFilterChange = useCallback((value: string) => {
    if (!user?.id) return;
    if (value === 'all') {
      setMaxTotalTimeMinutes(null, user.id);
      return;
    }
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed < 0) {
      setMaxTotalTimeMinutes(null, user.id);
      return;
    }
    setMaxTotalTimeMinutes(parsed, user.id);
  }, [setMaxTotalTimeMinutes, user?.id]);

  const handleDialogOpenChange = useCallback((open: boolean) => {
    setIsDialogOpen(open);
    if (!open) {
      setGenerationError(null);
      if (!isGenerating) {
        setPromptText('');
        setUsePantryIngredients(false);
      }
    }
  }, [isGenerating, setGenerationError, setPromptText, setUsePantryIngredients]);

  const timeFilterValue = maxTotalTimeMinutes != null ? String(maxTotalTimeMinutes) : 'all';

  // --- Funciones para manejar el Sheet de Filtros ---
  const handleIngredientChange = useCallback((ingredient: string, checked: boolean) => {
    setTempSelectedIngredients(prev =>
      checked
        ? [...prev, ingredient]
        : prev.filter(item => item !== ingredient)
    );
  }, []);

  const handleTagChange = useCallback((tag: string, checked: boolean) => {
    setTempSelectedTags(prev =>
      checked
        ? [...prev, tag]
        : prev.filter(item => item !== tag)
    );
  }, []);

  const handleApplyFilters = useCallback(() => {
    if (user?.id) {
      setSelectedIngredients(tempSelectedIngredients, user.id);
      setSelectedTags(tempSelectedTags, user.id);
      setIsFilterSheetOpen(false);
    }
  }, [user?.id, tempSelectedIngredients, tempSelectedTags, setSelectedIngredients, setSelectedTags, setIsFilterSheetOpen]);

  const handleClearFilters = useCallback(() => {
    setTempSelectedIngredients([]);
    setTempSelectedTags([]);
    if (user?.id) {
      setSelectedIngredients([], user.id);
      clearTagFilters(user.id);
    }
  }, [user?.id, setSelectedIngredients, clearTagFilters, setTempSelectedIngredients, setTempSelectedTags]);

  // Sincronizar estado temporal con el global
  useEffect(() => {
    if (isFilterSheetOpen) {
      setTempSelectedIngredients(selectedIngredients);
      setTempSelectedTags(selectedTags);
    }
  }, [isFilterSheetOpen, selectedIngredients, selectedTags, setTempSelectedIngredients, setTempSelectedTags]);

  // Efecto para carga inicial y actualización de datos
  useEffect(() => {
    const loadData = async () => {
      debugLog("Initial load triggered", {
        userId: user?.id,
        hasCategories: categories?.length > 0,
        selectedCategoryId
      });

      if (!user?.id) return;

      // Cargar categorías si es necesario (usando las del store)
      if (!categories?.length) {
        debugLog("Fetching categories...");
        await fetchCategories();
      }

      // Cargar recetas con filtros actuales
      debugLog("Fetching recipes with filters", {
        searchTerm,
        showOnlyFavorites,
        sortOption,
        selectedIngredients,
        selectedTags,
        selectedCategoryId,
        maxTotalTimeMinutes
      });

      fetchRecipes({
        userId: user.id,
        filters: {
          searchTerm,
          showOnlyFavorites,
          sortOption,
          selectedIngredients,
          selectedTags,
          categoryId: selectedCategoryId,
          maxTotalTimeMinutes
        },
        page: 1,
        reset: true
      });
    };

    loadData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, fetchRecipes, selectedCategoryId]);

  // --- Handlers para Generación y Sugerencia ---
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
          apiKey = resolveGeminiEnvKey();
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
      notifyError('Iniciá sesión para obtener sugerencias.');
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
        notifyInfo("No pudimos generar una sugerencia con tus ingredientes actuales.");
        setSuggestionError("No se pudo generar una sugerencia con los ingredientes de tu despensa.");
      }
    } catch (error: any) {
      console.error("Error al sugerir receta desde la despensa:", error);
      const errorMessage = error.message || 'Ocurrió un error inesperado al obtener la sugerencia.';
      setSuggestionError(errorMessage);
      notifyError(`No pudimos obtener una sugerencia: ${errorMessage}`);
    } finally {
      setIsSuggesting(false);
    }
  };

  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8">
      {/* --- Cabecera --- */}
      <header className="mb-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 border-b border-slate-200 pb-4">
          <h1 className="text-3xl md:text-4xl font-bold">Mis Recetas</h1>
          <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto">
            <Dialog open={isDialogOpen} onOpenChange={handleDialogOpenChange}>
              <DialogTrigger asChild>
                <Button className="w-full md:w-auto" type="button">
                  <Sparkles className="mr-2 h-4 w-4" /> Generar desde Descripción
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                  <DialogTitle>Generar receta</DialogTitle>
                  <DialogDescription>
                    Describe la receta que quieres crear y decide si quieres usar tus ingredientes de la despensa.
                  </DialogDescription>
                </DialogHeader>
                <form
                  onSubmit={(event) => {
                    event.preventDefault();
                    handleGenerateRecipe();
                  }}
                  className="space-y-4"
                >
                  <div className="space-y-2">
                    <Label htmlFor="generationPrompt">Descripción</Label>
                    <Textarea
                      id="generationPrompt"
                      value={promptText}
                      onChange={(event) => {
                        setPromptText(event.target.value);
                        if (generationError) {
                          setGenerationError(null);
                        }
                      }}
                      placeholder="Ej: Quiero una cena rápida con pollo y verduras..."
                      rows={4}
                    />
                  </div>
                  <div className="flex items-center justify-between rounded-md border border-slate-200 px-3 py-2">
                    <div className="flex items-center gap-2">
                      <Switch
                        id="usePantrySwitch"
                        checked={usePantryIngredients}
                        onCheckedChange={(checked) => {
                          setUsePantryIngredients(!!checked);
                          if (generationError) {
                            setGenerationError(null);
                          }
                        }}
                      />
                      <Label htmlFor="usePantrySwitch">Usar ingredientes de mi despensa</Label>
                    </div>
                  </div>
                  {generationError && (
                    <p className="text-sm text-red-500">{generationError}</p>
                  )}
                  <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => handleDialogOpenChange(false)}
                      disabled={isGenerating}
                    >
                      Cancelar
                    </Button>
                    <Button type="submit" disabled={isGenerating}>
                      {isGenerating ? <Spinner size="sm" className="mr-2" /> : <Sparkles className="mr-2 h-4 w-4" />}
                      Generar receta
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
            <div className="flex flex-col gap-1 w-full md:w-auto">
              <Button
                variant="secondary"
                className="w-full md:w-auto"
                onClick={handleSuggestFromPantry}
                disabled={isSuggesting}
              >
                {isSuggesting ? <Spinner size="sm" className="mr-2" /> : <ClipboardList className="mr-2 h-4 w-4" />}
                Sugerir desde Despensa
              </Button>
              {suggestionError && !isSuggesting && (
                <span className="text-xs text-red-500 text-left">{suggestionError}</span>
              )}
            </div>
            <Button asChild variant="outline" className="w-full md:w-auto">
              <Link to="/app/recipes/new" className="flex w-full items-center justify-center gap-2">
                <PlusCircle className="h-4 w-4" /> Añadir Manualmente
              </Link>
            </Button>
          </div>
        </div>
      </header>

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

          {/* Filtro por tiempo total */}
          <div className="w-full sm:w-auto">
            <Select value={timeFilterValue} onValueChange={handleTimeFilterChange}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Tiempo total" />
              </SelectTrigger>
              <SelectContent>
                {timeFilterOptions.map((option) => (
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
          <ViewModeSwitch currentMode={viewMode} onChange={setViewMode} />
        </div>
      </div>

      {/* Tabs de Categorías */}
      <div className="mb-6 flex justify-center relative">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-400/15 via-pink-400/10 to-blue-400/15 backdrop-blur-md rounded-xl shadow-lg ring-1 ring-white/10 -z-10" />
        <div className="w-full max-w-4xl px-4">
          {isLoadingCategories ? (
            <div className="flex justify-center items-center h-10">
              <Spinner size="sm" className="text-purple-500" />
            </div>
          ) : (
            <>
              {/* Debug info */}
              {process.env.NODE_ENV === 'development' && (
                <div className="text-xs text-slate-400 mb-2">
                  Categories: {categories?.length || 0} | Selected: {selectedCategoryId || 'all'}
                </div>
              )}
              <AnimatedTabs
                tabs={[
                  { id: 'all', label: 'Todas', icon: React.createElement(Home, { className: "w-3.5 h-3.5" }) },
                  ...RECIPE_CATEGORIES
                    .filter((category: RecipeCategory) => category.id !== 'all')
                    .map((category: RecipeCategory) => ({
                      id: category.id,
                      label: category.name,
                      icon: getCategoryIcon(category.id)
                    }))
                ]}
                activeTabIds={selectedCategoryId ? [selectedCategoryId] : ['all']}
                onChange={(ids) => {
                  const selectedId = ids[0] || 'all';
                  console.log("[RecipeListPage] Category changed:", selectedId);
                  if (user?.id) {
                    setSelectedCategory(selectedId === 'all' ? null : selectedId, user.id);
                  }
                }}
                className="max-w-xl px-6 py-3.5 rounded-xl bg-white/5 backdrop-blur-md hover:bg-white/10 transition-all duration-300 shadow-md"
              />
            </>
          )}
        </div>
      </div>

      {/* Contenido Principal */}
      {isLoading && recipes.length === 0 && (
        <RecipeListSkeleton />
      )}
      {isLoading && recipes.length > 0 && (
        <div className="flex justify-center mt-10">
          <Spinner size="lg" />
        </div>
      )}
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
