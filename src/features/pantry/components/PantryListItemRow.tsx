import React, { useState } from 'react'; // Añadir useState
import { PantryItem } from '../types';
// import { TableCell, TableRow } from '../../../components/ui/table'; // Componente no encontrado
import { Button } from '../../../components/ui/button'; // Ruta relativa
import { Pencil, Trash2, Info, MapPin, Tag, Package, MessageSquare, Tags } from 'lucide-react'; // Añadir icono Tags
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../../../components/ui/tooltip";
// Importar Checkbox
import { Checkbox } from '../../../components/ui/checkbox';
import { cn } from '@/lib/utils'; // Importar cn

interface PantryListItemRowProps {
 item: PantryItem;
 onEdit: (item: PantryItem) => void;
 onDelete: (itemId: string) => void;
 // Nuevas props para selección
 isSelectionMode: boolean;
 isSelected: boolean;
 onSelectItem: (itemId: string) => void;
}

export function PantryListItemRow({
 item,
 onEdit,
 onDelete,
 isSelectionMode,
 isSelected,
 onSelectItem
}: PantryListItemRowProps) {
  const [showNotes, setShowNotes] = useState(false); // Estado para mostrar/ocultar notas
  const isExpired = item.expiry_date && new Date(item.expiry_date) < new Date();
  // TODO: Lógica para "próximo a caducar"

  // Reemplazado TableRow/TableCell con divs debido a componente faltante
 // Handler para el click en la fila (si no es en un botón o checkbox)
 const handleRowClick = (e: React.MouseEvent<HTMLDivElement>) => {
   // Si estamos en modo selección y el click no fue en un botón o el checkbox,
   // entonces activamos la selección/deselección.
   if (isSelectionMode && !(e.target instanceof Element && (e.target.closest('button') || e.target.closest('[role="checkbox"]')))) {
     onSelectItem(item.id);
   }
 };

 return (
   <div
     className={cn(
       "flex items-start p-2 border-b hover:bg-muted/50",
       isSelectionMode && "cursor-pointer", // Cursor pointer en modo selección
       isSelected && "bg-primary/10 hover:bg-primary/15" // Resaltar si está seleccionado
     )}
     onClick={handleRowClick} // Añadir onClick a la fila
   >
     {/* Checkbox condicional */}
     {isSelectionMode && (
       <div className="flex items-center justify-center px-3 py-2 w-10 flex-shrink-0"> {/* Contenedor para centrar y alinear */}
         <Checkbox
           id={`select-row-${item.id}`}
           checked={isSelected}
           onCheckedChange={() => onSelectItem(item.id)}
           aria-label={`Seleccionar ${item.ingredient?.name || 'item'}`}
           // Detener propagación para que el click en el checkbox no active el click de la fila
           onClick={(e) => e.stopPropagation()}
         />
       </div>
     )}
      {/* Simula TableCell - Nombre, Ubicación, Precio, Notas */}
      {/* Quitar ancho fijo, añadir padding */}
     {/* Nombre, Ubicación, Precio, Notas */}
     <div className="flex-1 font-medium pr-3 py-2">
        <div>{item.ingredient?.name || 'Ingrediente Desconocido'}</div>
        {(item.location || item.price != null) && (
            <div className="text-xs text-muted-foreground mt-1 flex flex-wrap gap-x-2 gap-y-0.5">
                {item.location && (
                    <span className="flex items-center"><MapPin size={10} className="mr-1"/> {item.location}</span>
                )}
                {item.price != null && (
                     <span className="flex items-center"><Tag size={10} className="mr-1"/> ${item.price.toFixed(2)}</span>
                )}
            </div>
        )}
        {/* Mostrar icono de notas si existen */}
        {item.notes && (
             <TooltipProvider delayDuration={100}>
                <Tooltip>
                    <TooltipTrigger asChild>
                       <Button variant="ghost" size="icon" className="h-5 w-5 mt-1 text-muted-foreground" onClick={(e) => { e.stopPropagation(); setShowNotes(!showNotes); }}> {/* Detener propagación */}
                            <MessageSquare size={12} />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p className="text-xs">{showNotes ? 'Ocultar' : 'Mostrar'} notas</p>
                    </TooltipContent>
                </Tooltip>
             </TooltipProvider>
        )}
        {/* Mostrar Tags si existen */}
        {item.tags && item.tags.length > 0 && (
             <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1 flex-wrap">
                 <Tags size={10} className="flex-shrink-0"/>
                 {/* Badge de tags eliminado por componente faltante */}
                 {item.tags.map(tag => (
                     <span key={tag} className="text-[10px] px-1 py-0 bg-secondary text-secondary-foreground rounded">{tag}</span>
                 ))}
             </div>
        )}
        {/* Bloque duplicado de notas eliminado */}
      </div>
      {/* Simula TableCell - Cantidad y Stock */}
      {/* Quitar ancho fijo, añadir padding */}
      <div className="px-3 py-2">
          <div>{item.quantity ?? '-'}</div>
          {(item.min_stock != null || item.target_stock != null) && (
              <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1" title={`Stock: Min ${item.min_stock ?? 'N/A'} / Obj ${item.target_stock ?? 'N/A'}`}>
                 <Package size={10}/>
                 ({item.min_stock ?? '_'} - {item.target_stock ?? '_'})
              </div>
          )}
      </div>
      {/* Simula TableCell - Unidad */}
      {/* Quitar ancho fijo, añadir padding y evitar que se encoja */}
      <div className="px-3 py-2 flex-shrink-0">{item.unit || '-'}</div>
      {/* Simula TableCell - Categoría */}
      {/* Quitar ancho fijo, añadir padding */}
      <div className="px-3 py-2">
        {/* Badge de categoría eliminado por componente faltante */}
        {item.category?.name ? ( // Añadir paréntesis alrededor del JSX
          (<> {/* Mostrar como texto simple, quitar estilos de badge */}
            <span className="text-xs">
                {/* {item.category.icon && <span className="mr-1">{item.category.icon}</span>} Icono opcional */}
                {item.category.name}
            </span>
          </>)
        ) : (
          <span className="text-xs text-muted-foreground">Sin cat.</span>
        )}
      </div>
      {/* Simula TableCell - Caducidad */}
      {/* Quitar ancho fijo, añadir padding y evitar que se encoja */}
      <div className={`px-3 py-2 text-xs flex-shrink-0 ${isExpired ? 'text-destructive font-medium' : ''}`}>
        {item.expiry_date || '-'}
        {/* Badge de vencido eliminado por componente faltante */}
        {isExpired && <span className="ml-1 text-[9px] px-1 py-0 leading-none text-destructive-foreground bg-destructive rounded">(V)</span>}
      </div>
      {/* Simula TableCell - Acciones */}
      {/* Quitar ancho fijo, añadir padding y evitar que se encoja */}
     {/* Acciones (solo si no estamos en modo selección) */}
     {!isSelectionMode && (
       <div className="text-right space-x-1 pl-3 py-2 flex-shrink-0">
         <TooltipProvider delayDuration={100}>
             <Tooltip>
                 <TooltipTrigger asChild>
                     <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); onEdit(item); }}> {/* Detener propagación */}
                       <Pencil className="h-3 w-3" />
                       <span className="sr-only">Editar</span>
                     </Button>
                 </TooltipTrigger>
                 <TooltipContent><p className="text-xs">Editar</p></TooltipContent>
             </Tooltip>
             <Tooltip>
                  <TooltipTrigger asChild>
                     <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={(e) => { e.stopPropagation(); onDelete(item.id); }}> {/* Detener propagación */}
                       <Trash2 className="h-3 w-3" />
                        <span className="sr-only">Eliminar</span>
                     </Button>
                  </TooltipTrigger>
                  <TooltipContent><p className="text-xs">Eliminar</p></TooltipContent>
             </Tooltip>
         </TooltipProvider>
       </div>
     )}
     {/* Espacio reservado para acciones si estamos en modo selección para mantener alineación */}
     {isSelectionMode && (
         <div className="pl-3 py-2 flex-shrink-0 w-[76px]"> {/* Ancho aproximado de los botones de acción */}
             &nbsp; {/* Espacio no rompible para mantener altura */}
         </div>
     )}
   </div>
   // TODO: Reintegrar la lógica de mostrar notas si es necesario
 );
}