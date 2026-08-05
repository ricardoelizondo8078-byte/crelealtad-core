const { DataSource } = require('typeorm');

async function runMigration() {
  const dataSource = new DataSource({
    type: 'postgres',
    host: 'localhost',
    port: 5432,
    username: 'postgres',
    password: process.env.DB_PASSWORD || process.env.DB_PASS,
    database: 'crelealtad',
  });

  await dataSource.initialize();
  const queryRunner = dataSource.createQueryRunner();

  try {
    console.log('⚙️  Verificando solicitudes con campos NULL...');

    // Verificar cuántas solicitudes tienen campos críticos en NULL
    const verificacion = await queryRunner.query(`
      SELECT
        COUNT(*) FILTER (WHERE persona_id IS NULL) AS sin_persona,
        COUNT(*) FILTER (WHERE integrante_id IS NULL) AS sin_integrante,
        COUNT(*) FILTER (WHERE expediente_id IS NULL) AS sin_expediente,
        COUNT(*) FILTER (WHERE grupo_id IS NULL) AS sin_grupo,
        COUNT(*) AS total
      FROM solicitudes
    `);

    const { sin_persona, sin_integrante, sin_expediente, sin_grupo, total } = verificacion[0];

    console.log(`\n📊 Estado actual:`);
    console.log(`   Total solicitudes: ${total}`);
    console.log(`   Sin persona_id: ${sin_persona}`);
    console.log(`   Sin integrante_id: ${sin_integrante}`);
    console.log(`   Sin expediente_id: ${sin_expediente}`);
    console.log(`   Sin grupo_id: ${sin_grupo}`);

    // Eliminar solicitudes de prueba sin persona_id
    if (parseInt(sin_persona) > 0) {
      console.log(`\n⚠️  Eliminando ${sin_persona} solicitudes de prueba con persona_id NULL...`);

      const solicitudesAEliminar = await queryRunner.query(`
        SELECT id, created_at FROM solicitudes WHERE persona_id IS NULL
      `);

      console.log('   IDs a eliminar:', solicitudesAEliminar.map(s => s.id).join(', '));

      await queryRunner.query(`DELETE FROM solicitudes WHERE persona_id IS NULL`);

      console.log(`   ✅ ${sin_persona} solicitudes eliminadas`);
    }

    // Verificar que no queden NULL en campos críticos
    const verificacionFinal = await queryRunner.query(`
      SELECT
        COUNT(*) FILTER (WHERE persona_id IS NULL OR integrante_id IS NULL OR expediente_id IS NULL OR grupo_id IS NULL) AS con_nulls
      FROM solicitudes
    `);

    if (parseInt(verificacionFinal[0].con_nulls) > 0) {
      throw new Error(
        `MIGRACIÓN ABORTADA: Aún hay solicitudes con campos críticos en NULL. ` +
        `Todas las solicitudes deben tener persona_id, integrante_id, expediente_id y grupo_id poblados.`
      );
    }

    console.log('\n⚙️  Agregando NOT NULL constraints...');

    // Agregar NOT NULL a las 4 columnas críticas
    await queryRunner.query(`
      ALTER TABLE solicitudes
      ALTER COLUMN persona_id SET NOT NULL
    `);

    await queryRunner.query(`
      ALTER TABLE solicitudes
      ALTER COLUMN integrante_id SET NOT NULL
    `);

    await queryRunner.query(`
      ALTER TABLE solicitudes
      ALTER COLUMN expediente_id SET NOT NULL
    `);

    await queryRunner.query(`
      ALTER TABLE solicitudes
      ALTER COLUMN grupo_id SET NOT NULL
    `);

    console.log('\n✅ Constraints NOT NULL agregados correctamente');
    console.log('✅ Ahora es IMPOSIBLE crear solicitudes sin persona_id, integrante_id, expediente_id o grupo_id');
  } catch (error) {
    console.error('\n❌ Error en migración:', error.message);
    throw error;
  } finally {
    await queryRunner.release();
    await dataSource.destroy();
  }
}

runMigration().catch(error => {
  console.error('Fatal:', error);
  process.exit(1);
});
