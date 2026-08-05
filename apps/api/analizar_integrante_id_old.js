const { DataSource } = require('typeorm');

async function analizarIntegranteIdOld() {
  const ds = new DataSource({
    type: 'postgres',
    host: 'localhost',
    port: 5432,
    username: 'postgres',
    password: process.env.DB_PASSWORD || process.env.DB_PASS,
    database: 'crelealtad'
  });

  await ds.initialize();

  console.log('\n=== ANÁLISIS DE integrante_id_old ===\n');

  // 1. Comparar valores entre integrante_id e integrante_id_old
  const comparacion = await ds.query(`
    SELECT
      COUNT(*) FILTER (WHERE integrante_id IS NOT NULL) AS con_integrante_id,
      COUNT(*) FILTER (WHERE integrante_id_old IS NOT NULL) AS con_integrante_id_old,
      COUNT(*) FILTER (WHERE integrante_id IS NOT NULL AND integrante_id_old IS NOT NULL) AS con_ambos,
      COUNT(*) FILTER (WHERE integrante_id = integrante_id_old) AS valores_iguales,
      COUNT(*) FILTER (WHERE integrante_id IS NOT NULL AND integrante_id_old IS NOT NULL AND integrante_id <> integrante_id_old) AS valores_diferentes,
      COUNT(*) AS total
    FROM solicitudes
  `);

  console.log('📊 COMPARACIÓN DE COLUMNAS:\n');
  console.log(`Total solicitudes: ${comparacion[0].total}`);
  console.log(`Con integrante_id: ${comparacion[0].con_integrante_id}`);
  console.log(`Con integrante_id_old: ${comparacion[0].con_integrante_id_old}`);
  console.log(`Con ambos: ${comparacion[0].con_ambos}`);
  console.log(`Valores iguales: ${comparacion[0].valores_iguales}`);
  console.log(`Valores diferentes: ${comparacion[0].valores_diferentes}\n`);

  // 2. Mostrar casos donde difieren
  if (parseInt(comparacion[0].valores_diferentes) > 0) {
    console.log('⚠️  CASOS DONDE DIFIEREN:\n');
    const diferentes = await ds.query(`
      SELECT
        id,
        integrante_id,
        integrante_id_old,
        persona_id,
        folio
      FROM solicitudes
      WHERE integrante_id IS NOT NULL
        AND integrante_id_old IS NOT NULL
        AND integrante_id <> integrante_id_old
      LIMIT 5
    `);

    diferentes.forEach(row => {
      console.log(`Solicitud ${row.folio || row.id}:`);
      console.log(`  integrante_id: ${row.integrante_id}`);
      console.log(`  integrante_id_old: ${row.integrante_id_old}`);
      console.log(`  persona_id: ${row.persona_id}\n`);
    });
  }

  // 3. Verificar si integrante_id_old apunta a registros válidos
  console.log('🔍 VALIDEZ DE REFERENCIAS:\n');

  const huerfanos_old = await ds.query(`
    SELECT COUNT(*) AS total
    FROM solicitudes s
    WHERE s.integrante_id_old IS NOT NULL
      AND NOT EXISTS (
        SELECT 1 FROM integrantes i WHERE i.id = s.integrante_id_old
      )
  `);

  console.log(`Referencias huérfanas en integrante_id_old: ${huerfanos_old[0].total}`);

  const huerfanos_new = await ds.query(`
    SELECT COUNT(*) AS total
    FROM solicitudes s
    WHERE s.integrante_id IS NOT NULL
      AND NOT EXISTS (
        SELECT 1 FROM integrantes i WHERE i.id = s.integrante_id
      )
  `);

  console.log(`Referencias huérfanas en integrante_id: ${huerfanos_new[0].total}\n`);

  // 4. Casos donde solo existe integrante_id_old
  const solo_old = await ds.query(`
    SELECT COUNT(*) AS total
    FROM solicitudes
    WHERE integrante_id IS NULL
      AND integrante_id_old IS NOT NULL
  `);

  console.log(`Solicitudes que SOLO tienen integrante_id_old: ${solo_old[0].total}`);

  if (parseInt(solo_old[0].total) > 0) {
    console.log('   → Estas solicitudes requieren integrante_id_old como fallback\n');
  }

  await ds.destroy();
}

analizarIntegranteIdOld().catch(console.error);
