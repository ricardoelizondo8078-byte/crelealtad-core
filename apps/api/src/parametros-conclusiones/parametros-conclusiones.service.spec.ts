import { BadRequestException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Usuario } from '../catalogos/entities/usuario.entity';
import { ParametrosConclusionesService } from './parametros-conclusiones.service';

const administrador = {
  id: '11111111-1111-4111-8111-111111111111',
  rol: { nombre: 'ADMINISTRADOR' },
} as Usuario;

const vigente = {
  id: 1,
  audit_id: '22222222-2222-4222-8222-222222222222',
  verde_desde: 1,
  verde_hasta: 10,
  amarillo_desde: 11,
  amarillo_hasta: 13,
  rojo_desde: 14,
  rojo_hasta: 16,
  updated_at: '2026-10-11T12:00:00.000Z',
};

const ciclosVigentes = {
  ...vigente,
  audit_id: '33333333-3333-4333-8333-333333333333',
  verde_desde: 8,
  verde_hasta: 40,
  amarillo_desde: 4,
  amarillo_hasta: 7,
  rojo_desde: 1,
  rojo_hasta: 3,
};

const toleranciaVigente = {
  ...vigente,
  audit_id: '44444444-4444-4444-8444-444444444444',
  verde_desde: 0,
  verde_hasta: 0,
  amarillo_desde: 1,
  amarillo_hasta: 3,
  rojo_desde: 4,
  rojo_hasta: 10,
};

const concordanciaVigente = {
  ...vigente,
  audit_id: '55555555-5555-4555-8555-555555555555',
  verde_desde: 0,
  verde_hasta: 5,
  amarillo_desde: 6,
  amarillo_hasta: 10,
  rojo_desde: 11,
  rojo_hasta: 100,
};

const promedioEvidenciasVigente = {
  ...vigente,
  audit_id: '66666666-6666-4666-8666-666666666666',
  verde_desde: 67,
  verde_hasta: 100,
  amarillo_desde: 34,
  amarillo_hasta: 66,
  rojo_desde: 0,
  rojo_hasta: 33,
};

