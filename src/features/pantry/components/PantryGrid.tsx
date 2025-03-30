import { PantryItem, Category, UpdatePantryItemData } from '../types'; // Añadir UpdatePantryItemData
import { PantryItemCard } from './PantryItemCard';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useMemo, useEffect } from 'react'; // Añadir useEffect
// Corregir ruta de importación y añadir servicios faltantes
import { getCategories } from '../../shopping-list/services/categoryService';
import { updatePantryItem, deletePantryItem } from '../pantryService';

interface PantryGridProps {
  items: PantryItem[];
  onItemDeleted: (itemId: string) => void;
  onItemUpdated: (updatedItem: PantryItem) => void;
  onEditClick: (item: PantryItem) => void;
  onError: (message: string) => void;
}

export function PantryGrid({
  items,
  onItemDeleted,
  onItemUpdated,
  onEditClick,
  onError,
}: PantryGridProps) {
  const [updatingItemId, setUpdatingItemId] = useState<string | null>(null);
  const [deletingItemId, setDeletingItemId] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]); // Estado para categorías

  // Cargar categorías al montar
  useEffect(() => {
    async function loadCategories() {
      try {
        // Asumiendo que getCategories existe y funciona globalmente
        // Podríamos necesitar crear uno específico en pantryService si es diferente
        const cats = await getCategories();
        setCategories(cats);
      } catch (err) {
        console.error("Error loading categories for grid:", err);
        onError("Error al cargar categorías para agrupar.");
      }
    }
    loadCategories();
  }, [onError]);

  // Agrupar y ordenar items (usando useMemo para optimizar)
  const groupedAndSortedItems = useMemo(() => {
    if (categories.length === 0) {
        // Si no hay categorías cargadas, mostrar lista plana temporalmente
        return { 'all': items };
    }

    const categoryMap = new Map(categories.map(cat => [cat.id, cat]));
    // Añadir categoría por defecto para ítems no categorizados
    const defaultCategory: Category = { id: 'uncategorized', name: 'Sin Categoría', order: 999, is_default: true };
    categoryMap.set(defaultCategory.id, defaultCategory);

    const grouped = items.reduce((acc, item) => {
      const categoryId = item.category_id || defaultCategory.id;
      if (!acc[categoryId]) {
        acc[categoryId] = [];
      }
      acc[categoryId].push(item);
      return acc;
    }, {} as Record<string, PantryItem[]>);

    // Ordenar categorías y devolver el objeto agrupado
    const sortedGrouped: Record<string, PantryItem[]> = {};
    Object.keys(grouped)
      .sort((a, b) => {
        const catA = categoryMap.get(a);
        const catB = categoryMap.get(b);
        const orderA = catA?.order ?? 999;
        const orderB = catB?.order ?? 999;
        if (orderA !== orderB) return orderA - orderB;
        return (catA?.name ?? 'zzz').localeCompare(catB?.name ?? 'zzz');
      })
      .forEach(categoryId => {
        sortedGrouped[categoryId] = grouped[categoryId];
      });

    return sortedGrouped;

  }, [items, categories]);

  const categoryMap = useMemo(() => {
      const map = new Map(categories.map(cat => [cat.id, cat]));
      map.set('uncategorized', { id: 'uncategorized', name: 'Sin Categoría', order: 999, is_default: true });
      return map;
  }, [categories]);


  // Handlers que manejan el estado local de loading y llaman a los callbacks
  const handleUpdateQuantity = async (item: PantryItem, delta: number) => {
    setUpdatingItemId(item.id);
    try {
      // Lógica de updatePantryItem (copiada/adaptada de PantryList)
      const currentQuantity = item.quantity ?? 0;
      const newQuantity = Math.max(0, currentQuantity + delta);
      if (newQuantity === item.quantity) return;

      const updateData: UpdatePantryItemData = { quantity: newQuantity };
      const updatedItemResult = await updatePantryItem(item.id, updateData); // updatePantryItem debe devolver el item actualizado con JOINs

      if (updatedItemResult) {
         onItemUpdated(updatedItemResult); // Notificar al padre con el item completo
      } else {
         onError('No se pudo actualizar la cantidad.');
      }

    } catch (error) {
      console.error("Error updating pantry item quantity:", error);
      onError('Ocurrió un error al actualizar la cantidad.');
    } finally {
      setUpdatingItemId(null);
    }
  };

  const handleDelete = async (itemId: string) => {
    setDeletingItemId(itemId);
    try {
      const success = await deletePantryItem(itemId);
      if (success) {
        onItemDeleted(itemId);
      } else {
        onError('No se pudo eliminar el item.');
      }
    } catch (error) {
      console.error("Error deleting pantry item:", error);
      onError('Ocurrió un error al eliminar el item.');
    } finally {
      setDeletingItemId(null);
    }
  };


  // Variantes de animación (igual que antes)
  const listVariants = { /* ... */ };
  const itemVariants = { /* ... */ };

  if (items.length === 0) {
    return <p className="text-muted-foreground">Tu despensa está vacía.</p>;
  }

  return (
    <div className="space-y-6">
      {Object.entries(groupedAndSortedItems).map(([categoryId, itemsInCategory]) => {
        const category = categoryMap.get(categoryId);
        if (!itemsInCategory || itemsInCategory.length === 0) return null;

        return (
          <motion.div key={categoryId} layout> {/* Animar layout del grupo */}
            {/* Asegurar que color sea string o undefined */}
            <h2 className="text-lg font-semibold mb-3 border-b pb-1" style={{ color: category?.color ?? undefined }}>
              {/* Icono? */}
              {category?.name ?? 'Desconocido'} ({itemsInCategory.length})
            </h2>
            {/* Grid responsivo */}
            <motion.div
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
              variants={listVariants} // Aplicar variantes de lista a este contenedor
              initial="hidden"
              animate="visible"
            >
              <AnimatePresence initial={false}>
                {itemsInCategory.map((item) => (
                  <motion.div
                    key={item.id}
                    variants={itemVariants}
                    layout
                    exit="exit"
                  >
                    <PantryItemCard
                      item={item}
                      onUpdateQuantity={handleUpdateQuantity}
                      onDelete={handleDelete}
                      onEdit={onEditClick} // Pasar el prop recibido
                      isUpdating={updatingItemId === item.id}
                      isDeleting={deletingItemId === item.id}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          </motion.div>
        );
      })}
    </div>
  );
}

// Definir variantes aquí si no se importan
const listVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05 },
  },
};
const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
  exit: { opacity: 0, scale: 0.9, transition: { duration: 0.2 } },
};