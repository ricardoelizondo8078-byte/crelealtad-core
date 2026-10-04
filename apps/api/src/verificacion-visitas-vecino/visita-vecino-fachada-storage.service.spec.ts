import { BadRequestException } from '@nestjs/common';
import { mkdtemp, rm } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';
import { VisitaVecinoFachadaStorageService } from './visita-vecino-fachada-storage.service';

describe('VisitaVecinoFachadaStorageService', () => {
  let storageRoot: string;
  let previousStoragePath: string | undefined;
  let service: VisitaVecinoFachadaStorageService;

  beforeEach(async () => {
    previousStoragePath = process.env.VERIFICACION_STORAGE_PATH;
    storageRoot = await mkdtemp(join(tmpdir(), 'crelealtad-fachada-'));
    process.env.VERIFICACION_STORAGE_PATH = storageRoot;
    service = new VisitaVecinoFachadaStorageService();
  });

  afterEach(async () => {
    if (previousStoragePath === undefined) {
      delete process.env.VERIFICACION_STORAGE_PATH;
    } else {
      process.env.VERIFICACION_STORAGE_PATH = previousStoragePath;
    }
    await rm(storageRoot, { recursive: true, force: true });
  });

  it('guarda y recupera una fotografía JPEG por identificadores controlados', async () => {
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

  it('guarda y recupera una evidencia JPEG dentro de la visita indicada', async () => {
    const integranteId = '11111111-1111-4111-8111-111111111111';
    const visitaId = '22222222-2222-4222-8222-222222222222';
    const contenido = Buffer.from([0xff, 0xd8, 0xff, 0x03, 0x04]);

    const guardada = await service.guardarEvidencia(integranteId, visitaId, {
      buffer: contenido,
      mimetype: 'image/jpeg',
      size: contenido.length,
    });

    expect(guardada.ruta).toContain(`/visitas-vecino/${visitaId}/evidencias/`);
    await expect(service.leerEvidencia(
      integranteId,
      visitaId,
      guardada.id,
      guardada.mime_type,
    )).resolves.toEqual(contenido);
  });
});
