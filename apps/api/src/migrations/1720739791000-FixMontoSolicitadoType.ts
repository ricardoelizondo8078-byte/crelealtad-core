import { MigrationInterface, QueryRunner } from 'typeorm';

export class FixMontoSolicitadoType1720739791000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Cambiar tipo de columna de DECIMAL(10,2) a INTEGER
    // PostgreSQL mantiene el valor, solo cambia el tipo
    await queryRunner.query(`
      ALTER TABLE "solicitantes"
      ALTER COLUMN "montoSolicitado"
      TYPE INTEGER
      USING FLOOR("montoSolicitado")::INTEGER
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Revertir a DECIMAL(10,2)
    await queryRunner.query(`
      ALTER TABLE "solicitantes"
      ALTER COLUMN "montoSolicitado"
      TYPE DECIMAL(10,2)
    `);
  }
}
