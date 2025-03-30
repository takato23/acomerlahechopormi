// src/components/common/EmptyState.tsx
import React from 'react';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center gap-4 py-16 px-4", // Aumentar padding vertical
        className
      )}
    >
      {icon && (
        <div className="text-muted-foreground/50 mb-4"> {/* Ajustar color y margen */}
          {/* Clonar el icono para poder aplicarle clases de tamaño */}
          {React.isValidElement(icon) ? React.cloneElement(icon as React.ReactElement, { className: 'h-16 w-16' }) : icon}
        </div>
      )}
      <h3 className="text-xl font-semibold">{title}</h3>
      {description && (
        <p className="text-muted-foreground max-w-xs">{description}</p> // Limitar ancho descripción
      )}
      {action && <div className="mt-4">{action}</div>} {/* Añadir margen superior a la acción */}
    </div>
  );
}