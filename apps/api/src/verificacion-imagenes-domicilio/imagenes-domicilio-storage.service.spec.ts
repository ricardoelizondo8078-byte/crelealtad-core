import { BadRequestException } from '@nestjs/common';
import { mkdtemp, rm } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';
import { ImagenesDomicilioStorageService } from './imagenes-domicilio-storage.service';

describe('ImagenesDomicilioStorageService', () => {
  let storageRoot: string;
  let previousStoragePath: string | undefined;
  let service: ImagenesDomicilioStorageService;

  beforeEach(async () => {
    previousStoragePath = process.env.VERIFICACION_STORAGE_PATH;
    storageRoot = await mkdtemp(join(tmpdir(), 'crelealtad-imagen-domicilio-'));
    process.env.VERIFICACION_STORAGE_PATH = storageRoot;
    service = new ImagenesDomicilioStorageService();
  });

  afterEach(async () => {
    if (previousStoragePath === undefined) {
      delete process.env.VERIFICACION_STORAGE_PATH;
    } else {
      process.env.VERIFICACION_STORAGE_PATH = previousStoragePath;
    }
    await rm(storageRoot, { recursive: true, force: true });
  });

  it('guarda y recupera una imagen JPEG por identificadores controlados', async () => {
    const integranteId = '11111111-1111-4111-8111-111111111111';
    const contenido = Buffer.from([0xff, 0xd8, 0xff, 0x01, 0x02]);

    const guardada = await service.guardar(integranteId, {
      buffer: contenido,
      mimetype: 'image/jpeg',
      size: contenido.length,
    });

    expect(guardada.ruta).toContain(guardada.id);
    expect(guardada.sha256).toMatch(/^[0-9a-f]{64}$/);
    await expect(service.leer(
      integranteId,
      guardada.id,
      guardada.mime_type,
    )).resolves.toEqual(contenido);
  });

  it('rechaza contenido que no sea JPEG o PNG real', async () => {
    const contenido = Buffer.from('no-es-una-imagen');

    await expect(service.guardar(
      '11111111-1111-4111-8111-111111111111',
      { buffer: contenido, mimetype: 'image/jpeg', size: contenido.length },
    )).rejects.toBeInstanceOf(BadRequestException);
  });
});
