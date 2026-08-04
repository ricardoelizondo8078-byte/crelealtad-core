export const formatCurrency = (value: number | string | null | undefined): string => {
  if (value === null || value === undefined || value === '') {
    return '$ 0';
  }

  // BUG 3 FIX: No eliminar el punto decimal, solo parsear directamente
  const numeric = typeof value === 'number' ? value : parseFloat(String(value));

  if (Number.isNaN(numeric)) {
    return '$ 0';
  }

  const formatted = Math.trunc(numeric).toLocaleString('en-US');
  return `$ ${formatted}`;
};

/**
 * Normaliza la entrada de moneda para TextInput
 * Acepta solo números y formatea automáticamente con comas
 * Ejemplo: "1234" -> "$ 1,234"
 */
export const normalizeCurrencyInput = (value: string): string => {
  // Remover todo excepto dígitos
  const digitsOnly = value.replace(/\D/g, '');

  // Si está vacío, retornar vacío
  if (!digitsOnly) {
    return '';
  }

  // Convertir a número y formatear
  const numeric = parseInt(digitsOnly, 10);
  const formatted = numeric.toLocaleString('en-US');
  return `$ ${formatted}`;
};

/**
 * Extrae el valor numérico de un string de moneda formateado
 * Ejemplo: "$ 1,234" -> "1234"
 */
export const extractCurrencyValue = (formattedValue: string): string => {
  return formattedValue.replace(/\D/g, '');
};
