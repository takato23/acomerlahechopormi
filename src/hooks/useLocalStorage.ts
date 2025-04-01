import { useState, useEffect } from 'react';

// Hook genérico para sincronizar estado con localStorage
function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T | ((val: T) => T)) => void] {
  // Función para obtener el valor inicial desde localStorage o usar el valor inicial proporcionado
  const readValue = (): T => {
    // Prevenir errores en SSR o entornos sin window/localStorage
    if (typeof window === 'undefined') {
      return initialValue;
    }

    try {
      const item = window.localStorage.getItem(key);
      // Parsear el JSON almacenado o devolver initialValue si no hay nada o hay error
      return item ? (JSON.parse(item) as T) : initialValue;
    } catch (error) {
      console.warn(`Error reading localStorage key “${key}”:`, error);
      return initialValue;
    }
  };

  // Estado para almacenar nuestro valor
  // Pasamos una función a useState para que la lógica de lectura inicial solo se ejecute una vez
  const [storedValue, setStoredValue] = useState<T>(readValue);

  // Función wrapper para `setValue` que persiste en localStorage
  const setValue = (value: T | ((val: T) => T)) => {
    // Prevenir errores en SSR
    if (typeof window === 'undefined') {
      console.warn(
        `Tried setting localStorage key “${key}” even though environment is not a client`
      );
    }

    try {
      // Permitir que el valor sea una función para tener la misma API que useState
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      // Guardar estado
      setStoredValue(valueToStore);
      // Guardar en localStorage
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.warn(`Error setting localStorage key “${key}”:`, error);
    }
  };

  // Escuchar cambios en localStorage desde otras pestañas/ventanas (opcional pero buena práctica)
  useEffect(() => {
    // Handler para cambios en localStorage desde otras pestañas/ventanas
    const handleStorageChange = (event: StorageEvent) => {
      // Asegurarse de que el evento es para nuestra key y tiene un nuevo valor
      if (event.key === key && event.newValue !== null) {
        try {
          // Actualizar el estado local con el nuevo valor parseado
          setStoredValue(JSON.parse(event.newValue) as T);
        } catch (error) {
          console.warn(`Error parsing localStorage change for key “${key}”:`, error);
        }
      } else if (event.key === key && event.newValue === null) {
        // Si la key fue eliminada en otra pestaña, volver al valor inicial
        setStoredValue(initialValue);
      }
    };

    // Suscribirse al evento 'storage'
    window.addEventListener('storage', handleStorageChange);

    // Limpiar el listener cuando el componente se desmonte o la key cambie
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
    // Dependencias: key e initialValue. Si cambian, el efecto se re-ejecuta.
  }, [key, initialValue]);

  return [storedValue, setValue];
}

export default useLocalStorage;