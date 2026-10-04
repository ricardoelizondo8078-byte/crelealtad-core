import { Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { mkdir, readFile, rm, writeFile } from 'fs/promises';
import { resolve } from 'path';
import {
  assertUuid,
  detectImageUploadFormat,
  sha256Hex,
} from '../common/files/upload-file.policy';

export interface ArchivoFachadaRecibido {
  buffer: Buffer;
  mimetype: string;
  size: number;
}

export interface ArchivoFachadaGuardado {
  id: string;
  ruta: string;
  mime_type: 'image/jpeg' | 'image/png';
  tamano_bytes: number;
  sha256: string;
}

export type ArchivoEvidenciaVecinoGuardado = ArchivoFachadaGuardado;

@Injectable()
export class VisitaVecinoFachadaStorageService {
  private readonly storageRoot: string;

  constructor() {
    this.storageRoot = resolve(
      process.env.VERIFICACION_STORAGE_PATH
        || resolve(process.cwd(), 'runtime-data', 'verificacion'),
      'visitas-vecino',
    );
  }

  async guardar(
    integranteId: string,
    archivo: ArchivoFachadaRecibido,
  ): Promise<ArchivoFachadaGuardado> {
    const id = randomUUID();
    return this.guardarArchivo(
      id,
      this.fachadaDirectory(integranteId, id),
      `/verificacion/integrantes/${integranteId}/visitas-vecino/fachadas/${id}/archivo`,
      'fachada',
      archivo,
    );
  }

  async guardarEvidencia(
    integranteId: string,
    visitaId: string,
    archivo: ArchivoFachadaRecibido,
  ): Promise<ArchivoEvidenciaVecinoGuardado> {
    const id = randomUUID();
    return this.guardarArchivo(
      id,
      this.evidenciaDirectory(integranteId, visitaId, id),
      `/verificacion/integrantes/${integranteId}/visitas-vecino/${visitaId}/evidencias/${id}/archivo`,
      'evidencia',
      archivo,
    );
  }

  async leer(
    integranteId: string,
    fachadaId: string,
    mimeType: string,
  ): Promise<Buffer> {
    const extension = mimeType === 'image/png' ? 'png' : 'jpg';
    try {
      return await readFile(resolve(
        this.fachadaDirectory(integranteId, fachadaId),
        `fachada.${extension}`,
      ));
    } catch {
      throw new NotFoundException('Fotografía de fachada no encontrada');
    }
  }

  async descartar(integranteId: string, fachadaId: string): Promise<void> {
    await rm(this.fachadaDirectory(integranteId, fachadaId), {
      recursive: true,
      force: true,
    });
  }

  async leerEvidencia(
    integranteId: string,
    visitaId: string,
    evidenciaId: string,
    mimeType: string,
  ): Promise<Buffer> {
    const extension = mimeType === 'image/png' ? 'png' : 'jpg';
    try {
      return await readFile(resolve(
        this.evidenciaDirectory(integranteId, visitaId, evidenciaId),
        `evidencia.${extension}`,
      ));
    } catch {
      throw new NotFoundException('Fotografía de evidencia no encontrada');
    }
  }

  async descartarEvidencia(
    integranteId: string,
    visitaId: string,
    evidenciaId: string,
  ): Promise<void> {
    await rm(this.evidenciaDirectory(integranteId, visitaId, evidenciaId), {
      recursive: true,
      force: true,
    });
  }

  private async guardarArchivo(
    id: string,
    directory: string,
    ruta: string,
    nombreBase: 'fachada' | 'evidencia',
    archivo: ArchivoFachadaRecibido,
  ): Promise<ArchivoFachadaGuardado> {
    const formato = detectImageUploadFormat(archivo, {
      empty: 'La fotografía de fachada está vacía',
      tooLarge: 'La fotografía de fachada debe pesar máximo 10 MB',
      invalid: 'La fotografía de fachada debe ser una imagen JPEG o PNG válida',
    });
    await mkdir(directory, { recursive: true });
    try {
      await writeFile(
        resolve(directory, `${nombreBase}.${formato.extension}`),
        archivo.buffer,
        { flag: 'wx' },
      );
      return {
        id,
        ruta,
        mime_type: formato.mimeType,
        tamano_bytes: archivo.buffer.length,
        sha256: sha256Hex(archivo.buffer),
      };
    } catch (error) {
      await rm(directory, { recursive: true, force: true });
      throw error;
    }
  }

  private fachadaDirectory(integranteId: string, fachadaId: string): string {
    assertUuid(integranteId, 'integrante');
    assertUuid(fachadaId, 'fachada');
    return resolve(this.storageRoot, integranteId, fachadaId);
  }

  private evidenciaDirectory(
    integranteId: string,
    visitaId: string,
    evidenciaId: string,
  ): string {
    assertUuid(integranteId, 'integrante');
    assertUuid(visitaId, 'visita');
    assertUuid(evidenciaId, 'evidencia');
    return resolve(this.storageRoot, 'evidencias', integranteId, visitaId, evidenciaId);
  }
}
