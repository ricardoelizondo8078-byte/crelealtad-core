import { useEffect, useState } from 'react';

/**
 * Hook para debounce de valores
 * Útil para auto-save, búsqueda, y prevenir requests excesivos
 *
 * @example
 * const [searchTerm, setSearchTerm] = useState('');
 * const debouncedSearch = useDebounce(searchTerm, 500);
 *
 * useEffect(() => {
 *   // Este efecto solo se ejecuta 500ms después del último cambio
 *   if (debouncedSearch) {
 *     fetchResults(debouncedSearch);
 *   }
 * }, [debouncedSearch]);
 */
export function useDebounce<T>(value: T, delay: number = 500): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    // Set timeout para actualizar el valor después del delay
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Cleanup: cancelar el timeout si value cambia antes del delay
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Hook para debounce de callbacks
 * Útil para funciones de guardado automático
 *
 * @example
 * const debouncedSave = useDebouncedCallback(
 *   (formData) => saveToAPI(formData),
 *   500
 * );
 *
 * // Llamar múltiples veces - solo se ejecuta una vez después de 500ms
 * onChange={(value) => debouncedSave({ field: value })}
 */
export function useDebouncedCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number = 500,
): (...args: Parameters<T>) => void {
  const [timeoutId, setTimeoutId] = useState<ReturnType<typeof setTimeout> | null>(null);

  return (...args: Parameters<T>) => {
    // Cancelar el timeout anterior
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    // Crear nuevo timeout
    const newTimeoutId = setTimeout(() => {
      callback(...args);
    }, delay);

    setTimeoutId(newTimeoutId);
  };
}
