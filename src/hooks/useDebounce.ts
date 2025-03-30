import { useState, useEffect } from 'react';

/**
 * Hook personalizado para debouncear un valor.
 * Útil para retrasar la ejecución de operaciones costosas (como búsquedas API)
 * hasta que el usuario haya dejado de escribir por un tiempo determinado.
 *
 * @param value El valor a debouncear (ej: el query de búsqueda).
 * @param delay El tiempo de espera en milisegundos después del último cambio.
 * @returns El valor debounced.
 */
export function useDebounce<T>(value: T, delay: number): T {
  // Estado para almacenar el valor debounced
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(
    () => {
      // Configurar un temporizador para actualizar el valor debounced
      // después del delay especificado
      const handler = setTimeout(() => {
        setDebouncedValue(value);
      }, delay);

      // Limpiar el temporizador si el valor cambia (o si el componente se desmonta)
      // Esto es lo que cancela el debounce si el usuario sigue escribiendo
      return () => {
        clearTimeout(handler);
      };
    },
    [value, delay] // Solo re-ejecutar el efecto si el valor o el delay cambian
  );

  return debouncedValue;
}