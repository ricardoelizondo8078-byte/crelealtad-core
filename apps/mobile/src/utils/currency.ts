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
