const { DataSource } = require('typeorm');

/**
 * TEST DE REGRESIÓN: Integridad de Historial de Créditos
 *
 * Prueba que las constraints aplicadas funcionen correctamente.
 */
async function testIntegrityConstraints() {
  const dataSource = new DataSource({
    type: 'postgres',
    host: 'localhost',
    port: 5432,
    username: 'postgres',
    password: process.env.DB_PASSWORD || process.env.DB_PASS,
    database: 'crelealtad',
  });

  await dataSource.initialize();

  console.log('\n=== TESTS DE INTEGRIDAD DE HISTORIAL DE CRÉDITOS ===\n');

  let testsPassed = 0;
  let testsFailed = 0;

  // Obtener una persona de prueba
  const personas = await dataSource.query('SELECT id FROM personas LIMIT 1');
  const testPersonaId = personas[0].id;

  const integrantes = await dataSource.query('SELECT id FROM integrantes LIMIT 1');
  const testIntegranteId = integrantes[0].id;

  // =====================================================
  // TEST 1: UNIQUE (persona_id, numero_credito) - Duplicados NOT NULL
  // =====================================================
  console.log('TEST 1: Constraint UNIQUE debe FALLAR con duplicados NOT NULL');
  try {
    // Limpiar
    await dataSource.query('DELETE FROM solicitudes WHERE persona_id = $1 AND numero_credito IS NOT NULL', [testPersonaId]);

    // Crear dos integrantes diferentes para evitar solicitudes_integrante_unique
    const integrante1 = await dataSource.query('INSERT INTO integrantes (persona_id, expediente_id) VALUES ($1, NULL) RETURNING id', [testPersonaId]);
    const integrante2 = await dataSource.query('INSERT INTO integrantes (persona_id, expediente_id) VALUES ($1, NULL) RETURNING id', [testPersonaId]);

    const integranteId1 = integrante1[0].id;
    const integranteId2 = integrante2[0].id;

    // Insertar primera solicitud con numero_credito = 1
    await dataSource.query(`
      INSERT INTO solicitudes (persona_id, integrante_id, numero_credito)
      VALUES ($1, $2, 1)
    `, [testPersonaId, integranteId1]);

    // Intentar insertar segunda con el mismo numero_credito (debe fallar)
    try {
      await dataSource.query(`
        INSERT INTO solicitudes (persona_id, integrante_id, numero_credito)
        VALUES ($1, $2, 1)
      `, [testPersonaId, integranteId2]);

      console.log('   ❌ FALLÓ: Debería haber rechazado el duplicado\n');
      testsFailed++;
    } catch (error) {
      if (error.code === '23505') { // unique_violation
        console.log('   ✅ PASÓ: Duplicado rechazado correctamente\n');
        testsPassed++;
      } else {
        console.log('   ❌ FALLÓ: Error inesperado:', error.message, '\n');
        testsFailed++;
      }
    }

    // Limpiar
    await dataSource.query('DELETE FROM solicitudes WHERE persona_id = $1 AND numero_credito = 1', [testPersonaId]);
    await dataSource.query('DELETE FROM integrantes WHERE id IN ($1, $2)', [integranteId1, integranteId2]);
  } catch (error) {
    console.log('   ❌ FALLÓ: Error en setup:', error.message, '\n');
    testsFailed++;
  }

  // =====================================================
  // TEST 2: UNIQUE permite múltiples NULL
  // =====================================================
  console.log('TEST 2: Constraint UNIQUE debe PERMITIR múltiples NULL');
  try {
    // Limpiar
    await dataSource.query('DELETE FROM solicitudes WHERE persona_id = $1', [testPersonaId]);

    // Crear 3 integrantes diferentes
    const int1 = await dataSource.query('INSERT INTO integrantes (persona_id, expediente_id) VALUES ($1, NULL) RETURNING id', [testPersonaId]);
    const int2 = await dataSource.query('INSERT INTO integrantes (persona_id, expediente_id) VALUES ($1, NULL) RETURNING id', [testPersonaId]);
    const int3 = await dataSource.query('INSERT INTO integrantes (persona_id, expediente_id) VALUES ($1, NULL) RETURNING id', [testPersonaId]);

    // Insertar 3 solicitudes con numero_credito NULL
    await dataSource.query(`
      INSERT INTO solicitudes (persona_id, integrante_id, numero_credito)
      VALUES ($1, $2, NULL)
    `, [testPersonaId, int1[0].id]);

    await dataSource.query(`
      INSERT INTO solicitudes (persona_id, integrante_id, numero_credito)
      VALUES ($1, $2, NULL)
    `, [testPersonaId, int2[0].id]);

    await dataSource.query(`
      INSERT INTO solicitudes (persona_id, integrante_id, numero_credito)
      VALUES ($1, $2, NULL)
    `, [testPersonaId, int3[0].id]);

    // Verificar que se crearon 3
    const resultado = await dataSource.query(`
      SELECT COUNT(*) AS total
      FROM solicitudes
      WHERE persona_id = $1 AND numero_credito IS NULL
    `, [testPersonaId]);

    if (parseInt(resultado[0].total) === 3) {
      console.log('   ✅ PASÓ: 3 solicitudes con NULL creadas correctamente\n');
      testsPassed++;
    } else {
      console.log('   ❌ FALLÓ: Se esperaban 3, se encontraron', resultado[0].total, '\n');
      testsFailed++;
    }

    // Limpiar
    await dataSource.query('DELETE FROM solicitudes WHERE persona_id = $1', [testPersonaId]);
    await dataSource.query('DELETE FROM integrantes WHERE id IN ($1, $2, $3)', [int1[0].id, int2[0].id, int3[0].id]);
  } catch (error) {
    console.log('   ❌ FALLÓ: Error:', error.message, '\n');
    testsFailed++;
  }

  // =====================================================
  // TEST 3: FK persona_id rechaza inexistentes
  // =====================================================
  console.log('TEST 3: FK persona_id debe FALLAR con persona_id inexistente');
  try {
    const personaIdInexistente = '00000000-0000-0000-0000-999999999999';

    try {
      await dataSource.query(`
        INSERT INTO solicitudes (persona_id, integrante_id)
        VALUES ($1, $2)
      `, [personaIdInexistente, testIntegranteId]);

      console.log('   ❌ FALLÓ: Debería haber rechazado persona_id inexistente\n');
      testsFailed++;
    } catch (error) {
      if (error.code === '23503') { // foreign_key_violation
        console.log('   ✅ PASÓ: persona_id inexistente rechazado correctamente\n');
        testsPassed++;
      } else {
        console.log('   ❌ FALLÓ: Error inesperado:', error.message, '\n');
        testsFailed++;
      }
    }
  } catch (error) {
    console.log('   ❌ FALLÓ: Error en setup:', error.message, '\n');
    testsFailed++;
  }

  // =====================================================
  // TEST 4: ON DELETE RESTRICT protege personas con solicitudes
  // =====================================================
  console.log('TEST 4: ON DELETE RESTRICT debe proteger persona con solicitudes');
  try {
    // Crear integrante temporal
    const intTemp = await dataSource.query('INSERT INTO integrantes (persona_id, expediente_id) VALUES ($1, NULL) RETURNING id', [testPersonaId]);
    const integranteTempId = intTemp[0].id;

    // Crear solicitud
    await dataSource.query(`
      INSERT INTO solicitudes (persona_id, integrante_id)
      VALUES ($1, $2)
    `, [testPersonaId, integranteTempId]);

    // Intentar borrar la persona (debe fallar)
    try {
      await dataSource.query('DELETE FROM personas WHERE id = $1', [testPersonaId]);

      console.log('   ❌ FALLÓ: Debería haber protegido la persona\n');
      testsFailed++;
    } catch (error) {
      if (error.code === '23503') { // foreign_key_violation
        console.log('   ✅ PASÓ: Persona protegida correctamente (ON DELETE RESTRICT)\n');
        testsPassed++;
      } else {
        console.log('   ❌ FALLÓ: Error inesperado:', error.message, '\n');
        testsFailed++;
      }
    }

    // Limpiar
    await dataSource.query('DELETE FROM solicitudes WHERE persona_id = $1', [testPersonaId]);
    await dataSource.query('DELETE FROM integrantes WHERE id = $1', [integranteTempId]);
  } catch (error) {
    console.log('   ❌ FALLÓ: Error en setup:', error.message, '\n');
    testsFailed++;
  }

  // =====================================================
  // RESUMEN
  // =====================================================
  console.log('=== RESUMEN DE TESTS ===\n');
  console.log(`✅ Tests pasados: ${testsPassed}`);
  console.log(`❌ Tests fallados: ${testsFailed}`);
  console.log(`📊 Total: ${testsPassed + testsFailed}`);

  if (testsFailed === 0) {
    console.log('\n🎉 TODOS LOS TESTS PASARON\n');
  } else {
    console.log('\n⚠️  ALGUNOS TESTS FALLARON\n');
    process.exitCode = 1;
  }

  await dataSource.destroy();
}

testIntegrityConstraints().catch(error => {
  console.error('\n❌ ERROR FATAL:', error);
  process.exit(1);
});
