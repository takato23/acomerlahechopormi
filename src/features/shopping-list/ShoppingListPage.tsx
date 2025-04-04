import React, { useState, useCallback, useEffect } from 'react'; // Combinar importaciones de React
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { ShoppingListItem } from './types'; // Importación original
import type { Category } from '@/features/pantry/types'; // Importar Category de pantry
import { generateShoppingList } from './shoppingListService';
import { format, startOfWeek, endOfWeek } from 'date-fns';
import { es } from 'date-fns/locale';
import { ListChecks, Terminal } from 'lucide-react'; // Iconos

export function ShoppingListPage() {
  const [listItems, setListItems] = useState<ShoppingListItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedRange, setGeneratedRange] = useState<{ start: string; end: string } | null>(null);

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



  const handleGenerateList = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setListItems([]); // Limpiar lista anterior
    setGeneratedRange(null);

    const startDateStr = format(weekStart, 'yyyy-MM-dd');
    const endDateStr = format(weekEnd, 'yyyy-MM-dd');

    try {
      const items = await generateShoppingList(startDateStr, endDateStr);
      setListItems(items.map(item => ({ ...item, isChecked: false }))); // Inicializar isChecked
      setGeneratedRange({ start: startDateStr, end: endDateStr });
    } catch (err: any) {
      console.error("Error generating shopping list:", err);
      setError(err.message || "Error inesperado al generar la lista.");
    } finally {
      setIsLoading(false);
    }
  }, [weekStart, weekEnd]); // Depende de las fechas de la semana

  const handleToggleItem = (itemId: string) => {
    setListItems(prevItems =>
      prevItems.map(item =>
        item.id === itemId ? { ...item, isChecked: !item.isChecked } : item
      )
    );
    // Aquí podríamos añadir lógica para persistir el estado isChecked si fuera necesario
  };

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


  // Handler para añadir item manualmente y buscar precios (Recuperado y adaptado)
  const handleAddItem = async (parsedItem: { name: string; quantity: number | null; unit: string | null }) => {
    // Nota: Este handler asume que viene de un AddItemForm que parsea la entrada.
    // Necesitaríamos reimplementar AddItemForm o adaptar SearchPanel para llamar esto.
    setIsSearchingPrices(true);
    setItemForPriceSearch(parsedItem.name);
    setPriceResults(null);
    try {
      // Añadir item al estado local (adaptado de la lógica de Zustand)
      // Crear un objeto ShoppingListItem básico
      const newItem: ShoppingListItem = {
        id: `temp-${Date.now()}`, // ID temporal
        ingredientName: parsedItem.name, // Usar ingredientName que sí existe en el tipo
        quantity: parsedItem.quantity,
        unit: parsedItem.unit,
        isChecked: false,
        recipeSources: [], // Añadir propiedad requerida como array vacío
      };
      setListItems(prevItems => [...prevItems, newItem]);
      toast.success(`"${parsedItem.name}" añadido a la lista.`);

      // Buscar precios después de intentar añadir (o simular éxito)
      const results: SearchProductsResult = await searchProducts(parsedItem.name); // Añadir tipo explícito
      if (!results.error) { // Verificar si no hubo error
        setPriceResults(results.products); // Acceder a la propiedad 'products'
        if (results.products.length === 0) {
             toast.info(`No se encontraron precios para "${parsedItem.name}".`);
        }
      } else {
        // Hubo un error en la búsqueda (ya se logueó en el servicio)
        toast.error(`Error al buscar precios para "${parsedItem.name}".`);
        setPriceResults([]); // Indicar error con array vacío
        // Opcional: Mostrar sugerencias de fallback si existen en results.fallbackSuggestions
      }
    } catch (err) {
      console.error('Error adding item or searching prices:', err);
      toast.error(`Error al procesar "${parsedItem.name}".`);
      setPriceResults([]); // Indicar error en búsqueda
    } finally {
      setIsSearchingPrices(false);
    }
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

  // Función para renderizar el contenido principal (lista) (Adaptado)
  // Función para cargar datos iniciales (adaptada de PantryPage)
  const loadData = useCallback(async () => {
    console.log("--- Executing loadData to refresh shopping list items ---");
    setIsLoading(true); // Usar isLoading general
    setError(null);
    setIsLoadingCategories(true); // También cargar categorías
    try {
      // Cargar categorías y items en paralelo
      // Asumiendo que getShoppingListItems y getCategories existen en los servicios copiados
      // const [fetchedCategories, fetchedItems] = await Promise.all([
      //   getCategories(), // Necesita existir en services/categoryService.ts
      //   getShoppingListItems() // Necesita existir en shoppingListService.ts
      // ]);
      console.warn("Lógica para cargar items y categorías pendiente en loadData");
      const fetchedCategories: Category[] = []; // Placeholder
      const fetchedItems: ShoppingListItem[] = []; // Placeholder

      setCategories(fetchedCategories);
      setListItems(fetchedItems.map(item => ({ ...item, isChecked: item.isChecked ?? false }))); // Asegurar isChecked
    } catch (err) {
      console.error("Error loading shopping list data:", err);
      setError("No se pudo cargar la lista de compras. Intenta de nuevo más tarde.");
      setListItems([]); // Limpiar items en caso de error
      setCategories([]);
    } finally {
      setIsLoading(false);
      setIsLoadingCategories(false);
    }
  }, []); // Dependencia vacía para ejecutar solo al montar inicialmente
      {/* Formulario para añadir manualmente (Recuperado) */}
      <div className="mb-4">
        <AddItemForm onAddItem={handleAddItem} />
      </div>


  // Cargar datos al montar el componente
  useEffect(() => {
    loadData();
  }, [loadData]); // Llamar a loadData al montar


  const renderMainContent = () => (
    // Contenedor principal para la lista y resultados de precios
    <div className="flex flex-col h-full p-4 gap-4"> {/* Añadido padding y gap */}
      {/* Resultados de Precios (si existen) */}
      <PriceResultsDisplay
        results={priceResults}
        itemName={itemForPriceSearch}
        isLoading={isSearchingPrices}
      />

      {/* Lista de Compras */}
      <Card className="bg-white border border-slate-200 shadow-sm rounded-lg flex-grow flex flex-col overflow-hidden"> {/* Ajustado shadow */}
        <CardHeader className="p-4 border-b"> {/* Ajustado padding y borde */}
          <CardTitle className="text-lg text-slate-800"> {/* Ajustado tamaño y color */}
            {listItems.length > 0 ? `Lista Generada ${formatRange(generatedRange)}` : 'Genera o añade ítems'}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-grow overflow-y-auto p-0"> {/* Quitado padding para lista */}
          {isLoading && !isSearchingPrices && ( // Mostrar solo si no está buscando precios
            <div className="flex justify-center items-center h-40"><Spinner /></div>
          )}
          {!isLoading && listItems.length === 0 && !error && (
            <p className="text-center text-slate-500 py-10 px-4">
              Genera una lista desde tu plan semanal o añade ítems manualmente.
            </p>
          )}
          {!isLoading && listItems.length > 0 && (
            // Usar Accordion para agrupar (si agrupamos, si no, ul directo)
            // Por ahora, mantenemos la lista simple como en la versión actual
            <ul className="space-y-0"> {/* Quitado space-y */}
              {listItems.map((item) => (
                <li key={item.id} className="flex items-center space-x-3 p-3 border-b border-slate-100 last:border-b-0 hover:bg-slate-50 transition-colors"> {/* Ajustado padding y hover */}
                  <Checkbox
                    id={`item-${item.id}`}
                    checked={item.isChecked}
                    onCheckedChange={() => handleToggleItem(item.id)}
                    aria-label={`Marcar ${item.ingredientName}`}
                  />
                  <div className="flex-grow">
                    <label
                      htmlFor={`item-${item.id}`}
                      className={`text-sm font-medium cursor-pointer ${item.isChecked ? 'text-slate-400 line-through' : 'text-slate-800'}`} // Añadido cursor-pointer
                    >
                      {item.ingredientName}
                    </label>
                    {(item.quantity !== null || item.unit) && (
                       <span className={`ml-2 text-xs ${item.isChecked ? 'text-slate-400 line-through' : 'text-slate-500'}`}>
                         ({item.quantity ?? ''} {item.unit ?? ''})
                       </span>
                    )}
                  </div>
                  {/* TODO: Añadir botón de borrar item si es necesario */}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );

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