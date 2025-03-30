import React from 'react'; // Quitar useState
// import { deletePantryItem, updatePantryItem } from './pantryService'; // Ya no se importa el servicio
import { Button } from '@/components/ui/button';
import { Trash2, Plus, Minus, Pencil } from 'lucide-react'; 
import { Card } from '@/components/ui/card';
import { Spinner } from '@/components/ui/Spinner'; // Podría quitarse si no hay estado de carga local
import { motion, AnimatePresence } from 'framer-motion'; 
// Usar any temporalmente
// import type { PantryItem } from './types';
type PantryItem = any;

interface PantryListProps {
  items: PantryItem[];
  // Callbacks para notificar a la página padre
  onEditClick: (item: PantryItem) => void; 
  onDeleteClick: (itemId: string) => void;
  onQuantityChange: (item: PantryItem, delta: number) => void;
  // Podríamos pasar isLoading/isDeleting/isUpdating por item si queremos feedback aquí
  // Opcional: isProcessing?: (itemId: string) => boolean; 
}

export function PantryList({ 
  items, 
  onEditClick, 
  onDeleteClick, 
  onQuantityChange 
  // isProcessing // Descomentar si se implementa feedback local
}: PantryListProps) {

  // Ya no se maneja estado de borrado/actualización aquí

  const handleDelete = (itemId: string) => {
    // Simplemente llama al callback pasado por props
    onDeleteClick(itemId);
  };

  const handleQuantityChange = (item: PantryItem, delta: number) => {
    // Llama al callback pasado por props
    onQuantityChange(item, delta);
  };

  if (items.length === 0) {
    return <p className="text-muted-foreground text-center py-6">Tu despensa está vacía.</p>;
  }

  // Variantes de animación (sin cambios)
  const listVariants = { /* ... */ };
  const itemVariants = { /* ... */ };

  return (
    <motion.div
      className="space-y-3"
      // variants={listVariants} // Podríamos quitar animación inicial si causa problemas
      initial="hidden"
      animate="visible"
    >
      <AnimatePresence initial={false}>
        {items.map((item) => ( 
          <motion.div
            key={item.id} 
            variants={itemVariants}
            layout 
            exit="exit" 
          >
            <Card className="p-3 flex items-center justify-between gap-2">
              {/* Info del Item */}
              <div className="flex-grow">
                {/* Usar item.name directamente si no hay relación 'ingredients' */}
                <p className="font-medium">{item.name ?? 'Item sin nombre'}</p> 
                {/* Controles de Cantidad */}
                <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                  <Button
                    variant="outline" size="icon" className="h-6 w-6"
                    onClick={() => handleQuantityChange(item, -1)}
                    // disabled={isProcessing?.(item.id) || (item.quantity ?? 0) <= 0} // Usar prop opcional
                    disabled={(item.quantity ?? 0) <= 0} // Simplificado por ahora
                    aria-label="Disminuir cantidad"
                  >
                    <Minus className="h-3 w-3" />
                  </Button>
                  <span className="min-w-[3ch] text-center font-medium text-foreground">
                     {/* Mostrar cantidad directamente, el feedback de carga lo maneja el padre */}
                     {(item.quantity ?? 0)}
                  </span>
                  <Button
                    variant="outline" size="icon" className="h-6 w-6"
                    onClick={() => handleQuantityChange(item, 1)}
                    // disabled={isProcessing?.(item.id)} // Usar prop opcional
                    aria-label="Aumentar cantidad"
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                  <span className="ml-1">{item.unit ?? 'un.'}</span> 
                </div>
              </div>
              {/* Botones de Acción */}
              <div className="flex items-center">
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground hover:text-primary hover:bg-primary/10 h-8 w-8"
                  onClick={() => onEditClick(item)} 
                  // disabled={isProcessing?.(item.id)}
                  aria-label="Editar item"
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 h-8 w-8"
                  onClick={() => handleDelete(item.id)}
                  // disabled={isProcessing?.(item.id)}
                  aria-label="Eliminar item"
                >
                   {/* Ya no muestra spinner local */}
                   <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          </motion.div>
        ))} 
      </AnimatePresence>
    </motion.div>
  );
}