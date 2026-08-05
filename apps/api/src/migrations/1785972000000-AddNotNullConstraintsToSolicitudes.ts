import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * MIGRACIÓN: Agregar NOT NULL a columnas críticas de solicitudes
 *
 * Columnas que deben ser NOT NULL:
 * - persona_id: Ancla del historial de crédito
 * - integrante_id: Identifica al solicitante
 * - expediente_id: Contexto del proceso
 * - grupo_id: Contexto del crédito grupal
 *
 * IMPORTANTE: Elimina las 2 solicitudes de prueba con persona_id NULL antes de aplicar.
 *
 * Fecha: 05 de agosto de 2026
 */
export class AddNotNullConstraintsToSolicitudes1785972000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
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

    console.log(`📊 Estado actual:`);
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

    console.log('✅ Constraints NOT NULL agregados correctamente');
    console.log('✅ Ahora es IMPOSIBLE crear solicitudes sin persona_id, integrante_id, expediente_id o grupo_id');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    console.log('⚙️  Removiendo NOT NULL constraints...');

    await queryRunner.query(`
      ALTER TABLE solicitudes
      ALTER COLUMN persona_id DROP NOT NULL
    `);

    await queryRunner.query(`
      ALTER TABLE solicitudes
      ALTER COLUMN integrante_id DROP NOT NULL
    `);

    await queryRunner.query(`
      ALTER TABLE solicitudes
      ALTER COLUMN expediente_id DROP NOT NULL
    `);

    await queryRunner.query(`
      ALTER TABLE solicitudes
      ALTER COLUMN grupo_id DROP NOT NULL
    `);

    console.log('✅ Constraints NOT NULL removidos');
  }
}
