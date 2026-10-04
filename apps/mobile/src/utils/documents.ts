const PREFIJOS_RUTA_LOCAL = ['storage:', 'file://', 'content://', 'mobile-temp:'];

export function esRutaDocumentoServidor(ruta?: string | null): boolean {
  if (!ruta?.trim()) {
    return false;
  }

  return !PREFIJOS_RUTA_LOCAL.some((prefijo) => ruta.startsWith(prefijo));
}
