import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox'; 
import { Spinner } from '@/components/ui/Spinner';
import { Trash2, RefreshCw, ListChecks, Package } from 'lucide-react'; 
import { useShoppingListStore } from '@/stores/shoppingListStore'; 
import { generateShoppingList } from './services/shoppingListService'; 
import { AddItemForm } from './components/AddItemForm';
import { PriceResultsDisplay } from './components/PriceResultsDisplay'; // Importar nuevo componente
import { inferCategory } from './lib/categoryInference';
import { ParsedShoppingInput } from './lib/inputParser'; // Importar tipo
import { getCategories } from './services/categoryService';
import { searchProducts, BuscaPreciosProduct } from './services/buscaPreciosService';
import { preciosClarosService } from './services/preciosClarosService'; // Importar servicio Precios Claros
import { toast } from 'sonner';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import useBreakpoint from '@/hooks/useBreakpoint'; // Usar import por defecto
import { DesktopLayout } from './components/Layout/DesktopLayout'; // Importar layouts
import { TabletLayout } from './components/Layout/TabletLayout';
import { MobileLayout } from './components/Layout/MobileLayout';
import { SearchPanel } from './components/SearchPanel/SearchPanel';
import { ShoppingMap } from './components/Map/ShoppingMap';
// Eliminar esta línea duplicada
import { FavoriteStoresInfo } from './components/Map/FavoriteStoresInfo'; // Importar componente info

// Usar any temporalmente hasta tener los tipos de Supabase
type ShoppingListItem = any;
type Category = any;

