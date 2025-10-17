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
import { Badge } from '@/components/ui/badge';

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
  const quantityValue = typeof item.quantity === 'number' ? item.quantity : item.quantity ?? null;
  const minStockValue = typeof item.min_stock === 'number' ? item.min_stock : null;
  const isLowStock =
    minStockValue !== null &&
    quantityValue !== null &&
    Number(quantityValue) < Number(minStockValue);

  const statusBadges: Array<{ key: string; label: string; variant: 'destructive' | 'secondary' }> = [];
  if (isExpired) {
    statusBadges.push({ key: 'expired', label: 'Vencido', variant: 'destructive' as const });
  }
  if (isLowStock) {
    statusBadges.push({ key: 'low-stock', label: 'Bajo stock', variant: 'secondary' as const });
  }

  const renderBadges = () =>
    statusBadges.map(({ key, label, variant }) => (
      <Badge
        key={key}
        variant={variant}
        className={cn(
          "uppercase tracking-wide text-[11px]",
          variant === 'secondary' && "bg-amber-100 text-amber-900 border border-amber-200"
        )}
      >
        {label}
      </Badge>
    ));

  // Determinar qué mostrar: Imagen, Icono de Categoría o Icono Fallback
  const VisualRepresentation = useMemo(() => {
    if (item.ingredient?.image_url) {
      return (
        <img
          src={item.ingredient.image_url}
          alt={item.ingredient.name || 'Ingrediente'}
          className="w-6 h-6 object-cover rounded flex-shrink-0"
          loading="lazy"
          onError={(e) => { e.currentTarget.style.display = 'none'; }}
        />
      );
    }
    const CategoryIcon = getLucideIcon(item.category?.icon_name);
    if (CategoryIcon) {
      return <CategoryIcon className="w-4 h-4 text-muted-foreground flex-shrink-0" />;
    }
    return <DefaultIcon className="w-4 h-4 text-muted-foreground flex-shrink-0" />;
  }, [item.ingredient?.image_url, item.ingredient?.name, item.category?.icon_name]);

  const gridTemplateClass = isSelectionMode
    ? 'sm:grid-cols-[auto_minmax(0,1fr)_auto_auto_auto_auto]'
    : 'sm:grid-cols-[minmax(0,1fr)_auto_auto_auto_auto]';

  return (
    <TooltipProvider>
      <div
        className={cn(
          "border-b px-3 py-3 sm:px-0 sm:py-0 transition-colors",
          isSelectionMode ? "cursor-pointer" : "cursor-default",
          isSelected && "bg-primary/10"
        )}
        onClick={handleRowClick}
      >
        <div
          className={cn(
            "flex flex-col gap-3 sm:grid sm:items-center sm:px-3 sm:py-2",
            gridTemplateClass
          )}
        >
          {isSelectionMode && (
            <div className="flex items-center justify-center">
              <Checkbox
                checked={isSelected}
                onCheckedChange={() => onSelectItem(item.id)}
                onClick={(e) => e.stopPropagation()}
                aria-label={`Seleccionar ${item.ingredient?.name}`}
              />
            </div>
          )}

          <div className="flex items-start gap-3">
            {!isSelectionMode && VisualRepresentation}
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate text-sm sm:text-base">
                {item.ingredient?.name || 'N/A'}
              </p>
              {item.location && (
                <p className="mt-1 text-xs text-muted-foreground sm:hidden">
                  Ubicación: {item.location}
                </p>
              )}
              {statusBadges.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2 sm:hidden">
                  {renderBadges()}
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-2 text-sm sm:items-center">
            <div className="flex items-center gap-2">
              <span className="font-medium">{item.quantity ?? '-'}</span>
              <span className="text-muted-foreground">{item.unit || ''}</span>
            </div>
            {statusBadges.length > 0 && (
              <div className="hidden sm:flex flex-wrap gap-2">
                {renderBadges()}
              </div>
            )}
          </div>

          <div className="text-sm text-muted-foreground sm:text-center">
            {item.category?.name || 'N/A'}
          </div>

          <div className="text-sm sm:text-center">
            <span className={cn(isExpired ? "text-destructive font-semibold" : "text-muted-foreground")}>
              {item.expiry_date || '-'}
            </span>
          </div>

          <div className="hidden sm:flex justify-end items-center gap-0.5">
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
              <TooltipContent>
                <p>{item.is_favorite ? "Quitar de favoritos" : "Añadir a favoritos"}</p>
              </TooltipContent>
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
          </div>
        </div>

        {!isSelectionMode && (
          <div className="mt-3 flex items-center justify-end gap-1 sm:hidden">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={(e) => { e.stopPropagation(); onEdit(item); }}
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-destructive hover:text-destructive"
              onClick={(e) => { e.stopPropagation(); onDelete(item.id); }}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={(e) => { e.stopPropagation(); handleToggleFavorite(e); }}
              aria-label={item.is_favorite ? "Quitar de favoritos" : "Añadir a favoritos"}
            >
              <Star
                className={cn(
                  "h-4 w-4",
                  item.is_favorite ? "fill-yellow-400 text-yellow-500" : "text-muted-foreground"
                )}
              />
            </Button>
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}
