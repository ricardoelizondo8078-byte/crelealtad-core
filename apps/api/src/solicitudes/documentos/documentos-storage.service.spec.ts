import { BadRequestException, NotFoundException } from '@nestjs/common';
import { mkdtemp, rm } from 'fs/promises';
import { tmpdir } from 'os';
import { join, resolve } from 'path';
import { DocumentosStorageService } from './documentos-storage.service';
import { MAX_DOCUMENT_FILES_PER_MULTIPART_REQUEST } from '../../common/files/upload-file.policy';

describe('DocumentosStorageService', () => {
  const integranteId = '11111111-1111-4111-8111-111111111111';
  const usuarioId = '22222222-2222-4222-8222-222222222222';
  let storagePath: string;
  let service: DocumentosStorageService;

  beforeEach(async () => {
    storagePath = resolve(await mkdtemp(join(tmpdir(), 'crelealtad-documentos-test-')));
    process.env.DOCUMENT_STORAGE_PATH = storagePath;
    service = new DocumentosStorageService();
  });

  afterEach(async () => {
    await rm(storagePath, { recursive: true, force: true });
    delete process.env.DOCUMENT_STORAGE_PATH;
  });

  it('guarda una versión inmutable y permite recuperar su contenido', async () => {
    const contenido = Buffer.from([0xff, 0xd8, 0xff, 0x01]);
    const documento = await service.guardar(integranteId, 'ine', usuarioId, [
      { buffer: contenido, mimetype: 'image/jpeg', size: contenido.length },
      { buffer: contenido, mimetype: 'image/jpeg', size: contenido.length },
    ]);

    expect(documento.ruta).toContain(`/documentos/ine/${documento.id}`);
    expect(documento.usuario_id).toBe(usuarioId);
    const metadata = await service.obtener(integranteId, 'ine', documento.id);
    const archivo = await service.leerArchivo(integranteId, 'ine', documento.id, 0);
    expect(metadata.archivos).toHaveLength(2);
    expect(archivo.mimeType).toBe('image/jpeg');
    expect(archivo.contenido).toEqual(contenido);
  });

  it('rechaza contenido que no corresponde a un formato permitido', async () => {
    const contenido = Buffer.from('no es una imagen');
    await expect(service.guardar(integranteId, 'comprobante', usuarioId, [
      { buffer: contenido, mimetype: 'image/jpeg', size: contenido.length },
    ])).rejects.toBeInstanceOf(BadRequestException);
  });

  it('acepta el comprobante de línea de crédito como documento opcional', async () => {
    const contenido = Buffer.from([0xff, 0xd8, 0xff, 0x01]);
    const documento = await service.guardar(integranteId, 'comprobante_credito', usuarioId, [
      { buffer: contenido, mimetype: 'image/jpeg', size: contenido.length },
      { buffer: contenido, mimetype: 'image/jpeg', size: contenido.length },
      { buffer: contenido, mimetype: 'image/jpeg', size: contenido.length },
      { buffer: contenido, mimetype: 'image/jpeg', size: contenido.length },
      { buffer: contenido, mimetype: 'image/jpeg', size: contenido.length },
    ]);

    expect(documento.tipo).toBe('comprobante_credito');
    expect(documento.ruta).toContain(`/documentos/comprobante_credito/${documento.id}`);
    expect(documento.archivos).toHaveLength(5);
    await expect(service.leerArchivo(
      integranteId,
      'comprobante_credito',
      documento.id,
      4,
    )).resolves.toMatchObject({ mimeType: 'image/jpeg' });
  });

  it('conserva el máximo de dos imágenes para los demás documentos', async () => {
    const contenido = Buffer.from([0xff, 0xd8, 0xff, 0x01]);
    const archivos = Array.from({ length: 3 }, () => ({
      buffer: contenido,
      mimetype: 'image/jpeg',
      size: contenido.length,
    }));

    await expect(service.guardar(
      integranteId,
      'comprobante',
      usuarioId,
      archivos,
    )).rejects.toBeInstanceOf(BadRequestException);
  });

  it('reúne más fotografías que el límite de transporte en una sola versión ordenada', async () => {
    const contenido = Buffer.from([0xff, 0xd8, 0xff, 0x01]);
    const primerLote = Array.from(
      { length: MAX_DOCUMENT_FILES_PER_MULTIPART_REQUEST },
      () => ({ buffer: contenido, mimetype: 'image/jpeg', size: contenido.length }),
    );
    const parcial = await service.guardarLote(
      integranteId,
      'comprobante_credito',
      usuarioId,
      primerLote,
      {
        indice_inicio: 0,
        total_archivos: MAX_DOCUMENT_FILES_PER_MULTIPART_REQUEST + 1,
        finalizar: false,
      },
    );

    expect(parcial).toMatchObject({
      recibidos: MAX_DOCUMENT_FILES_PER_MULTIPART_REQUEST,
      total_archivos: MAX_DOCUMENT_FILES_PER_MULTIPART_REQUEST + 1,
      completado: false,
    });

    const final = await service.guardarLote(
      integranteId,
      'comprobante_credito',
      usuarioId,
      [{ buffer: contenido, mimetype: 'image/jpeg', size: contenido.length }],
      {
        carga_id: parcial.carga_id,
        indice_inicio: MAX_DOCUMENT_FILES_PER_MULTIPART_REQUEST,
        total_archivos: MAX_DOCUMENT_FILES_PER_MULTIPART_REQUEST + 1,
        finalizar: true,
      },
    );

    expect(final.completado).toBe(true);
    expect(final.documento?.archivos).toHaveLength(MAX_DOCUMENT_FILES_PER_MULTIPART_REQUEST + 1);
    expect(final.documento?.archivos.map(({ indice }) => indice)).toEqual(
      Array.from({ length: MAX_DOCUMENT_FILES_PER_MULTIPART_REQUEST + 1 }, (_, index) => index),
    );
  });

  it('rechaza incluso por servicio un lote que excede el límite multipart', async () => {
    const contenido = Buffer.from([0xff, 0xd8, 0xff, 0x01]);
    const archivos = Array.from({ length: MAX_DOCUMENT_FILES_PER_MULTIPART_REQUEST + 1 }, () => ({
      buffer: contenido,
      mimetype: 'image/jpeg',
      size: contenido.length,
    }));

    await expect(service.guardar(
      integranteId,
      'comprobante_credito',
      usuarioId,
      archivos,
    )).rejects.toThrow(`máximo ${MAX_DOCUMENT_FILES_PER_MULTIPART_REQUEST} imágenes`);
  });

  it('vincula la continuación al actor y al siguiente índice esperado', async () => {
    const contenido = Buffer.from([0xff, 0xd8, 0xff, 0x01]);
    const archivo = { buffer: contenido, mimetype: 'image/jpeg', size: contenido.length };
    const parcial = await service.guardarLote(
      integranteId,
      'comprobante_credito',
      usuarioId,
      [archivo],
      { indice_inicio: 0, total_archivos: 2, finalizar: false },
    );

    await expect(service.guardarLote(
      integranteId,
      'comprobante_credito',
      '33333333-3333-4333-8333-333333333333',
      [archivo],
      {
        carga_id: parcial.carga_id,
        indice_inicio: 1,
        total_archivos: 2,
        finalizar: true,
      },
    )).rejects.toThrow('no corresponde al documento o usuario actual');

    await expect(service.guardarLote(
      integranteId,
      'comprobante_credito',
      usuarioId,
      [archivo],
      {
        carga_id: parcial.carga_id,
        indice_inicio: 0,
        total_archivos: 2,
        finalizar: true,
      },
    )).rejects.toThrow('debe iniciar en el índice 1');
  });

  it('rechaza identificadores manipulados y documentos inexistentes', async () => {
    await expect(service.obtener('../fuera', 'ine', integranteId)).rejects.toBeInstanceOf(BadRequestException);
    await expect(service.obtener(integranteId, 'ine', usuarioId)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('confirma el manifiesto sólo mientras todos sus archivos físicos existen', async () => {
    const contenido = Buffer.from([0xff, 0xd8, 0xff, 0x01]);
    const documento = await service.guardar(integranteId, 'comprobante', usuarioId, [
      { buffer: contenido, mimetype: 'image/jpeg', size: contenido.length },
    ]);

    await expect(service.confirmarExistencia(
      integranteId,
      'comprobante',
      documento.id,
    )).resolves.toBe(true);

    await rm(resolve(
      storagePath,
      integranteId,
      'comprobante',
      documento.id,
      documento.archivos[0].nombre,
    ));
    await expect(service.confirmarExistencia(
      integranteId,
      'comprobante',
      documento.id,
    )).resolves.toBe(false);
  });
});
