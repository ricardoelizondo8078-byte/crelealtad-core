import { BadRequestException } from '@nestjs/common';
import { mkdtemp, readFile, rm } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';
import { EntrevistaEvidenciaStorageService } from './entrevista-evidencia-storage.service';

describe('EntrevistaEvidenciaStorageService', () => {
  const integranteId = '11111111-1111-4111-8111-111111111111';
  let storagePath: string;
  let previousStoragePath: string | undefined;

  beforeEach(async () => {
    previousStoragePath = process.env.VERIFICACION_STORAGE_PATH;
    storagePath = await mkdtemp(join(tmpdir(), 'crelealtad-entrevista-'));
    process.env.VERIFICACION_STORAGE_PATH = storagePath;
  });

  afterEach(async () => {
    if (previousStoragePath === undefined) {
      delete process.env.VERIFICACION_STORAGE_PATH;
    } else {
      process.env.VERIFICACION_STORAGE_PATH = previousStoragePath;
    }
    await rm(storagePath, { recursive: true, force: true });
  });

  it('verifica los bytes y permite recuperar la fotografía protegida', async () => {
    const service = new EntrevistaEvidenciaStorageService();
    const bytes = Buffer.from([0xff, 0xd8, 0xff, 0x01, 0x02]);

    const guardada = await service.guardar(integranteId, 'NEGOCIO', {
      buffer: bytes,
      mimetype: 'image/jpeg',
      size: bytes.length,
    });

    await expect(service.leer(integranteId, 'NEGOCIO', guardada.id, guardada.mime_type))
      .resolves.toEqual(bytes);
    expect(await readFile(join(
      storagePath,
      'entrevista-evidencias',
      'negocio',
      integranteId,
      guardada.id,
      'evidencia.jpg',
    ))).toEqual(bytes);
  });

  it('rechaza contenido que no sea una imagen JPEG o PNG válida', async () => {
    const service = new EntrevistaEvidenciaStorageService();

    await expect(service.guardar(integranteId, 'NEGOCIO', {
      buffer: Buffer.from('no-es-imagen'),
      mimetype: 'image/jpeg',
      size: 12,
    })).rejects.toBeInstanceOf(BadRequestException);
  });
});
