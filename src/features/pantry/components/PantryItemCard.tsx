import React, { useCallback, useEffect, useMemo } from 'react';
import { PantryItem } from '../types';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'; // Importar CardFooter
import { Button } from '@/components/ui/button';
import { Pencil, Trash2, Star, Package } from 'lucide-react'; // Importar Package
import { cn } from '@/lib/utils';
import { Checkbox } from '@/components/ui/checkbox';
import { getLucideIcon, DefaultIcon } from '@/lib/iconMap'; // Importar getLucideIcon y DefaultIcon
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"; // Importar Tooltip

interface PantryItemCardProps {
  item: PantryItem;
  onEdit: (item: PantryItem) => void;
  onDelete: (itemId: string) => void;
  isSelectionMode: boolean;
  isSelected: boolean;
  onSelectItem: (itemId: string) => void;
  onToggleFavorite: (itemId: string) => void; // Solo espera itemId
}

export function PantryItemCard({
  item,
  onEdit,
  onDelete,
  isSelectionMode,
  isSelected,
  onSelectItem,
  onToggleFavorite
}: PantryItemCardProps) {

  useEffect(() => {
    // console.log('[PantryItemCard] Rendering. onToggleFavorite type:', typeof onToggleFavorite); // Log opcional
  }, [onToggleFavorite]);

  const handleToggleFavorite = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (typeof onToggleFavorite === 'function') {
      onToggleFavorite(item.id);
    } else {
      console.error('[PantryItemCard] onToggleFavorite is not a function');
    }
  }, [item.id, onToggleFavorite]);

  const handleCardClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const targetElement = e.target as Element;
    const isButtonClick = targetElement.closest('button');
    const isCheckboxClick = targetElement.closest('[role="checkbox"]');
    if (isSelectionMode && !isButtonClick && !isCheckboxClick) {
      onSelectItem(item.id);
    }
  }, [isSelectionMode, item.id, onSelectItem]);

  // Determinar qué mostrar: Imagen, Icono de Categoría o Icono Fallback
  const VisualRepresentation = useMemo(() => {
    // Prioridad 1: Imagen del ingrediente
    if (item.ingredient?.image_url) {
      return (
        <img
          src={item.ingredient.image_url}
          alt={item.ingredient.name || 'Ingrediente'}
          className="w-10 h-10 object-cover rounded-md mr-2 flex-shrink-0" // Ajustar margen
          loading="lazy"
          onError={(e) => { e.currentTarget.style.display = 'none'; }} // Ocultar si la imagen falla
        />
      );
    }
    // Prioridad 2: Icono de la categoría
    const CategoryIcon = getLucideIcon(item.category?.icon_name);
    if (CategoryIcon) {
      return <CategoryIcon className="w-6 h-6 text-muted-foreground mr-2 flex-shrink-0" />; // Ajustar margen
    }
    // Prioridad 3: Icono por defecto
    return <DefaultIcon className="w-6 h-6 text-muted-foreground mr-2 flex-shrink-0" />; // Ajustar margen
  }, [item.ingredient?.image_url, item.ingredient?.name, item.category?.icon_name]);

  return (
    <TooltipProvider> {/* Necesario para que funcionen los Tooltips internos */}
      <Card
        className={cn(
          "relative flex flex-col h-full shadow-sm hover:shadow-md transition-shadow duration-200",
          "bg-card/80 backdrop-blur-md rounded-lg",
          isSelectionMode && "cursor-pointer",
          isSelected && "ring-2 ring-primary ring-offset-2"
        )}
        onClick={handleCardClick}
        data-testid="pantry-item-card"
      >
        <CardHeader
          className={cn(
            "p-3 flex flex-row items-center gap-0 space-y-0", // gap-0 para controlar espacio con mr-*
            isSelectionMode && "pointer-events-auto"
          )}
        >
          {/* Checkbox */}
          {isSelectionMode && (
            <div className="flex items-center h-7 w-7 mr-2">
              <Checkbox
                checked={isSelected}
                onCheckedChange={() => onSelectItem(item.id)}
                aria-label={`Seleccionar ${item.ingredient?.name || 'item'}`}
                onClick={e => e.stopPropagation()}
              />
            </div>
          )}

          {/* Imagen o Icono (siempre visible ahora) */}
          {VisualRepresentation}

          {/* Título y Categoría */}
          <div className="flex-1 min-w-0">
            <CardTitle className="text-sm font-medium leading-tight truncate">
              {item.ingredient?.name || 'Ingrediente Desconocido'}
            </CardTitle>
            {item.category?.name && (
              <p className="text-xs font-medium text-muted-foreground truncate">
                {item.category.name}
              </p>
            )}
          </div>

          {/* Botones de Acción (Favorito y Editar) - Solo si no está en modo selección */}
          {!isSelectionMode && (
            <div className="absolute top-2 right-2 flex flex-col gap-1 z-10">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={handleToggleFavorite}
                    aria-label={item.is_favorite ? "Quitar de favoritos" : "Añadir a favoritos"}
                    data-testid="favorite-button"
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
                    aria-label="Editar"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Editar item</p>
                </TooltipContent>
              </Tooltip>
            </div>
          )}
        </CardHeader>

        <CardContent className="p-3 pt-1 text-sm">
          <div className="space-y-1">
            <div className="flex items-center gap-1">
              <span className="font-medium">{item.quantity ?? '-'}</span>
              <span className="text-muted-foreground">{item.unit || ''}</span>
            </div>
            {item.expiry_date && (
              <p className="text-xs text-muted-foreground">Vence: {item.expiry_date}</p>
            )}
          </div>
        </CardContent>

        {/* Botón Eliminar en Footer (Solo si no está en modo selección) */}
        {!isSelectionMode && (
          <CardFooter className="p-2 justify-end">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-destructive hover:text-destructive/90"
                  onClick={(e) => { e.stopPropagation(); onDelete(item.id); }}
                  aria-label="Eliminar"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Eliminar item</p>
              </TooltipContent>
            </Tooltip>
          </CardFooter>
        )}
      </Card>
    </TooltipProvider>
  );
}