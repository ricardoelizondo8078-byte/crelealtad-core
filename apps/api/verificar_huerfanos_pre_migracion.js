const { DataSource } = require('typeorm');

async function verificarHuerfanos() {
  const dataSource = new DataSource({
    type: 'postgres',
    host: 'localhost',
    port: 5432,
    username: 'postgres',
    password: process.env.DB_PASSWORD || process.env.DB_PASS,
    database: 'crelealtad',
  });

  await dataSource.initialize();

  console.log('\n=== VERIFICACIÓN DE HUÉRFANOS PRE-MIGRACIÓN ===\n');

  let hayHuerfanos = false;

  // 1. Verificar solicitudes.persona_id -> personas.id
  const huerfanosPersona = await dataSource.query(`
    SELECT COUNT(*) AS cantidad
    FROM solicitudes s
    WHERE s.persona_id IS NOT NULL
      AND NOT EXISTS (
        SELECT 1 FROM personas p WHERE p.id = s.persona_id
      );
  `);

  console.log(`1. solicitudes.persona_id -> personas.id`);
  if (parseInt(huerfanosPersona[0].cantidad) > 0) {
    console.log(`   ❌ HUÉRFANOS ENCONTRADOS: ${huerfanosPersona[0].cantidad}`);
    hayHuerfanos = true;

    const ejemplos = await dataSource.query(`
      SELECT s.id, s.persona_id
      FROM solicitudes s
      WHERE s.persona_id IS NOT NULL
        AND NOT EXISTS (SELECT 1 FROM personas p WHERE p.id = s.persona_id)
      LIMIT 5;
    `);
    console.log('   Ejemplos:', ejemplos);
  } else {
    console.log(`   ✅ Sin huérfanos`);
  }

  // 2. Verificar solicitudes.expediente_id -> expedientes.id
  const huerfanosExpediente = await dataSource.query(`
    SELECT COUNT(*) AS cantidad
    FROM solicitudes s
    WHERE s.expediente_id IS NOT NULL
      AND NOT EXISTS (
        SELECT 1 FROM expedientes e WHERE e.id = s.expediente_id
      );
  `);

  console.log(`\n2. solicitudes.expediente_id -> expedientes.id`);
  if (parseInt(huerfanosExpediente[0].cantidad) > 0) {
    console.log(`   ❌ HUÉRFANOS ENCONTRADOS: ${huerfanosExpediente[0].cantidad}`);
    hayHuerfanos = true;

    const ejemplos = await dataSource.query(`
      SELECT s.id, s.expediente_id
      FROM solicitudes s
      WHERE s.expediente_id IS NOT NULL
        AND NOT EXISTS (SELECT 1 FROM expedientes e WHERE e.id = s.expediente_id)
      LIMIT 5;
    `);
    console.log('   Ejemplos:', ejemplos);
  } else {
    console.log(`   ✅ Sin huérfanos`);
  }

  // 3. Verificar solicitudes.grupo_id -> grupos.id
  const huerfanosGrupo = await dataSource.query(`
    SELECT COUNT(*) AS cantidad
    FROM solicitudes s
    WHERE s.grupo_id IS NOT NULL
      AND NOT EXISTS (
        SELECT 1 FROM grupos g WHERE g.id = s.grupo_id
      );
  `);

  console.log(`\n3. solicitudes.grupo_id -> grupos.id`);
  if (parseInt(huerfanosGrupo[0].cantidad) > 0) {
    console.log(`   ❌ HUÉRFANOS ENCONTRADOS: ${huerfanosGrupo[0].cantidad}`);
    hayHuerfanos = true;

    const ejemplos = await dataSource.query(`
      SELECT s.id, s.grupo_id
      FROM solicitudes s
      WHERE s.grupo_id IS NOT NULL
        AND NOT EXISTS (SELECT 1 FROM grupos g WHERE g.id = s.grupo_id)
      LIMIT 5;
    `);
    console.log('   Ejemplos:', ejemplos);
  } else {
    console.log(`   ✅ Sin huérfanos`);
  }

  // 4. Verificar solicitudes.credito_id -> creditos.id
  const huerfanosCredito = await dataSource.query(`
    SELECT COUNT(*) AS cantidad
    FROM solicitudes s
    WHERE s.credito_id IS NOT NULL
      AND NOT EXISTS (
        SELECT 1 FROM creditos c WHERE c.id = s.credito_id
      );
  `);

  console.log(`\n4. solicitudes.credito_id -> creditos.id`);
  if (parseInt(huerfanosCredito[0].cantidad) > 0) {
    console.log(`   ❌ HUÉRFANOS ENCONTRADOS: ${huerfanosCredito[0].cantidad}`);
    hayHuerfanos = true;

    const ejemplos = await dataSource.query(`
      SELECT s.id, s.credito_id
      FROM solicitudes s
      WHERE s.credito_id IS NOT NULL
        AND NOT EXISTS (SELECT 1 FROM creditos c WHERE c.id = s.credito_id)
      LIMIT 5;
    `);
    console.log('   Ejemplos:', ejemplos);
  } else {
    console.log(`   ✅ Sin huérfanos`);
  }

  // 5. Verificar solicitudes.integrante_id -> integrantes.id
  const huerfanosIntegrante = await dataSource.query(`
    SELECT COUNT(*) AS cantidad
    FROM solicitudes s
    WHERE s.integrante_id IS NOT NULL
      AND NOT EXISTS (
        SELECT 1 FROM integrantes i WHERE i.id = s.integrante_id
      );
  `);

  console.log(`\n5. solicitudes.integrante_id -> integrantes.id`);
  if (parseInt(huerfanosIntegrante[0].cantidad) > 0) {
    console.log(`   ❌ HUÉRFANOS ENCONTRADOS: ${huerfanosIntegrante[0].cantidad}`);
    hayHuerfanos = true;

    const ejemplos = await dataSource.query(`
      SELECT s.id, s.integrante_id
      FROM solicitudes s
      WHERE s.integrante_id IS NOT NULL
        AND NOT EXISTS (SELECT 1 FROM integrantes i WHERE i.id = s.integrante_id)
      LIMIT 5;
    `);
    console.log('   Ejemplos:', ejemplos);
  } else {
    console.log(`   ✅ Sin huérfanos`);
  }

  // Resumen
  console.log('\n=== RESUMEN ===\n');
  if (hayHuerfanos) {
    console.log('❌ SE ENCONTRARON REGISTROS HUÉRFANOS');
    console.log('⚠️  NO se puede proceder con la migración hasta limpiarlos\n');
    await dataSource.destroy();
    process.exit(1);
  } else {
    console.log('✅ NO hay registros huérfanos');
    console.log('✅ Es seguro proceder con la migración de integridad\n');
  }

  await dataSource.destroy();
}

verificarHuerfanos().catch(console.error);
