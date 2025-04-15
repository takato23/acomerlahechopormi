import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { List, LayoutGrid } from 'lucide-react';
import { toast } from 'sonner';
import { EmptyState } from '@/components/common/EmptyState';
import { Spinner } from '@/components/ui/Spinner';
import {
  getPantryItems,
  getCategories,
  deleteMultiplePantryItems,
  toggleFavoritePantryItem,
  clearPantry
} from './pantryService';
import type { PantryItem, Category, CreatePantryItemData } from './types';
import useBreakpoint from '@/hooks/useBreakpoint';
import { Suspense } from 'react';

import PantryFiltersSection from './components/PantryFiltersSection';
import PantrySelectionControls from './components/PantrySelectionControls';
import PantryItemsView from './components/PantryItemsView';
import UnifiedPantryInput from './components/UnifiedPantryInput';

export function PantryPage() {
  // Estados del componente
  const currentBreakpoint = useBreakpoint();
  const isDesktop = currentBreakpoint === 'desktop';
  const [pantryItems, setPantryItems] = useState<PantryItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false); // ¿Se usa este modal? Revisar si AddPantryItemForm se usa
  const [itemToEdit, setItemToEdit] = useState<PantryItem | null>(null); // ¿Se usa para editar desde Card/Row?
  const [showFiltersSheet, setShowFiltersSheet] = useState(false); // ¿Se usa este sheet?
  const [viewMode, setViewMode] = useState<'list' | 'grid'>(() =>
    isDesktop ? 'list' : 'grid'
  );
  const [filters, setFilters] = useState({
    searchTerm: '',
    categoryId: 'all',
    tags: '' // ¿Se usa el filtro de tags?
  });
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [isSelectionMode, setIsSelectionMode] = useState<boolean>(false);

  // Cargar datos
  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [fetchedCategories, fetchedItems] = await Promise.all([
        getCategories(),
        getPantryItems()
      ]);
      console.log('[PantryPage] Fetched Items Sample:', fetchedItems.slice(0, 2)); // DEBUG: Log first 2 items
      setCategories(fetchedCategories);
      setPantryItems(fetchedItems);
    } catch (err) {
      console.error("Error loading pantry data:", err);
      setError("No se pudo cargar la despensa. Intenta de nuevo más tarde.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handlers
  const handleFilterChange = useCallback((newFilters: typeof filters) => {
    setFilters(newFilters);
  }, []);

  const handleSelectItem = useCallback((itemId: string) => {
    setSelectedItems(prev => {
      const next = new Set(prev);
      if (next.has(itemId)) {
        next.delete(itemId);
      } else {
        next.add(itemId);
      }
      return next;
    });
  }, []);

  const handleEditItem = useCallback((item: PantryItem) => {
    // TODO: Implementar lógica para abrir modal de edición con 'item'
    console.log("Edit item requested:", item);
    setItemToEdit(item); // Guardar item a editar
    // setIsModalOpen(true); // Abrir modal si existe
    toast.info(`Editar ${item.ingredient?.name} (funcionalidad pendiente)`);
  }, []);

  const handleEditRequestFromUnifiedInput = useCallback((data: CreatePantryItemData) => {
    // Esta función parece diseñada para abrir el modal de edición
    // con los datos parseados del input unificado.
    const partialItem: Partial<PantryItem> = {
      ingredient: { name: data.ingredient_name },
      quantity: data.quantity,
      unit: data.unit,
      category_id: data.category_id,
      expiry_date: data.expiry_date,
      notes: data.notes,
      // Añadir otros campos si existen en CreatePantryItemData y son relevantes
    };
    handleEditItem(partialItem as PantryItem); // Llama al handler general de edición
  }, [handleEditItem]);

  const handleToggleFavorite = useCallback(async (itemId: string) => {
    // Encontrar el estado actual antes de la actualización optimista
    const currentItem = pantryItems.find(item => item.id === itemId);
    if (!currentItem) return; // No hacer nada si el item no se encuentra

    const currentState = Boolean(currentItem.is_favorite);
    const newState = !currentState;

    // Actualización optimista
    setPantryItems(prevItems =>
      prevItems.map(item =>
        item.id === itemId ? { ...item, is_favorite: newState } : item
      )
    );

    try {
      const updatedItem = await toggleFavoritePantryItem(itemId, newState);
      if (!updatedItem) {
        throw new Error('Failed to update favorite status');
      }
      toast.success(
        `${updatedItem.ingredient?.name} ${newState ? 'añadido a' : 'quitado de'} favoritos`
      );
      // Opcional: Sincronizar con el estado devuelto por el servidor si es necesario
      // setPantryItems(prevItems =>
      //   prevItems.map(item => (item.id === updatedItem.id ? updatedItem : item))
      // );
    } catch (error) {
      console.error("Error toggling favorite:", error);
      toast.error("Error al actualizar favorito");
      // Revertir
      setPantryItems(prevItems =>
        prevItems.map(item =>
          item.id === itemId ? { ...item, is_favorite: currentState } : item
        )
      );
    }
  }, [pantryItems]); // Depender de pantryItems para tener el currentState correcto

  const handleDeleteSelected = async () => {
    try {
      const itemIdsArray = Array.from(selectedItems);
      await deleteMultiplePantryItems(itemIdsArray);
      toast.success(`${itemIdsArray.length} items eliminados`);
      await loadData();
      setIsSelectionMode(false);
      setSelectedItems(new Set());
    } catch (err) {
      console.error("Error deleting items:", err);
      toast.error("Error al eliminar los items seleccionados");
    }
  };

  const handleClearPantry = useCallback(async () => {
    try {
      await clearPantry();
      toast.success('Despensa vaciada correctamente');
      await loadData();
    } catch (error) {
      console.error('Error al vaciar despensa:', error);
      toast.error('No se pudo vaciar la despensa');
    }
  }, [loadData]);

  // Procesamiento de datos (Agrupación y Filtrado)
  const processedItems = useMemo(() => {
    let filtered = [...pantryItems];

    // 1. Filtrar por categoría o favoritos
    if (filters.categoryId === 'favorites') {
      filtered = filtered.filter(item => item.is_favorite);
    } else if (filters.categoryId && filters.categoryId !== 'all') {
      filtered = filtered.filter(item => item.category_id === filters.categoryId);
    }

    // 2. Filtrar por término de búsqueda
    if (filters.searchTerm) {
      const searchLower = filters.searchTerm.toLowerCase();
      filtered = filtered.filter(item =>
        item.ingredient?.name?.toLowerCase().includes(searchLower) ?? false
      );
    }

    // 3. Agrupar por categoría
    const groupedByCategory = filtered.reduce((acc, item) => {
      const category = categories.find(c => c.id === item.category_id) || null;
      const groupKey = category?.id || 'uncategorized'; // Usar ID o 'uncategorized'

      if (!acc[groupKey]) {
        // Crear grupo si no existe
        acc[groupKey] = { category, items: [] };
      }
      acc[groupKey].items.push(item);

      return acc;
    }, {} as Record<string, { category: Category | null; items: PantryItem[] }>);

    // 4. Convertir a array y ordenar categorías
    return Object.values(groupedByCategory).sort((a, b) => {
      // 'Sin Categoría' al final
      if (!a.category && b.category) return 1;
      if (a.category && !b.category) return -1;
      // Ordenar por nombre de categoría
      return (a.category?.name || '').localeCompare(b.category?.name || '');
    });
  }, [pantryItems, categories, filters]);

  return (
    <div className="container mx-auto py-8 px-4 md:px-6 lg:px-8 relative">
      <Card>
        <CardHeader className="pb-4">
          {/* Título y Controles de Selección/Vista */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-4">
            <CardTitle className="text-2xl font-bold">Mi Despensa</CardTitle>
            <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
              <Suspense fallback={null}>
                {!isSelectionMode ? (
                  <>
                    {isDesktop && (
                      <>
                        <Button
                          variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                          size="sm"
                          onClick={() => setViewMode('list')}
                        >
                          <List className="h-4 w-4" />
                        </Button>
                        <Button
                          variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                          size="sm"
                          onClick={() => setViewMode('grid')}
                        >
                          <LayoutGrid className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                    <PantrySelectionControls
                      isSelectionMode={isSelectionMode}
                      selectedItems={selectedItems}
                      onSelectAll={() => setSelectedItems(new Set(pantryItems.map(item => item.id)))}
                      onDeselectAll={() => setSelectedItems(new Set())}
                      onEnterSelectionMode={() => setIsSelectionMode(true)}
                      onCancelSelection={() => { /* No necesario si el botón solo aparece en modo selección */ }}
                      onDeleteSelected={handleDeleteSelected}
                      totalVisibleItems={pantryItems.length}
                    />
                  </>
                ) : (
                  <PantrySelectionControls
                    isSelectionMode={isSelectionMode}
                    selectedItems={selectedItems}
                    onSelectAll={() => setSelectedItems(new Set(pantryItems.map(item => item.id)))}
                    onDeselectAll={() => setSelectedItems(new Set())}
                    onEnterSelectionMode={() => setIsSelectionMode(true)} // Redundante aquí?
                    onCancelSelection={() => {
                      setIsSelectionMode(false);
                      setSelectedItems(new Set());
                    }}
                    onDeleteSelected={handleDeleteSelected}
                    totalVisibleItems={pantryItems.length}
                  />
                )}
              </Suspense>
            </div>
          </div>

          {/* Filtros */}
          <Suspense fallback={null}>
            <PantryFiltersSection
              categories={categories}
              isDesktop={isDesktop}
              filters={filters}
              onFilterChange={handleFilterChange}
              showFiltersSheet={showFiltersSheet} // ¿Se usa?
              setShowFiltersSheet={setShowFiltersSheet} // ¿Se usa?
              pantryItems={pantryItems}
              onClearPantry={handleClearPantry}
            />
          </Suspense>
        </CardHeader>

        {/* Input Unificado (Movido aquí) */}
        {!isSelectionMode && (
          <div className="px-4 md:px-6 lg:px-8 pt-4 pb-2 border-t border-b"> {/* Padding y bordes */}
            <Suspense fallback={<Spinner size="sm" />}>
              <UnifiedPantryInput
                onItemAdded={loadData}
                availableCategories={categories}
                onEditRequest={handleEditRequestFromUnifiedInput}
              />
            </Suspense>
          </div>
        )}

        {/* Contenido Principal (Lista/Grid) */}
        <CardContent className="pt-6 pb-6"> {/* Padding ajustado */}
          <Suspense fallback={<Spinner />}>
            <PantryItemsView
              viewMode={viewMode}
              processedItems={processedItems}
              isLoading={isLoading}
              error={error}
              isSelectionMode={isSelectionMode}
              selectedItems={selectedItems}
              onSelectItem={handleSelectItem}
              onEditItem={handleEditItem} // Pasar handler de edición
              onDeleteItem={() => {}} // TODO: Implementar delete individual si es necesario
              onToggleFavorite={handleToggleFavorite}
            />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}

export default PantryPage;
