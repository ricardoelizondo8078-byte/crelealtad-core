import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { mkdir, readFile, rm, stat, writeFile } from 'fs/promises';
import { basename, resolve } from 'path';
import {
  assertUuid,
  detectDocumentUploadFormat,
  MAX_DOCUMENT_FILES_PER_MULTIPART_REQUEST,
} from '../../common/files/upload-file.policy';
import {
  ArchivoDocumentoRecibido,
  CargaDocumentoInput,
  DocumentoGuardado,
  ResultadoCargaDocumento,
  TIPOS_DOCUMENTO,
  TipoDocumento,
} from './documentos.types';
import { DocumentosStoragePort } from './documentos-storage.port';

interface CargaDocumentoPendiente {
  id: string;
  integrante_id: string;
  tipo: TipoDocumento;
  usuario_id: string;
  total_archivos: number;
  fecha_inicio: string;
  archivos: DocumentoGuardado['archivos'];
}

@Injectable()
export class DocumentosStorageService extends DocumentosStoragePort {
  private readonly storageRoot: string;

  constructor() {
    super();
    this.storageRoot = resolve(
      process.env.DOCUMENT_STORAGE_PATH || resolve(process.cwd(), 'runtime-data', 'documentos'),
    );
  }

  validarTipo(tipo: string): TipoDocumento {
    if (!TIPOS_DOCUMENTO.includes(tipo as TipoDocumento)) {
      throw new BadRequestException('Tipo de documento no permitido');
    }
    return tipo as TipoDocumento;
  }

  async guardar(
    integranteId: string,
    tipoEntrada: string,
    usuarioId: string,
    archivos: ArchivoDocumentoRecibido[],
  ): Promise<DocumentoGuardado> {
    const resultado = await this.guardarLote(
      integranteId,
      tipoEntrada,
      usuarioId,
      archivos,
      {
        indice_inicio: 0,
        total_archivos: archivos.length,
        finalizar: true,
      },
    );
    if (!resultado.documento) {
      throw new BadRequestException('La carga del documento quedó incompleta');
    }
    return resultado.documento;
  }

