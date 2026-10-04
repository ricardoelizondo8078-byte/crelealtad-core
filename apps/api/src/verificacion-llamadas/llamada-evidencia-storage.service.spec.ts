import { BadRequestException } from '@nestjs/common';
import { mkdtemp, rm } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';
import { LlamadaEvidenciaStorageService } from './llamada-evidencia-storage.service';

describe('LlamadaEvidenciaStorageService', () => {
  let storageRoot: string;
  let previousStoragePath: string | undefined;
  let service: LlamadaEvidenciaStorageService;

  beforeEach(async () => {
    previousStoragePath = process.env.VERIFICACION_STORAGE_PATH;
    storageRoot = await mkdtemp(join(tmpdir(), 'crelealtad-llamada-'));
    process.env.VERIFICACION_STORAGE_PATH = storageRoot;
    service = new LlamadaEvidenciaStorageService();
  });

  afterEach(async () => {
    if (previousStoragePath === undefined) {
      delete process.env.VERIFICACION_STORAGE_PATH;
    } else {
      process.env.VERIFICACION_STORAGE_PATH = previousStoragePath;
    }
    await rm(storageRoot, { recursive: true, force: true });
  });

  it('guarda y recupera una evidencia JPEG por identificadores controlados', async () => {
    const integranteId = '11111111-1111-4111-8111-111111111111';
    const llamadaId = '22222222-2222-4222-8222-222222222222';
    const contenido = Buffer.from([0xff, 0xd8, 0xff, 0x01, 0x02]);

    const guardada = await service.guardar(integranteId, llamadaId, {
      buffer: contenido,
      mimetype: 'image/jpeg',
      size: contenido.length,
    });

    expect(guardada.mime_type).toBe('image/jpeg');
    expect(guardada.sha256).toMatch(/^[0-9a-f]{64}$/);
    await expect(service.leer(
      integranteId,
      llamadaId,
      guardada.id,
      guardada.mime_type,
    )).resolves.toEqual(contenido);
  });

  it('rechaza contenido cuyo encabezado no corresponde a JPEG o PNG', async () => {
    const contenido = Buffer.from('no-es-una-imagen');

    await expect(service.guardar(
      '11111111-1111-4111-8111-111111111111',
      '22222222-2222-4222-8222-222222222222',
      { buffer: contenido, mimetype: 'image/jpeg', size: contenido.length },
    )).rejects.toBeInstanceOf(BadRequestException);
  });
});
