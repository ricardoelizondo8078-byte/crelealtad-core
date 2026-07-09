export type DocumentoClave =
  | 'solicitud_fisica'
  | 'ine'
  | 'comprobante_domicilio'
  | 'comprobante_credito_externo';

export type DocumentoEstado = 'Pendiente' | 'Capturado';

export interface DocumentoEntity {
  id: string;
  solicitanteId: string;
  clave: DocumentoClave;
  nombre: string;
  requerido: boolean;
  estado: DocumentoEstado;
  updatedAt: string;
}