  async guardarLote(
    integranteId: string,
    tipoEntrada: string,
    usuarioId: string,
    archivos: ArchivoDocumentoRecibido[],
    carga: CargaDocumentoInput = {},
  ): Promise<ResultadoCargaDocumento> {
    const tipo = this.validarTipo(tipoEntrada);
    if (!archivos?.length) {
      throw new BadRequestException('Debes enviar al menos una imagen del documento');
    }
    if (archivos.length > MAX_DOCUMENT_FILES_PER_MULTIPART_REQUEST) {
      throw new BadRequestException(
        `Cada lote permite máximo ${MAX_DOCUMENT_FILES_PER_MULTIPART_REQUEST} imágenes`,
      );
    }

    const totalArchivos = carga.total_archivos ?? archivos.length;
    const indiceInicio = carga.indice_inicio ?? 0;
    const finalizar = carga.finalizar ?? true;
    if (!Number.isSafeInteger(totalArchivos) || totalArchivos < 1) {
      throw new BadRequestException('El total de archivos de la carga no es válido');
    }
    if (!Number.isSafeInteger(indiceInicio) || indiceInicio < 0) {
      throw new BadRequestException('El índice inicial de la carga no es válido');
    }
    if (tipo !== 'comprobante_credito' && totalArchivos > 2) {
      throw new BadRequestException('Este documento permite máximo dos imágenes');
    }
    if (tipo === 'ine' && totalArchivos !== 2) {
      throw new BadRequestException('El INE requiere frente y reverso');
    }

    const documentoId = carga.carga_id ?? randomUUID();
    assertUuid(documentoId, 'carga');
    const directory = this.documentDirectory(integranteId, tipo, documentoId);
    const draftPath = resolve(directory, 'upload.json');
    const esNuevaCarga = !carga.carga_id;
    let pendiente: CargaDocumentoPendiente;

    if (esNuevaCarga) {
      if (indiceInicio !== 0) {
        throw new BadRequestException('El primer lote debe iniciar en el índice 0');
      }
      pendiente = {
        id: documentoId,
        integrante_id: integranteId,
        tipo,
        usuario_id: usuarioId,
        total_archivos: totalArchivos,
        fecha_inicio: new Date().toISOString(),
        archivos: [],
      };
    } else {
      pendiente = await this.obtenerCargaPendiente(draftPath);
      if (
        pendiente.id !== documentoId
        || pendiente.integrante_id !== integranteId
        || pendiente.tipo !== tipo
        || pendiente.usuario_id !== usuarioId
      ) {
        throw new BadRequestException('La carga pendiente no corresponde al documento o usuario actual');
      }
      if (pendiente.total_archivos !== totalArchivos) {
        throw new BadRequestException('El total de archivos no coincide con la carga iniciada');
      }
    }

    if (indiceInicio !== pendiente.archivos.length) {
      throw new BadRequestException(
        `El siguiente lote debe iniciar en el índice ${pendiente.archivos.length}`,
      );
    }
    const recibidos = indiceInicio + archivos.length;
    if (recibidos > totalArchivos) {
      throw new BadRequestException('El lote excede el total de archivos declarado');
    }
    if (finalizar && recibidos !== totalArchivos) {
      throw new BadRequestException('No se puede finalizar: todavía faltan archivos');
    }
    if (!finalizar && recibidos === totalArchivos) {
      throw new BadRequestException('El último lote debe marcarse para finalizar');
    }

    const nombresCreados: string[] = [];
    try {
      if (esNuevaCarga) await mkdir(directory, { recursive: true });
      const guardados = [...pendiente.archivos];
      for (let index = 0; index < archivos.length; index += 1) {
        const archivo = archivos[index];
        const formato = detectDocumentUploadFormat(archivo, {
          empty: 'El archivo está vacío',
          tooLarge: 'Cada archivo debe pesar máximo 10 MB',
          invalid: 'Solo se permiten imágenes JPEG, PNG o archivos PDF válidos',
        });
        const indice = indiceInicio + index;
        const nombre = `pagina-${indice + 1}.${formato.extension}`;
        await writeFile(resolve(directory, nombre), archivo.buffer, { flag: 'wx' });
        nombresCreados.push(nombre);
        guardados.push({
          indice,
          nombre,
          mime_type: formato.mimeType,
          tamano: archivo.size,
          url: this.archivoRoute(integranteId, tipo, documentoId, indice),
        });
      }

      if (!finalizar) {
        await writeFile(
          draftPath,
          JSON.stringify({ ...pendiente, archivos: guardados }, null, 2),
          { encoding: 'utf8' },
        );
        return {
          carga_id: documentoId,
          recibidos: guardados.length,
          total_archivos: totalArchivos,
          completado: false,
        };
      }

      const fechaCaptura = new Date().toISOString();
      const documento: DocumentoGuardado = {
        id: documentoId,
        integrante_id: integranteId,
        tipo,
        ruta: this.documentRoute(integranteId, tipo, documentoId),
        fecha_captura: fechaCaptura,
        usuario_id: usuarioId,
        archivos: guardados,
      };
      await writeFile(
        resolve(directory, 'manifest.json'),
        JSON.stringify(documento, null, 2),
        { encoding: 'utf8', flag: 'wx' },
      );
      await rm(draftPath, { force: true });
      return {
        carga_id: documentoId,
        recibidos: guardados.length,
        total_archivos: totalArchivos,
        completado: true,
        documento,
      };
    } catch (error) {
      if (esNuevaCarga) {
        await rm(directory, { recursive: true, force: true });
      } else {
        await Promise.all(nombresCreados.map((nombre) => rm(resolve(directory, nombre), { force: true })));
      }
      throw error;
    }
  }

