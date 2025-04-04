import { PantryItem, Category } from '../types';
import { PantryListItemRow } from './PantryListItemRow';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useMemo, useEffect } from 'react';
import { getCategories } from '../../shopping-list/services/categoryService'; // Reutilizar servicio
import { updatePantryItem, deletePantryItem } from '../pantryService'; // Importar servicios
import { Tag } from 'lucide-react'; // Placeholder icono

interface PantryAccordionListProps {
  items: PantryItem[];
  onItemDeleted: (itemId: string) => void; // Callback para actualizar estado en Page
  onItemUpdated: (updatedItem: PantryItem) => void; // Callback para actualizar estado en Page
  onEditClick: (item: PantryItem) => void; // Callback para abrir modal en Page
  onError: (message: string) => void;
}

export function PantryAccordionList({
  items,
  onItemDeleted,
  onItemUpdated,
  onEditClick,
  onError,
}: PantryAccordionListProps) {
  const [updatingItemId, setUpdatingItemId] = useState<string | null>(null);
  const [deletingItemId, setDeletingItemId] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [openCategories, setOpenCategories] = useState<string[]>([]); // IDs de categorías abiertas

  // Cargar categorías
  useEffect(() => {
    async function loadCategories() {
      try {
        const cats = await getCategories();
        setCategories(cats);
        // Opcional: Abrir todas las categorías por defecto al inicio
        setOpenCategories(cats.map(c => c.id).concat('uncategorized'));
      } catch (err) {
        console.error("Error loading categories for accordion:", err);
        onError("Error al cargar categorías.");
      }
    }
    loadCategories();
  }, [onError]);

  // Agrupar y ordenar items (misma lógica que PantryGrid)
  const groupedAndSortedItems = useMemo(() => {
    // ... (lógica de agrupación idéntica a PantryGrid, incluyendo defaultCategory) ...
     if (categories.length === 0 && items.length > 0) {
        // Si no hay categorías cargadas pero sí items, agrupar todo en 'uncategorized'
        return { 'uncategorized': items };
    }
     if (categories.length === 0) return {}; // Evitar error si no hay categorías

    const categoryMap = new Map(categories.map(cat => [cat.id, cat]));
    const defaultCategory: Category = { id: 'uncategorized', name: 'Sin Categoría', order: 999, is_default: true };
    categoryMap.set(defaultCategory.id, defaultCategory);

    const grouped = items.reduce((acc, item) => {
      const categoryId = item.category_id || defaultCategory.id;
      if (!acc[categoryId]) acc[categoryId] = [];
      acc[categoryId].push(item);
      return acc;
    }, {} as Record<string, PantryItem[]>);

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


  // Handlers (similares a PantryGrid, llaman a callbacks del padre)
   const handleUpdateQuantity = async (item: PantryItem, delta: number) => {
    setUpdatingItemId(item.id);
    try {
      const currentQuantity = item.quantity ?? 0;
      const newQuantity = Math.max(0, currentQuantity + delta);
      if (newQuantity === item.quantity) return;
      const updateData = { quantity: newQuantity };
      const updatedItemResult = await updatePantryItem(item.id, updateData);
      if (updatedItemResult) onItemUpdated(updatedItemResult);
      else onError('No se pudo actualizar la cantidad.');
    } catch (error) {
      onError('Ocurrió un error al actualizar la cantidad.');
    } finally {
      setUpdatingItemId(null);
    }
  };

  const handleDelete = async (itemId: string) => {
    setDeletingItemId(itemId);
    try {
      await deletePantryItem(itemId); // Llamar a delete
      onItemDeleted(itemId); // Asumir éxito si no hay error y llamar al callback
      // Quitar el else, el error se maneja en el catch
    } catch (error) {
      onError('Ocurrió un error al eliminar el item.');
    } finally {
      setDeletingItemId(null);
    }
  };

  // Variantes de animación para los items dentro del acordeón
  const itemVariants = {
    hidden: { opacity: 0, height: 0 },
    visible: { opacity: 1, height: 'auto' },
    exit: { opacity: 0, height: 0, transition: { duration: 0.2 } },
  };

  if (items.length === 0) {
    return <p className="text-muted-foreground">Tu despensa está vacía.</p>;
  }

  return (
    <Accordion
        type="multiple" // Permite abrir múltiples secciones
        value={openCategories} // Controlar secciones abiertas
        onValueChange={setOpenCategories} // Actualizar estado al abrir/cerrar
        className="w-full space-y-1"
    >
      {Object.entries(groupedAndSortedItems).map(([categoryId, itemsInCategory]) => {
        const category = categoryMap.get(categoryId);
        if (!itemsInCategory || itemsInCategory.length === 0) return null;

        // Placeholder para icono de categoría
        const CategoryIcon = category?.icon ? Tag : null;

        return (
          <AccordionItem value={categoryId} key={categoryId} className="border-b-0">
            <AccordionTrigger className="px-3 py-2 text-sm font-medium hover:bg-muted/50 rounded-md [&[data-state=open]]:bg-muted/60">
               <div className="flex items-center gap-2">
                 {CategoryIcon && (
                    <span style={{ color: category?.color ?? 'inherit' }}>
                        <CategoryIcon className="h-4 w-4" />
                    </span>
                 )}
                 <span>{category?.name ?? 'Desconocido'} ({itemsInCategory.length})</span>
               </div>
            </AccordionTrigger>
            <AccordionContent className="pt-1 pb-0">
              {/* Animar la lista de items dentro del contenido */}
              <motion.div layout className="overflow-hidden">
                 <AnimatePresence initial={false}>
                    {itemsInCategory.map((item) => (
                       <motion.div
                         key={item.id}
                         variants={itemVariants}
                         initial="hidden"
                         animate="visible"
                         exit="exit"
                         layout // Animar cambios de posición
                       >
                         <PantryListItemRow
                           item={item}
                           // onUpdateQuantity no existe
                           onDelete={handleDelete}
                           onEdit={onEditClick}
                           // isUpdating no existe
                           // isDeleting no existe
                           // Añadir props faltantes con valores por defecto
                           isSelectionMode={false}
                           isSelected={false}
                           onSelectItem={() => {}} // Función vacía
                         />
                       </motion.div>
                    ))}
                 </AnimatePresence>
              </motion.div>
            </AccordionContent>
          </AccordionItem>
        );
      })}
    </Accordion>
  );
}