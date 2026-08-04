export const normalizeUppercaseText = (value: string): string => value.toUpperCase();

export const normalizeUppercaseLettersOnly = (value: string): string =>
  value.toUpperCase().replace(/[^A-ZÁÉÍÓÚÜÑ\s]/g, '');

export const normalizeCurpInput = (value: string): string =>
  value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 18);

export const normalizeDigits = (value: string, maxLength?: number): string => {
  const digitsOnly = value.replace(/\D/g, '');
  if (!maxLength) {
    return digitsOnly;
  }

  return digitsOnly.slice(0, maxLength);
};

export const normalizePhone = (value: string): string => normalizeDigits(value, 10);

export const formatPhone = (value: string): string => {
  const digits = normalizePhone(value);

  if (!digits) {
    return '';
  }

  const pairs = digits.match(/.{1,2}/g);
  return pairs ? pairs.join('-') : digits;
};

export const validatePhone10 = (value: string): boolean => normalizePhone(value).length === 10;

export const formatDateDDMMYYYY = (value: string): string => {
  const digits = normalizeDigits(value, 8);

  if (digits.length <= 2) {
    return digits;
  }

  if (digits.length <= 4) {
    return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  }

  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
};

export const validateRealDate = (value: string): boolean => {
  if (!/^\d{2}\/\d{2}\/\d{4}$/.test(value)) {
    return false;
  }

  const [dayText, monthText, yearText] = value.split('/');
  const day = Number(dayText);
  const month = Number(monthText);
  const year = Number(yearText);

  if (year < 1900 || year > 2100) {
    return false;
  }

  if (month < 1 || month > 12) {
    return false;
  }

  if (day < 1 || day > 31) {
    return false;
  }

  const candidateDate = new Date(year, month - 1, day);
  return (
    candidateDate.getFullYear() === year &&
    candidateDate.getMonth() === month - 1 &&
    candidateDate.getDate() === day
  );
};

const SPANISH_MONTHS_3 = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'];

export const toISODateFromDDMMYYYY = (value: string): string => {
  if (!validateRealDate(value)) {
    return '';
  }

  const [dayText, monthText, yearText] = value.split('/');
  return `${yearText}-${monthText}-${dayText}`;
};

export const formatISODateToDDMMYYYY = (value: string): string => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return '';
  }

  const [yearText, monthText, dayText] = value.split('-');
  const ddmmyyyy = `${dayText}/${monthText}/${yearText}`;
  return validateRealDate(ddmmyyyy) ? ddmmyyyy : '';
};

export const formatDDMMYYYYToDDMMMYYYY = (value: string): string => {
  if (!validateRealDate(value)) {
    return value;
  }

  const [dayText, monthText, yearText] = value.split('/');
  const monthIndex = Number(monthText) - 1;
  const monthLabel = SPANISH_MONTHS_3[monthIndex];
  return `${dayText}-${monthLabel}-${yearText}`;
};

export const formatISODateToDDMMMYYYY = (value: string): string => {
  const ddmmyyyy = formatISODateToDDMMYYYY(value);
  if (!ddmmyyyy) {
    return '';
  }

  return formatDDMMYYYYToDDMMMYYYY(ddmmyyyy);
};

export const maskDateDDMMYYYY = formatDateDDMMYYYY;

export const isValidDateDDMMYYYY = validateRealDate;
