import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Usuario } from '../catalogos/entities/usuario.entity';
import { ParametrosEvidenciaMotivosService } from './parametros-evidencia-motivos.service';

const actor = (rol: string): Usuario => ({
  id: '11111111-1111-4111-8111-111111111111',
  rol: { nombre: rol },
} as Usuario);

const motivo = {
  id: '22222222-2222-4222-8222-222222222222',
  clasificacion: 'VERDE' as const,
  concepto: 'Información consistente',
  orden: 1,
  activo: true,
  created_at: new Date('2026-10-10T12:00:00.000Z'),
  updated_at: new Date('2026-10-10T12:00:00.000Z'),
};

describe('ParametrosEvidenciaMotivosService', () => {
  it('lista sólo los motivos activos para el consumo operativo', async () => {
    const query = jest.fn().mockResolvedValue([motivo]);
    const service = new ParametrosEvidenciaMotivosService(
      { query } as unknown as DataSource,
    );

    await expect(service.listarActivos()).resolves.toEqual({ items: [motivo] });
    expect(query).toHaveBeenCalledWith(
      expect.stringContaining('activo = TRUE'),
      [null, false],
    );
  });

  it('rechaza altas fuera del rol Administración antes de abrir transacción', async () => {
    const transaction = jest.fn();
    const service = new ParametrosEvidenciaMotivosService(
      { transaction } as unknown as DataSource,
    );

    await expect(service.crear(
      { clasificacion: 'VERDE', concepto: 'Información consistente' },
      actor('GERENTE'),
    )).rejects.toBeInstanceOf(ForbiddenException);
    expect(transaction).not.toHaveBeenCalled();
  });

  it('normaliza, registra y audita un concepto nuevo', async () => {
    const manager = {
      query: jest.fn()
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([{ orden: 1 }])
        .mockResolvedValueOnce([[motivo], 1])
        .mockResolvedValueOnce(undefined),
    };
    const dataSource = {
      transaction: jest.fn((callback: (value: typeof manager) => unknown) => callback(manager)),
    };
    const service = new ParametrosEvidenciaMotivosService(
      dataSource as unknown as DataSource,
    );

    await expect(service.crear(
      { clasificacion: 'VERDE', concepto: '  Información   consistente  ' },
      actor('ADMINISTRADOR'),
    )).resolves.toEqual({ motivo });

    expect(manager.query.mock.calls[3][1]).toEqual([
      'VERDE',
      'Información consistente',
      'INFORMACION CONSISTENTE',
      1,
      '11111111-1111-4111-8111-111111111111',
    ]);
    expect(manager.query.mock.calls[4][0]).toContain('INSERT INTO audit_log');
    expect(manager.query.mock.calls[4][1][2]).toBe('MOT_EVI_ALTA');
  });

  it('orienta a reactivar un concepto duplicado que está inactivo', async () => {
    const manager = {
      query: jest.fn()
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce([{ id: motivo.id, activo: false }]),
    };
    const dataSource = {
      transaction: jest.fn((callback: (value: typeof manager) => unknown) => callback(manager)),
    };
    const service = new ParametrosEvidenciaMotivosService(
      dataSource as unknown as DataSource,
    );

    await expect(service.crear(
      { clasificacion: 'VERDE', concepto: 'Información consistente' },
      actor('ADMINISTRADOR'),
    )).rejects.toThrow('reactívalo desde la lista');
  });

  it('edita y audita un concepto que todavía no fue utilizado', async () => {
    const actualizado = { ...motivo, concepto: 'Datos confirmados' };
    const manager = {
      query: jest.fn()
        .mockResolvedValueOnce([{ ...motivo, utilizado: false }])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([[actualizado], 1])
        .mockResolvedValueOnce(undefined),
    };
    const dataSource = {
      transaction: jest.fn((callback: (value: typeof manager) => unknown) => callback(manager)),
    };
    const service = new ParametrosEvidenciaMotivosService(
      dataSource as unknown as DataSource,
    );

    await expect(service.actualizarConcepto(
      motivo.id,
      { concepto: '  Datos   confirmados  ' },
      actor('ADMINISTRADOR'),
    )).resolves.toEqual({ motivo: actualizado });

    expect(manager.query.mock.calls[2][1]).toEqual([
      motivo.id,
      'Datos confirmados',
      'DATOS CONFIRMADOS',
      '11111111-1111-4111-8111-111111111111',
    ]);
    expect(manager.query.mock.calls[3][1][2]).toBe('MOT_EVI_EDITA');
  });

  it('impide editar un concepto usado para conservar el significado histórico', async () => {
    const manager = {
      query: jest.fn().mockResolvedValueOnce([{ ...motivo, utilizado: true }]),
    };
    const dataSource = {
      transaction: jest.fn((callback: (value: typeof manager) => unknown) => callback(manager)),
    };
    const service = new ParametrosEvidenciaMotivosService(
      dataSource as unknown as DataSource,
    );

    await expect(service.actualizarConcepto(
      motivo.id,
      { concepto: 'Datos confirmados' },
      actor('ADMINISTRADOR'),
    )).rejects.toThrow('conservar el historial');
    expect(manager.query).toHaveBeenCalledTimes(1);
  });

  it('cambia el estado sin borrar el motivo y registra la auditoría', async () => {
    const actualizado = { ...motivo, activo: false };
    const manager = {
      query: jest.fn()
        .mockResolvedValueOnce([motivo])
        .mockResolvedValueOnce([[actualizado], 1])
        .mockResolvedValueOnce(undefined),
    };
    const dataSource = {
      transaction: jest.fn((callback: (value: typeof manager) => unknown) => callback(manager)),
    };
    const service = new ParametrosEvidenciaMotivosService(
      dataSource as unknown as DataSource,
    );

    await expect(service.cambiarEstado(
      motivo.id,
      { activo: false },
      actor('ADMINISTRADOR'),
    )).resolves.toEqual({ motivo: actualizado });

    expect(manager.query.mock.calls[1][1]).toEqual([
      motivo.id,
      false,
      '11111111-1111-4111-8111-111111111111',
    ]);
    expect(manager.query.mock.calls[2][0]).toContain('INSERT INTO audit_log');
    expect(manager.query.mock.calls[2][1][2]).toBe('MOT_EVI_ESTADO');
  });

  it('reordena el catálogo completo y audita cada posición modificada', async () => {
    const segundo = {
      ...motivo,
      id: '33333333-3333-4333-8333-333333333333',
      concepto: 'Documento completo',
      orden: 2,
    };
    const reordenados = [{ ...segundo, orden: 1 }, { ...motivo, orden: 2 }];
    const manager = {
      query: jest.fn()
        .mockResolvedValueOnce([motivo, segundo])
        .mockResolvedValueOnce([reordenados, 2])
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce(undefined),
    };
    const dataSource = {
      transaction: jest.fn((callback: (value: typeof manager) => unknown) => callback(manager)),
    };
    const service = new ParametrosEvidenciaMotivosService(
      dataSource as unknown as DataSource,
    );

    await expect(service.reordenar(
      { clasificacion: 'VERDE', motivo_ids: [segundo.id, motivo.id] },
      actor('ADMINISTRADOR'),
    )).resolves.toEqual({ items: reordenados });
    expect(manager.query.mock.calls[1][0]).toContain('WITH ORDINALITY');
    expect(manager.query.mock.calls[1][1]).toEqual([
      'VERDE',
      [segundo.id, motivo.id],
      '11111111-1111-4111-8111-111111111111',
    ]);
    expect(manager.query.mock.calls[2][1][2]).toBe('MOT_EVI_ORDEN');
    expect(manager.query.mock.calls[3][1][2]).toBe('MOT_EVI_ORDEN');
  });

  it('rechaza un orden incompleto para no perder motivos del catálogo', async () => {
    const segundo = { ...motivo, id: '33333333-3333-4333-8333-333333333333', orden: 2 };
    const manager = { query: jest.fn().mockResolvedValueOnce([motivo, segundo]) };
    const dataSource = {
      transaction: jest.fn((callback: (value: typeof manager) => unknown) => callback(manager)),
    };
    const service = new ParametrosEvidenciaMotivosService(
      dataSource as unknown as DataSource,
    );

    await expect(service.reordenar(
      { clasificacion: 'VERDE', motivo_ids: [motivo.id] },
      actor('ADMINISTRADOR'),
    )).rejects.toBeInstanceOf(BadRequestException);
    expect(manager.query).toHaveBeenCalledTimes(1);
  });

  it('rechaza un motivo inactivo o de otro color durante la captura', async () => {
    const query = jest.fn().mockResolvedValue([]);
    const service = new ParametrosEvidenciaMotivosService(
      { query } as unknown as DataSource,
    );

    await expect(service.obtenerActivo(motivo.id, 'ROJO'))
      .rejects.toBeInstanceOf(BadRequestException);
    expect(query).toHaveBeenCalledWith(expect.any(String), [motivo.id, 'ROJO', false]);
  });

  it('permite recuperar un motivo inactivo sólo para resolver un reintento idempotente', async () => {
    const query = jest.fn().mockResolvedValue([{ ...motivo, activo: false }]);
    const service = new ParametrosEvidenciaMotivosService(
      { query } as unknown as DataSource,
    );

    await expect(service.obtenerActivo(motivo.id, 'VERDE', true))
      .resolves.toEqual({ ...motivo, activo: false });
    expect(query).toHaveBeenCalledWith(expect.any(String), [motivo.id, 'VERDE', true]);
  });
});
