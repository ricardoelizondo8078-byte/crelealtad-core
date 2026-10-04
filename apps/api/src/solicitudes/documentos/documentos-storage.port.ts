import {
  ArchivoDocumentoRecibido,
  CargaDocumentoInput,
  DocumentoGuardado,
  ResultadoCargaDocumento,
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

  abstract guardarLote(
    integranteId: string,
    tipoEntrada: string,
    usuarioId: string,
    archivos: ArchivoDocumentoRecibido[],
    carga?: CargaDocumentoInput,
  ): Promise<ResultadoCargaDocumento>;

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
