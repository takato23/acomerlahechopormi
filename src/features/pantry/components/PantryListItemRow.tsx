import React, { useCallback, useMemo } from 'react'; // Añadir useMemo
import { PantryItem } from '../types';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Pencil, Trash2, Star, Package } from 'lucide-react'; // Añadir Package
import { cn } from '@/lib/utils';
import { getLucideIcon, DefaultIcon } from '@/lib/iconMap'; // Importar helpers de iconos
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"; // Importar Tooltip

interface PantryListItemRowProps {
  item: PantryItem;
  onEdit: (item: PantryItem) => void;
  onDelete: (itemId: string) => void;
  isSelectionMode: boolean;
  isSelected: boolean;
  onSelectItem: (itemId: string) => void;
  onToggleFavorite: (itemId: string) => void; // Solo itemId
}

export function PantryListItemRow({
  item,
  onEdit,
  onDelete,
  isSelectionMode,
  isSelected,
  onSelectItem,
  onToggleFavorite
}: PantryListItemRowProps) {

  const handleToggleFavorite = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (typeof onToggleFavorite === 'function') {
      onToggleFavorite(item.id);
    } else {
      console.error('[PantryListItemRow] onToggleFavorite is not a function');
    }
  }, [item.id, onToggleFavorite]);

  const handleRowClick = useCallback(() => {
    if (isSelectionMode) {
      onSelectItem(item.id);
    }
  }, [isSelectionMode, item.id, onSelectItem]);

  const isExpired = item.expiry_date && new Date(item.expiry_date) < new Date();

  // Determinar qué mostrar: Imagen, Icono de Categoría o Icono Fallback
  const VisualRepresentation = useMemo(() => {
    if (item.ingredient?.image_url) {
      return (
        <img
          src={item.ingredient.image_url}
          alt={item.ingredient.name || 'Ingrediente'}
          className="w-6 h-6 object-cover rounded mr-2 flex-shrink-0" // Tamaño más pequeño para la fila
          loading="lazy"
          onError={(e) => { e.currentTarget.style.display = 'none'; }}
        />
      );
    }
    const CategoryIcon = getLucideIcon(item.category?.icon_name);
    if (CategoryIcon) {
      return <CategoryIcon className="w-4 h-4 text-muted-foreground mr-2 flex-shrink-0" />;
    }
    return <DefaultIcon className="w-4 h-4 text-muted-foreground mr-2 flex-shrink-0" />;
  }, [item.ingredient?.image_url, item.ingredient?.name, item.category?.icon_name]);


  return (
    <TooltipProvider> {/* Necesario para Tooltips */}
      <div
        className={cn(
          "flex w-full border-b items-center hover:bg-muted/30 transition-colors",
          isSelectionMode && "cursor-pointer",
          isSelected && "bg-primary/10"
        )}
        onClick={handleRowClick}
      >
        {/* Checkbox */}
        {isSelectionMode && (
          <div className="p-3 w-10 flex-shrink-0 flex items-center justify-center">
            <Checkbox
              checked={isSelected}
              onCheckedChange={() => onSelectItem(item.id)}
              onClick={(e) => e.stopPropagation()}
              aria-label={`Seleccionar ${item.ingredient?.name}`}
            />
          </div>
        )}

        {/* Nombre (con Imagen/Icono) */}
        <div className="flex-1 p-3 flex items-center gap-2 truncate">
           {!isSelectionMode && VisualRepresentation} {/* Mostrar icono/imagen si no está en modo selección */}
           <span className="truncate">{item.ingredient?.name || 'N/A'}</span>
        </div>


        {/* Cantidad */}
        <div className="p-3 w-20 text-center">{item.quantity ?? '-'}</div>

        {/* Unidad */}
        <div className="p-3 w-24 truncate">{item.unit || '-'}</div>

        {/* Categoría */}
        <div className="p-3 w-32 truncate">{item.category?.name || 'N/A'}</div>

        {/* Caducidad */}
        <div className={cn("p-3 w-28 truncate", isExpired && "text-destructive font-medium")}>
          {item.expiry_date || '-'}
        </div>

        {/* Acciones */}
        <div className="p-3 w-24 text-right flex justify-end items-center gap-0.5">
          {!isSelectionMode && (
            <>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={handleToggleFavorite}
                    aria-label={item.is_favorite ? "Quitar de favoritos" : "Añadir a favoritos"}
                  >
                    <Star
                      className={cn(
                        "h-4 w-4",
                        item.is_favorite ? "fill-yellow-400 text-yellow-500" : "text-muted-foreground"
                      )}
                    />
                  </Button>
                </TooltipTrigger>
                <TooltipContent><p>{item.is_favorite ? "Quitar de favoritos" : "Añadir a favoritos"}</p></TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={(e) => { e.stopPropagation(); onEdit(item); }}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent><p>Editar item</p></TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-destructive hover:text-destructive"
                    onClick={(e) => { e.stopPropagation(); onDelete(item.id); }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent><p>Eliminar item</p></TooltipContent>
              </Tooltip>
            </>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
}