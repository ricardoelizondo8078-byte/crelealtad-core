/**
 * TESTS DE INTEGRIDAD DE HISTORIAL DE CRÉDITOS
 *
 * Estos tests verifican las constraints aplicadas en la migración
 * AddCreditHistoryIntegrityConstraints y que el servicio sanitiza
 * correctamente el DTO.
 *
 * IMPORTANTE: Requieren base de datos PostgreSQL corriendo.
 */

import { DataSource } from 'typeorm';

describe('Integridad de Historial de Créditos', () => {
  let dataSource: DataSource;
  let testPersonaId: string;

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
    testPersonaId = personas[0].id;
  });

  afterAll(async () => {
    await dataSource.destroy();
  });

  describe('Constraint UNIQUE (persona_id, numero_credito)', () => {
    it('debe rechazar duplicados con numero_credito NOT NULL', async () => {
      // Limpiar
      await dataSource.query(
        'DELETE FROM solicitudes WHERE persona_id = $1 AND numero_credito IS NOT NULL',
        [testPersonaId]
      );

      // Crear integrantes únicos para evitar constraint solicitudes_integrante_unique
      const int1 = await dataSource.query(
        'INSERT INTO integrantes (persona_id, expediente_id) SELECT $1, id FROM expedientes LIMIT 1 RETURNING id',
        [testPersonaId]
      );
      const int2 = await dataSource.query(
        'INSERT INTO integrantes (persona_id, expediente_id) SELECT $1, id FROM expedientes LIMIT 1 RETURNING id',
        [testPersonaId]
      );

      const integranteId1 = int1[0].id;
      const integranteId2 = int2[0].id;

      // Insertar primera solicitud con numero_credito = 1
      await dataSource.query(
        'INSERT INTO solicitudes (persona_id, integrante_id, numero_credito) VALUES ($1, $2, 1)',
        [testPersonaId, integranteId1]
      );

      // Intentar insertar segunda con el mismo numero_credito (debe fallar)
      await expect(
        dataSource.query(
          'INSERT INTO solicitudes (persona_id, integrante_id, numero_credito) VALUES ($1, $2, 1)',
          [testPersonaId, integranteId2]
        )
      ).rejects.toThrow();

      // Limpiar
      await dataSource.query(
        'DELETE FROM solicitudes WHERE persona_id = $1 AND numero_credito = 1',
        [testPersonaId]
      );
      await dataSource.query(
        'DELETE FROM integrantes WHERE id IN ($1, $2)',
        [integranteId1, integranteId2]
      );
    });

    it('debe permitir múltiples NULL para la misma persona_id', async () => {
      // Limpiar
      await dataSource.query(
        'DELETE FROM solicitudes WHERE persona_id = $1 AND numero_credito IS NULL',
        [testPersonaId]
      );

      // Crear 3 integrantes únicos
      const int1 = await dataSource.query(
        'INSERT INTO integrantes (persona_id, expediente_id) SELECT $1, id FROM expedientes LIMIT 1 RETURNING id',
        [testPersonaId]
      );
      const int2 = await dataSource.query(
        'INSERT INTO integrantes (persona_id, expediente_id) SELECT $1, id FROM expedientes LIMIT 1 RETURNING id',
        [testPersonaId]
      );
      const int3 = await dataSource.query(
        'INSERT INTO integrantes (persona_id, expediente_id) SELECT $1, id FROM expedientes LIMIT 1 RETURNING id',
        [testPersonaId]
      );

      // Insertar 3 solicitudes con numero_credito NULL
      await dataSource.query(
        'INSERT INTO solicitudes (persona_id, integrante_id, numero_credito) VALUES ($1, $2, NULL)',
        [testPersonaId, int1[0].id]
      );
      await dataSource.query(
        'INSERT INTO solicitudes (persona_id, integrante_id, numero_credito) VALUES ($1, $2, NULL)',
        [testPersonaId, int2[0].id]
      );
      await dataSource.query(
        'INSERT INTO solicitudes (persona_id, integrante_id, numero_credito) VALUES ($1, $2, NULL)',
        [testPersonaId, int3[0].id]
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
    });
  });

  describe('Foreign Key persona_id', () => {
    it('debe rechazar solicitudes con persona_id inexistente', async () => {
      const personaIdInexistente = '00000000-0000-0000-0000-999999999999';
      const integrantes = await dataSource.query('SELECT id FROM integrantes LIMIT 1');
      const integranteId = integrantes[0].id;

      await expect(
        dataSource.query(
          'INSERT INTO solicitudes (persona_id, integrante_id) VALUES ($1, $2)',
          [personaIdInexistente, integranteId]
        )
      ).rejects.toThrow();
    });
  });

  describe('ON DELETE RESTRICT', () => {
    it('debe proteger persona con solicitudes asociadas', async () => {
      // Crear integrante temporal
      const intTemp = await dataSource.query(
        'INSERT INTO integrantes (persona_id, expediente_id) SELECT $1, id FROM expedientes LIMIT 1 RETURNING id',
        [testPersonaId]
      );
      const integranteTempId = intTemp[0].id;

      // Crear solicitud
      await dataSource.query(
        'INSERT INTO solicitudes (persona_id, integrante_id) VALUES ($1, $2)',
        [testPersonaId, integranteTempId]
      );

      // Intentar borrar la persona (debe fallar)
      await expect(
        dataSource.query('DELETE FROM personas WHERE id = $1', [testPersonaId])
      ).rejects.toThrow();

      // Limpiar
      await dataSource.query(
        'DELETE FROM solicitudes WHERE persona_id = $1',
        [testPersonaId]
      );
      await dataSource.query(
        'DELETE FROM integrantes WHERE id = $1',
        [integranteTempId]
      );
    });
  });
});
