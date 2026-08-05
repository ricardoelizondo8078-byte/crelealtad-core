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
    console.log('⚙️  Eliminando columna legacy integrante_id_old de solicitudes...');

    // Verificar que la columna esté completamente vacía antes de eliminar
    const verificacion = await queryRunner.query(`
      SELECT COUNT(*) AS total
      FROM solicitudes
      WHERE integrante_id_old IS NOT NULL
    `);

    const totalConValor = parseInt(verificacion[0].total);

    if (totalConValor > 0) {
      throw new Error(
        `MIGRACIÓN ABORTADA: ${totalConValor} solicitudes tienen integrante_id_old poblado. ` +
        `Revisar DIAGNOSTICO_INTEGRANTE_ID_OLD.md antes de continuar.`
      );
    }

    console.log(`✅ Verificación OK: 0 solicitudes usan integrante_id_old`);

    // Eliminar vista que depende de la columna
    console.log('⚙️  Eliminando vista solicitudes_completo...');
    await queryRunner.query(`DROP VIEW IF EXISTS solicitudes_completo CASCADE`);

    // Eliminar columna
    await queryRunner.query(`
      ALTER TABLE solicitudes
      DROP COLUMN IF EXISTS integrante_id_old
    `);

    console.log('✅ Columna integrante_id_old eliminada correctamente');

    // Recrear vista SIN integrante_id_old
    console.log('⚙️  Recreando vista solicitudes_completo...');
    await queryRunner.query(`
      CREATE OR REPLACE VIEW solicitudes_completo AS
      SELECT
        s.id,
        s.folio,
        s.integrante_id,
        s.persona_id,
        s.expediente_id,
        s.grupo_id,
        s.credito_id,
        s.ciclo_numero,
        s.numero_credito,
        s.monto_solicitado,
        s.monto_autorizado,
        s.created_at,
        s.updated_at
      FROM solicitudes s
    `);

    console.log('✅ Vista solicitudes_completo recreada');
  } catch (error) {
    console.error('❌ Error en migración:', error.message);
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
