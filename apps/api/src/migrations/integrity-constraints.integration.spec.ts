import { randomUUID } from 'node:crypto';
import { DataSource } from 'typeorm';

interface ConstraintRow {
  conname: string;
  convalidated: boolean;
  confdeltype: string;
}

interface ColumnRow {
  table_name: string;
  data_type: string;
  column_default: string | null;
}

describe('Migración 036 - integridad de actores y estados', () => {
  jest.setTimeout(30000);
  let dataSource: DataSource;

  beforeAll(async () => {
    dataSource = new DataSource({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: Number(process.env.DB_PORT || 5432),
      username: process.env.DB_USER || process.env.DB_USERNAME || 'postgres',
      password: process.env.DB_PASSWORD || process.env.DB_PASS,
      database: 'crelealtad_test',
      synchronize: false,
    });
    await dataSource.initialize();
  });

  afterAll(async () => {
    if (dataSource?.isInitialized) await dataSource.destroy();
  });

  const expectDatabaseRejection = async (
    sql: string,
    parameters: unknown[],
    errorCode: string,
  ): Promise<void> => {
    await dataSource.query('BEGIN');
    try {
      await expect(dataSource.query(sql, parameters)).rejects.toMatchObject({
        driverError: expect.objectContaining({ code: errorCode }),
      });
    } finally {
      await dataSource.query('ROLLBACK');
    }
  };

  it('mantiene validadas las FK restrictivas de actor', async () => {
    const constraints = await dataSource.query<ConstraintRow[]>(
      `SELECT conname, convalidated, confdeltype
       FROM pg_constraint
       WHERE conname IN ('fk_audit_log_usuario', 'fk_grupos_created_by')
       ORDER BY conname`,
    );

    expect(constraints).toEqual([
      { conname: 'fk_audit_log_usuario', convalidated: true, confdeltype: 'r' },
      { conname: 'fk_grupos_created_by', convalidated: true, confdeltype: 'r' },
    ]);
  });

  it('rechaza actores inexistentes sin crear filas', async () => {
    await expectDatabaseRejection(
      `INSERT INTO audit_log (tabla, registro_id, accion, usuario_id)
       VALUES ('prueba_integridad', $1, 'PRUEBA', $2)`,
      [randomUUID(), randomUUID()],
      '23503',
    );

    await expectDatabaseRejection(
      'INSERT INTO grupos (id, nombre, created_by) VALUES ($1, $2, $3)',
      [randomUUID(), 'GRUPO INVENTADO PARA PRUEBA', randomUUID()],
      '23503',
    );
  });

  it('mantiene validados los siete catálogos de estado cerrados', async () => {
    const rows = await dataSource.query<Array<{ conname: string; convalidated: boolean }>>(
      `SELECT conname, convalidated
       FROM pg_constraint
       WHERE conname IN (
         'ck_roles_estado',
         'ck_usuarios_estado',
         'ck_personas_estado',
         'ck_productos_credito_estado',
         'ck_creditos_estado',
         'ck_ciclos_estado',
         'ck_pagos_estado'
       )
       ORDER BY conname`,
    );

    expect(rows).toHaveLength(7);
    expect(rows.every(({ convalidated }) => convalidated)).toBe(true);
  });

  it('rechaza un estado fuera del catálogo', async () => {
    await expectDatabaseRejection(
      `UPDATE roles
       SET estado = 'ESTADO_INVENTADO'
       WHERE id = (SELECT id FROM roles ORDER BY id LIMIT 1)`,
      [],
      '23514',
    );
  });

  it('usa UUID para el creador y defaults canónicos en crédito y pago', async () => {
    const columns = await dataSource.query<ColumnRow[]>(
      `SELECT table_name, data_type, column_default
       FROM information_schema.columns
       WHERE table_schema = 'public'
         AND (
           (table_name = 'grupos' AND column_name = 'created_by')
           OR (table_name = 'creditos' AND column_name = 'estado')
           OR (table_name = 'pagos' AND column_name = 'estado')
         )
       ORDER BY table_name`,
    );

    expect(columns).toEqual([
      {
        table_name: 'creditos',
        data_type: 'character varying',
        column_default: "'BORRADOR'::character varying",
      },
      {
        table_name: 'grupos',
        data_type: 'uuid',
        column_default: null,
      },
      {
        table_name: 'pagos',
        data_type: 'character varying',
        column_default: "'PENDIENTE'::character varying",
      },
    ]);
  });
});
