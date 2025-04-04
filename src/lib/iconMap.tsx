import React from 'react';
import { 
  LucideProps, 
  Package, // Default
  Carrot, 
  Beef, 
  Milk, 
  Archive, 
  GlassWater, 
  Snowflake, 
  Sandwich,
  SprayCan,
  PersonStanding,
  Tag,
  HelpCircle,
  // Añade aquí cualquier otro icono que uses en tu BD
} from 'lucide-react';

type LucideIcon = React.ComponentType<LucideProps>;

// Mapeo explícito de nombres (en minúscula/kebab-case como en BD) a componentes de icono
const iconRegistry: Record<string, LucideIcon> = {
  'package': Package, // Fallback si no se especifica otro
  'carrot': Carrot,
  'beef': Beef,
  'milk': Milk,
  'archive': Archive,
  'glass-water': GlassWater,
  'snowflake': Snowflake,
  'sandwich': Sandwich,
  'spray': SprayCan, // Asumiendo 'spray' para Limpieza
  'bath': PersonStanding, // Asumiendo 'bath' para Higiene Personal
  'tag': Tag, // Posible para 'Otros'
  'help-circle': HelpCircle, // Otro posible para 'Otros'
  // Añade más mapeos según los nombres que uses en tu BD
};

/**
 * Obtiene un componente de icono Lucide basado en su nombre registrado.
 * Devuelve el icono por defecto (Package) si el nombre no es válido o no se encuentra.
 * @param iconName - El nombre del icono (ej. "milk", "carrot", "glass-water"). Case-insensitive.
 * @returns El componente de icono Lucide correspondiente o el icono por defecto.
 */
export const getLucideIcon = (iconName?: string | null): LucideIcon => {
  if (iconName && typeof iconName === 'string') {
    // Buscar en minúscula para ser case-insensitive
    const IconComponent = iconRegistry[iconName.toLowerCase()];
    if (IconComponent) {
      return IconComponent;
    }
    console.warn(`[getLucideIcon] Icono no encontrado en el registro: ${iconName}`);
  }
  return Package; // Devolver icono por defecto si no se encuentra
};

// Exportar el icono por defecto también por si se necesita directamente
export const DefaultIcon = Package;