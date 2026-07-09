export const formatCurrency = (value: number | string | null | undefined): string => {
  if (value === null || value === undefined || value === '') {
    return '$ 0';
  }

  const numeric = typeof value === 'number' ? value : Number(String(value).replace(/\D/g, ''));

  if (Number.isNaN(numeric)) {
    return '$ 0';
  }

  const formatted = Math.trunc(numeric).toLocaleString('en-US');
  return `$ ${formatted}`;
};
