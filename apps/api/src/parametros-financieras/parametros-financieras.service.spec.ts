import { ConflictException, ForbiddenException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Usuario } from '../catalogos/entities/usuario.entity';
import { fechaOperativaISO } from '../common/fecha-operativa';
import { ParametrosFinancierasService } from './parametros-financieras.service';

const user = (id: string, rol: string): Usuario => ({
  id,
  rol: { nombre: rol },
} as Usuario);

const version = (overrides: Record<string, unknown> = {}): Record<string, unknown> => ({
  id: '22222222-2222-4222-8222-222222222222',
  financiera_id: '33333333-3333-4333-8333-333333333333',
  nombre_oficial: 'Financiera de prueba',
  nombre_normalizado: 'FINANCIERA DE PRUEBA',
  revision: 1,
  clasificacion: 'OBJETIVO',
  motivo: 'Buen comportamiento observado',
  aliases: [],
  activa: true,
  semanas: null,
  tasa: null,
  seguro: null,
  apertura: null,
  retencion: null,
  base: null,
  refinanciamiento: null,
  descripcion: null,
  sucursales: [],
  vigencia_desde: '2099-01-01',
  vigencia_hasta: null,
  estado: 'PUBLICADA',
  propuesta_por: '55555555-5555-4555-8555-555555555555',
  decidida_por: '55555555-5555-4555-8555-555555555555',
  publicada_por: '55555555-5555-4555-8555-555555555555',
  ...overrides,
});

