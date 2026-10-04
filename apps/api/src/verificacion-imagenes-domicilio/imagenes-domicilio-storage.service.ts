import { Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { mkdir, readFile, rm, writeFile } from 'fs/promises';
import { resolve } from 'path';
import {
  assertUuid,
  detectImageUploadFormat,
  sha256Hex,
} from '../common/files/upload-file.policy';

export interface ArchivoImagenDomicilioRecibido {
  buffer: Buffer;
  mimetype: string;
  size: number;
}

export interface ArchivoImagenDomicilioGuardado {
  id: string;
  ruta: string;
  mime_type: 'image/jpeg' | 'image/png';
  tamano_bytes: number;
  sha256: string;
}

@Injectable()
export class ImagenesDomicilioStorageService {
  private readonly storageRoot: string;

  constructor() {
    this.storageRoot = resolve(
      process.env.VERIFICACION_STORAGE_PATH
        || resolve(process.cwd(), 'runtime-data', 'verificacion'),
      'imagenes-domicilio',
    );
  }

  async guardar(
    integranteId: string,
    archivo: ArchivoImagenDomicilioRecibido,
  ): Promise<ArchivoImagenDomicilioGuardado> {
    const id = randomUUID();
    const directory = this.imagenDirectory(integranteId, id);
    const formato = detectImageUploadFormat(archivo, {
      empty: 'La imagen del domicilio está vacía',
      tooLarge: 'La imagen del domicilio debe pesar máximo 10 MB',
      invalid: 'La imagen del domicilio debe ser JPEG o PNG válida',
    });
    await mkdir(directory, { recursive: true });

    try {
      await writeFile(
        resolve(directory, `imagen.${formato.extension}`),
        archivo.buffer,
        { flag: 'wx' },
      );
      return {
        id,
        ruta: `/verificacion/integrantes/${integranteId}/imagenes-domicilio/${id}/archivo`,
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
    imagenId: string,
    mimeType: string,
  ): Promise<Buffer> {
    const extension = mimeType === 'image/png' ? 'png' : 'jpg';
    try {
      return await readFile(resolve(
        this.imagenDirectory(integranteId, imagenId),
        `imagen.${extension}`,
      ));
    } catch {
      throw new NotFoundException('Imagen del domicilio no encontrada');
    }
  }

  async descartar(integranteId: string, imagenId: string): Promise<void> {
    await rm(this.imagenDirectory(integranteId, imagenId), {
      recursive: true,
      force: true,
    });
  }

  private imagenDirectory(integranteId: string, imagenId: string): string {
    assertUuid(integranteId, 'integrante');
    assertUuid(imagenId, 'imagen');
    return resolve(this.storageRoot, integranteId, imagenId);
  }
}
