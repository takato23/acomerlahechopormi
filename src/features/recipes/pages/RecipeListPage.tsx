// Core imports
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

// Icons
import {
  Filter,
  Sparkles,
  PlusCircle,
  ClipboardList,
  LayoutGrid,
  List,
  Home,
  AlertCircle,
  Loader2,
  Download,
  Plus
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
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { Sheet, SheetClose, SheetContent, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { AnimatedTabs } from '@/components/common/AnimatedTabs';
import { EmptyState } from '@/components/common/EmptyState';
import RecipeCard from '../components/RecipeCard';
import RecipeList from '../components/RecipeList';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// Types
import type { TabItem } from '@/components/common/AnimatedTabs';
import type { UserProfile } from '@/features/user/userTypes';
import type { PantryItem } from '@/features/pantry/types';
import { DEFAULT_USER_PREFERENCES } from '@/types/userPreferences';
import type { UserPreferences } from '@/types/userPreferences';
import { SuggestionRequest, RecipeSuggestion } from '@/features/suggestions/types';

// Stores & Services
import { useRecipeStore } from '@/stores/recipeStore';
import { useAuth } from '@/features/auth/AuthContext';
import { getUserProfile } from '@/features/user/userService';
import { getPantryItems } from '@/features/pantry/services/pantryService'; // Corregir ruta
import { getRecipes, addRecipe, updateRecipe, deleteRecipe, toggleRecipeFavorite, getRecipeById } from '../services/recipeService';
import { preferencesService } from '@/features/user/services/PreferencesService'; // Importar servicio de preferencias
import { debugLogger } from '@/lib/utils';
import { buildCreativePrompt } from '../generationService';
import { getSuggestions } from '@/features/suggestions/suggestionService';

// Inicialización del logger
// No crear una instancia de logger aquí, llamar directamente a debugLogger

// --- Definición local del tipo GeneratedRecipeData ---
interface GeneratedRecipeData {
  title: string;
  description: string | null;
  ingredients: Array<{ name: string; quantity: number | string | null; unit: string | null }>;
  instructions: string[];
  prepTimeMinutes: number | null;
  cookTimeMinutes: number | null;
  servings: number | null;
  tags?: string[] | null;
  // Añadir otros campos si son necesarios y devueltos por la API/parseo
}

// --- Helper Functions ---
const extractAndParseRecipe = (responseText: string): GeneratedRecipeData | null => { // Usar tipo local
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
           // Validación básica de la estructura de GeneratedRecipeData
           if (typeof parsedData.prepTimeMinutes === 'number' && typeof parsedData.cookTimeMinutes === 'number' && typeof parsedData.servings === 'number') {
             return parsedData as GeneratedRecipeData; // Usar tipo local
           }
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

interface RecipeListPageProps {}

// --- Component Principal ---
export const RecipeListPage: React.FC<RecipeListPageProps> = () => {
  // Hooks y contexto
  const navigate = useNavigate();
  const { user, session } = useAuth();

  // Estado global de recetas
  const {
    recipes,
    isLoading,
    error,
    loadRecipes,
    toggleFavorite,
    deleteRecipe,
    hasMore,
    filters,
    setFilters
  } = useRecipeStore();

  // Tags disponibles
  const availableTags = useMemo(() =>
    RECIPE_CATEGORIES
      .filter(category => category.id !== 'all')
      .map(category => category.name),
    []
  );

  // Estados derivados del store
  // Destructuring de filters con valores por defecto
  const {
    searchTerm = '',
    selectedIngredients = [],
    selectedTags = [],
    showOnlyFavorites = false,
    sortOption = 'created_at_desc',
    categoryId = null,
    viewMode = 'card',
    showOnlyPublic = false,
    quickRecipes = false
  } = filters;

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
  const [isGenerationDialogOpen, setIsGenerationDialogOpen] = useState(false); // Estado para el diálogo de generación

  // TODO: Obtener availableIngredients dinámicamente si es necesario, o desde config
  const availableIngredients = ['Pollo', 'Arroz', 'Tomate', 'Cebolla', 'Ajo', 'Pimiento', 'Carne Picada', 'Pasta'];

  const sortOptions = [
    { value: 'created_at_desc', label: 'Más recientes' },
    { value: 'created_at_asc', label: 'Más antiguas' },
    { value: 'title_asc', label: 'Título (A-Z)' },
    { value: 'title_desc', label: 'Título (Z-A)' },
  ];

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
      setFilters({
        ...filters,
        selectedIngredients: tempSelectedIngredients,
        selectedTags: tempSelectedTags
      });
      setIsFilterSheetOpen(false);
    }
  }, [user?.id, tempSelectedIngredients, tempSelectedTags, filters, setFilters, setIsFilterSheetOpen]);

  const handleClearFilters = useCallback(() => {
    setTempSelectedIngredients([]);
    setTempSelectedTags([]);
    if (user?.id) {
      setFilters({
        ...filters,
        selectedIngredients: [],
        selectedTags: []
      });
    }
  }, [user?.id, filters, setFilters]);

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
      if (!user?.id) return;

      debugLogger("[RecipeListPage] Loading recipes with current filters");
      await loadRecipes(user.id, true);
    };

    loadData();
  }, [user?.id, loadRecipes]);

  // --- Handlers para Generación y Sugerencia ---
  const handleGenerateRecipe = async () => {
    const usePantry = usePantryIngredients;
    if (!promptText.trim() && !usePantry) {
      setGenerationError("Introduce una descripción o marca 'Usar ingredientes de mi despensa'.");
      return;
    }
    if (!session || !user?.id) {
      setGenerationError("Debes iniciar sesión para generar recetas.");
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
      } catch (profileError) {
          console.warn("No se pudo obtener el perfil del usuario o la clave API del perfil:", profileError);
      }
      if (!apiKey) {
          apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      }
      if (!apiKey) {
        throw new Error('Clave API no disponible. Configúrala en tu perfil o en VITE_GEMINI_API_KEY.');
      }
      
      let userPreferences: UserPreferences;
      try {
        userPreferences = await preferencesService.getUserPreferences(user.id);
      } catch (prefError) {
        console.warn("Error obteniendo preferencias, usando defaults:", prefError);
        userPreferences = DEFAULT_USER_PREFERENCES;
      }
      
      let pantryIngredientNames: string[] | undefined = undefined;
      if (usePantry) {
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
      // const simplePrompt = `Genera una receta de cocina basada en: \"${promptText}\"${pantryIngredientNames ? ` usando principalmente: ${pantryIngredientNames.join(', ')}` : ''}. Formato JSON: { title, description, prepTimeMinutes, cookTimeMinutes, servings, ingredients: [{name, quantity, unit}], instructions }. Cantidades como números decimales.`;
      // const fullPrompt = simplePrompt;
      // Usar buildCreativePrompt para un prompt más robusto
      const fullPrompt = buildCreativePrompt(
        null, // No estamos adaptando una receta base aquí
        pantryIngredientNames || [], // Ingredientes de la despensa si se usan
        userPreferences, // Pasar las preferencias obtenidas
        promptText, // Usar la descripción del usuario como contexto
        undefined, // No especificamos MealType aquí
        null, // Sin modificador de estilo específico
        [] // Sin contexto de recetas previas
      );
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
      let recipeData: GeneratedRecipeData | null = null; // Usar tipo local
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
          // Validar estructura y tipos usando los nombres camelCase del tipo local GeneratedRecipeData
          if (!recipeData || typeof recipeData.title !== 'string' || !Array.isArray(recipeData.ingredients) || !Array.isArray(recipeData.instructions) || typeof recipeData.prepTimeMinutes !== 'number' || typeof recipeData.cookTimeMinutes !== 'number' || typeof recipeData.servings !== 'number') {
              console.error("JSON parseado pero con formato inválido o tipos incorrectos para GeneratedRecipeData:", recipeData);
              throw new Error("Formato JSON de receta inválido o incompleto.");
          }
           // Mapear y limpiar ingredientes usando recipeData.ingredients (camelCase)
          recipeData.ingredients = recipeData.ingredients
              .map((ing: GeneratedRecipeData['ingredients'][number]) => {
                  // Parsea la cantidad asegurándose de que sea number | null
                  let quantityValue: number | null = null;
                  if (typeof ing.quantity === 'number') {
                      quantityValue = ing.quantity;
                  } else if (typeof ing.quantity === 'string') {
                      const parsed = parseFloat(ing.quantity.replace(',', '.'));
                      if (!isNaN(parsed)) {
                          quantityValue = parsed;
                      }
                  }
                  // Asegurar que unit sea string | null
                  const unitValue = typeof ing.unit === 'string' ? ing.unit.trim() : null;
                  
                  return {
                      name: ing.name ?? 'Ingrediente desconocido',
                      quantity: quantityValue,
                      unit: unitValue,
                  };
              })
              .filter((ing: { name: string; quantity: number | null; unit: string | null }) =>
                  // Filtrar por nombre válido
                  ing.name !== 'Ingrediente desconocido' && ing.name.trim() !== ''
              );
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
      setGenerationError(null); // Limpiar error al cerrar
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
      console.log("Obteniendo ítems de la despensa para sugerencia...");
      const pantryItems = await getPantryItems(); // Obtener ítems primero
      if (!pantryItems || pantryItems.length === 0) {
        console.log("La despensa está vacía, no se puede sugerir.");
        toast.info("Tu despensa está vacía. Añade ingredientes para obtener sugerencias.");
        setSuggestionError("Despensa vacía.");
        setIsSuggesting(false);
        return;
      }
      console.log("Solicitando sugerencia de receta desde la despensa con", pantryItems.length, "items.");
      
      // Preparar el contexto para getSuggestions - asegurarnos de la compatibilidad de tipos
      const context: SuggestionRequest = {
        pantryItems: pantryItems
          .filter(item => item.ingredient?.name) // Solo incluir items con nombre
          .map(item => ({
            name: item.ingredient?.name || '', // Usar nombre del ingrediente
            quantity: item.quantity || 0,
            unit: item.unit || undefined // Convertir null a undefined
          })),
        mealType: 'Almuerzo'
      };
      
      // Obtener sugerencias
      const response = await getSuggestions(context);
      
      if (response.suggestions && response.suggestions.length > 0) {
        // Usar la primera sugerencia que esté basada en la despensa
        const pantrySuggestion = response.suggestions.find(s => 
          s.reason?.includes('despensa') || s.reason?.includes('ingredientes'));
          
        if (pantrySuggestion && pantrySuggestion.id) {
          // Navegar a la página de detalles si tiene un ID
          console.log("Receta sugerida encontrada, navegando a la receta:", pantrySuggestion);
          
          // Verificar primero si la receta existe
          try {
            const recipeExists = await getRecipeById(pantrySuggestion.id);
            if (recipeExists) {
              navigate(`/app/recipes/${pantrySuggestion.id}`);
            } else {
              throw new Error("Receta no encontrada");
            }
          } catch (error) {
            console.error("Error verificando receta:", error);
            toast.error("No se pudo encontrar la receta sugerida. Inténtalo de nuevo.");
            setSuggestionError("Receta no encontrada o error al obtenerla.");
          }
        } else {
          console.log("No se encontró una sugerencia con ID válido.");
          toast.info("No pudimos encontrar una sugerencia adecuada con tus ingredientes actuales.");
          setSuggestionError("No se encontró una receta con tus ingredientes.");
        }
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
      {/* --- Cabecera --- */}
      <header className="mb-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 border-b border-slate-200 pb-4">
          <h1 className="text-3xl md:text-4xl font-bold">Mis Recetas</h1>
          <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto">
            {/* --- Botón para Importar Recetas --- */}
            <Link to="/app/recipes/import">
              <Button variant="outline" className="w-full">
                <Download className="mr-2 h-4 w-4" /> Importar Recetas
              </Button>
            </Link>
            
            {/* --- Botón Generar desde Descripción (abre Dialog) --- */}
            <Dialog open={isGenerationDialogOpen} onOpenChange={setIsGenerationDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="default">
                  <Sparkles className="mr-2 h-4 w-4" /> Generar desde Descripción
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Generar Receta con IA</DialogTitle>
                  <DialogDescription>
                    Describe qué tipo de receta quieres o usa tus ingredientes de la despensa.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="recipe-prompt">Descripción de la Receta</Label>
                    <Textarea
                      id="recipe-prompt"
                      placeholder="Ej: 'Un postre rápido con chocolate y frutas' o 'Algo vegetariano para la cena'"
                      value={promptText}
                      onChange={(e) => setPromptText(e.target.value)}
                      rows={3}
                      disabled={isGenerating}
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="use-pantry"
                      checked={usePantryIngredients}
                      onCheckedChange={(checked) => setUsePantryIngredients(!!checked)} // Asegurar que sea boolean
                      disabled={isGenerating}
                    />
                    <Label htmlFor="use-pantry" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      Usar ingredientes de mi despensa
                    </Label>
                  </div>
                   {generationError && (
                     <Alert variant="destructive">
                       <AlertCircle className="h-4 w-4" />
                       <AlertTitle>Error de Generación</AlertTitle>
                       <AlertDescription>{generationError}</AlertDescription>
                     </Alert>
                   )}
                </div>
                <DialogFooter>
                  <DialogClose asChild>
                     <Button variant="outline" disabled={isGenerating}>Cancelar</Button>
                  </DialogClose>
                  <Button
                    onClick={handleGenerateRecipe}
                    disabled={isGenerating || (!promptText.trim() && !usePantryIngredients)}
                  >
                    {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Generar Receta
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* --- Botón Sugerir desde Despensa --- */}
            <Button
              onClick={handleSuggestFromPantry}
              disabled={isSuggesting}
              variant="secondary"
            >
              {isSuggesting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ClipboardList className="mr-2 h-4 w-4" />}
              Sugerir desde Despensa
            </Button>
            <a
              className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2"
              href="/app/recipes/new"
            >
              <PlusCircle className="mr-2 h-4 w-4" /> Añadir Manualmente
            </a>
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
              if (user?.id) {
                setFilters({ ...filters, searchTerm: e.target.value });
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
              onCheckedChange={() => user?.id && setFilters({ ...filters, showOnlyFavorites: !showOnlyFavorites })}
            />
            <Label htmlFor="favorite-filter">Solo Favoritos</Label>
          </div>

          {/* Select Ordenamiento */}
          <div className="w-full sm:w-auto">
            <Select
              value={filters.sortOption || 'created_at_desc'}
              onValueChange={(value) => {
                if (user?.id) {
                  setFilters({ ...filters, sortOption: value });
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

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="favorites"
                    checked={showOnlyFavorites}
                    onCheckedChange={(checked) => {
                      setFilters({ showOnlyFavorites: !!checked });
                    }}
                  />
                  <label htmlFor="favorites">Solo favoritas</label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="publics"
                    checked={filters.showOnlyPublic || false}
                    onCheckedChange={(checked) => {
                      setFilters({ showOnlyPublic: !!checked });
                    }}
                  />
                  <label htmlFor="publics">Solo recetas públicas</label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="quick"
                    checked={filters.quickRecipes || false}
                    onCheckedChange={(checked) => {
                      setFilters({ quickRecipes: !!checked });
                    }}
                  />
                  <label htmlFor="quick">Recetas rápidas (menos de 30 min)</label>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="sort">Ordenar por</Label>
                  <Select
                    value={sortOption}
                    onValueChange={(value) => {
                      setFilters({ sortOption: value });
                    }}
                  >
                    {sortOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </Select>
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
          <ViewModeSwitch
            currentMode={filters.viewMode || 'card'}
            onChange={(mode) => setFilters({ ...filters, viewMode: mode })}
          />
        </div>
      </div>

      {/* Tabs de Categorías */}
      <div className="mb-6 flex justify-center relative">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-400/15 via-pink-400/10 to-blue-400/15 backdrop-blur-md rounded-xl shadow-lg ring-1 ring-white/10 -z-10" />
        <div className="w-full max-w-4xl px-4">
          {isLoading ? (
            <div className="flex justify-center items-center h-10">
              <Spinner size="sm" className="text-purple-500" />
            </div>
          ) : (
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
              activeTabIds={filters.categoryId ? [filters.categoryId] : ['all']}
              onChange={(ids) => {
                const selectedId = ids[0] || 'all';
                if (user?.id) {
                  setFilters({
                    ...filters,
                    categoryId: selectedId === 'all' ? null : selectedId
                  });
                }
              }}
              className="max-w-xl px-6 py-3.5 rounded-xl bg-white/5 backdrop-blur-md hover:bg-white/10 transition-all duration-300 shadow-md"
            />
          )}
        </div>
      </div>

      {/* Contenido Principal */}
      {isLoading && (
         <div className="flex justify-center mt-10">
           <Spinner size="lg" />
         </div>
       )}
      {!isLoading && error && (
        <p className="text-red-500 text-center mt-10">
          Error: {error instanceof Error ? error.message : String(error)}
        </p>
      )}
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
          {(filters.viewMode || 'card') === 'card' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
              {recipes.map((recipe) => (
                <RecipeCard
                  key={recipe.id}
                  recipe={recipe}
                  onToggleFavorite={() => toggleFavorite(recipe.id, !recipe.is_favorite)}
                  onDelete={() => deleteRecipe(recipe.id)}
                />
              ))}
            </div>
          ) : (
            <RecipeList
              recipes={recipes}
              onToggleFavorite={(id, isFavorite) => toggleFavorite(id, isFavorite)}
              onDelete={(id) => deleteRecipe(id)}
            />
          )}

          {/* Botón Cargar Más */}
          {hasMore && (
            <div className="flex justify-center mt-8">
              <Button
                onClick={() => user?.id && loadRecipes(user.id, false)} // false para no resetear
                disabled={isLoading}
                variant="outline"
              >
                {isLoading ? <Spinner size="sm" className="mr-2" /> : null}
                Cargar más recetas
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
};