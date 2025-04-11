import React, { useCallback, useEffect, useState } from 'react';
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

// Tipos DB
type DBShoppingListItemRow = Database['public']['Tables']['shopping_list_items']['Row'];
type DBShoppingListItemInsert = Database['public']['Tables']['shopping_list_items']['Insert'];
type DBShoppingListItemUpdate = Database['public']['Tables']['shopping_list_items']['Update'];
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

   // Obtener user para pasar ID a generateShoppingList
   const { user } = useAuth(); // Asumiendo que useAuth está disponible


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
    await updateItem(itemId, { is_purchased: !currentStatus });
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


  // Función para añadir ítem directamente a Supabase (SIMPLIFICADO)
  const handleAddItemSubmit = useCallback(async (parsedItem: ParsedShoppingInput) => {
    const itemName = parsedItem.name;
    if (!itemName) {
      toast.error("No se pudo identificar el nombre del ítem.");
      throw new Error("Parsed item name is missing"); // Lanzar error para el formulario
    }

    // Asegurarse que el usuario está autenticado
    if (!user?.id) {
      toast.error("Debes iniciar sesión para añadir ítems.");
      throw new Error("User not authenticated");
    }

    setIsAddingItem(true); // Indicar que estamos añadiendo

    try {
      const { data, error } = await supabase
        .from('shopping_list_items')
        .insert({
          ingredient_name: itemName.trim(),
          quantity: parsedItem.quantity,
          unit: parsedItem.unit,
          // user_id: user.id // <--- ELIMINADO (La DB lo pondrá por DEFAULT)
        })
        .select()
        .single();

      if (error) {
        console.error("Error de Supabase al añadir item:", error);
        toast.error(`Error al añadir "${itemName}". ${error.message}`);
        throw error; // Lanzar error para el formulario
      }

      if (data) {
        fetchItems(); // Refrescar toda la lista
        toast.success(`"${itemName}" añadido a la lista.`);
      }
    } catch (error) {
      console.error("Error inesperado al añadir:", error);
      toast.error(`Error inesperado al añadir "${itemName}".`);
      throw error; // Propagar error para que el formulario lo sepa
    } finally {
      setIsAddingItem(false); // Terminar el estado de añadir
    }
  }, [user, fetchItems]); // Dependencias

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

  // Handler para buscar precios de todos los items
  const handleSearchAllPrices = useCallback(async () => {
    if (listItems.length === 0) {
      toast.info("No hay ítems en la lista para buscar precios.");
      return;
    }

    setIsSearchingPrices(true);
    setPriceResults(null); // Limpiar resultados anteriores
    setItemForPriceSearch('Todos los ítems'); // Indicar búsqueda general
    const allResults: BuscaPreciosProduct[] = [];
    let errorCount = 0;

    toast.info(`Buscando precios para ${listItems.length} ítems...`);

    // Usar Promise.allSettled para manejar errores individuales
    const searchPromises = listItems.map(item =>
      searchProducts(item.ingredient_name).then(result => ({ item, result })) // Usar ingredient_name
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

  }, [listItems]); // Depende de la lista actual

  // Cargar items desde el store al montar
  useEffect(() => {
    console.log("--- Fetching shopping list items on mount ---");
    fetchItems();
    // TODO: Cargar categorías si es necesario para SearchPanel
    // setIsLoadingCategories(true);
    // getCategories().then(setCategories).finally(() => setIsLoadingCategories(false));
  }, [fetchItems]);

  // Función para renderizar el contenido principal (lista) (Adaptado)
  const renderMainContent = () => (
    // Contenedor principal para la lista y resultados de precios
    <div className="flex flex-col h-full p-4 gap-4"> {/* Añadido padding y gap */}
      {/* Formulario para añadir manualmente (Movido aquí) */}
      <div className="mb-4">
        <AddItemForm 
          onAddItem={handleAddItemSubmit} 
          isAdding={isAddingItem} // Pasar el estado de carga
        /> 
      </div>
      {/* Resultados de Precios (si existen) */}
      <PriceResultsDisplay
        results={priceResults}
        itemName={itemForPriceSearch}
        isLoading={isSearchingPrices}
      />

      {/* Lista de Compras */}
      <Card className="bg-white border border-slate-200 shadow-sm rounded-lg flex-grow flex flex-col overflow-hidden"> {/* Ajustado shadow */}
        <CardHeader>
          <CardTitle className="text-lg font-medium flex items-center justify-between"> {/* Flex para alinear */}
            <div className="flex items-center gap-2"> {/* Grupo para título e icono */}
                <ListChecks className="h-4 w-4 text-muted-foreground" />
                <span>Mi Lista</span>
                {generatedRange && (
                <span className="text-sm text-slate-500 font-normal ml-2">
                    ({formatRange(generatedRange)})
                </span>
                )}
            </div>
            <Button variant="outline" size="sm" onClick={handleSearchAllPrices} disabled={isSearchingPrices || listItems.length === 0} className="text-xs"> {/* Botón de buscar precios */}
              {isSearchingPrices ? <Spinner size="sm" /> : <Search className="mr-1 h-3 w-3" />} Buscar Precios
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 flex-grow overflow-y-auto"> {/* Quitado padding, añadido scroll */}
          {isLoading ? (
            <div className="flex items-center justify-center h-full p-6"> {/* Padding para centrar spinner */}
              <Spinner />
            </div>
          ) : error ? (
            <Alert variant="destructive" className="m-4">
              <Terminal className="h-4 w-4" />
              <AlertTitle>Error al cargar la lista</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : listItems.length === 0 ? (
            <p className="text-slate-500 text-center p-6 italic">Tu lista de compras está vacía.</p>
          ) : (
            <ul className="divide-y divide-slate-200"> {/* Añadido divisor */}
              {listItems.map((item) => (
                <li key={item.id} className={`flex items-center justify-between px-4 py-3 ${item.is_checked ? 'opacity-50 bg-slate-50' : ''}`}> {/* Padding y estilo para marcados */}
                  <div className="flex items-center gap-3"> {/* Gap entre checkbox y texto */}
                    <Checkbox
                      id={`item-${item.id}`}
                      checked={item.is_checked}
                      onCheckedChange={() => handleToggleItem(item.id, item.is_checked)} 
                    />
                    <label
                      htmlFor={`item-${item.id}`}
                      className={`flex flex-col cursor-pointer ${item.is_checked ? 'line-through' : ''}`} 
                    >
                      <span className="font-medium text-slate-800">{item.ingredient_name}</span>
                      {(item.quantity || item.unit) && (
                        <span className="text-xs text-slate-500">
                          {item.quantity} {item.unit}
                          {item.notes && ` - ${item.notes}`} {/* Mostrar notas */}
                        </span>
                      )}
                    </label>
                  </div>
                  <div className="flex items-center gap-1"> {/* Contenedor para botones */}
                     {/* Botón para buscar precios individuales */}
                     <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-500 hover:text-blue-600" onClick={() => { /* TODO: Implementar búsqueda individual */ toast.info('Funcionalidad pendiente'); }}>
                         <Search className="h-4 w-4" />
                     </Button>
                     {/* Botón para eliminar */}
                     <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-500 hover:text-red-600" onClick={async () => {
                        const success = await deleteItem(item.id);
                        if (success) toast.success(`"${item.ingredient_name}" eliminado.`);
                        else toast.error("Error al eliminar el ítem.");
                      }}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
        {listItems.length > 0 && (
          <CardFooter className="p-2 border-t border-slate-200 flex justify-end gap-2"> {/* Flex y gap para botones */}
            <Button variant="outline" size="sm" onClick={async () => {
              const success = await clearPurchased();
              if (success) toast.success("Ítems comprados eliminados.");
              else toast.error("Error al eliminar ítems comprados.");
            }} disabled={listItems.every(i => !i.is_checked)} className="text-xs"> {/* Deshabilitar si no hay marcados */}
              <XCircle className="mr-1 h-3 w-3" /> Limpiar Comprados
            </Button>
            <Button variant="destructive" size="sm" onClick={async () => {
              const success = await clearAll();
              if (success) toast.success("Lista vaciada correctamente.");
              else toast.error("Error al vaciar la lista.");
            }} className="text-xs">
              <Trash2 className="mr-1 h-3 w-3" /> Vaciar Lista
            </Button>
          </CardFooter>
        )}
      </Card>
    </div>
  );

  // --- Fin Funciones movidas ---
  // Bloque eliminado ya que fue movido arriba

  // Renderizar el layout según el breakpoint (Recuperado y adaptado)
  return (
    <div className="h-screen flex flex-col"> {/* Ocupar toda la altura */}
      {breakpoint === 'desktop' && (
        <DesktopLayout
          searchPanel={<SearchPanel categories={categories} />}
          shoppingList={renderMainContent()}
          map={mapContent}
        />
      )}
      {breakpoint === 'tablet' && (
        <TabletLayout
          listAndSearch={
            <div className="flex flex-col h-full">
              <div className="p-4"><SearchPanel categories={categories} /></div>
              <div className="flex-grow overflow-y-auto">{renderMainContent()}</div> {/* Lista abajo */}
            </div>
          }
          map={mapContent}
        />
      )}
      {breakpoint === 'mobile' && (
        <MobileLayout
          listAndSearch={renderMainContent()}
          map={mapContent}
        />
      )}
    </div>
  );
}