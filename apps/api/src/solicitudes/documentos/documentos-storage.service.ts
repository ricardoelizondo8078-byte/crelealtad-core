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
} from '../../common/files/upload-file.policy';
import {
  ArchivoDocumentoRecibido,
  DocumentoGuardado,
  TIPOS_DOCUMENTO,
  TipoDocumento,
} from './documentos.types';
import { DocumentosStoragePort } from './documentos-storage.port';

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
    const tipo = this.validarTipo(tipoEntrada);
    if (!archivos?.length) {
      throw new BadRequestException('Debes enviar al menos una imagen del documento');
    }
    if (tipo !== 'comprobante_credito' && archivos.length > 2) {
      throw new BadRequestException('Este documento permite máximo dos imágenes');
    }
    if (tipo === 'ine' && archivos.length !== 2) {
      throw new BadRequestException('El INE requiere frente y reverso');
    }

    const documentoId = randomUUID();
    const directory = this.documentDirectory(integranteId, tipo, documentoId);
    await mkdir(directory, { recursive: true });

    try {
      const guardados = [];
      for (let index = 0; index < archivos.length; index += 1) {
        const archivo = archivos[index];
        const formato = detectDocumentUploadFormat(archivo, {
          empty: 'El archivo está vacío',
          tooLarge: 'Cada archivo debe pesar máximo 10 MB',
          invalid: 'Solo se permiten imágenes JPEG, PNG o archivos PDF válidos',
        });
        const nombre = `pagina-${index + 1}.${formato.extension}`;
        await writeFile(resolve(directory, nombre), archivo.buffer, { flag: 'wx' });
        guardados.push({
          indice: index,
          nombre,
          mime_type: formato.mimeType,
          tamano: archivo.size,
          url: this.archivoRoute(integranteId, tipo, documentoId, index),
        });
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
      return documento;
    } catch (error) {
      await rm(directory, { recursive: true, force: true });
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
