// src/components/common/AnimatedTabs.tsx
import React from 'react'; // No necesitamos useState aquí por ahora
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils'; // Asumiendo que tienes cn de shadcn/ui

interface TabItem {
  id: string;
  label: string;
}

interface AnimatedTabsProps {
  tabs: TabItem[];
  activeTabId: string;
  onChange: (id: string) => void;
  // Opcional: Props para personalizar colores/estilos
  // theme?: { ... };
  className?: string; // Para estilos del contenedor
  tabClassName?: string; // Para estilos de cada botón/tab
  activeTabClassName?: string; // Para estilos específicos del tab activo (principalmente color de texto)
  inactiveTabClassName?: string; // Para estilos específicos del tab inactivo (principalmente color de texto)
  indicatorClassName?: string; // Para estilos del indicador animado (fondo, sombra)
}

export function AnimatedTabs({
  tabs,
  activeTabId,
  onChange,
  className,
  tabClassName,
  activeTabClassName = "text-primary-foreground", // Color de texto activo por defecto
  inactiveTabClassName = "text-muted-foreground hover:text-primary", // Color de texto inactivo por defecto
  indicatorClassName = "bg-primary shadow-sm", // Fondo del indicador por defecto
}: AnimatedTabsProps) {

  return (
    <div className={cn(
      "relative flex space-x-1 p-1 bg-muted rounded-lg", // Contenedor base
      className
    )}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={cn(
            "relative rounded-md px-3 py-1.5 text-sm font-medium transition-colors duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2", // Estilos base del botón
            tabClassName,
            activeTabId === tab.id ? activeTabClassName : inactiveTabClassName // Aplicar clases de color de texto
          )}
          style={{
            WebkitTapHighlightColor: "transparent", // Mejora experiencia móvil
          }}
        >
          {/* Indicador animado (se posicionará detrás con layoutId) */}
          {activeTabId === tab.id && (
            <motion.span
              layoutId="bubble" // Clave para la animación compartida
              className={cn(
                "absolute inset-0 z-10 mix-blend-difference", // Posición y z-index
                indicatorClassName // Clases para el fondo/sombra
              )}
              style={{ borderRadius: 6 }} // Coincidir con rounded-md de los botones
              transition={{ type: "spring", bounce: 0.2, duration: 0.6 }} // Animación tipo resorte
            />
          )}
          {/* Etiqueta del Tab (delante del indicador) */}
          <span className="relative z-20">{tab.label}</span>
        </button>
      ))}
    </div>
  );
}