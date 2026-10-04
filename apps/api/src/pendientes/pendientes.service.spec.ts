import { DataSource } from 'typeorm';
import { PendientesService } from './pendientes.service';

describe('PendientesService', () => {
  const query = jest.fn();
  const dataSource = { query } as unknown as DataSource;
  const service = new PendientesService(dataSource);

  beforeEach(() => {
    query.mockReset();
  });

  it('agrupa las revisiones documentales vigentes del asesor autenticado', async () => {
    const solicitadoDesde = new Date('2026-08-29T15:00:00.000Z');
    query.mockResolvedValue([
      {
        expediente_id: 'expediente-1',
        grupo_id: 'grupo-1',
        grupo_nombre: 'GRUPO PRUEBA',
        integrantes_pendientes: 2,
        solicitado_desde: solicitadoDesde,
      },
    ]);

    const result = await service.listRevisionDocumental('usuario-asesor');

    expect(query).toHaveBeenCalledWith(
      expect.stringContaining('asesora.usuario_id = $1'),
      [
        'usuario-asesor',
        'integrantes',
        'REV_DOC_SOLICITADA',
        'EN_VERIFICACION',
        'DOCUMENTANDO',
      ],
    );
    const sql = query.mock.calls[0][0] as string;
    expect(sql).toContain('INNER JOIN LATERAL');
    expect(sql).toContain('i.estado = $5');
    expect(result).toEqual({
      total_pendientes: 2,
      grupos: [
        {
          expediente_id: 'expediente-1',
          grupo_id: 'grupo-1',
          grupo_nombre: 'GRUPO PRUEBA',
          integrantes_pendientes: 2,
          solicitado_desde: solicitadoDesde.toISOString(),
        },
      ],
    });
  });

  it('devuelve una bandeja vacía cuando no hay revisiones documentales vigentes', async () => {
    query.mockResolvedValue([]);

    await expect(service.listRevisionDocumental('usuario-asesor')).resolves.toEqual({
      total_pendientes: 0,
      grupos: [],
    });
  });
});
