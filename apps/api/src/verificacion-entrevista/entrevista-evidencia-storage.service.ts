import { Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { mkdir, readFile, rm, writeFile } from 'fs/promises';
import { resolve } from 'path';
import {
  assertUuid,
  detectImageUploadFormat,
  sha256Hex,
} from '../common/files/upload-file.policy';
import { TipoEvidenciaEntrevista } from './verificacion-entrevista-evidencia.entity';

export interface ArchivoEvidenciaEntrevistaRecibido {
  buffer: Buffer;
  mimetype: string;
  size: number;
}

export interface ArchivoEvidenciaEntrevistaGuardado {
  id: string;
  ruta: string;
  mime_type: 'image/jpeg' | 'image/png';
  tamano_bytes: number;
  sha256: string;
}

@Injectable()
export class EntrevistaEvidenciaStorageService {
  private readonly storageRoot: string;

  constructor() {
    this.storageRoot = resolve(
      process.env.VERIFICACION_STORAGE_PATH
        || resolve(process.cwd(), 'runtime-data', 'verificacion'),
      'entrevista-evidencias',
    );
  }

  async guardar(
    integranteId: string,
    tipo: TipoEvidenciaEntrevista,
    archivo: ArchivoEvidenciaEntrevistaRecibido,
  ): Promise<ArchivoEvidenciaEntrevistaGuardado> {
    const id = randomUUID();
    const directory = this.evidenciaDirectory(integranteId, tipo, id);
    const formato = detectImageUploadFormat(archivo, {
      empty: 'La evidencia está vacía',
      tooLarge: 'Cada evidencia debe pesar máximo 10 MB',
      invalid: 'La evidencia debe ser JPEG o PNG válida',
    });
    await mkdir(directory, { recursive: true });

    try {
      await writeFile(
        resolve(directory, `evidencia.${formato.extension}`),
        archivo.buffer,
        { flag: 'wx' },
      );
      return {
        id,
        ruta: `/verificacion/integrantes/${integranteId}/entrevista/evidencias/${id}/archivo`,
        mime_type: formato.mimeType,
        tamano_bytes: archivo.buffer.length,
        sha256: sha256Hex(archivo.buffer),
      };
    } catch (error) {
      await rm(directory, { recursive: true, force: true });
      throw error;
    }
  }

  async leer(
    integranteId: string,
    tipo: TipoEvidenciaEntrevista,
    evidenciaId: string,
    mimeType: string,
  ): Promise<Buffer> {
    const extension = mimeType === 'image/png' ? 'png' : 'jpg';
    try {
      return await readFile(resolve(
        this.evidenciaDirectory(integranteId, tipo, evidenciaId),
        `evidencia.${extension}`,
      ));
    } catch {
      throw new NotFoundException('Evidencia de entrevista no encontrada');
    }
  }

  async descartar(
    integranteId: string,
    tipo: TipoEvidenciaEntrevista,
    evidenciaId: string,
  ): Promise<void> {
    await rm(this.evidenciaDirectory(integranteId, tipo, evidenciaId), {
      recursive: true,
      force: true,
    });
  }

  private evidenciaDirectory(
    integranteId: string,
    tipo: TipoEvidenciaEntrevista,
    evidenciaId: string,
  ): string {
    assertUuid(integranteId, 'integrante');
    assertUuid(evidenciaId, 'evidencia');
    return resolve(this.storageRoot, tipo.toLowerCase(), integranteId, evidenciaId);
  }
}
