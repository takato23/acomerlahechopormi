import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { List, LayoutGrid } from 'lucide-react';
import { notifyError, notifySuccess } from '@/lib/notifications';
import { EmptyState } from '@/components/common/EmptyState';
import { Spinner } from '@/components/ui/Spinner';
import {
  getPantryItems,
  getCategories,
  deleteMultiplePantryItems,
  toggleFavoritePantryItem,
  clearPantry,
  addPantryItem,
  updatePantryItem,
  deletePantryItem
} from './pantryService';
import type { PantryItem, Category, CreatePantryItemData, UpdatePantryItemData } from './types';
import useBreakpoint from '@/hooks/useBreakpoint';
import { Suspense } from 'react';

import PantryFiltersSection from './components/PantryFiltersSection';
import PantrySelectionControls from './components/PantrySelectionControls';
import PantryItemsView from './components/PantryItemsView';
import UnifiedPantryInput from './components/UnifiedPantryInput';
import AddPantryItemForm from './AddPantryItemForm';
import { PantrySkeleton } from '@/components/common/PantrySkeleton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog';

export function PantryPage() {
  // Estados del componente
  const currentBreakpoint = useBreakpoint();
  const isDesktop = currentBreakpoint === 'desktop';
  const [pantryItems, setPantryItems] = useState<PantryItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [itemToEdit, setItemToEdit] = useState<PantryItem | null>(null);
  const [createDraft, setCreateDraft] = useState<CreatePantryItemData | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [itemPendingDelete, setItemPendingDelete] = useState<PantryItem | null>(null);
  const [showFiltersSheet, setShowFiltersSheet] = useState(false);
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
    setItemToEdit(item);
    setCreateDraft(null);
    setIsModalOpen(true);
  }, []);

  const handleEditRequestFromUnifiedInput = useCallback((data: CreatePantryItemData) => {
    setItemToEdit(null);
    setCreateDraft(data);
    setIsModalOpen(true);
  }, []);

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
      const itemName = updatedItem.ingredient?.name ?? 'Ítem';
      const successMessage = newState
        ? `Marcamos ${itemName} como favorito.`
        : `Quitamos ${itemName} de favoritos.`;
      notifySuccess(successMessage);
      // Opcional: Sincronizar con el estado devuelto por el servidor si es necesario
      // setPantryItems(prevItems =>
      //   prevItems.map(item => (item.id === updatedItem.id ? updatedItem : item))
      // );
    } catch (error) {
      console.error("Error toggling favorite:", error);
      notifyError('No pudimos actualizar el favorito. Inténtalo nuevamente.');
      // Revertir
      setPantryItems(prevItems =>
        prevItems.map(item =>
          item.id === itemId ? { ...item, is_favorite: currentState } : item
        )
      );
    }
  }, [pantryItems]); // Depender de pantryItems para tener el currentState correcto

  const handleDeleteItem = useCallback((itemId: string) => {
    const targetItem = pantryItems.find(item => item.id === itemId) || null;
    setItemPendingDelete(targetItem);
    setIsDeleteDialogOpen(true);
  }, [pantryItems]);

  const handleModalClose = useCallback(() => {
    setIsModalOpen(false);
    setItemToEdit(null);
    setCreateDraft(null);
  }, []);

  const handleSubmitPantryItem = useCallback(
    async (data: CreatePantryItemData | UpdatePantryItemData, closeModalAfterSubmit: boolean) => {
      try {
        if (itemToEdit) {
          await updatePantryItem(itemToEdit.id, data as UpdatePantryItemData);
          notifySuccess('Actualizamos el ítem en tu despensa.');
        } else {
          await addPantryItem(data as CreatePantryItemData);
          notifySuccess('Agregamos el ítem a tu despensa.');
        }
        await loadData();
        if (closeModalAfterSubmit) {
          handleModalClose();
        }
      } catch (error) {
        console.error('Error guardando item de despensa:', error);
        notifyError('No pudimos guardar el ítem. Inténtalo nuevamente.');
      }
    },
    [handleModalClose, itemToEdit, loadData]
  );

  const handleConfirmDelete = useCallback(async () => {
    if (!itemPendingDelete) {
      setIsDeleteDialogOpen(false);
      return;
    }
    try {
      await deletePantryItem(itemPendingDelete.id);
      const deletedName = itemPendingDelete.ingredient?.name ?? 'el ítem';
      notifySuccess(`Eliminamos ${deletedName} de tu despensa.`);
      await loadData();
    } catch (error) {
      console.error('Error eliminando item:', error);
      notifyError('No pudimos eliminar el ítem. Inténtalo nuevamente.');
    } finally {
      setIsDeleteDialogOpen(false);
      setItemPendingDelete(null);
    }
  }, [itemPendingDelete, loadData]);

  const handleDeleteSelected = async () => {
    try {
      const itemIdsArray = Array.from(selectedItems);
      await deleteMultiplePantryItems(itemIdsArray);
      notifySuccess(`Eliminamos ${itemIdsArray.length} ítems seleccionados.`);
      await loadData();
      setIsSelectionMode(false);
      setSelectedItems(new Set());
    } catch (err) {
      console.error("Error deleting items:", err);
      notifyError('No pudimos eliminar los ítems seleccionados. Inténtalo nuevamente.');
    }
  };

  const handleCancelSelection = useCallback(() => {
    setIsSelectionMode(false);
    setSelectedItems(new Set());
  }, []);

  const handleClearPantry = useCallback(async () => {
    try {
      await clearPantry();
      notifySuccess('Vaciamos tu despensa.');
      await loadData();
    } catch (error) {
      console.error('Error al vaciar despensa:', error);
      notifyError('No pudimos vaciar la despensa. Inténtalo nuevamente.');
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

    // 3. Filtrar por etiquetas
    if (filters.tags) {
      const activeTags = filters.tags
        .split(',')
        .map(tag => tag.trim().toLowerCase())
        .filter(tag => tag.length > 0);

      if (activeTags.length > 0) {
        filtered = filtered.filter(item => {
          const itemTags = item.tags?.map(tag => tag.toLowerCase()) ?? [];
          return activeTags.every(tag => itemTags.includes(tag));
        });
      }
    }

    // 4. Agrupar por categoría
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

    // 5. Convertir a array y ordenar categorías
    return Object.values(groupedByCategory).sort((a, b) => {
      // 'Sin Categoría' al final
      if (!a.category && b.category) return 1;
      if (a.category && !b.category) return -1;
      // Ordenar por nombre de categoría
      return (a.category?.name || '').localeCompare(b.category?.name || '');
    });
  }, [pantryItems, categories, filters]);

  const visibleItems = useMemo(
    () => processedItems.flatMap(group => group.items),
    [processedItems]
  );

  useEffect(() => {
    setSelectedItems(prev => {
      if (prev.size === 0) return prev;
      const visibleIds = new Set(visibleItems.map(item => item.id));
      const retainedIds = [...prev].filter(id => visibleIds.has(id));
      if (retainedIds.length === prev.size) {
        return prev;
      }
      return new Set(retainedIds);
    });
  }, [visibleItems]);

  const handleSelectAllVisible = useCallback(() => {
    setSelectedItems(new Set(visibleItems.map(item => item.id)));
  }, [visibleItems]);

  const handleDeselectAll = useCallback(() => {
    setSelectedItems(new Set());
  }, []);

  // Mostrar skeleton mientras carga inicialmente
  if (isLoading && pantryItems.length === 0) {
    return <PantrySkeleton />;
  }

  return (
    <div className="container mx-auto py-8 px-4 md:px-6 lg:px-8 relative">
      <Card>
        <CardHeader className="pb-4">
          {/* Título y Controles de Selección/Vista */}
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mb-4">
            <CardTitle className="text-2xl font-bold">Mi Despensa</CardTitle>
            <div className="flex w-full flex-wrap items-center gap-2 md:w-auto md:justify-end">
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
                      onSelectAll={handleSelectAllVisible}
                      onDeselectAll={handleDeselectAll}
                      onEnterSelectionMode={() => setIsSelectionMode(true)}
                      onCancelSelection={handleCancelSelection}
                      onDeleteSelected={handleDeleteSelected}
                      totalVisibleItems={visibleItems.length}
                    />
                  </>
                ) : (
                  <PantrySelectionControls
                    isSelectionMode={isSelectionMode}
                    selectedItems={selectedItems}
                    onSelectAll={handleSelectAllVisible}
                    onDeselectAll={handleDeselectAll}
                    onEnterSelectionMode={() => setIsSelectionMode(true)}
                    onCancelSelection={handleCancelSelection}
                    onDeleteSelected={handleDeleteSelected}
                    totalVisibleItems={visibleItems.length}
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
              onDeleteItem={handleDeleteItem}
              onToggleFavorite={handleToggleFavorite}
            />
          </Suspense>
        </CardContent>
      </Card>

      <AddPantryItemForm
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onSubmit={handleSubmitPantryItem}
        itemToEdit={itemToEdit}
        categories={categories}
        initialData={createDraft}
      />

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar item?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará definitivamente{' '}
              <span className="font-semibold">
                {itemPendingDelete?.ingredient?.name ?? 'este item'}
              </span>{' '}
              de tu despensa.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setItemPendingDelete(null)}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete}>
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
