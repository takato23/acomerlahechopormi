import React, { useCallback, useEffect, useState, useMemo, useRef } from 'react';
import { useAuth } from '@/features/auth/AuthContext'; // Importar useAuth
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/Spinner';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { PriceResultsDisplay } from './components/PriceResultsDisplay'; // Recuperado
import { SearchPanel } from './components/SearchPanel/SearchPanel'; // Recuperado
import { ShoppingMap } from './components/Map/ShoppingMap'; // Recuperado
import { FavoriteStoresInfo } from './components/Map/FavoriteStoresInfo'; // Recuperado
import { searchProducts, BuscaPreciosProduct, SearchProductsResult } from './services/buscaPreciosService'; // Recuperado y añadido SearchProductsResult
import { preciosClarosService } from './services/preciosClarosService'; // Recuperado
import { toast } from 'sonner'; // Asegurar que esté
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"; // Recuperado
import { Package } from 'lucide-react'; // Recuperado para Accordion
import useBreakpoint from '@/hooks/useBreakpoint'; // Recuperado
import { DesktopLayout } from './components/Layout/DesktopLayout'; // Recuperado
import { TabletLayout } from './components/Layout/TabletLayout'; // Recuperado
import { MobileLayout } from './components/Layout/MobileLayout'; // Recuperado
import { Checkbox } from '@/components/ui/checkbox'; // Para marcar items
import { AddItemForm } from './components/AddItemForm'; // Recuperado
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'; // Añadir CardFooter
import type { ShoppingListItem as UIShoppingListItem } from './types'; // Renombrar para claridad (UI vs DB)
import type { Category } from '@/features/pantry/types'; // Importar Category de pantry
import { generateShoppingList } from './shoppingListService'; // Servicio para generar
import { useShoppingListStore } from '@/stores/shoppingListStore'; // Importar store
import type { Database } from '@/lib/database.types'; // Importar tipos DB
import { format, startOfWeek, endOfWeek } from 'date-fns';
import { es } from 'date-fns/locale';
import { ListChecks, Terminal, Trash2, XCircle, Search } from 'lucide-react'; // Añadir icono Search
import { parseShoppingInput, ParsedShoppingInput } from './lib/inputParser'; // Importar parser
import { supabase } from '@/lib/supabaseClient'; // Importar supabase directamente
import ResponsiveLayout from './components/Layout/ResponsiveLayout'; // IMPORTAR RESPONSIVE LAYOUT
import { getDisplayCategory } from './utils/categorization'; // Importar la función de display
// --- NUEVO: Importar componentes de Tabs ---
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from '@/lib/utils'; // Importar la función de utilidades

// --- ANALYTICS HELPER ---
// Función para categorizar el número de resultados (Paso 2.2)
const calculateBucket = (count: number): string => {
  if (count === 0) return '0';
  if (count <= 5) return '1-5';
  return '6+';
};

// Placeholder para la función de tracking - ¡Reemplazar con tu implementación real!
const trackEvent = (eventName: string, properties?: object) => {
  console.log(`[Analytics] Event: ${eventName}`, properties || '');
  // Ejemplo: window.analytics.track(eventName, properties);
  // Ejemplo: posthog.capture(eventName, properties);
};
// --- FIN ANALYTICS HELPER ---

// Tipos DB
type DBShoppingListItemInsert = Database['public']['Tables']['shopping_list_items']['Insert'];
type DBShoppingListItemUpdate = Database['public']['Tables']['shopping_list_items']['Update'];

// AÑADIR tipo Category Row
type CategoryRow = Database['public']['Tables']['categories']['Row'];

// Tipo para la estructura agrupada
type GroupedShoppingListItems = { [category: string]: Database['public']['Tables']['shopping_list_items']['Row'][] };

