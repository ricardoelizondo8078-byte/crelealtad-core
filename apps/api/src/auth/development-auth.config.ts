const PIN_PATTERN = /^\d{4}$/;

export function getDevelopmentUniversalPin(): string | null {
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  const pin = process.env.DEV_UNIVERSAL_PIN?.trim();
  return pin && PIN_PATTERN.test(pin) ? pin : null;
}

export function isDevelopmentUniversalAccessEnabled(): boolean {
  return getDevelopmentUniversalPin() !== null;
}

export function matchesDevelopmentUniversalPin(pin: string): boolean {
  return getDevelopmentUniversalPin() === pin;
}
