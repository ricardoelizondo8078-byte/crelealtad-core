import { DataSource } from 'typeorm';

/**
 * TEST DE REGRESIÓN: Integridad de Historial de Créditos
 *
 * Verifica que las constraints de integridad aplicadas en la migración
 * AddCreditHistoryIntegrityConstraints funcionen correctamente.
 *
 * Usa DataSource directamente (sin @nestjs/testing) para evitar problemas
 * de carga de módulos en Jest.
 */
describe('Integridad de Historial de Créditos', () => {
  let dataSource: DataSource;
  let testPersonaId: string;
  let testGrupoId: string;

  beforeAll(async () => {
    dataSource = new DataSource({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      username: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME || 'crelealtad',
    });

    await dataSource.initialize();

    // Obtener una persona de prueba
    const personas = await dataSource.query('SELECT id FROM personas LIMIT 1');
    if (personas.length === 0) {
      throw new Error('No hay personas en la base de datos para ejecutar tests');
    }
    testPersonaId = personas[0].id;

    // Obtener un grupo de prueba (REQUERIDO para crear expedientes)
    const grupos = await dataSource.query('SELECT id FROM grupos LIMIT 1');
    if (grupos.length === 0) {
      throw new Error('No hay grupos en la base de datos para ejecutar tests');
    }
    testGrupoId = grupos[0].id;
  });

  afterAll(async () => {
    await dataSource.destroy();
  });

  describe('1. Constraint UNIQUE (persona_id, numero_credito)', () => {
    it('debe rechazar duplicados con numero_credito NOT NULL', async () => {
      // Limpiar
      await dataSource.query(
        'DELETE FROM solicitudes WHERE persona_id = $1 AND numero_credito IS NOT NULL',
        [testPersonaId]
      );

      // Crear dos expedientes temporales para evitar uq_integrante_expediente_persona
      const exp1 = await dataSource.query('INSERT INTO expedientes (grupo_id, folio) VALUES ($1, DEFAULT) RETURNING id', [testGrupoId]);
      const exp2 = await dataSource.query('INSERT INTO expedientes (grupo_id, folio) VALUES ($1, DEFAULT) RETURNING id', [testGrupoId]);

      const int1 = await dataSource.query(
        'INSERT INTO integrantes (persona_id, expediente_id) VALUES ($1, $2) RETURNING id',
        [testPersonaId, exp1[0].id]
      );
      const int2 = await dataSource.query(
        'INSERT INTO integrantes (persona_id, expediente_id) VALUES ($1, $2) RETURNING id',
        [testPersonaId, exp2[0].id]
      );

      const integranteId1 = int1[0].id;
      const integranteId2 = int2[0].id;

      // Insertar primera solicitud con numero_credito = 1
      await dataSource.query(
        'INSERT INTO solicitudes (persona_id, integrante_id, expediente_id, grupo_id, numero_credito) VALUES ($1, $2, $3, $4, 1)',
        [testPersonaId, integranteId1, exp1[0].id, testGrupoId]
      );

      // Intentar insertar segunda con el mismo numero_credito (debe fallar)
      await expect(
        dataSource.query(
          'INSERT INTO solicitudes (persona_id, integrante_id, expediente_id, grupo_id, numero_credito) VALUES ($1, $2, $3, $4, 1)',
          [testPersonaId, integranteId2, exp2[0].id, testGrupoId]
        )
      ).rejects.toThrow(/solicitudes_persona_numero_credito_unique|llave duplicada/);

      // Limpiar
      await dataSource.query(
        'DELETE FROM solicitudes WHERE persona_id = $1 AND numero_credito = 1',
        [testPersonaId]
      );
      await dataSource.query(
        'DELETE FROM integrantes WHERE id IN ($1, $2)',
        [integranteId1, integranteId2]
      );
      await dataSource.query(
        'DELETE FROM expedientes WHERE id IN ($1, $2)',
        [exp1[0].id, exp2[0].id]
      );
    });

    it('debe permitir múltiples NULL para la misma persona_id', async () => {
      // Limpiar
      await dataSource.query(
        'DELETE FROM solicitudes WHERE persona_id = $1 AND numero_credito IS NULL',
        [testPersonaId]
      );

      // Crear 3 expedientes temporales
      const exp1 = await dataSource.query('INSERT INTO expedientes (grupo_id, folio) VALUES ($1, DEFAULT) RETURNING id', [testGrupoId]);
      const exp2 = await dataSource.query('INSERT INTO expedientes (grupo_id, folio) VALUES ($1, DEFAULT) RETURNING id', [testGrupoId]);
      const exp3 = await dataSource.query('INSERT INTO expedientes (grupo_id, folio) VALUES ($1, DEFAULT) RETURNING id', [testGrupoId]);

      const int1 = await dataSource.query(
        'INSERT INTO integrantes (persona_id, expediente_id) VALUES ($1, $2) RETURNING id',
        [testPersonaId, exp1[0].id]
      );
      const int2 = await dataSource.query(
        'INSERT INTO integrantes (persona_id, expediente_id) VALUES ($1, $2) RETURNING id',
        [testPersonaId, exp2[0].id]
      );
      const int3 = await dataSource.query(
        'INSERT INTO integrantes (persona_id, expediente_id) VALUES ($1, $2) RETURNING id',
        [testPersonaId, exp3[0].id]
      );

      // Insertar 3 solicitudes con numero_credito NULL
      await dataSource.query(
        'INSERT INTO solicitudes (persona_id, integrante_id, expediente_id, grupo_id, numero_credito) VALUES ($1, $2, $3, $4, NULL)',
        [testPersonaId, int1[0].id, exp1[0].id, testGrupoId]
      );
      await dataSource.query(
        'INSERT INTO solicitudes (persona_id, integrante_id, expediente_id, grupo_id, numero_credito) VALUES ($1, $2, $3, $4, NULL)',
        [testPersonaId, int2[0].id, exp2[0].id, testGrupoId]
      );
      await dataSource.query(
        'INSERT INTO solicitudes (persona_id, integrante_id, expediente_id, grupo_id, numero_credito) VALUES ($1, $2, $3, $4, NULL)',
        [testPersonaId, int3[0].id, exp3[0].id, testGrupoId]
      );

      // Verificar que se crearon 3
      const resultado = await dataSource.query(
        'SELECT COUNT(*) AS total FROM solicitudes WHERE persona_id = $1 AND numero_credito IS NULL',
        [testPersonaId]
      );

      expect(parseInt(resultado[0].total)).toBe(3);

      // Limpiar
      await dataSource.query(
        'DELETE FROM solicitudes WHERE persona_id = $1 AND numero_credito IS NULL',
        [testPersonaId]
      );
      await dataSource.query(
        'DELETE FROM integrantes WHERE id IN ($1, $2, $3)',
        [int1[0].id, int2[0].id, int3[0].id]
      );
      await dataSource.query(
        'DELETE FROM expedientes WHERE id IN ($1, $2, $3)',
        [exp1[0].id, exp2[0].id, exp3[0].id]
      );
    });
  });

  describe('2. Foreign Key persona_id', () => {
    it('debe rechazar solicitudes con persona_id inexistente', async () => {
      const personaIdInexistente = '00000000-0000-0000-0000-999999999999';
      const integrantes = await dataSource.query('SELECT id, expediente_id FROM integrantes LIMIT 1');
      const integranteId = integrantes[0].id;
      const expedienteId = integrantes[0].expediente_id;

      await expect(
        dataSource.query(
          'INSERT INTO solicitudes (persona_id, integrante_id, expediente_id, grupo_id) VALUES ($1, $2, $3, $4)',
          [personaIdInexistente, integranteId, expedienteId, testGrupoId]
        )
      ).rejects.toThrow(/fk_solicitudes_persona|viola la llave foránea/);
    });
  });

  describe('3. NOT NULL Constraints', () => {
    it('debe rechazar solicitudes sin persona_id', async () => {
      const int = await dataSource.query(
        'INSERT INTO integrantes (persona_id, expediente_id) VALUES ($1, $2) RETURNING id',
        [testPersonaId, (await dataSource.query('INSERT INTO expedientes (grupo_id, folio) VALUES ($1, DEFAULT) RETURNING id', [testGrupoId]))[0].id]
      );

      await expect(
        dataSource.query(
          'INSERT INTO solicitudes (persona_id, integrante_id, expediente_id, grupo_id) VALUES (NULL, $1, $2, $3)',
          [int[0].id, int[0].id, testGrupoId]
        )
      ).rejects.toThrow(/viola la restricción de no nulo|null value/);

      // Limpiar
      await dataSource.query('DELETE FROM integrantes WHERE id = $1', [int[0].id]);
    });
  });

  describe('4. ON DELETE RESTRICT', () => {
    it('debe proteger persona con solicitudes asociadas', async () => {
      // Crear expediente temporal
      const expTemp = await dataSource.query('INSERT INTO expedientes (grupo_id, folio) VALUES ($1, DEFAULT) RETURNING id', [testGrupoId]);

      // Crear integrante temporal
      const intTemp = await dataSource.query(
        'INSERT INTO integrantes (persona_id, expediente_id) VALUES ($1, $2) RETURNING id',
        [testPersonaId, expTemp[0].id]
      );
      const integranteTempId = intTemp[0].id;

      // Crear solicitud
      await dataSource.query(
        'INSERT INTO solicitudes (persona_id, integrante_id, expediente_id, grupo_id) VALUES ($1, $2, $3, $4)',
        [testPersonaId, integranteTempId, expTemp[0].id, testGrupoId]
      );

      // Intentar borrar la persona (debe fallar)
      await expect(
        dataSource.query('DELETE FROM personas WHERE id = $1', [testPersonaId])
      ).rejects.toThrow(/fk_solicitudes_persona|viola la llave foránea/);

      // Limpiar
      await dataSource.query(
        'DELETE FROM solicitudes WHERE persona_id = $1 AND integrante_id = $2',
        [testPersonaId, integranteTempId]
      );
      await dataSource.query(
        'DELETE FROM integrantes WHERE id = $1',
        [integranteTempId]
      );
      await dataSource.query(
        'DELETE FROM expedientes WHERE id = $1',
        [expTemp[0].id]
      );
    });
  });
});
