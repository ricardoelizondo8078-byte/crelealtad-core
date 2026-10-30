import { ConflictException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Usuario } from '../catalogos/entities/usuario.entity';
import { ParametrosVerificacionCierreService } from './parametros-verificacion-cierre.service';

const administrador = {
  id: '11111111-1111-4111-8111-111111111111',
  activo: true,
  rol: { nombre: 'ADMINISTRADOR' },
} as unknown as Usuario;

describe('ParametrosVerificacionCierreService', () => {
  it('devuelve null cuando todavía no existe una publicación', async () => {
    const dataSource = { query: jest.fn().mockResolvedValue([]) } as unknown as DataSource;
    const service = new ParametrosVerificacionCierreService(dataSource);

    await expect(service.obtenerVigente()).resolves.toBeNull();
  });

  it('rechaza una publicación basada en una revisión desactualizada', async () => {
    const manager = {
      query: jest.fn()
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([{
          version_id: '22222222-2222-4222-8222-222222222222',
          revision: 2,
          integrantes_verificadas_requeridas: 4,
          publicada_at: '2026-10-22T12:00:00.000Z',
        }]),
    };
    const dataSource = {
      transaction: jest.fn((callback) => callback(manager)),
    } as unknown as DataSource;
    const service = new ParametrosVerificacionCierreService(dataSource);

    await expect(service.actualizar({
      integrantes_verificadas_requeridas: 5,
      expected_revision: 1,
    }, administrador)).rejects.toBeInstanceOf(ConflictException);
  });
});
