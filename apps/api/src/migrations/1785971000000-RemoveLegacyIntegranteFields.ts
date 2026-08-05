import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * MIGRACIÓN: Eliminar columna legacy integrante_id_old
 *
 * Razón: El único consumidor de la API (app React Native) envía solo integrante_id.
 * No hay clientes legacy activos. La columna está vacía en todas las solicitudes existentes.
 *
 * Fecha: 05 de agosto de 2026
 * Relacionado: DIAGNOSTICO_INTEGRANTE_ID_OLD.md
 */
export class RemoveLegacyIntegranteFields1785971000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
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

    // Eliminar columna
    await queryRunner.query(`
      ALTER TABLE solicitudes
      DROP COLUMN IF EXISTS integrante_id_old
    `);

    console.log('✅ Columna integrante_id_old eliminada correctamente');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    console.log('⚙️  Restaurando columna integrante_id_old...');

    // Restaurar columna
    await queryRunner.query(`
      ALTER TABLE solicitudes
      ADD COLUMN integrante_id_old UUID
    `);

    console.log('✅ Columna integrante_id_old restaurada');
  }
}
