import React from 'react';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

/**
 * Componente reutilizable para mostrar un estado vacío o sin resultados.
 * Permite incluir un icono, título, descripción y un botón de acción opcional.
 */
export function EmptyState({
  icon,
  title,
  description,
  action,
  className
}: EmptyStateProps) {
  return (
    <div className={cn(
      "flex flex-col items-center text-center gap-4 py-16 px-4",
      className // Permite añadir clases desde fuera
    )}>
      {icon && (
        <div className="text-muted-foreground/70 mb-2">
          {/* Asumimos que el icono ya tiene tamaño, ej. h-12 w-12 */}
          {icon}
        </div>
      )}
      <h3 className="text-xl font-semibold text-foreground">{title}</h3>
      {description && (
        <p className="text-sm text-muted-foreground max-w-xs mx-auto">{description}</p>
      )}
      {action && (
        <div className="mt-4">
          {action}
        </div>
      )}
    </div>
  );
}