import {
  ArchivoDocumentoRecibido,
  DocumentoGuardado,
  TipoDocumento,
} from './documentos.types';

export abstract class DocumentosStoragePort {
  abstract validarTipo(tipo: string): TipoDocumento;

  abstract guardar(
    integranteId: string,
    tipoEntrada: string,
    usuarioId: string,
    archivos: ArchivoDocumentoRecibido[],
  ): Promise<DocumentoGuardado>;

  abstract obtener(
    integranteId: string,
    tipoEntrada: string,
    documentoId: string,
  ): Promise<DocumentoGuardado>;

  abstract leerArchivo(
    integranteId: string,
    tipoEntrada: string,
    documentoId: string,
    indice: number,
  ): Promise<{ contenido: Buffer; mimeType: string }>;

  abstract confirmarExistencia(
    integranteId: string,
    tipoEntrada: string,
    documentoId: string,
  ): Promise<boolean>;

  abstract descartar(documento: DocumentoGuardado): Promise<void>;
}