export function ShoppingListPage() {
  // Estado global (Zustand)
  const { 
    items: persistedItems, 
    isLoading: isLoadingList, 
    error: storeError, 
    fetchItems, 
    addItem, 
    updateItem, 
    deleteItem, 
    clearPurchased 
  } = useShoppingListStore();

  // Estado local
  const [isGenerating, setIsGenerating] = useState(false); 
  const [generationError, setGenerationError] = useState<string | null>(null); 
  const [generatedItems, setGeneratedItems] = useState<ShoppingListItem[] | null>(null); 
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const [inferredCategories, setInferredCategories] = useState<Record<string, string | null>>({});
  const [priceResults, setPriceResults] = useState<BuscaPreciosProduct[] | null>(null); // Estado para resultados de precios
  const [itemForPriceSearch, setItemForPriceSearch] = useState<string | null>(null);
  const [isSearchingPrices, setIsSearchingPrices] = useState(false);
  const [favoriteStoreIds, setFavoriteStoreIds] = useState<Set<string>>(new Set());
  const [forceShowMap, setForceShowMap] = useState(false); // Estado para forzar mostrar mapa

  // Datos derivados
  const displayItems = generatedItems !== null ? generatedItems : persistedItems;
  const purchasedCount = displayItems.filter(i => i.is_purchased).length;
  const isLoading = isLoadingList || (generatedItems === null && isLoadingCategories);
  const breakpoint = useBreakpoint(); // Obtener breakpoint actual

  // Efectos
  useEffect(() => {
    fetchItems();
    const loadCats = async () => {
      setIsLoadingCategories(true);
      try {
        const cats = await getCategories();
        setCategories(cats);
      } catch (err) {
        console.error("Error loading categories:", err);
      } finally {
        setIsLoadingCategories(false);
      }
    };
    loadCats();

    // Verificar disponibilidad de Precios Claros al montar
    const checkApi = async () => {
      const isAvailable = await preciosClarosService.checkServiceAvailability();
      if (isAvailable) {
        console.info("API Precios Claros disponible.");
        // toast.info("API Precios Claros disponible."); // Opcional: mostrar toast
      } else {
        console.warn("API Precios Claros NO disponible o con errores.");
        toast.warning("El servicio de Precios Claros (para ubicaciones) no está disponible.");
      }
    };
    checkApi();

  }, [fetchItems]);

  // Handler para seleccionar/deseleccionar tienda favorita
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

  // Inferir categorías para items cuando cambian
  useEffect(() => {
    const inferAllCategories = async () => {
      if (persistedItems.length > 0 && categories.length > 0) {
        const newInferred: Record<string, string | null> = {};
        await Promise.all(persistedItems.map(async (item) => {
          if (inferredCategories[item.id] === undefined) {
            newInferred[item.id] = await inferCategory(item.name);
          } else {
            newInferred[item.id] = inferredCategories[item.id];
          }
        }));
        setInferredCategories(prev => ({ ...prev, ...newInferred }));
      }
    };
    inferAllCategories();
  }, [persistedItems, categories]);

  // Grupos de items por categoría
  const groupedItems = useMemo(() => {
    if (generatedItems !== null || categories.length === 0) return null;

    const groups: Record<string, { name: string; items: ShoppingListItem[] }> = {};
    const categoryMap = new Map(categories.map(c => [c.id, c.name]));
    const otherCategoryName = "Otros";

    persistedItems.forEach(item => {
      const categoryId = inferredCategories[item.id];
      const categoryName = categoryId ? categoryMap.get(categoryId) || otherCategoryName : otherCategoryName;
      
      if (!groups[categoryName]) {
        groups[categoryName] = { name: categoryName, items: [] };
      }
      groups[categoryName].items.push(item);
      groups[categoryName].items.sort((a, b) => {
        if (a.is_purchased !== b.is_purchased) return a.is_purchased ? 1 : -1;
        return a.name.localeCompare(b.name);
      });
    });

    return Object.values(groups).sort((a, b) => a.name.localeCompare(b.name));
  }, [persistedItems, categories, inferredCategories, generatedItems]);

  // Handlers
  const handleAddItem = async (parsedItem: ParsedShoppingInput) => { // Recibir objeto parseado
    try {
      // Inferir categoría
      const inferredCategoryId = await inferCategory(parsedItem.name);

      // Preparar datos para añadir
      const itemData = {
        name: parsedItem.name,
        quantity: parsedItem.quantity,
        unit: parsedItem.unit,
        category_id: inferredCategoryId, // Usar categoría inferida
        is_purchased: false,
      };

      const addedItem = await addItem(itemData); // Añadir item con todos los datos
      toast.success(`"${parsedItem.name}" añadido a la lista.`);

      // Iniciar búsqueda de precios para el item añadido (si se añadió correctamente)
      if (addedItem) {
        setItemForPriceSearch(addedItem.name);
        setIsSearchingPrices(true);
        setPriceResults(null); // Limpiar resultados anteriores
        try {
          const results = await searchProducts(addedItem.name);
          setPriceResults(results);
          console.log(`Resultados de BuscaPrecios para "${addedItem.name}":`, results); // Log temporal
          if (results.length === 0) {
               toast.info(`No se encontraron precios para "${addedItem.name}".`);
          }
        } catch (priceError) {
          console.error(`Error searching prices for "${addedItem.name}":`, priceError);
          toast.error(`Error al buscar precios para "${addedItem.name}".`);
          setPriceResults([]); // Indicar que hubo error pero no bloquear
        } finally {
          setIsSearchingPrices(false);
        }
      }

    } catch (err) {
      console.error('Error adding item:', err);
      // Asegurarse de que 'name' existe en parsedItem antes de usarlo en el toast de error
      const errorItemName = parsedItem?.name || 'el ítem';
      toast.error(`Error al añadir "${errorItemName}".`);
    }
  };

  const handleTogglePurchased = async (item: ShoppingListItem) => {
    try {
      await updateItem(item.id, { is_purchased: !item.is_purchased });
    } catch (err) {
      console.error('Error toggling item:', err);
      toast.error(`Error al actualizar "${item.name}".`);
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    const item = persistedItems.find(i => i.id === itemId);
    if (!item) return;

    const confirmDelete = window.confirm(`¿Estás seguro de que quieres eliminar "${item.name}"?`);
    if (!confirmDelete) return;

    try {
      await deleteItem(itemId);
      toast.success(`"${item.name}" eliminado.`);
    } catch (err) {
      console.error('Error deleting item:', err);
      toast.error(`Error al eliminar "${item.name}".`);
    }
  };

  const handleClearPurchased = async () => {
    if (purchasedCount === 0) return;

    const confirmClear = window.confirm(`¿Eliminar los ${purchasedCount} ítems comprados?`);
    if (!confirmClear) return;

    try {
      await clearPurchased();
      toast.success('Ítems comprados eliminados.');
    } catch (err) {
      console.error('Error clearing purchased items:', err);
      toast.error('Error al limpiar los ítems comprados.');
    }
  };

  const handleGenerateList = async () => {
    setIsGenerating(true);
    setGenerationError(null);
    try {
      // Por ahora, generar para la semana actual
      const today = new Date();
      const weekStart = format(today, 'yyyy-MM-dd');
      const weekEnd = format(new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd');
      
      const items = await generateShoppingList(weekStart, weekEnd);
      setGeneratedItems(items);
      
      if (items.length === 0) {
        toast.info('No hay comidas planificadas para generar una lista.');
      } else {
        toast.success(`Lista generada con ${items.length} ítems.`);
      }
    } catch (err) {
      console.error('Error generating list:', err);
      const message = err instanceof Error ? err.message : 'Error desconocido';
      setGenerationError(message);
      toast.error(`Error al generar la lista: ${message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  // Renderizar contenido principal (lista, formulario, resultados de precios)
  const renderMainContent = () => (
    <div className="flex flex-col h-full"> {/* Asegurar que ocupe altura */}
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-4 px-4 pt-4">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <ListChecks className="h-6 w-6 text-primary"/> Lista de Compras
        </h1>
        <Button
          size="sm"
          onClick={handleGenerateList}
          disabled={isGenerating}
          className="h-9"
          title="Generar lista basada en la planificación de esta semana"
        >
          {isGenerating ? <Spinner size="sm" className="mr-2"/> : <RefreshCw className="mr-2 h-4 w-4"/>}
          Generar Lista
        </Button>
      </div>

      {(storeError || generationError) && (
        <p className="text-destructive text-sm mb-4 px-4">{storeError || generationError}</p>
      )}

      {/* Formulario añadir manual */}
      {generatedItems === null && (
        <div className="px-4 mb-4">
           <AddItemForm onAddItem={handleAddItem} />
        </div>
      )}

      {/* Mostrar resultados de precios */}
      <div className="px-4 mb-4">
        <PriceResultsDisplay
          results={priceResults}
          itemName={itemForPriceSearch}
          isLoading={isSearchingPrices}
        />
      </div>

      {/* Lista */}
      <div className="flex-grow overflow-y-auto px-1 pb-4"> {/* Permitir scroll */}
        {isLoading ? (
          <div className="flex justify-center py-10"><Spinner /></div>
        ) : (
          <div className="bg-card border rounded-lg shadow-sm p-0">
            {displayItems.length === 0 && !isGenerating ? (
              <p className="text-muted-foreground text-center py-6 px-4">
                {generatedItems !== null
                  ? "No se generaron ítems para esta semana."
                  : "Tu lista de compras está vacía."}
              </p>
            ) : (
              <>
                {groupedItems ? (
                  <Accordion type="multiple" defaultValue={groupedItems.map(g => g.name)} className="w-full">
                    {groupedItems.map(group => (
                      <AccordionItem value={group.name} key={group.name}>
                        <AccordionTrigger className="px-4 py-3 text-sm font-medium hover:no-underline bg-muted/30 hover:bg-muted/40">
                          <div className="flex items-center gap-2">
                            <Package className="h-4 w-4 text-muted-foreground" />
                            {group.name} ({group.items.length})
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="px-4 pt-3 pb-1">
                          <ul className="space-y-2">
                            {group.items.map(item => (
                              <li key={item.id} className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <Checkbox
                                    id={`item-${item.id}`}
                                    checked={item.is_purchased}
                                    onCheckedChange={() => handleTogglePurchased(item)}
                                  />
                                  <label
                                    htmlFor={`item-${item.id}`}
                                    className={cn(
                                      "text-sm cursor-pointer",
                                      item.is_purchased && "line-through text-muted-foreground"
                                    )}
                                  >
                                    {item.name}
                                    {(item.quantity || item.unit) && (
                                      <span className="text-xs text-muted-foreground ml-1">
                                        ({item.quantity}{item.unit ? ` ${item.unit}` : ''})
                                      </span>
                                    )}
                                  </label>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 text-muted-foreground hover:text-destructive"
                                  onClick={() => handleDeleteItem(item.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </li>
                            ))}
                          </ul>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                ) : (
                  <ul className="space-y-2 p-4">
                    {displayItems.map((item) => (
                      <li key={item.id} className="flex items-center justify-between p-2 rounded-md bg-background/50">
                        <span className="text-sm">
                          {item.name}
                          {(item.quantity || item.unit) && (
                            <span className="text-xs text-muted-foreground ml-1">
                              ({item.quantity}{item.unit ? ` ${item.unit}` : ''})
                            </span>
                          )}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
                
                {generatedItems === null && purchasedCount > 0 && (
                  <div className="mt-4 p-4 border-t flex justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleClearPurchased}
                    >
                      <Trash2 className="mr-2 h-4 w-4"/>
                      Limpiar Comprados ({purchasedCount})
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );

  // Determinar si mostrar el mapa completo o la info de favoritos
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

  // Renderizar el layout según el breakpoint
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
              <div className="p-4"><SearchPanel categories={categories} /></div> {/* Pasar categorías */}
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