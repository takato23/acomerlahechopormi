import { PantryItem } from '../types';
import { Button } from '@/components/ui/button';
// Card ya no se usa directamente, usamos motion.div con clases de card
// import { Card } from '@/components/ui/card';
import { Spinner } from '@/components/ui/Spinner';
import { Trash2, Plus, Minus, Pencil, CalendarClock, Tag } from 'lucide-react'; // Añadido Tag como placeholder
import { useState } from 'react';
import { format, differenceInDays, parseISO, isValid } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion'; // Importar motion

interface PantryItemCardProps {
  item: PantryItem;
  onUpdateQuantity: (item: PantryItem, delta: number) => Promise<void>;
  onDelete: (itemId: string) => Promise<void>;
  onEdit: (item: PantryItem) => void;
  isUpdating?: boolean;
  isDeleting?: boolean;
}

export function PantryItemCard({
  item,
  onUpdateQuantity,
  onDelete,
  onEdit,
  isUpdating,
  isDeleting,
}: PantryItemCardProps) {

  const handleUpdate = async (delta: number) => {
    await onUpdateQuantity(item, delta);
  };

  const handleDelete = async () => {
    await onDelete(item.id);
  };

  // Calcular estado de vencimiento
  let expiryStatus: 'ok' | 'soon' | 'expired' = 'ok';
  let daysRemaining: number | null = null;
  let formattedExpiryDate: string | null = null;

  if (item.expiry_date) {
    const expiryDateObj = parseISO(item.expiry_date);
    if (isValid(expiryDateObj)) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        daysRemaining = differenceInDays(expiryDateObj, today);
        formattedExpiryDate = format(expiryDateObj, 'dd MMM yy', { locale: es }); // Formato más corto

        if (daysRemaining < 0) {
            expiryStatus = 'expired';
        } else if (daysRemaining <= 7) {
            expiryStatus = 'soon';
        }
    }
  }

  // Clases condicionales para la tarjeta
  const cardClasses = cn(
    "p-2 flex items-center justify-between gap-2 transition-opacity duration-300", // Padding reducido
    "rounded-lg border bg-card text-card-foreground shadow-sm", // Clases base de Card
    expiryStatus === 'expired' && 'opacity-60 border-destructive/40', // Más sutil
    expiryStatus === 'soon' && 'border-yellow-500/50'
  );

  // Placeholder para icono de categoría
  const CategoryIcon = item.categories?.icon ? Tag : null; // Reemplazar Tag con componente real de iconos

  return (
    <motion.div className={cardClasses}>
      {/* Contenedor Principal Flex */}
      <div className="flex flex-1 items-center gap-2 overflow-hidden"> {/* Reducido gap */}
        {/* Icono de Categoría */}
        {CategoryIcon && (
           <span
             className="p-1.5 bg-muted/40 rounded-full flex-shrink-0"
             style={{ color: item.categories?.color ?? 'hsl(var(--muted-foreground))' }} // Usar muted-foreground como fallback
             title={item.categories?.name ?? 'Sin Categoría'}
            >
             <CategoryIcon className="h-4 w-4" />
           </span>
        )}
        {/* Info Principal */}
        <div className="flex-grow overflow-hidden">
          <p className="font-medium truncate text-sm" title={item.ingredients?.name ?? 'Ingrediente desconocido'}>
            {item.ingredients?.name ?? 'Ingrediente desconocido'}
          </p>
          {/* Cantidad y Unidad */}
          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
             {/* Controles +/- */}
             <Button
                variant="ghost" size="icon" className="h-5 w-5 text-muted-foreground hover:text-foreground" // Más pequeño, ghost
                onClick={() => handleUpdate(-1)}
                disabled={isUpdating || isDeleting || (item.quantity ?? 0) <= 0}
                aria-label="Disminuir cantidad"
              >
                <Minus className="h-3 w-3" />
              </Button>
              <span className="min-w-[2ch] text-center font-medium text-foreground text-sm"> {/* Ajustado tamaño */}
                {isUpdating ? <Spinner size="sm"/> : (item.quantity ?? 0)}
              </span>
              <Button
                variant="ghost" size="icon" className="h-5 w-5 text-muted-foreground hover:text-foreground" // Más pequeño, ghost
                onClick={() => handleUpdate(1)}
                disabled={isUpdating || isDeleting}
                aria-label="Aumentar cantidad"
              >
                <Plus className="h-3 w-3" />
              </Button>
              <span className="ml-1 truncate">{item.unit ?? 'un.'}</span>
          </div>
          {/* Fecha Vencimiento */}
          {formattedExpiryDate && (
            <p className={cn(
                "text-xs mt-0.5 flex items-center gap-1",
                expiryStatus === 'expired' && 'text-red-600 font-medium',
                expiryStatus === 'soon' && 'text-yellow-600'
            )}>
              <CalendarClock className="h-3 w-3" />
              {formattedExpiryDate}
              {/* {expiryStatus === 'soon' && ` (${daysRemaining}d)`} */}
              {/* {expiryStatus === 'expired' && ` (Vencido)`} */}
            </p>
          )}
        </div>
      </div>

      {/* Botones de Acción (Editar/Eliminar) */}
      <div className="flex flex-col items-center gap-0.5 flex-shrink-0">
          <Button
            variant="ghost" size="icon"
            className="text-muted-foreground hover:text-primary hover:bg-primary/10 h-6 w-6" // Más pequeño
            onClick={() => onEdit(item)}
            disabled={isDeleting || isUpdating}
            aria-label="Editar item"
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost" size="icon"
            className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 h-6 w-6" // Más pequeño
            onClick={handleDelete}
            disabled={isDeleting || isUpdating}
            aria-label="Eliminar item"
          >
            {isDeleting ? <Spinner size="sm" /> : <Trash2 className="h-3.5 w-3.5" />}
          </Button>
      </div>
    </motion.div>
  );
}