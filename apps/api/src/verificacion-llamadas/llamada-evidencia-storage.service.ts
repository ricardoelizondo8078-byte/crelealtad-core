import { Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { mkdir, readFile, rm, writeFile } from 'fs/promises';
import { resolve } from 'path';
import {
  assertUuid,
  detectImageUploadFormat,
  sha256Hex,
} from '../common/files/upload-file.policy';

export interface ArchivoEvidenciaLlamadaRecibido {
  buffer: Buffer;
  mimetype: string;
  size: number;
}

export interface EvidenciaLlamadaGuardada {
  id: string;
  ruta: string;
  mime_type: 'image/jpeg' | 'image/png';
  tamano_bytes: number;
  sha256: string;
}

@Injectable()
export class LlamadaEvidenciaStorageService {
  private readonly storageRoot: string;

  constructor() {
    this.storageRoot = resolve(
      process.env.VERIFICACION_STORAGE_PATH
        || resolve(process.cwd(), 'runtime-data', 'verificacion-llamadas'),
    );
  }

  async guardar(
    integranteId: string,
    llamadaId: string,
    archivo: ArchivoEvidenciaLlamadaRecibido,
    rutaProtegida = `/verificacion/integrantes/${integranteId}/llamadas/${llamadaId}/evidencia`,
  ): Promise<EvidenciaLlamadaGuardada> {
    const formato = detectImageUploadFormat(archivo, {
      empty: 'La evidencia está vacía',
      tooLarge: 'La evidencia debe pesar máximo 10 MB',
      invalid: 'La evidencia debe ser una imagen JPEG o PNG válida',
    });
    const id = randomUUID();
    const directory = this.evidenceDirectory(integranteId, llamadaId, id);
    const nombre = `evidencia.${formato.extension}`;

    await mkdir(directory, { recursive: true });
    try {
      await writeFile(resolve(directory, nombre), archivo.buffer, { flag: 'wx' });
      return {
        id,
        ruta: rutaProtegida,
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
    llamadaId: string,
    evidenciaId: string,
    mimeType: string,
  ): Promise<Buffer> {
    const extension = mimeType === 'image/png' ? 'png' : 'jpg';
    try {
      return await readFile(resolve(
        this.evidenceDirectory(integranteId, llamadaId, evidenciaId),
        `evidencia.${extension}`,
      ));
    } catch {
      throw new NotFoundException('Evidencia de llamada no encontrada');
    }
  }

  async descartar(
    integranteId: string,
    llamadaId: string,
    evidenciaId: string,
  ): Promise<void> {
    await rm(this.evidenceDirectory(integranteId, llamadaId, evidenciaId), {
      recursive: true,
      force: true,
    });
  }

  private evidenceDirectory(
    integranteId: string,
    llamadaId: string,
    evidenciaId: string,
  ): string {
    assertUuid(integranteId, 'integrante');
    assertUuid(llamadaId, 'llamada');
    assertUuid(evidenciaId, 'evidencia');
    return resolve(this.storageRoot, integranteId, llamadaId, evidenciaId);
  }
}
