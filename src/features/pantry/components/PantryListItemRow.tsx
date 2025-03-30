import { PantryItem } from '../types';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/Spinner';
import { Trash2, Plus, Minus, Pencil, CalendarClock, Tag } from 'lucide-react';
import { format, differenceInDays, parseISO, isValid } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion'; // Para animaciones si se aplica aquí

interface PantryListItemRowProps {
  item: PantryItem;
  onUpdateQuantity: (item: PantryItem, delta: number) => Promise<void>;
  onDelete: (itemId: string) => Promise<void>;
  onEdit: (item: PantryItem) => void;
  isUpdating?: boolean;
  isDeleting?: boolean;
}

export function PantryListItemRow({
  item,
  onUpdateQuantity,
  onDelete,
  onEdit,
  isUpdating,
  isDeleting,
}: PantryListItemRowProps) {

  const handleUpdate = async (delta: number) => {
    await onUpdateQuantity(item, delta);
  };

  const handleDelete = async () => {
    await onDelete(item.id);
  };

  // Calcular estado de vencimiento (lógica similar a PantryItemCard)
  let expiryStatus: 'ok' | 'soon' | 'expired' = 'ok';
  let daysRemaining: number | null = null;
  let formattedExpiryDate: string | null = null;

  if (item.expiry_date) {
    const expiryDateObj = parseISO(item.expiry_date);
    if (isValid(expiryDateObj)) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        daysRemaining = differenceInDays(expiryDateObj, today);
        formattedExpiryDate = format(expiryDateObj, 'dd/MM/yy', { locale: es }); // Formato más corto

        if (daysRemaining < 0) {
            expiryStatus = 'expired';
        } else if (daysRemaining <= 7) {
            expiryStatus = 'soon';
        }
    }
  }

  // Placeholder para icono de categoría
  const CategoryIcon = item.categories?.icon ? Tag : null; // Reemplazar Tag

  return (
    // Usar flexbox para alinear elementos en la fila
    <div className={cn(
        "flex items-center gap-3 px-3 py-2 border-b last:border-b-0", // Estilo de fila
        expiryStatus === 'expired' && 'opacity-60',
        isUpdating || isDeleting ? 'opacity-50 pointer-events-none' : '' // Feedback visual durante acción
    )}>
        {/* Icono Categoría */}
        {CategoryIcon && (
           <span
             className="p-1 bg-muted/40 rounded-full flex-shrink-0 hidden sm:inline-flex" // Ocultar en móvil?
             style={{ color: item.categories?.color ?? 'hsl(var(--muted-foreground))' }}
             title={item.categories?.name ?? 'Sin Categoría'}
            >
             <CategoryIcon className="h-4 w-4" />
           </span>
        )}

        {/* Nombre */}
        <span className="flex-grow font-medium text-sm truncate" title={item.ingredients?.name ?? 'Ingrediente desconocido'}>
            {item.ingredients?.name ?? 'Ingrediente desconocido'}
        </span>

        {/* Fecha Vencimiento (Compacta) */}
        {formattedExpiryDate && (
            <span className={cn(
                "text-xs flex items-center gap-1 flex-shrink-0 whitespace-nowrap",
                expiryStatus === 'expired' && 'text-red-600 font-medium',
                expiryStatus === 'soon' && 'text-yellow-600'
            )} title={`Vence: ${formattedExpiryDate}`}>
              <CalendarClock className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{formattedExpiryDate}</span> {/* Ocultar texto en móvil? */}
            </span>
         )}

        {/* Controles Cantidad */}
        <div className="flex items-center gap-1 flex-shrink-0">
             <Button
                variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-foreground"
                onClick={() => handleUpdate(-1)}
                disabled={isUpdating || isDeleting || (item.quantity ?? 0) <= 0}
                aria-label="Disminuir cantidad"
              >
                <Minus className="h-4 w-4" />
              </Button>
              <span className="min-w-[2ch] text-center font-medium text-sm">
                {isUpdating ? <Spinner size="sm"/> : (item.quantity ?? 0)}
              </span>
              <Button
                variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-foreground"
                onClick={() => handleUpdate(1)}
                disabled={isUpdating || isDeleting}
                aria-label="Aumentar cantidad"
              >
                <Plus className="h-4 w-4" />
              </Button>
              <span className="ml-1 text-xs text-muted-foreground w-8 truncate" title={item.unit ?? 'un.'}>{item.unit ?? 'un.'}</span> {/* Ancho fijo opcional */}
        </div>

        {/* Botones Acción */}
        <div className="flex items-center gap-0.5 flex-shrink-0">
             <Button
                variant="ghost" size="icon"
                className="text-muted-foreground hover:text-primary hover:bg-primary/10 h-7 w-7"
                onClick={() => onEdit(item)}
                disabled={isDeleting || isUpdating}
                aria-label="Editar item"
              >
                <Pencil className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost" size="icon"
                className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 h-7 w-7"
                onClick={handleDelete}
                disabled={isDeleting || isUpdating}
                aria-label="Eliminar item"
              >
                {isDeleting ? <Spinner size="sm" /> : <Trash2 className="h-4 w-4" />}
              </Button>
        </div>
    </div>
  );
}