describe('ParametrosConclusionesService', () => {
  it('consulta la partición vigente de semanas', async () => {
    const query = jest.fn().mockResolvedValue([vigente]);
    const service = new ParametrosConclusionesService({ query } as unknown as DataSource);

    await expect(service.obtenerSemanaCredito()).resolves.toEqual({ parametro: vigente });
    expect(query).toHaveBeenCalledWith(expect.stringContaining('WHERE id = 1'));
  });

  it('rechaza semanas repetidas entre colores antes de escribir', async () => {
    const transaction = jest.fn();
    const service = new ParametrosConclusionesService({ transaction } as unknown as DataSource);

    await expect(service.actualizarSemanaCredito({
      verde_desde: 1,
      verde_hasta: 9,
      amarillo_desde: 9,
      amarillo_hasta: 13,
      rojo_desde: 14,
      rojo_hasta: 16,
    }, administrador)).rejects.toBeInstanceOf(BadRequestException);
    expect(transaction).not.toHaveBeenCalled();
  });

  it('actualiza y audita rangos en cualquier orden', async () => {
    const actualizada = {
      ...vigente,
      verde_desde: 13,
      verde_hasta: 16,
      amarillo_desde: 9,
      amarillo_hasta: 12,
      rojo_desde: 1,
      rojo_hasta: 8,
    };
    const query = jest.fn()
      .mockResolvedValueOnce([vigente])
      .mockResolvedValueOnce([[actualizada], 1])
      .mockResolvedValueOnce([]);
    const transaction = jest.fn(async (callback) => callback({ query }));
    const service = new ParametrosConclusionesService({ transaction } as unknown as DataSource);

    await expect(service.actualizarSemanaCredito({
      verde_desde: 13,
      verde_hasta: 16,
      amarillo_desde: 9,
      amarillo_hasta: 12,
      rojo_desde: 1,
      rojo_hasta: 8,
    }, administrador)).resolves.toEqual({ parametro: actualizada });
    expect(query).toHaveBeenNthCalledWith(2, expect.stringContaining('UPDATE'), [
      13, 16, 9, 12, 1, 8, administrador.id,
    ]);
    expect(query).toHaveBeenNthCalledWith(
      3,
      expect.stringContaining('INSERT INTO audit_log'),
      expect.arrayContaining([
        actualizada.audit_id,
        'PAR_CON_SEMANA',
        expect.stringContaining('"verde_desde":13'),
        administrador.id,
      ]),
    );
  });

  it('consulta, actualiza y audita ciclos entre 1 y 40', async () => {
    const actualizada = { ...ciclosVigentes, verde_desde: 10 };
    const query = jest.fn()
      .mockResolvedValueOnce([ciclosVigentes])
      .mockResolvedValueOnce([[actualizada], 1])
      .mockResolvedValueOnce([]);
    const transaction = jest.fn(async (callback) => callback({ query }));
    const dataSource = { query: jest.fn().mockResolvedValue([ciclosVigentes]), transaction };
    const service = new ParametrosConclusionesService(dataSource as unknown as DataSource);

    await expect(service.obtenerCiclosCredito()).resolves.toEqual({ parametro: ciclosVigentes });
    await expect(service.actualizarCiclosCredito({
      verde_desde: 10,
      verde_hasta: 40,
      amarillo_desde: 4,
      amarillo_hasta: 7,
      rojo_desde: 1,
      rojo_hasta: 3,
    }, administrador)).resolves.toEqual({ parametro: actualizada });
    expect(query).toHaveBeenNthCalledWith(2, expect.stringContaining(
      'UPDATE parametros_conclusiones_ciclos_credito',
    ), [10, 40, 4, 7, 1, 3, administrador.id]);
    expect(query).toHaveBeenNthCalledWith(
      3,
      expect.stringContaining('INSERT INTO audit_log'),
      expect.arrayContaining([
        ciclosVigentes.audit_id,
        'PAR_CON_CICLOS',
        expect.stringContaining('"verde_hasta":40'),
        administrador.id,
      ]),
    );
  });

  it('actualiza y audita tolerancias entre 0 y 10', async () => {
    const actualizada = { ...toleranciaVigente, amarillo_hasta: 2, rojo_desde: 3 };
    const query = jest.fn()
      .mockResolvedValueOnce([toleranciaVigente])
      .mockResolvedValueOnce([[actualizada], 1])
      .mockResolvedValueOnce([]);
    const transaction = jest.fn(async (callback) => callback({ query }));
    const dataSource = {
      query: jest.fn().mockResolvedValue([toleranciaVigente]),
      transaction,
    };
    const service = new ParametrosConclusionesService(dataSource as unknown as DataSource);

    await expect(service.obtenerToleranciaSemanaDesembolso()).resolves.toEqual({
      parametro: toleranciaVigente,
    });
    await expect(service.actualizarToleranciaSemanaDesembolso({
      verde_desde: 0,
      verde_hasta: 0,
      amarillo_desde: 1,
      amarillo_hasta: 2,
      rojo_desde: 3,
      rojo_hasta: 10,
    }, administrador)).resolves.toEqual({ parametro: actualizada });
    expect(query).toHaveBeenNthCalledWith(2, expect.stringContaining(
      'UPDATE parametros_conclusiones_tolerancia_semana_desembolso',
    ), [0, 0, 1, 2, 3, 10, administrador.id]);
    expect(query).toHaveBeenNthCalledWith(
      3,
      expect.stringContaining('INSERT INTO audit_log'),
      expect.arrayContaining([
        toleranciaVigente.audit_id,
        'PAR_TOL_DESEMBOLSO',
        expect.stringContaining('"rojo_hasta":10'),
        administrador.id,
      ]),
    );
  });

  it.each([
    ['ficha', 'actualizarConcordanciaFicha', 'parametros_conclusiones_concordancia_ficha', 'PAR_CON_FICHA'],
    ['préstamo', 'actualizarConcordanciaPrestamo', 'parametros_conclusiones_concordancia_prestamo', 'PAR_CON_PRESTAMO'],
  ] as const)('actualiza y audita la concordancia de %s entre 0 y 100', async (
    _nombre,
    metodo,
    tabla,
    accion,
  ) => {
    const actualizada = { ...concordanciaVigente, verde_hasta: 4, amarillo_desde: 5 };
    const query = jest.fn()
      .mockResolvedValueOnce([concordanciaVigente])
      .mockResolvedValueOnce([[actualizada], 1])
      .mockResolvedValueOnce([]);
    const transaction = jest.fn(async (callback) => callback({ query }));
    const service = new ParametrosConclusionesService({ transaction } as unknown as DataSource);

    await expect(service[metodo]({
      verde_desde: 0,
      verde_hasta: 4,
      amarillo_desde: 5,
      amarillo_hasta: 10,
      rojo_desde: 11,
      rojo_hasta: 100,
    }, administrador)).resolves.toEqual({ parametro: actualizada });
    expect(query).toHaveBeenNthCalledWith(2, expect.stringContaining(`UPDATE ${tabla}`), [
      0, 4, 5, 10, 11, 100, administrador.id,
    ]);
    expect(query).toHaveBeenNthCalledWith(
      3,
      expect.stringContaining('INSERT INTO audit_log'),
      expect.arrayContaining([concordanciaVigente.audit_id, accion]),
    );
  });

  it('consulta, actualiza y audita el promedio de fotografías entre 0 y 100', async () => {
    const actualizada = { ...promedioEvidenciasVigente, verde_desde: 70, amarillo_hasta: 69 };
    const query = jest.fn()
      .mockResolvedValueOnce([promedioEvidenciasVigente])
      .mockResolvedValueOnce([[actualizada], 1])
      .mockResolvedValueOnce([]);
    const transaction = jest.fn(async (callback) => callback({ query }));
    const dataSource = {
      query: jest.fn().mockResolvedValue([promedioEvidenciasVigente]),
      transaction,
    };
    const service = new ParametrosConclusionesService(dataSource as unknown as DataSource);

    await expect(service.obtenerPromedioEvidencias()).resolves.toEqual({
      parametro: promedioEvidenciasVigente,
    });
    await expect(service.actualizarPromedioEvidencias({
      verde_desde: 70,
      verde_hasta: 100,
      amarillo_desde: 34,
      amarillo_hasta: 69,
      rojo_desde: 0,
      rojo_hasta: 33,
    }, administrador)).resolves.toEqual({ parametro: actualizada });
    expect(query).toHaveBeenNthCalledWith(2, expect.stringContaining(
      'UPDATE parametros_conclusiones_promedio_evidencias',
    ), [70, 100, 34, 69, 0, 33, administrador.id]);
    expect(query).toHaveBeenNthCalledWith(
      3,
      expect.stringContaining('INSERT INTO audit_log'),
      expect.arrayContaining([promedioEvidenciasVigente.audit_id, 'PAR_PROM_EVIDENCIAS']),
    );
  });
});