  async obtener(integranteId: string, tipoEntrada: string, documentoId: string): Promise<DocumentoGuardado> {
    const tipo = this.validarTipo(tipoEntrada);
    assertUuid(documentoId, 'documento');
    try {
      const raw = await readFile(
        resolve(this.documentDirectory(integranteId, tipo, documentoId), 'manifest.json'),
        'utf8',
      );
      const documento = JSON.parse(raw) as DocumentoGuardado;
      if (documento.integrante_id !== integranteId || documento.tipo !== tipo || documento.id !== documentoId) {
        throw new NotFoundException('Documento no encontrado');
      }
      return documento;
    } catch (error) {
      if (error instanceof BadRequestException || error instanceof NotFoundException) throw error;
      throw new NotFoundException('Documento no encontrado');
    }
  }

  async leerArchivo(integranteId: string, tipoEntrada: string, documentoId: string, indice: number) {
    const documento = await this.obtener(integranteId, tipoEntrada, documentoId);
    const archivo = documento.archivos.find((item) => item.indice === indice);
    if (!archivo) throw new NotFoundException('Página del documento no encontrada');
    if (basename(archivo.nombre) !== archivo.nombre) {
      throw new NotFoundException('Página del documento no encontrada');
    }
    const contenido = await readFile(
      resolve(this.documentDirectory(integranteId, documento.tipo, documentoId), archivo.nombre),
    );
    return { contenido, mimeType: archivo.mime_type };
  }

  async confirmarExistencia(
    integranteId: string,
    tipoEntrada: string,
    documentoId: string,
  ): Promise<boolean> {
    try {
      const documento = await this.obtener(integranteId, tipoEntrada, documentoId);
      if (documento.archivos.length === 0) return false;
      const directory = this.documentDirectory(integranteId, documento.tipo, documentoId);
      const resultados = await Promise.all(documento.archivos.map(async (archivo) => {
        if (basename(archivo.nombre) !== archivo.nombre) return false;
        const info = await stat(resolve(directory, archivo.nombre));
        return info.isFile() && info.size === archivo.tamano;
      }));
      return resultados.every(Boolean);
    } catch {
      return false;
    }
  }

  async descartar(documento: DocumentoGuardado): Promise<void> {
    await rm(this.documentDirectory(documento.integrante_id, documento.tipo, documento.id), {
      recursive: true,
      force: true,
    });
  }

  private async obtenerCargaPendiente(path: string): Promise<CargaDocumentoPendiente> {
    try {
      const pendiente = JSON.parse(await readFile(path, 'utf8')) as CargaDocumentoPendiente;
      if (
        !pendiente
        || typeof pendiente.id !== 'string'
        || typeof pendiente.integrante_id !== 'string'
        || typeof pendiente.tipo !== 'string'
        || typeof pendiente.usuario_id !== 'string'
        || !Number.isSafeInteger(pendiente.total_archivos)
        || !Array.isArray(pendiente.archivos)
      ) {
        throw new Error('Carga pendiente inválida');
      }
      return pendiente;
    } catch {
      throw new NotFoundException('Carga pendiente no encontrada');
    }
  }

  private documentDirectory(integranteId: string, tipo: TipoDocumento, documentoId: string): string {
    assertUuid(integranteId, 'integrante');
    assertUuid(documentoId, 'documento');
    return resolve(this.storageRoot, integranteId, tipo, documentoId);
  }

  private documentRoute(integranteId: string, tipo: TipoDocumento, documentoId: string): string {
    return `/solicitudes/integrante/${integranteId}/documentos/${tipo}/${documentoId}`;
  }

  private archivoRoute(integranteId: string, tipo: TipoDocumento, documentoId: string, indice: number): string {
    return `${this.documentRoute(integranteId, tipo, documentoId)}/archivos/${indice}`;
  }
}