describe('ParametrosFinancierasService', () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  it('expone si cada financiera pertenece al catálogo base para separar el catálogo', async () => {
    const query = jest.fn().mockResolvedValue([{
      id: '33333333-3333-4333-8333-333333333333',
      nombre_oficial: 'Came',
      catalogo_base: true,
      created_at: '2026-10-08T00:00:00.000Z',
      ultima_revision: 0,
      vigente_id: null,
      programada_id: null,
      propuesta_id: null,
    }]);
    const service = new ParametrosFinancierasService({ query } as unknown as DataSource);

    await expect(service.listar()).resolves.toEqual({
      items: [expect.objectContaining({ nombre: 'Came', catalogo_base: true })],
    });
    expect(query.mock.calls[0][0]).toContain('f.catalogo_base');
  });

  it('incluye el catálogo base sin clasificación en la consulta para Verificación', async () => {
    const query = jest.fn().mockResolvedValue([{
      id: '33333333-3333-4333-8333-333333333333',
      nombre: 'CrediMujer',
      alias_captura: 'CrediMujer',
      clasificacion: null,
      motivo: null,
      aliases: null,
      vigencia_desde: null,
      vigencia_hasta: null,
      revision: null,
    }]);
    const service = new ParametrosFinancierasService({ query } as unknown as DataSource);

    await expect(service.listarVigentes('2026-10-08')).resolves.toEqual({
      fecha: '2026-10-08',
      items: [expect.objectContaining({
        nombre: 'CrediMujer',
        alias_captura: 'CrediMujer',
        clasificacion: null,
      })],
    });
    expect(query.mock.calls[0][0]).toContain('financiera.catalogo_base = TRUE');
    expect(query.mock.calls[0][0]).toContain('version.aliases[1]');
    expect(query.mock.calls[0][0]).toContain('AS alias_captura');
    expect(query.mock.calls[0][1]).toEqual(['2026-10-08']);
  });

  it('rechaza la publicación directa fuera del rol Administración antes de abrir transacción', async () => {
    const transaction = jest.fn();
    const service = new ParametrosFinancierasService({ transaction } as unknown as DataSource);

    await expect(service.publicarCambio(
      { financiera_id: '33333333-3333-4333-8333-333333333333' },
      user('actor', 'GERENTE'),
    )).rejects.toBeInstanceOf(ForbiddenException);
    expect(transaction).not.toHaveBeenCalled();
  });

  it('acepta y publica hoy en México aunque UTC ya esté en el día siguiente', async () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-10-09T04:44:00.000Z'));
    const financieraId = '33333333-3333-4333-8333-333333333333';
    const versionId = '22222222-2222-4222-8222-222222222222';
    const actorId = '55555555-5555-4555-8555-555555555555';
    const hoy = fechaOperativaISO();
    const publicada = version({
      id: versionId,
      clasificacion: null,
      motivo: null,
      aliases: ['BanFeliz'],
      vigencia_desde: hoy,
    });
    const manager = {
      query: jest.fn()
        .mockResolvedValueOnce([{
          id: financieraId,
          nombre_oficial: 'Banco BanFeliz',
          nombre_normalizado: 'BANCO BANFELIZ',
        }])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([{ revision: 0 }])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([{ id: versionId }])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([publicada]),
    };
    const dataSource = {
      transaction: jest.fn((callback: (value: typeof manager) => unknown) => callback(manager)),
    };
    const service = new ParametrosFinancierasService(dataSource as unknown as DataSource);

    await expect(service.publicarCambio({
      financiera_id: financieraId,
      aliases: ['BanFeliz'],
      expected_revision: 0,
    }, user(actorId, 'ADMINISTRADOR'))).resolves.toMatchObject({
      estado: 'PUBLICADA',
      clasificacion: null,
      motivo: null,
    });

    expect(manager.query.mock.calls[7][0]).toContain("'PUBLICADA'");
    expect(manager.query.mock.calls[7][0]).toContain('decidida_por');
    expect(manager.query.mock.calls[7][0]).toContain('publicada_por');
    expect(manager.query.mock.calls[7][1]).toEqual([
      financieraId,
      1,
      'Banco BanFeliz',
      'BANCO BANFELIZ',
      null,
      null,
      ['BanFeliz'],
      ['BANFELIZ'],
      true,
      hoy,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      actorId,
    ]);
    expect(manager.query.mock.calls[8][0]).toContain('INSERT INTO audit_log');
    expect(manager.query.mock.calls[8][1][2]).toBe('FIN_PUBLICADA');
    expect(manager.query.mock.calls[8][1][4]).toContain('PUBLICACION_DIRECTA_ADMIN');
  });

  it('publica directamente los datos de producto y las sucursales', async () => {
    const financieraId = '33333333-3333-4333-8333-333333333333';
    const versionId = '22222222-2222-4222-8222-222222222222';
    const manager = {
      query: jest.fn()
        .mockResolvedValueOnce([{
          id: financieraId,
          nombre_oficial: 'Banco BanFeliz',
          nombre_normalizado: 'BANCO BANFELIZ',
        }])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([{ revision: 0 }])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([{ id: versionId }])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([version({
          semanas: '16',
          tasa: '65%',
          descripcion: 'Crédito grupal flexible.\nAcepta pagos anticipados.',
          sucursales: [{
            orden: 1,
            zona: 'Norte',
            direccion: 'Centro',
            numero_asesoras: 8,
            valor_sucursal: '$1,250,000',
          }],
        })]),
    };
    const dataSource = {
      transaction: jest.fn((callback: (value: typeof manager) => unknown) => callback(manager)),
    };
    const service = new ParametrosFinancierasService(dataSource as unknown as DataSource);

    await service.publicarCambio({
      financiera_id: financieraId,
      semanas: ' 16 ',
      tasa: ' 65% ',
      descripcion: '  Crédito grupal flexible.\nAcepta pagos anticipados.  ',
      sucursales: [{
        zona: ' Norte ',
        direccion: ' Centro ',
        numero_asesoras: 8,
        valor_sucursal: ' $1,250,000 ',
      }],
      expected_revision: 0,
    }, user('55555555-5555-4555-8555-555555555555', 'ADMINISTRADOR'));

    expect(manager.query.mock.calls[7][1]).toEqual(expect.arrayContaining(['16', '65%']));
    expect(manager.query.mock.calls[7][1]).toContain(
      'Crédito grupal flexible.\nAcepta pagos anticipados.',
    );
    expect(manager.query.mock.calls[7][0]).toContain('descripcion');
    expect(manager.query.mock.calls[8][0]).toContain(
      'financieras_competidoras_sucursales_version',
    );
    expect(manager.query.mock.calls[8][1][1]).toContain('"zona":"Norte"');
  });

  it('rechaza una vigencia que se superpone con una publicación existente', async () => {
    const financieraId = '33333333-3333-4333-8333-333333333333';
    const manager = {
      query: jest.fn()
        .mockResolvedValueOnce([{
          id: financieraId,
          nombre_oficial: 'Banco BanFeliz',
          nombre_normalizado: 'BANCO BANFELIZ',
        }])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([{ revision: 1 }])
        .mockResolvedValueOnce([{ id: 'publicada' }]),
    };
    const dataSource = {
      transaction: jest.fn((callback: (value: typeof manager) => unknown) => callback(manager)),
    };
    const service = new ParametrosFinancierasService(dataSource as unknown as DataSource);

    await expect(service.publicarCambio(
      { financiera_id: financieraId },
      user('55555555-5555-4555-8555-555555555555', 'ADMINISTRADOR'),
    )).rejects.toBeInstanceOf(ConflictException);
    expect(manager.query).toHaveBeenCalledTimes(5);
  });
});
