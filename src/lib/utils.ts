import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Crea una función de logging con un prefijo específico para cada componente/módulo
 */
export const debugLogger = (prefix: string) => {
  return (message: string, data?: any) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`${prefix} ${message}`, data || '');
    }
  };
};
