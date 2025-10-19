import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { List, LayoutGrid, ShoppingBasket } from 'lucide-react';
import { toast } from 'sonner';
import { Spinner } from '@/components/ui/Spinner';
import {
  getPantryItems,
  getCategories,
  deleteMultiplePantryItems,
  toggleFavoritePantryItem,
  clearPantry,
} from './pantryService';
import type { PantryItem, Category, CreatePantryItemData } from './types';
import useBreakpoint from '@/hooks/useBreakpoint';
import { Suspense } from 'react';

import PantryFiltersSection from './components/PantryFiltersSection';
import PantrySelectionControls from './components/PantrySelectionControls';
import PantryItemsView from './components/PantryItemsView';
import UnifiedPantryInput from './components/UnifiedPantryInput';
import { PageLayout } from '@/components/layout/PageLayout';
import { PageSection } from '@/components/ui/PageSection';

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
  const [viewMode, setViewMode] = useState<'list' | 'grid'>(() => (isDesktop ? 'list' : 'grid'));
  const [filters, setFilters] = useState({
    searchTerm: '',
    categoryId: 'all',
    tags: '', // ¿Se usa el filtro de tags?
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
        getPantryItems(),
      ]);
      console.log('[PantryPage] Fetched Items Sample:', fetchedItems.slice(0, 2)); // DEBUG: Log first 2 items
      setCategories(fetchedCategories);
      setPantryItems(fetchedItems);
    } catch (err) {
      console.error('Error loading pantry data:', err);
      setError('No se pudo cargar la despensa. Intenta de nuevo más tarde.');
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
    setSelectedItems((prev) => {
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
    console.log('Edit item requested:', item);
    setItemToEdit(item); // Guardar item a editar
    // setIsModalOpen(true); // Abrir modal si existe
    toast.info(`Editar ${item.ingredient?.name} (funcionalidad pendiente)`);
  }, []);

  const handleEditRequestFromUnifiedInput = useCallback(
    (data: CreatePantryItemData) => {
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
    },
    [handleEditItem],
  );

  const handleToggleFavorite = useCallback(
    async (itemId: string) => {
      // Encontrar el estado actual antes de la actualización optimista
      const currentItem = pantryItems.find((item) => item.id === itemId);
      if (!currentItem) return; // No hacer nada si el item no se encuentra

      const currentState = Boolean(currentItem.is_favorite);
      const newState = !currentState;

      // Actualización optimista
      setPantryItems((prevItems) =>
        prevItems.map((item) => (item.id === itemId ? { ...item, is_favorite: newState } : item)),
      );

      try {
        const updatedItem = await toggleFavoritePantryItem(itemId, newState);
        if (!updatedItem) {
          throw new Error('Failed to update favorite status');
        }
        toast.success(
          `${updatedItem.ingredient?.name} ${newState ? 'añadido a' : 'quitado de'} favoritos`,
        );
        // Opcional: Sincronizar con el estado devuelto por el servidor si es necesario
        // setPantryItems(prevItems =>
        //   prevItems.map(item => (item.id === updatedItem.id ? updatedItem : item))
        // );
      } catch (error) {
        console.error('Error toggling favorite:', error);
        toast.error('Error al actualizar favorito');
        // Revertir
        setPantryItems((prevItems) =>
          prevItems.map((item) =>
            item.id === itemId ? { ...item, is_favorite: currentState } : item,
          ),
        );
      }
    },
    [pantryItems],
  ); // Depender de pantryItems para tener el currentState correcto

  const handleEnterSelectionMode = useCallback(() => {
    setIsSelectionMode(true);
  }, []);

  const handleCancelSelection = useCallback(() => {
    setIsSelectionMode(false);
    setSelectedItems(new Set());
  }, []);

  const handleSelectAllItems = useCallback(() => {
    setSelectedItems(new Set(pantryItems.map((item) => item.id)));
  }, [pantryItems]);

  const handleDeselectAllItems = useCallback(() => {
    setSelectedItems(new Set());
  }, []);

  const handleDeleteSelected = async () => {
    try {
      const itemIdsArray = Array.from(selectedItems);
      await deleteMultiplePantryItems(itemIdsArray);
      toast.success(`${itemIdsArray.length} items eliminados`);
      await loadData();
      handleCancelSelection();
    } catch (err) {
      console.error('Error deleting items:', err);
      toast.error('Error al eliminar los items seleccionados');
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
      filtered = filtered.filter((item) => item.is_favorite);
    } else if (filters.categoryId && filters.categoryId !== 'all') {
      filtered = filtered.filter((item) => item.category_id === filters.categoryId);
    }

    // 2. Filtrar por término de búsqueda
    if (filters.searchTerm) {
      const searchLower = filters.searchTerm.toLowerCase();
      filtered = filtered.filter(
        (item) => item.ingredient?.name?.toLowerCase().includes(searchLower) ?? false,
      );
    }

    // 3. Agrupar por categoría
    const groupedByCategory = filtered.reduce(
      (acc, item) => {
        const category = categories.find((c) => c.id === item.category_id) || null;
        const groupKey = category?.id || 'uncategorized'; // Usar ID o 'uncategorized'

        if (!acc[groupKey]) {
          // Crear grupo si no existe
          acc[groupKey] = { category, items: [] };
        }
        acc[groupKey].items.push(item);

        return acc;
      },
      {} as Record<string, { category: Category | null; items: PantryItem[] }>,
    );

    // 4. Convertir a array y ordenar categorías
    return Object.values(groupedByCategory).sort((a, b) => {
      // 'Sin Categoría' al final
      if (!a.category && b.category) return 1;
      if (a.category && !b.category) return -1;
      // Ordenar por nombre de categoría
      return (a.category?.name || '').localeCompare(b.category?.name || '');
    });
  }, [pantryItems, categories, filters]);

  const headerActions = (
    <div className="flex flex-wrap items-center gap-section-sm">
      {!isSelectionMode && isDesktop && (
        <div className="inline-flex items-center gap-1 rounded-full border border-border bg-muted/50 p-1">
          <Button
            variant={viewMode === 'list' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('list')}
            aria-pressed={viewMode === 'list'}
          >
            <List className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('grid')}
            aria-pressed={viewMode === 'grid'}
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
        </div>
      )}
      <PantrySelectionControls
        isSelectionMode={isSelectionMode}
        selectedItems={selectedItems}
        onEnterSelectionMode={handleEnterSelectionMode}
        onSelectAll={handleSelectAllItems}
        onDeselectAll={handleDeselectAllItems}
        onCancelSelection={handleCancelSelection}
        onDeleteSelected={handleDeleteSelected}
        totalVisibleItems={pantryItems.length}
      />
    </div>
  );

  return (
    <PageLayout
      title="Mi Despensa"
      description="Gestiona tus ingredientes y favoritos desde un único panel."
      icon={<ShoppingBasket className="h-6 w-6" />}
      actions={headerActions}
    >
      <PageSection padded>
        <Suspense fallback={null}>
          <PantryFiltersSection
            categories={categories}
            isDesktop={isDesktop}
            filters={filters}
            onFilterChange={handleFilterChange}
            showFiltersSheet={showFiltersSheet}
            setShowFiltersSheet={setShowFiltersSheet}
            pantryItems={pantryItems}
            onClearPantry={handleClearPantry}
          />
        </Suspense>

        {!isSelectionMode && (
          <Suspense fallback={<Spinner size="sm" />}>
            <UnifiedPantryInput
              onItemAdded={loadData}
              availableCategories={categories}
              onEditRequest={handleEditRequestFromUnifiedInput}
            />
          </Suspense>
        )}

        <Suspense fallback={<Spinner />}>
          <PantryItemsView
            viewMode={viewMode}
            processedItems={processedItems}
            isLoading={isLoading}
            error={error}
            isSelectionMode={isSelectionMode}
            selectedItems={selectedItems}
            onSelectItem={handleSelectItem}
            onEditItem={handleEditItem}
            onDeleteItem={() => {}}
            onToggleFavorite={handleToggleFavorite}
          />
        </Suspense>
      </PageSection>
    </PageLayout>
  );
}

export default PantryPage;
