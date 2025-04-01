import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { PantryList } from './PantryList';
import { PantryGrid } from './PantryGrid';
import { PantryFilters } from './components/PantryFilters';
import { AddPantryItemForm } from './AddPantryItemForm';
import PantryAccordionItemRow from './components/PantryAccordionItemRow'; // Corregido: importación por defecto
import { Button } from '../../components/ui/button';
// Importar iconos necesarios
import { PlusCircle, AlertCircle, List, LayoutGrid, Inbox, Filter, CheckSquare, X, Square, Trash } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '../../components/ui/alert-dialog';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Trash2 } from 'lucide-react'; // Mantener para el botón Vaciar
import { getPantryItems, getCategories, addPantryItem, updatePantryItem, deletePantryItem, deleteMultiplePantryItems } from './pantryService';
import { PantryItem, Category, CreatePantryItemData, UpdatePantryItemData, Ingredient } from './types'; // Añadir Ingredient si no está ya
import { Spinner } from '../../components/ui/Spinner';
import { toast } from 'sonner';
import { UnifiedPantryInput } from './components/UnifiedPantryInput';
import { EmptyState } from '@/components/common/EmptyState';
import useBreakpoint from '@/hooks/useBreakpoint';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"; // Importar Select
export function PantryPage() {
  // Hooks para estado
  const currentBreakpoint = useBreakpoint(); // No necesita argumento
  const isDesktop = currentBreakpoint === 'desktop'; // Comparar con el valor devuelto
  const [pantryItems, setPantryItems] = useState<PantryItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [itemToEdit, setItemToEdit] = useState<PantryItem | null>(null);
  const [showFiltersSheet, setShowFiltersSheet] = useState(false);
  
  // Vista por defecto: grid en móvil, lista en escritorio
  const [viewMode, setViewMode] = useState<'list' | 'grid'>(() =>
    isDesktop ? 'list' : 'grid'
  );
  
  const [filters, setFilters] = useState({
    searchTerm: '',
    categoryId: 'all',
    tags: ''
  });
  const [sortOrder, setSortOrder] = useState<'default' | 'expiry_asc' | 'name_asc' | 'name_desc' | 'category_asc' | 'category_desc'>('default'); // Estado para ordenación
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [isSelectionMode, setIsSelectionMode] = useState<boolean>(false);
  // Llave extra eliminada

  // Función para cargar datos iniciales
  const loadData = useCallback(async () => {
    console.log("--- Executing loadData to refresh pantry items ---"); // Log para verificar ejecución
    setIsLoading(true);
    setError(null);
    try {
      // Cargar categorías y items en paralelo
      const [fetchedCategories, fetchedItems] = await Promise.all([
        getCategories(),
        getPantryItems()
      ]);
      console.log("Fetched Items:", fetchedItems); // DEBUG: Ver estructura de ítems
      setCategories(fetchedCategories);
      setPantryItems(fetchedItems);
    } catch (err) {
      console.error("Error loading pantry data:", err);
      setError("No se pudo cargar la despensa. Intenta de nuevo más tarde.");
      setPantryItems([]); // Limpiar items en caso de error
      setCategories([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Cargar datos al montar el componente
  useEffect(() => {
    loadData();
  }, [loadData]);


  // --- Tipos para datos procesados ---
  // Extiende PantryItem para incluir información de consolidación
  type ProcessedPantryItem = PantryItem & {
    _consolidatedCount?: number; // Cuántos items originales representa
    _originalItems?: PantryItem[]; // Referencia a los items originales (opcional)
  };

  // Estructura para los datos agrupados por categoría
  type GroupedPantryData = {
    category: Category | null; // Categoría (o null para 'Sin categoría')
    items: ProcessedPantryItem[]; // Items procesados (consolidados o individuales)
  };

  // --- Memoización con Agrupación, Consolidación, Filtrado y Ordenación ---
  const processedItems: GroupedPantryData[] = useMemo(() => {
    console.log("--- Recalculando processedItems ---");
    console.log("Filtros actuales:", filters);
    console.log("Orden actual:", sortOrder);
    console.log("Items originales:", pantryItems.length);

    // 1. Agrupar por Categoría
    const groupedByCategory = new Map<string | null, PantryItem[]>();
    pantryItems.forEach(item => {
      const categoryId = item.category_id ?? null; // Usar null para sin categoría
      if (!groupedByCategory.has(categoryId)) {
        groupedByCategory.set(categoryId, []);
      }
      groupedByCategory.get(categoryId)!.push(item);
    });
    console.log("Items agrupados por categoría:", groupedByCategory.size, "grupos");

    // 2. Consolidar Ítems dentro de cada Grupo y Crear ProcessedPantryItem
    const consolidatedGroups: GroupedPantryData[] = [];
    const categoryMap = new Map(categories.map(cat => [cat.id, cat])); // Mapa para buscar categorías por ID

    groupedByCategory.forEach((itemsInGroup, categoryId) => {
      // 2a. Agrupar por Ingrediente dentro de la categoría
      const groupedByIngredient = new Map<string, PantryItem[]>();
      itemsInGroup.forEach(item => {
        const ingredientId = item.ingredient_id; // Clave de agrupación principal
        if (!groupedByIngredient.has(ingredientId)) {
          groupedByIngredient.set(ingredientId, []);
        }
        groupedByIngredient.get(ingredientId)!.push(item);
      });

      // 2b. Procesar cada grupo de ingredientes
      const processedItemsForCategory: ProcessedPantryItem[] = [];
      groupedByIngredient.forEach((ingredientItems, ingredientId) => {
        if (ingredientItems.length === 1) {
          // Ítem único para este ingrediente, añadir directamente
          processedItemsForCategory.push({
            ...ingredientItems[0],
            _consolidatedCount: 1, // Marcar como no consolidado/agrupado
            _originalItems: [ingredientItems[0]] // Incluirse a sí mismo para consistencia
          });
        } else {
          // Múltiples ítems para el mismo ingrediente (variantes/lotes)
          const representativeItem = { ...ingredientItems[0] }; // Usar el primero como base

          // Calcular cantidad total SOLO si todas las unidades son iguales
          const firstUnit = representativeItem.unit;
          const allUnitsSame = ingredientItems.every(item => item.unit === firstUnit);
          let totalQuantity: number | null = null;
          if (allUnitsSame) {
            totalQuantity = ingredientItems.reduce((sum, item) => sum + (item.quantity ?? 0), 0);
          }

          // Crear el ítem procesado representante
          const processedRepresentative: ProcessedPantryItem = {
            ...representativeItem,
            // Usar cantidad total si las unidades coinciden, sino la del representante
            quantity: allUnitsSame ? totalQuantity : representativeItem.quantity,
            // Mantener la unidad del representante (o la común si todas son iguales)
            unit: representativeItem.unit,
            // La fecha de caducidad del representante puede ser la más próxima o la del primero.
            // Por simplicidad, mantenemos la del primero. Los detalles estarán en la expansión.
            expiry_date: representativeItem.expiry_date,
            // Establecer contador y lista de originales
            _consolidatedCount: ingredientItems.length,
            _originalItems: ingredientItems, // Guardar todos los ítems originales
            // Otros campos como precio, notas, etc., se toman del representante.
            // La vista expandida mostrará los valores individuales.
          };
          processedItemsForCategory.push(processedRepresentative);
        }
      });

      // Añadir el grupo de categoría procesado
      const categoryInfo = categoryId ? categoryMap.get(categoryId) ?? null : null;
      consolidatedGroups.push({
        category: categoryInfo,
        items: processedItemsForCategory,
      });
    });
    console.log("Items consolidados:", consolidatedGroups.length, "grupos");

    // 3. Filtrar Grupos y Ítems
    let filteredGroups = consolidatedGroups
      // Filtrar por categoría a nivel de grupo
      .filter(group => {
        const categoryIdFilter = filters.categoryId;
        if (categoryIdFilter === 'all') return true;
        if (categoryIdFilter === 'unassigned') return group.category === null;
        return group.category?.id === categoryIdFilter;
      })
      // Filtrar ítems dentro de cada grupo restante y eliminar grupos vacíos
      .map(group => {
        const filteredItems = group.items.filter(item => {
          // Filtrar por término de búsqueda (nombre)
          const itemName = item.ingredient?.name;
          const nameMatch = itemName
            ? itemName.toLowerCase().includes(filters.searchTerm.toLowerCase())
            : filters.searchTerm === ''; // Si no hay nombre, coincide si no hay término

          // Filtrar por tags
          const filterTags = filters.tags.split(',').map(t => t.trim().toLowerCase()).filter(t => t.length > 0);
          const itemTags = item.tags?.map(t => t.toLowerCase()) || [];
          const tagsMatch = filterTags.length === 0 || filterTags.every(filterTag => itemTags.includes(filterTag));

          return nameMatch && tagsMatch;
        });
        return { ...group, items: filteredItems };
      })
      // Eliminar grupos que quedaron sin ítems después del filtro interno
      .filter(group => group.items.length > 0);

    console.log("Grupos después de filtrar:", filteredGroups.length);


    // 4. Ordenar Ítems dentro de cada Grupo Filtrado
    filteredGroups.forEach(group => {
      group.items.sort((a, b) => {
        if (sortOrder === 'expiry_asc') {
          const dateA = a.expiry_date ? new Date(a.expiry_date).getTime() : Infinity;
          const dateB = b.expiry_date ? new Date(b.expiry_date).getTime() : Infinity;
          // Manejo de nulos/undefined (Infinity)
          if (!isFinite(dateA) && !isFinite(dateB)) return 0; // Ambos sin fecha
          if (!isFinite(dateA)) return 1; // 'a' sin fecha va al final
          if (!isFinite(dateB)) return -1; // 'b' sin fecha va al final
          return dateA - dateB; // Comparar fechas válidas
        } else if (sortOrder === 'name_asc') {
          const nameA = a.ingredient?.name;
          const nameB = b.ingredient?.name;
          // Manejo de nulos/undefined para nombres
          if (nameA == null && nameB == null) return 0; // Ambos sin nombre
          if (nameA == null) return 1; // 'a' sin nombre va al final
          if (nameB == null) return -1; // 'b' sin nombre va al final
          return nameA.localeCompare(nameB); // Comparar nombres válidos
        } else if (sortOrder === 'name_desc') {
          const nameA = a.ingredient?.name;
          const nameB = b.ingredient?.name;
          // Manejo de nulos/undefined para nombres (descendente)
          if (nameA == null && nameB == null) return 0;
          if (nameA == null) return 1; // 'a' sin nombre va al final
          if (nameB == null) return -1; // 'b' sin nombre va al final
          return nameB.localeCompare(nameA); // Invertir comparación para descendente
        } else if (sortOrder === 'category_asc') {
          const catNameA = a.category?.name;
          const catNameB = b.category?.name;
          // Manejo de nulos/undefined para categorías
          if (catNameA == null && catNameB == null) return 0; // Ambas sin categoría
          if (catNameA == null) return 1; // 'a' sin categoría va al final
          if (catNameB == null) return -1; // 'b' sin categoría va al final
          return catNameA.localeCompare(catNameB); // Comparar nombres de categoría válidos
        } else if (sortOrder === 'category_desc') {
          const catNameA = a.category?.name;
          const catNameB = b.category?.name;
          // Manejo de nulos/undefined para categorías (descendente)
          if (catNameA == null && catNameB == null) return 0;
          if (catNameA == null) return 1; // 'a' sin categoría va al final
          if (catNameB == null) return -1; // 'b' sin categoría va al final
          return catNameB.localeCompare(catNameA); // Invertir comparación para descendente
        } else { // default (orden por nombre ascendente como fallback)
          const nameA = a.ingredient?.name;
          const nameB = b.ingredient?.name;
          if (nameA == null && nameB == null) return 0;
          if (nameA == null) return 1;
          if (nameB == null) return -1;
          return nameA.localeCompare(nameB);
        }
      });
    });

    // 5. Opcional: Ordenar los Grupos (ej. alfabéticamente, Sin categoría al final)
    filteredGroups.sort((groupA, groupB) => {
        const nameA = groupA.category?.name ?? 'Ω'; // Usar un carácter alto para poner null al final
        const nameB = groupB.category?.name ?? 'Ω';
        // Considerar 'Sin categoría' explícitamente si se prefiere un nombre específico
        const displayNameA = groupA.category === null ? "Sin categoría" : nameA;
        const displayNameB = groupB.category === null ? "Sin categoría" : nameB;

        if (displayNameA === "Sin categoría" && displayNameB !== "Sin categoría") return 1;
        if (displayNameA !== "Sin categoría" && displayNameB === "Sin categoría") return -1;

        return displayNameA.localeCompare(displayNameB);
    });


    console.log("--- Cálculo de processedItems finalizado ---");
    return filteredGroups;

  }, [pantryItems, categories, filters, sortOrder]); // Dependencias: items, categorías (para nombres), filtros y orden


  // --- Handlers para Selección Múltiple ---

  const handleSelectItem = useCallback((itemId: string) => {
    setSelectedItems(prevSelected => {
      const newSelected = new Set(prevSelected);
      if (newSelected.has(itemId)) {
        newSelected.delete(itemId);
      } else {
        newSelected.add(itemId);
      }
      return newSelected;
    });
  }, []);

  const handleSelectAll = useCallback(() => {
    // Extraer IDs de todos los items visibles en todos los grupos
    const allVisibleItemIds = processedItems.flatMap(group => group.items.map(item => item.id));
    setSelectedItems(new Set(allVisibleItemIds));
  }, [processedItems]); // Depende de los items actualmente visibles/filtrados

  const handleDeselectAll = useCallback(() => {
    setSelectedItems(new Set());
  }, []);

  const handleCancelSelection = useCallback(() => {
    setIsSelectionMode(false);
    setSelectedItems(new Set());
  }, []);

  const handleDeleteSelected = async () => {
    const itemsToDeleteCount = selectedItems.size;
    // La confirmación se maneja con AlertDialog, esta es la lógica post-confirmación
    // La comprobación de itemsToDeleteCount === 0 se hace en el AlertDialogTrigger o al llamar la función
    try {
      const itemIdsArray = Array.from(selectedItems);
      await deleteMultiplePantryItems(itemIdsArray);
      toast.success(`${itemsToDeleteCount} ${itemsToDeleteCount === 1 ? 'ítem eliminado' : 'ítems eliminados'} correctamente.`);
      await loadData(); // Recargar datos
      handleCancelSelection(); // Salir del modo selección y limpiar
    } catch (err) {
      console.error("Error deleting selected items:", err);
      toast.error("Error al eliminar los ítems seleccionados.");
      // Opcional: No salir del modo selección si hay error? Depende del UX deseado.
      // handleCancelSelection();
    }
  };

  // --- Handlers para CRUD ---

  const handleOpenAddModal = () => {
    setItemToEdit(null); // Asegurar que no hay item para editar
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item: PantryItem) => {
    setItemToEdit(item);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setItemToEdit(null); // Limpiar item en edición al cerrar
  };

  const handleSubmitItem = async (data: CreatePantryItemData | UpdatePantryItemData, closeModal: boolean) => { // Añadir closeModal
    try {
      let updatedItem: PantryItem; // Añadir tipo explícito
      if (itemToEdit) {
        // Actualizar item
        updatedItem = await updatePantryItem(itemToEdit.id, data as UpdatePantryItemData);
        // Optimistic update removed
        toast.success(`"${updatedItem.ingredient?.name || 'Item'}" actualizado.`);
      } else {
        // Añadir nuevo item
        updatedItem = await addPantryItem(data as CreatePantryItemData);
        // Optimistic update removed
        toast.success(`"${updatedItem.ingredient?.name || 'Item'}" añadido a la despensa.`);
      }
      // Recargar datos y resetear filtros después de añadir/editar para asegurar visibilidad
      await loadData();
      if (!itemToEdit) { // Solo resetear filtros al AÑADIR, no al editar
          resetFilters();
      }

      // Cerrar modal si closeModal es true
      if (closeModal) {
       handleCloseModal();
     }

   } catch (err) {
      console.error("Error submitting item:", err);
      toast.error(`Error al ${itemToEdit ? 'actualizar' : 'añadir'} el item.`);
      throw err;
   }
  };

  // Handler para abrir el modal de edición desde UnifiedPantryInput
  const handleEditRequestFromUnifiedInput = (data: CreatePantryItemData) => {
      // Creamos un objeto PantryItem parcial para pre-rellenar el formulario
      // Nota: No tenemos ID ni otros campos que solo existen en la DB
      const partialItem: Partial<PantryItem> & { ingredient: { name: string } } = {
          ingredient: { name: data.ingredient_name }, // Necesitamos la estructura anidada
          quantity: data.quantity,
          unit: data.unit,
          category_id: data.category_id,
          expiry_date: data.expiry_date,
          // Otros campos de CreatePantryItemData podrían mapearse aquí si AddPantryItemForm los espera
      };
      setItemToEdit(partialItem as PantryItem); // Castear con cuidado, el form debe manejarlo
      setIsModalOpen(true);
  };

  const handleDeleteItem = async (itemId: string) => {
    // TODO: Añadir confirmación antes de borrar
    const itemToDelete = pantryItems.find(item => item.id === itemId);
    if (!itemToDelete) return;

    const itemName = itemToDelete.ingredient?.name || 'Item';
    if (!window.confirm(`¿Seguro que quieres eliminar "${itemName}" de tu despensa?`)) {
        return;
    }

    try {
      await deletePantryItem(itemId);
      setPantryItems(prevItems => prevItems.filter(item => item.id !== itemId));
      toast.success(`"${itemName}" eliminado.`);
    } catch (err) {
      console.error("Error deleting item:", err);
      toast.error(`Error al eliminar "${itemName}".`);
    }
  };

  // Callback para manejar cambios en los filtros
  const handleFilterChange = useCallback((newFilters: { searchTerm: string; categoryId: string; tags: string }) => {
    setFilters(newFilters);
  }, []);

  // Función para resetear filtros al estado inicial
  const resetFilters = useCallback(() => {
      const defaultFilters = { searchTerm: '', categoryId: 'all', tags: '' };
      setFilters(defaultFilters);
      // Opcional: Podríamos necesitar forzar la actualización del componente PantryFilters si no reacciona solo al cambio de estado `filters`.
      // Por ahora, asumimos que reacciona al cambio de estado.
       console.log("Filters reset to default.");
  }, []);

  // El bloque processedItems se movió antes de los handlers de selección

  return (
    <div className="container mx-auto py-8 px-4 md:px-6 lg:px-8 relative">
      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-4">
           <CardTitle className="text-2xl font-bold">Mi Despensa</CardTitle>
           <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
             {/* --- Botones Modo Normal --- */}
             {!isSelectionMode && (
               <>
                 {/* Selector de Vista (solo en desktop) */}
                 {isDesktop && (
                   <>
                     <Button
                       variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                       size="sm"
                       onClick={() => setViewMode('list')}
                       aria-label="Ver como lista"
                     >
                       <List className="h-4 w-4" />
                     </Button>
                     <Button
                       variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                       size="sm"
                       onClick={() => setViewMode('grid')}
                       aria-label="Ver como cuadrícula"
                     >
                       <LayoutGrid className="h-4 w-4" />
                     </Button>
                   </>
                 )}

                 {/* Botón de Filtros (solo en móvil) */}
                 {!isDesktop && categories.length > 0 && (
                   <Button
                     variant="outline"
                     size="sm"
                     onClick={() => setShowFiltersSheet(true)}
                   >
                     <Filter className="h-4 w-4 mr-2" />
                     Filtros
                   </Button>
                 )}

                 {/* Botón Seleccionar */}
                 <Button
                   variant="outline"
                   size="sm"
                   onClick={() => setIsSelectionMode(true)}
                   aria-label="Activar modo selección"
                 >
                   <CheckSquare className="mr-2 h-4 w-4" />
                   Seleccionar
                 </Button>

                 {/* Botón Vaciar Despensa con Confirmación */}
                 <AlertDialog>
                   <AlertDialogTrigger asChild>
                     <Button variant="outline" size="sm" className="text-destructive border-destructive hover:bg-destructive/10">
                       <Trash2 className="mr-2 h-4 w-4" />
                       Vaciar
                     </Button>
                   </AlertDialogTrigger>
                   <AlertDialogContent>
                     <AlertDialogHeader>
                       <AlertDialogTitle>¿Estás absolutely seguro?</AlertDialogTitle>
                       <AlertDialogDescription>
                         Esta acción eliminará permanentemente TODOS los ítems de tu despensa.
                         No podrás deshacer esta acción.
                       </AlertDialogDescription>
                     </AlertDialogHeader>
                     <AlertDialogFooter>
                       <AlertDialogCancel>Cancelar</AlertDialogCancel>
                       <AlertDialogAction
                         // onClick={() => console.log("Confirmar vaciado presionado (lógica pendiente)")}
                         className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                       >
                         Confirmar Vaciar
                       </AlertDialogAction>
                     </AlertDialogFooter>
                   </AlertDialogContent>
                 </AlertDialog>

                 {/* Botón Añadir Item */}
                 <Button size="sm" onClick={handleOpenAddModal}>
                   <PlusCircle className="mr-2 h-4 w-4" />
                   Añadir Item
                 </Button>
               </>
             )}

             {/* --- Botones Modo Selección --- */}
             {isSelectionMode && (
               <>
                 <Button
                   variant="outline"
                   size="sm"
                   onClick={handleCancelSelection}
                   aria-label="Cancelar selección"
                 >
                   <X className="mr-2 h-4 w-4" />
                   Cancelar
                 </Button>
                 <Button
                   variant="outline"
                   size="sm"
                   onClick={handleSelectAll}
                   aria-label="Seleccionar todo"
                 >
                   <CheckSquare className="mr-2 h-4 w-4" />
                   Todos
                 </Button>
                 <Button
                   variant="outline"
                   size="sm"
                   onClick={handleDeselectAll}
                   aria-label="Deseleccionar todo"
                 >
                   <Square className="mr-2 h-4 w-4" />
                   Ninguno
                 </Button>
                 {/* AlertDialog para confirmar eliminación múltiple */}
                 <AlertDialog>
                   <AlertDialogTrigger asChild>
                     <Button
                       variant="destructive"
                       size="sm"
                       aria-label="Eliminar seleccionados"
                       disabled={selectedItems.size === 0} // Deshabilitar si no hay items seleccionados
                     >
                       <Trash className="mr-2 h-4 w-4" />
                       Eliminar ({selectedItems.size})
                     </Button>
                   </AlertDialogTrigger>
                   <AlertDialogContent>
                     <AlertDialogHeader>
                       <AlertDialogTitle>Confirmar Eliminación</AlertDialogTitle>
                       <AlertDialogDescription>
                         ¿Estás seguro de que quieres eliminar {selectedItems.size} {selectedItems.size === 1 ? 'ítem seleccionado' : 'ítems seleccionados'}?
                         Esta acción no se puede deshacer.
                       </AlertDialogDescription>
                     </AlertDialogHeader>
                     <AlertDialogFooter>
                       <AlertDialogCancel>Cancelar</AlertDialogCancel>
                       <AlertDialogAction
                         onClick={handleDeleteSelected} // Llamar al handler al confirmar
                         className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                       >
                         Confirmar Eliminar
                       </AlertDialogAction>
                     </AlertDialogFooter>
                   </AlertDialogContent>
                 </AlertDialog>
               </>
             )}
           </div>
          </div>

         {/* Contenedor para Filtros y Ordenación en Desktop (solo si no estamos en modo selección) */}
         {!isSelectionMode && isDesktop && categories.length > 0 && (
           <div className="flex flex-col sm:flex-row gap-4 mt-4">
             <div className="flex-grow">
               <PantryFilters
                 categories={categories}
                 onFilterChange={handleFilterChange}
                 currentFilters={filters}
               />
             </div>
             <div className="flex-shrink-0 w-full sm:w-auto">
               <Select
                 value={sortOrder}
                 onValueChange={(value) => setSortOrder(value as 'default' | 'expiry_asc' | 'name_asc' | 'name_desc' | 'category_asc' | 'category_desc')}
               >
                 <SelectTrigger className="w-full sm:w-[180px]">
                   <SelectValue placeholder="Ordenar por..." />
                 </SelectTrigger>
                 <SelectContent>
                   <SelectItem value="default">Orden por defecto</SelectItem>
                   <SelectItem value="expiry_asc">Fecha de caducidad</SelectItem>
                   <SelectItem value="name_asc">Nombre (A-Z)</SelectItem>
                   <SelectItem value="name_desc">Nombre (Z-A)</SelectItem>
                   <SelectItem value="category_asc">Categoría (A-Z)</SelectItem>
                   <SelectItem value="category_desc">Categoría (Z-A)</SelectItem>
                 </SelectContent>
               </Select>
             </div>
           </div>
         )}
        </CardHeader>
        <CardContent className="pb-20 lg:pb-6"> {/* Padding para input fijo en móvil */}
         {/* Input Unificado para añadir rápido (solo si no estamos en modo selección) */}
         {!isSelectionMode && (
           <div className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t lg:relative lg:p-0 lg:border-0 lg:mb-6 z-10">
             <UnifiedPantryInput
               onItemAdded={() => {
                 loadData();
                 resetFilters();
               }}
               availableCategories={categories}
               onEditRequest={handleEditRequestFromUnifiedInput}
             />
           </div>
         )}

           {/* Filtros (ya estaban siendo renderizados en el header, quitar comentario TODO) */}
          <div className="mt-4">
            {isLoading ? (
              <div className="flex justify-center items-center py-10">
                <Spinner size="lg" /> {/* Corregido: lg en lugar de large */}
              </div>
            ) : error ? (
              <div className="text-center py-10 text-destructive flex flex-col items-center">
                 <AlertCircle className="w-8 h-8 mb-2" />
                 <p>{error}</p>
                 <Button variant="outline" size="sm" onClick={loadData} className="mt-4">
                    Reintentar Carga
                 </Button>
              </div>
            ) : pantryItems.length === 0 ? (
                // Estado vacío: La despensa original está vacía
                <EmptyState
                    icon={<Inbox />}
                    title="Tu despensa está vacía"
                    description="Usa el campo de arriba para añadir tu primer ítem."
                    // Podríamos añadir una acción aquí si quisiéramos
                />
            ) : processedItems.length === 0 ? ( // Usar processedItems
                // Estado vacío filtrado: Hay items, pero ninguno coincide con los filtros
                <EmptyState
                    icon={<Inbox />} // Podría ser otro icono como FilterX
                    title="No se encontraron ítems"
                    description="Prueba ajustar los filtros de búsqueda o categoría."
                />
            ) : (
              // Hay items y coinciden con los filtros: Renderizar Acordeón
              <Accordion type="multiple" className="w-full">
                {processedItems.map((group) => {
                  // Determinar el componente de vista (Lista o Grid)
                  const ViewComponent = viewMode === 'list' ? PantryList : PantryGrid;
                  const categoryId = group.category?.id || 'unassigned';
                  const categoryName = group.category?.name || 'Sin categoría';

                  return (
                    <AccordionItem value={categoryId} key={categoryId}>
                      <AccordionTrigger>
                        <div className="flex justify-between items-center w-full pr-4"> {/* pr-4 para espacio antes del icono */}
                          <span>{categoryName}</span>
                          <span className="text-sm text-muted-foreground">({group.items.length})</span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="px-2 py-4 sm:p-4"> {/* Increased mobile horizontal padding */}
                        {isDesktop ? (
                          // Vista Desktop: Lista o Grid
                          <ViewComponent
                            items={group.items}
                            onEdit={handleOpenEditModal}
                            onDelete={handleDeleteItem}
                            selectedItems={selectedItems}
                            onSelectItem={handleSelectItem}
                            isSelectionMode={isSelectionMode}
                            // viewMode se infiere internamente o no es necesario aquí
                          />
                        ) : (
                          // Vista Móvil: Lista compacta dentro del acordeón
                          <div className="space-y-2"> {/* Contenedor para las filas */}
                            {group.items.map((item) => (
                              <PantryAccordionItemRow
                                key={item.id}
                                item={item}
                                onEdit={handleOpenEditModal}
                                onDelete={(id) => { // Envolver para ajustar tipo y retorno
                                  if (typeof id === 'string') {
                                    handleDeleteItem(id); // Llamar a la función async original
                                  } else {
                                    console.warn("PantryAccordionItemRow intentó borrar con ID numérico:", id);
                                  }
                                }}
                                // La selección múltiple se maneja a nivel de página, no en la fila individual del acordeón móvil
                              />
                            ))}
                          </div>
                        )}
                      </AccordionContent>
                    </AccordionItem>
                  );
                })}
              </Accordion>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Modal/Formulario para añadir/editar item */}
      <AddPantryItemForm
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSubmit={handleSubmitItem}
        itemToEdit={itemToEdit}
        categories={categories}
      />

      {/* Sheet para filtros en móvil */}
      <Sheet open={showFiltersSheet && !isDesktop} onOpenChange={setShowFiltersSheet}>
        <SheetContent side="bottom" className="h-[80vh]">
          <SheetHeader>
            <SheetTitle>Filtros</SheetTitle>
          </SheetHeader>
          <div className="py-4">
            <PantryFilters
              categories={categories}
              onFilterChange={(newFilters) => {
                handleFilterChange(newFilters);
                setShowFiltersSheet(false);
              }}
              currentFilters={filters}
            />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}