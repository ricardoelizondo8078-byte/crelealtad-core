import { ConflictException, ForbiddenException } from '@nestjs/common';
import { RenovacionesService } from './renovaciones.service';

describe('RenovacionesService', () => {
  const manager = { query: jest.fn() };
  const runner = {
    manager,
    connect: jest.fn(),
    startTransaction: jest.fn(),
    commitTransaction: jest.fn(),
    rollbackTransaction: jest.fn(),
    release: jest.fn(),
  };
  const dataSource = {
    manager,
    query: jest.fn(),
    createQueryRunner: jest.fn(() => runner),
  };
  const scope = { usuarioId: 'usuario-1', rolNombre: 'ASESOR' };
  let service: RenovacionesService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new RenovacionesService(dataSource as never);
  });

  it('rechaza roles ajenos al flujo del asesor', async () => {
    await expect(service.listGrupos({ ...scope, rolNombre: 'VERIFICADOR' })).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('mantiene visible pero bloqueado un grupo sin contrato individual completo', async () => {
    manager.query.mockResolvedValueOnce([{ id: 'empleado-1' }]);
    dataSource.query.mockResolvedValueOnce([{
      grupo_id: 'grupo-1', nombre: 'GRUPO UNO', numero_ciclo: 4, vigente_en_corte: true,
      fecha_desembolso: '2026-01-01', fecha_vencimiento: null, numero_integrantes: 10,
      prestamo: '100000.00', porcentaje_pagado: '0.80', source_integrantes: 0, source_montos: 0,
    }]);

    const result = await service.listGrupos(scope);

    expect(result[0]).toMatchObject({ grupo_id: 'grupo-1', puede_renovar: false });
    expect(dataSource.query).toHaveBeenCalledWith(expect.stringContaining('posicion = 1 AND asesora_id = $1'), ['empleado-1']);
    expect(dataSource.query).toHaveBeenCalledWith(expect.stringContaining('e.ciclo_historico_origen_id = u.id'), ['empleado-1']);
  });

  it('hace rollback sin crear un expediente cuando falta el origen individual', async () => {
    manager.query
      .mockResolvedValueOnce([{ id: 'empleado-1' }])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{ id: 'ciclo-historico-1', grupo_id: 'grupo-1', numero_ciclo: 4, numero_integrantes: 10 }])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);

    await expect(service.create('grupo-1', scope)).rejects.toBeInstanceOf(ConflictException);
    expect(runner.rollbackTransaction).toHaveBeenCalled();
    expect(runner.commitTransaction).not.toHaveBeenCalled();
  });

  it('crea expediente, integrantes y montos del ciclo siguiente en una sola transacción', async () => {
    manager.query
      .mockResolvedValueOnce([{ id: 'empleado-1' }])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{ id: 'ciclo-historico-1', grupo_id: 'grupo-1', numero_ciclo: 4, numero_integrantes: 2 }])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{ id: 'expediente-origen' }])
      .mockResolvedValueOnce([{ persona_id: 'persona-1', monto: '10000.00' }, { persona_id: 'persona-2', monto: '12000.00' }])
      .mockResolvedValueOnce([{ id: 'expediente-nuevo' }])
      .mockResolvedValueOnce([{ id: 'integrante-1' }])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{ id: 'integrante-2' }])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);

    const result = await service.create('grupo-1', scope);

    expect(result).toEqual({ expediente_id: 'expediente-nuevo', ya_existia: false, integrantes_precargadas: 2 });
    expect(manager.query).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO solicitudes'),
      ['integrante-1', 'persona-1', 'expediente-nuevo', 'grupo-1', 5, '10000.00'],
    );
    expect(manager.query).toHaveBeenCalledWith(
      expect.stringContaining('e.ciclo_historico_origen_id = $2'),
      ['grupo-1', 'ciclo-historico-1'],
    );
    expect(manager.query).toHaveBeenCalledWith(expect.stringContaining('s.monto_autorizado AS monto'), ['expediente-origen', 4]);
    expect(manager.query).toHaveBeenCalledWith(expect.stringContaining("'INICIO_RENOVACION'"), expect.any(Array));
    expect(manager.query.mock.calls.some(([sql]) => String(sql).includes('UPDATE grupos'))).toBe(false);
    expect(runner.commitTransaction).toHaveBeenCalled();
    expect(runner.rollbackTransaction).not.toHaveBeenCalled();
  });
});