export function ShoppingListPage() {
  // Usar estado del store
  const {
    items: listItems, // Renombrar para mantener consistencia en el componente
    isLoading,
    error,
    fetchItems,
    addItem: addItemToStore, // Renombrar para evitar conflicto
    updateItem,
    deleteItem,
    clearPurchased,
    clearAll
  } = useShoppingListStore();

  // Estado local solo para el rango generado y UI de búsqueda de precios
  const [generatedRange, setGeneratedRange] = useState<{ start: string; end: string } | null>(null);
  const [isAddingItem, setIsAddingItem] = useState(false); // Estado local para el formulario de añadir

  // Obtener semana actual como rango por defecto
  const today = new Date();
  const weekStart = startOfWeek(today, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(today, { weekStartsOn: 1 });
  // Estados recuperados para buscador y mapa
  const [categories, setCategories] = useState<Category[]>([]); // Estado para categorías
  const [isLoadingCategories, setIsLoadingCategories] = useState(true); // Estado de carga para categorías
  const [priceResults, setPriceResults] = useState<BuscaPreciosProduct[] | null>(null);
  const [itemForPriceSearch, setItemForPriceSearch] = useState<string | null>(null);
  const [isSearchingPrices, setIsSearchingPrices] = useState(false);
  const [favoriteStoreIds, setFavoriteStoreIds] = useState<Set<string>>(new Set());
  const [forceShowMap, setForceShowMap] = useState(false);
  const breakpoint = useBreakpoint(); // Recuperado
  const [searchTerm, setSearchTerm] = useState(''); // <-- Paso 1.2: Añadir estado para la búsqueda
  const [selectedStoreName, setSelectedStoreName] = useState<string | null>(null); // <-- NUEVO ESTADO
  const prevSearchTermRef = useRef(''); // <-- Ref para tracking (Paso 2.2)
  const [storeFilter, setStoreFilter] = useState<string>('all'); // <-- ESTADO PARA FILTRO DE TIENDAS
  const [availableCategories, setAvailableCategories] = useState<CategoryRow[]>([]); // <-- NUEVO ESTADO para categorías
  const [isLoadingAvailCategories, setIsLoadingAvailCategories] = useState(true); // <-- NUEVO ESTADO de carga

   // Obtener user para pasar ID a generateShoppingList
   const { user } = useAuth(); // Asumiendo que useAuth está disponible

  // --- Lógica de Filtrado (Paso 1.2) ---
  const filteredListItems = useMemo(() => {
    const lowerCaseSearchTerm = searchTerm.toLowerCase();
    if (!lowerCaseSearchTerm) {
      return listItems; // Si no hay búsqueda, devolver todos los items
    }

    // Lógica simple para plurales (Paso 1.4)
    let searchTermSingular = lowerCaseSearchTerm;
    let searchTermPlural = lowerCaseSearchTerm;
    if (lowerCaseSearchTerm.endsWith('s')) {
      searchTermSingular = lowerCaseSearchTerm.slice(0, -1);
    } else {
      searchTermPlural = lowerCaseSearchTerm + 's';
    }

    return listItems.filter(item => {
      const lowerCaseItemName = item.ingredient_name?.toLowerCase();
      if (!lowerCaseItemName) return false;

      // Comprobar término original, singular y plural
      return lowerCaseItemName.includes(lowerCaseSearchTerm) ||
             lowerCaseItemName.includes(searchTermSingular) ||
             lowerCaseItemName.includes(searchTermPlural);
    });
  }, [listItems, searchTerm]);
  // --- Fin Lógica de Filtrado ---

  // --- NUEVO: Agrupar ítems filtrados por categoría ---
  const groupedAndSortedItems = useMemo(() => {
    const grouped: GroupedShoppingListItems = filteredListItems.reduce((acc, item) => {
      // Usar 'Sin Categoría' si category es null, undefined o vacío
      const category = item.category || 'Sin Categoría'; 
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(item);
      return acc;
    }, {} as GroupedShoppingListItems);

    // Ordenar ítems dentro de cada categoría (opcional, pero bueno)
    Object.keys(grouped).forEach(category => {
      grouped[category].sort((a, b) => {
        if (a.is_checked !== b.is_checked) return a.is_checked ? 1 : -1; // No comprados primero
        return (a.ingredient_name ?? '').localeCompare(b.ingredient_name ?? ''); // Luego alfabéticamente
      });
    });

    // Ordenar las categorías (opcional, poner 'Sin Categoría' al final?)
    const sortedCategories = Object.keys(grouped).sort((a, b) => {
      if (a === 'Sin Categoría') return 1; // Mover Sin Categoría al final
      if (b === 'Sin Categoría') return -1;
      return a.localeCompare(b); // Ordenar alfabéticamente las demás
    });

    // Crear un objeto ordenado para facilitar el mapeo
    const orderedGrouped: GroupedShoppingListItems = {};
    sortedCategories.forEach(cat => {
        orderedGrouped[cat] = grouped[cat];
    });

    return orderedGrouped;
  }, [filteredListItems]); // Depende de los ítems ya filtrados
  // --- FIN Agrupación ---

  // --- Tracking de Eventos (Paso 2.2) ---
  useEffect(() => {
    // Track 'search_initiated' cuando searchTerm pasa de vacío a no-vacío
    if (!prevSearchTermRef.current && searchTerm) {
      trackEvent('search_initiated');
    }
    // Actualizar el valor previo para la próxima comparación
    prevSearchTermRef.current = searchTerm;
  }, [searchTerm]);

  useEffect(() => {
    // Track 'search_results_found' cuando la lista filtrada cambia Y hay un término de búsqueda activo
    if (searchTerm) { // Solo trackear si la búsqueda está activa
      const bucket = calculateBucket(filteredListItems.length);
      trackEvent('search_results_found', { resultCountBucket: bucket });
    }
    // Nota: No incluimos searchTerm en las dependencias aquí para evitar
    // trackear resultados cuando la lista base (listItems) cambia pero la búsqueda no.
    // Solo queremos trackear cuando los *resultados filtrados* cambian debido a la búsqueda.
    // Si listItems cambia Y hay un searchTerm, filteredListItems se recalculará
    // y este efecto se disparará igualmente gracias a la dependencia de filteredListItems.
  }, [filteredListItems/*, searchTerm*/]); // Dejamos searchTerm comentado aquí intencionalmente
  // --- Fin Tracking de Eventos ---

  const handleGenerateList = useCallback(async () => {
    if (!user?.id) {
      toast.error("Debes iniciar sesión para generar la lista.");
      return;
    }
    // El estado isLoading y error ahora vienen del store
    // set({ isLoading: true, error: null }); // Ya no se usa estado local
    setGeneratedRange(null); // Limpiar rango anterior

    const startDateStr = format(weekStart, 'yyyy-MM-dd');
    const endDateStr = format(weekEnd, 'yyyy-MM-dd');

    try {
      // Llamar a generateShoppingList (que ahora guarda en DB)
      await generateShoppingList(startDateStr, endDateStr, user.id); // Pasar userId
      // Refrescar la lista desde la DB usando el store
      await fetchItems();
      setGeneratedRange({ start: startDateStr, end: endDateStr });
      toast.success("Lista de compras generada y guardada.");
    } catch (err: any) {
      console.error("Error generating shopping list:", err);
      toast.error(err.message || "Error inesperado al generar la lista.");
      // El error se maneja en el store, no necesitamos setError local
    }
    // isLoading se maneja en el store
  }, [weekStart, weekEnd, user, fetchItems]); // Añadir dependencias
// Actualizar para usar updateItem del store con is_purchased
const handleToggleItem = useCallback(async (itemId: string, currentStatus: boolean) => {
  try {
    await updateItem(itemId, { is_checked: !currentStatus });
    // El store ya actualiza el estado optimisticamente, no necesitamos setListItems
    // Opcional: mostrar toast de éxito
  } catch (error) {
    console.error("Error toggling item status:", error);
    toast.error("Error al actualizar el estado del ítem.");
    // El store debería revertir el cambio optimista en caso de error
  }
}, [updateItem]); // Añadir dependencia

  const formatRange = (range: { start: string; end: string } | null): string => {
    if (!range) return '';
    // Parsear y formatear fechas para mostrarlas amigablemente
    try {
        const start = new Date(range.start + 'T00:00:00'); // Asumir zona horaria local
        const end = new Date(range.end + 'T00:00:00');
        return `para la semana del ${format(start, 'd MMM', { locale: es })} al ${format(end, 'd MMM yyyy', { locale: es })}`;
    } catch {
        return `para ${range.start} a ${range.end}`; // Fallback
    }
  };


  // Función para añadir ítem directamente a Supabase (MODIFICADA)
  const handleAddItemSubmit = useCallback(async (
    // Ajustar tipo para incluir categoryId opcional
    parsedItem: ParsedShoppingInput & { categoryId?: string | null }
  ): Promise<boolean> => { 
    const itemName = parsedItem.name;
    if (!itemName) {
      toast.error("No se pudo identificar el nombre del ítem.");
      return false;
    }

    if (!user?.id) {
      toast.error("Debes iniciar sesión para añadir ítems.");
      return false;
    }

    setIsAddingItem(true); 

    try {
      // Usar addItem del store que maneja API/Edge fallback
      const newItem = await addItemToStore({
        ingredient_name: itemName.trim(),
        quantity: parsedItem.quantity,
        unit: parsedItem.unit,
        category: parsedItem.categoryId // <-- CAMBIAR A 'category'
      });

      if (newItem) {
        toast.success(`"${itemName}" añadido a la lista.`);
        setIsAddingItem(false); 
        return true; 
      } else {
        toast.error(`Error al añadir "${itemName}".`);
        setIsAddingItem(false); 
        return false; 
      }

    } catch (error) {
      console.error("Error inesperado al añadir:", error);
      toast.error(`Error inesperado al añadir "${itemName}".`);
      setIsAddingItem(false);
      return false; 
    }
  }, [user, addItemToStore]);

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    // El tracking de 'search_initiated' se hace en el useEffect basado en el cambio de estado
  };

  // Handler para seleccionar/deseleccionar tienda favorita (Recuperado)
  const handleToggleFavoriteStore = (storeId: string) => {
    setFavoriteStoreIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(storeId)) {
        newSet.delete(storeId);
        toast.info("Tienda quitada de favoritos.");
      } else {
        newSet.add(storeId);
        toast.success("Tienda añadida a favoritos.");
      }
      // TODO: Guardar en localStorage o backend si se necesita persistencia
      console.log("Favorite stores:", Array.from(newSet)); // Log para verificar
      return newSet;
    });
  };

  // NUEVO Handler para seleccionar tienda desde el acordeón de precios
  const handleStoreSelect = (storeName: string | null) => {
    console.log("Store selected/deselected:", storeName);
    setSelectedStoreName(storeName);
    // Opcionalmente, forzar mostrar el mapa si estaba oculto
    if (storeName && !shouldShowFullMap) {
        // setForceShowMap(true); // Decidiremos esto luego
    }
  };

  // Determinar si mostrar el mapa completo o la info de favoritos (Recuperado)
  const shouldShowFullMap = favoriteStoreIds.size === 0 || forceShowMap;
  const mapContent = shouldShowFullMap
    ? <ShoppingMap
        onToggleFavorite={handleToggleFavoriteStore}
        favoriteStoreIds={favoriteStoreIds}
      />
    : <FavoriteStoresInfo
        count={favoriteStoreIds.size}
        onShowMapClick={() => setForceShowMap(true)}
      />;

  // --- Funciones movidas aquí dentro del componente ---

  // Handler para buscar precios de un ítem individual
  const handleSearchItemPrice = useCallback(async (item: Database['public']['Tables']['shopping_list_items']['Row']) => {
    if (!item.ingredient_name) return;
    
    console.log(`Buscando precios para: ${item.ingredient_name}`);
    setIsSearchingPrices(true);
    setPriceResults(null);
    setItemForPriceSearch(item.ingredient_name);
    
    try {
      const result = await searchProducts(item.ingredient_name);
      if (!result.error) {
        setPriceResults(result.products);
        if (result.products.length > 0) {
          toast.success(`Precios encontrados para "${item.ingredient_name}".`);
        } else {
          toast.info(`No se encontraron precios online para "${item.ingredient_name}".`);
        }
      } else {
        console.error(`Error buscando precios para ${item.ingredient_name}:`, result.originalError);
        toast.error(`Error al buscar precios para "${item.ingredient_name}".`);
        setPriceResults([]);
      }
    } catch (err) {
        console.error("Error inesperado en handleSearchItemPrice:", err);
        toast.error("Error inesperado al buscar precios.");
        setPriceResults([]);
    } finally {
      setIsSearchingPrices(false);
    }
  }, []);

  // Handler para buscar precios de todos los items
  const handleSearchAllPrices = useCallback(async () => {
    if (listItems.length === 0) {
      toast.info("No hay ítems en la lista para buscar precios.");
      return;
    }

    setIsSearchingPrices(true);
    setPriceResults(null);
    setItemForPriceSearch('Todos los ítems');
    const allResults: BuscaPreciosProduct[] = [];
    let errorCount = 0;

    toast.info(`Buscando precios para ${listItems.length} ítems...`);

    // Usar Promise.allSettled para manejar errores individuales
    const searchPromises = listItems.map(item =>
      searchProducts(item.ingredient_name).then(result => ({ item, result }))
    );

    const settledResults = await Promise.allSettled(searchPromises);

    settledResults.forEach(settledResult => {
      if (settledResult.status === 'fulfilled') {
        const { item, result } = settledResult.value;
        if (!result.error) {
          // Añadir resultados encontrados, quizás filtrando por relevancia?
          // Por ahora, añadimos todos los encontrados para ese nombre
          allResults.push(...result.products);
        } else {
          console.warn(`Error buscando precios para ${item.ingredient_name}:`, result.originalError);
          errorCount++;
        }
      } else {
        // Error en la promesa misma (raro con .then dentro)
        console.error("Error inesperado en Promise.allSettled:", settledResult.reason);
        errorCount++;
      }
    });

    setPriceResults(allResults);
    setIsSearchingPrices(false);

    if (errorCount > 0) {
      toast.error(`Hubo errores al buscar precios para ${errorCount} ítems.`);
    } else if (allResults.length === 0) {
      toast.info("No se encontraron precios para ningún ítem de la lista.");
    } else {
      toast.success(`Precios encontrados para ${listItems.length - errorCount} ítems.`);
    }

  }, [listItems]);

  // Cargar items y CATEGORÍAS desde el store/DB al montar
  useEffect(() => {
    console.log("--- Fetching shopping list items on mount ---");
    fetchItems();

    // Cargar categorías disponibles
    const fetchCategories = async () => {
      console.log("--- Fetching available categories on mount ---");
      setIsLoadingAvailCategories(true);
      try {
        const { data, error } = await supabase
          .from('categories')
          .select('*')
          .order('name', { ascending: true }); // Ordenar alfabéticamente
        
        if (error) {
          console.error("Error fetching categories:", error);
          toast.error("Error al cargar categorías.");
          setAvailableCategories([]);
        } else {
          setAvailableCategories(data || []);
        }
      } catch (err) {
        console.error("Unexpected error fetching categories:", err);
        toast.error("Error inesperado al cargar categorías.");
        setAvailableCategories([]);
      } finally {
        setIsLoadingAvailCategories(false);
      }
    };

    fetchCategories();

  }, [fetchItems]); // fetchItems como dependencia

  // Función para renderizar el contenido principal (MODIFICADA para pasar categorías)
  const renderShoppingListContent = () => (
    <div className="flex flex-col h-full flex-grow"> 
      <div className="p-4 pb-2 flex-shrink-0"> {/* Reducir padding inferior, evitar encogimiento */}
        <AddItemForm 
          onAddItem={async (parsedItem) => { 
             const success = await handleAddItemSubmit(parsedItem);
             if (success) {
               setSearchTerm(''); // <-- Limpiar el input/búsqueda SOLO si tuvo éxito
             }
             return success; // Devolver éxito/fallo a AddItemForm
          }}
          isAdding={isAddingItem}
          onSearchChange={handleSearchChange} 
          currentSearchTerm={searchTerm}
          availableCategories={availableCategories} // <-- PASAR CATEGORÍAS AL FORM
          isLoadingCategories={isLoadingAvailCategories} // <-- PASAR ESTADO DE CARGA
        /> 
      </div>

      {/* --- NUEVO: Contenedor de Tabs --- */}
      {/* flex-grow permite que ocupe espacio, overflow-hidden para contener */}
      <Tabs defaultValue="lista" className="flex-grow flex flex-col overflow-hidden px-4 pb-4"> 
        <TabsList className="mb-2 flex-shrink-0"> {/* Evitar encogimiento de la lista de tabs */}
          <TabsTrigger value="lista">Mi Lista</TabsTrigger>
          {priceResults !== null && ( /* Mostrar solo si hay resultados */
            <TabsTrigger value="resultados">Resultados ({priceResults?.length || 0})</TabsTrigger>
          )}
        </TabsList>

        {/* --- Contenido Pestaña "Mi Lista" --- */}
        <TabsContent value="lista" className="flex-grow flex flex-col overflow-hidden p-0 m-0"> 
          <Card className="flex-grow flex flex-col overflow-hidden bg-card"> {/* Usar estilos base de Card Y FORZAR bg-card */}
            <CardHeader className="p-4 border-b flex-shrink-0"> 
               <CardTitle className="text-lg font-semibold text-foreground"> {/* Usar foreground */} 
                 Mi Lista de Compras {generatedRange ? formatRange(generatedRange) : ''}
               </CardTitle>
            </CardHeader>
            <CardContent className="p-0 flex-grow overflow-y-auto"> 
              {isLoading ? (
                 <div className="flex items-center justify-center h-full p-6"> <Spinner /> </div>
              ) : error ? (
                 <Alert variant="destructive" className="m-4">
                   <AlertDescription>{typeof error === 'string' ? error : 'Error al cargar la lista'}</AlertDescription>
                 </Alert>
              ) : listItems.length === 0 ? (
                 <p className="text-muted-foreground text-center p-6 italic">Tu lista está vacía.</p>
              ) : Object.keys(groupedAndSortedItems).length === 0 && searchTerm ? (
                 <p className="text-muted-foreground text-center p-6 italic">
                   No se encontraron ítems para "{searchTerm}".
                 </p>
              ) : (
                 Object.entries(groupedAndSortedItems).map(([category, itemsInCategory]) => (
                   <div key={category} className="mb-1">
                     <h3 className="bg-muted text-muted-foreground px-4 py-1.5 text-sm font-semibold sticky top-0 z-10 border-b flex items-center gap-2">
                       {getDisplayCategory(category)}
                       <span className="text-xs font-normal">({itemsInCategory.length})</span>
                     </h3>
                     <ul className="divide-y divide-border">
                       {itemsInCategory.map((item) => (
                         <li key={item.id} className={cn("flex items-center justify-between px-4 py-3 transition-colors", item.is_checked ? 'opacity-60 bg-muted/50' : 'hover:bg-muted/50')}>
                           <div className="flex items-center gap-3">
                             <Checkbox
                               id={`item-${item.id}`}
                               checked={item.is_checked}
                               onCheckedChange={() => handleToggleItem(item.id, item.is_checked)}
                               aria-label={`Marcar ${item.ingredient_name} como ${item.is_checked ? 'no comprado' : 'comprado'}`}
                               className="border-primary data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
                             />
                             <label
                               htmlFor={`item-${item.id}`}
                               className={cn('flex flex-col cursor-pointer', item.is_checked ? 'line-through' : '')}
                             >
                               <span className="font-medium text-foreground">{item.ingredient_name}</span>
                               {(item.quantity || item.unit || item.notes) && (
                                 <span className="text-xs text-muted-foreground">
                                   {item.quantity} {item.unit}
                                   {item.notes && ` - ${item.notes}`}
                                 </span>
                               )}
                             </label>
                           </div>
                           <div className="flex items-center gap-1">
                              <Button
                                 variant="ghost"
                                 size="icon"
                                 className="h-7 w-7 text-muted-foreground hover:text-primary"
                                 onClick={() => handleSearchItemPrice(item)}
                                 disabled={isSearchingPrices}
                                 aria-label={`Buscar precios para ${item.ingredient_name}`}
                              >
                                  <Search className="h-4 w-4" />
                              </Button>
                              <Button
                                 variant="ghost"
                                 size="icon"
                                 className="h-7 w-7 text-muted-foreground hover:text-destructive"
                                 onClick={() => deleteItem(item.id)}
                                 aria-label={`Eliminar ${item.ingredient_name}`}
                              >
                                  <Trash2 className="h-4 w-4" />
                              </Button>
                           </div>
                         </li>
                       ))}
                     </ul>
                   </div>
                 ))
              )}
            </CardContent>
            {/* CardFooter: Asegurar que use estilos de tema */}
            <CardFooter className="p-2 border-t flex-shrink-0 flex justify-end gap-2">
               <Button variant="outline" size="sm" onClick={() => clearPurchased()} disabled={!listItems.some(i => i.is_checked)} className="text-xs">
                 <XCircle className="mr-1 h-3 w-3" /> Limpiar Comprados
               </Button>
               <Button variant="destructive" size="sm" onClick={() => clearAll()} disabled={listItems.length === 0} className="text-xs">
                 <Trash2 className="mr-1 h-3 w-3" /> Vaciar Lista
               </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* --- Contenido Pestaña "Resultados" --- */}
        {priceResults !== null && (
           <TabsContent value="resultados" className="flex-grow overflow-hidden p-0 m-0">
                <PriceResultsDisplay
                  results={priceResults}
                  itemName={itemForPriceSearch}
                  isLoading={isSearchingPrices}
                  onStoreSelect={handleStoreSelect}
                  storeFilter={storeFilter}
                  onStoreFilterChange={setStoreFilter}
                />
           </TabsContent>
        )}
      </Tabs> 
    </div>
  );

  // --- Fin Funciones movidas ---
  // Bloque eliminado ya que fue movido arriba

  // Renderizar el layout según el breakpoint (Recuperado y adaptado)
  return (
    <div className="h-screen flex flex-col"> {/* Ocupar toda la altura */}
      <ResponsiveLayout
        shoppingList={renderShoppingListContent()} // Pasar el contenido de la lista unificada
        map={mapContent} // Pasar el contenido del mapa
        // searchPanel ya no se pasa
      />
    </div>
  );
}

export default ShoppingListPage;