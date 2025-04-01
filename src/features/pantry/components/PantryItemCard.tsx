import React, { useState } from 'react'; // Importar useState
import { PantryItem } from '../types';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card'; // Ruta relativa (CardFooter eliminado si no se usa)
import { Button } from '../../../components/ui/button'; // Ruta relativa
import { Pencil, Trash2, MapPin, Tag, Package, MessageSquare, Tags, CalendarClock, ChevronDown, ChevronUp } from 'lucide-react'; // Importar ChevronDown y ChevronUp
import { cn } from '@/lib/utils';
// Importar Checkbox
import { Checkbox } from '../../../components/ui/checkbox';

// Función auxiliar para convertir HEX a RGBA con opacidad
// (Considera moverla a utils si se usa en más sitios)
function hexToRgba(hex: string, alpha: number): string {
  if (!hex || !hex.startsWith('#')) return `rgba(0, 0, 0, ${alpha})`; // Color por defecto o manejo de error
  const hexValue = hex.length === 4 ? `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}` : hex;
  const bigint = parseInt(hexValue.slice(1), 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}


interface PantryItemCardProps {
 item: PantryItem;
 onEdit: (item: PantryItem) => void;
 onDelete: (itemId: string) => void;
 // Nuevas props para selección
 isSelectionMode: boolean;
 isSelected: boolean;
 onSelectItem: (itemId: string) => void;
}

export function PantryItemCard({
 item,
 onEdit,
 onDelete,
 isSelectionMode,
 isSelected,
 onSelectItem
}: PantryItemCardProps) {
  const [isExpanded, setIsExpanded] = useState(false); // Estado para controlar la expansión

  const isConsolidated = item._consolidatedCount && item._consolidatedCount > 1;
  const originalItems = item._originalItems || [];

  const isExpired = item.expiry_date && new Date(item.expiry_date) < new Date();
  // TODO: Lógica para "próximo a caducar"

  const categoryColor = item.category?.color;
  const headerStyle = {
    borderLeft: `3px solid ${categoryColor || 'transparent'}`,
    backgroundColor: categoryColor ? hexToRgba(categoryColor, 0.1) : 'transparent', // Fondo sutil
  };

 const handleCardClick = (e: React.MouseEvent<HTMLDivElement>) => {
   // Si estamos en modo selección y el click NO fue en un botón O en el checkbox,
   // activamos la selección/deselección.
   const targetElement = e.target as Element;
   const isButtonClick = targetElement.closest('button');
   const isCheckboxClick = targetElement.closest('[role="checkbox"]'); // Identificar click en checkbox

   if (isSelectionMode && !isButtonClick && !isCheckboxClick) {
     onSelectItem(item.id);
   }
   // No expandir/colapsar al hacer click en la tarjeta si estamos en modo selección
   // o si el click fue en un botón o checkbox.
   // La expansión se maneja con su propio botón.
 };

 const toggleExpand = (e: React.MouseEvent<HTMLButtonElement>) => {
   e.stopPropagation(); // Evitar que el click se propague a la card
   setIsExpanded(!isExpanded);
 };


 return (
   <Card
     className={cn(
       "flex flex-col justify-between h-full shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden",
       isSelectionMode && "cursor-pointer", // Añadir cursor pointer en modo selección
       isSelected && "ring-2 ring-primary ring-offset-2" // Resaltar si está seleccionado
     )}
     onClick={handleCardClick} // Añadir onClick a la Card
   >
      {/* Header: Padding reducido, gap reducido, fondo con color categoría */}
      <CardHeader
       className={cn(
         "p-2 flex flex-row items-center gap-1.5 space-y-0",
         // No propagar el click del header si estamos en modo selección para evitar doble toggle
         isSelectionMode && "pointer-events-auto"
       )}
       style={headerStyle}
       // Detener la propagación del click si viene del header y estamos en modo selección
       onClick={(e) => { if (isSelectionMode) e.stopPropagation(); }}
     >
       {/* Checkbox condicional */}
       {isSelectionMode && (
         <div className="flex items-center justify-center h-7 w-7 mr-1"> {/* Contenedor para centrar */}
           <Checkbox
             id={`select-${item.id}`}
             checked={isSelected}
             onCheckedChange={() => onSelectItem(item.id)}
             aria-label={`Seleccionar ${item.ingredient?.name || 'item'}`}
             // Detener propagación para que el click en el checkbox no active el click de la card
             onClick={(e) => e.stopPropagation()}
           />
         </div>
       )}
       {/* Título y Categoría */}
       <div className="flex-1 overflow-hidden">
         <CardTitle className="text-sm font-medium leading-tight truncate">
           {item.ingredient?.name || 'Ingrediente Desconocido'}
         </CardTitle>
         {item.category?.name && (
           <p className="text-xs font-medium text-muted-foreground truncate">{item.category.name}</p>
         )} {/* Added font-medium */}
       </div>
       {/* Botón de Expansión (si es consolidado y no en modo selección) */}
       {isConsolidated && !isSelectionMode && (
         <Button
           variant="ghost"
           size="sm"
           className="h-7 w-7"
           onClick={toggleExpand}
           aria-expanded={isExpanded}
           aria-controls={`details-${item.id}`}
         >
           {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
           <span className="sr-only">{isExpanded ? 'Colapsar detalles' : 'Expandir detalles'}</span>
         </Button>
       )}
       {/* Botones Editar/Eliminar (solo si NO estamos en modo selección Y NO es consolidado o está expandido) */}
       {/* Los botones para ítems consolidados/expandidos estarán dentro de la vista expandida */}
       {!isSelectionMode && !isConsolidated && (
          <div className="flex gap-0">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7"
              onClick={(e) => { e.stopPropagation(); onEdit(item); }}
            >
              <Pencil className="h-3.5 w-3.5" />
              <span className="sr-only">Editar</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 text-destructive hover:text-destructive"
              onClick={(e) => { e.stopPropagation(); onDelete(item.id); }}
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span className="sr-only">Eliminar</span>
            </Button>
          </div>
        )}
      </CardHeader>
      {/* Línea divisoria sutil */}
      {/* Sin línea divisoria para mayor compacidad, el cambio de fondo del header ya separa visualmente */}
      {/* <div className="border-t border-border/50 mx-2"></div> */}
      <CardContent className="p-2 text-xs text-muted-foreground flex-1"> {/* Padding reducido, texto base xs */}
        <div className="space-y-1"> {/* Reduced vertical spacing */}
          {/* Cantidad destacada */}
          <div className="flex items-center gap-0.5 text-sm font-medium"> {/* Reduced gap */}
            <Package className="h-3.5 w-3.5 text-muted-foreground"/>
            <span>{item.quantity ?? '-'} {item.unit || ''}</span>
            {/* Indicador de consolidación */}
            {isConsolidated && (
               <span className="ml-1 text-xs font-normal text-muted-foreground">(+{item._consolidatedCount! - 1})</span>
            )}
          </div>

          {/* Info secundaria reestructurada con ul/li */}
          <ul className="space-y-0.5 text-xs"> {/* Mantener texto xs */}
            {/* Caducidad */}
            {item.expiry_date ? (
              <li className={`flex items-center gap-0.5 ${isExpired ? 'text-destructive font-medium' : ''}`}> {/* Reduced gap */}
                <CalendarClock className="h-3 w-3 flex-shrink-0"/> {/* Icono más pequeño */}
                <span>{isExpired ? "Vencido:" : "Vence:"} {item.expiry_date}</span>
              </li>
            ) : null}
            {/* Ubicación */}
            {item.location && (
              <li className="flex items-center gap-0.5"> {/* Reduced gap */}
                <MapPin className="h-3 w-3 flex-shrink-0"/>
                <span>{item.location}</span>
              </li>
            )}
            {/* Precio */}
            {item.price != null ? (
              <li className="flex items-center gap-0.5"> {/* Reduced gap */}
                <Tag className="h-3 w-3 flex-shrink-0"/>
                <span>${item.price.toFixed(2)}</span>
              </li>
            ) : null}
            {/* Stock */}
            {(item.min_stock != null || item.target_stock != null) && (
              <li className="flex items-center gap-0.5" title="Stock Min/Obj"> {/* Reduced gap */}
                <Package className="h-3 w-3 flex-shrink-0"/>
                <span>
                  Stock: {item.min_stock ?? '_'} / {item.target_stock ?? '_'} {/* Separador cambiado */}
                </span>
              </li>
            )}
          </ul>

          {/* Tags */}
          {item.tags && item.tags.length > 0 && (
            <div className="flex items-center gap-0.5 flex-wrap pt-1"> {/* Menos gap, pt ajustado */}
              <Tags className="h-3 w-3 text-muted-foreground mr-0.5 flex-shrink-0"/> {/* Icono más pequeño, margen derecho */}
              {item.tags.map(tag => (
                <span key={tag} className="text-[10px] px-1 py-0.25 bg-secondary text-secondary-foreground rounded-full"> {/* Tags más pequeños, padding ajustado */}
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Notas */}
          {item.notes && (
            <div className="flex items-start gap-0.5 pt-1 text-xs"> {/* Reduced gap */}
              <MessageSquare className="h-3 w-3 mt-0.5 flex-shrink-0"/> {/* Icono más pequeño */}
              <p className="line-clamp-2">{item.notes}</p> {/* Limitar a 2 líneas */}
            </div>
          )}
        </div>
      </CardContent>
      {/* Vista Expandida Compacta */}
      {isExpanded && isConsolidated && (
        <div id={`details-${item.id}`} className="border-t border-border/50 px-2 py-1.5 bg-muted/20"> {/* Padding ajustado, fondo sutil */}
          <div className="space-y-1"> {/* Espaciado vertical entre ítems */}
            {originalItems.map((originalItem, index) => {
              const originalIsExpired = originalItem.expiry_date && new Date(originalItem.expiry_date) < new Date();
              return (
                <div key={originalItem.id || index} className="flex justify-between items-center text-xs gap-2"> {/* Contenedor principal del ítem */}
                  {/* Info condensada */}
                  <div className="flex-1 flex items-center gap-1.5 overflow-hidden flex-wrap"> {/* Permitir wrap si no cabe */}
                    {/* Cantidad (siempre visible) */}
                    <span className="font-medium whitespace-nowrap">
                      <Package className="inline h-3 w-3 mr-0.5 text-muted-foreground" />
                      {originalItem.quantity ?? '-'} {originalItem.unit || ''}
                    </span>
                    {/* Vencimiento */}
                    {originalItem.expiry_date && (
                      <span className={cn("text-muted-foreground whitespace-nowrap", originalIsExpired && "text-destructive font-medium")}>
                        <CalendarClock className="inline h-3 w-3 mr-0.5" />
                        {originalItem.expiry_date}
                      </span>
                    )}
                    {/* Precio */}
                    {originalItem.price != null && (
                      <span className="text-muted-foreground whitespace-nowrap">
                        <Tag className="inline h-3 w-3 mr-0.5" />
                        ${originalItem.price.toFixed(2)}
                      </span>
                    )}
                    {/* Ubicación (oculto en pantallas muy pequeñas si es necesario) */}
                    {originalItem.location && (
                      <span className="text-muted-foreground whitespace-nowrap hidden xs:inline">
                        <MapPin className="inline h-3 w-3 mr-0.5" />
                        {originalItem.location}
                      </span>
                    )}
                    {/* Notas (indicador, oculto en pantallas pequeñas) */}
                    {originalItem.notes && (
                      <span className="text-muted-foreground whitespace-nowrap hidden sm:inline" title={originalItem.notes}>
                        <MessageSquare className="inline h-3 w-3 mr-0.5" />
                        Nota
                      </span>
                    )}
                  </div>

                  {/* Botones (solo si no estamos en modo selección) */}
                  {!isSelectionMode && (
                    <div className="flex gap-0.5 flex-shrink-0"> {/* Evitar que los botones se encojan */}
                      <Button
                        variant="ghost"
                        size="icon" // Botón cuadrado pequeño
                        className="h-5 w-5" // Tamaño botón
                        onClick={(e) => { e.stopPropagation(); onEdit(originalItem); }}
                      >
                        <Pencil className="h-3 w-3" /> {/* Tamaño icono */}
                        <span className="sr-only">Editar ítem original</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5 text-destructive hover:text-destructive" // Tamaño botón
                        onClick={(e) => { e.stopPropagation(); onDelete(originalItem.id); }}
                      >
                        <Trash2 className="h-3 w-3" /> {/* Tamaño icono */}
                        <span className="sr-only">Eliminar ítem original</span>
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </Card>
  );
}