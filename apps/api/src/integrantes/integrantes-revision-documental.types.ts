export const TIPOS_DOCUMENTO_REVISION = [
  'ine',
  'comprobante',
  'ine_beneficiario',
  'solicitud_firmada',
] as const;

export type TipoDocumentoRevision = (typeof TIPOS_DOCUMENTO_REVISION)[number];
