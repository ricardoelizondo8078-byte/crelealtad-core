export interface SolicitudEntity {
  id: string;
  solicitanteId: string;
  createdAt: string;
  updatedAt: string;
  [key: string]: string | boolean | undefined;
}
