import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddTelefonoMontoToPersonas1721001000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'personas',
      new TableColumn({
        name: 'telefono',
        type: 'varchar',
        isNullable: true,
      }),
    );

    await queryRunner.addColumn(
      'personas',
      new TableColumn({
        name: 'monto_solicitado',
        type: 'decimal',
        precision: 10,
        scale: 2,
        isNullable: true,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('personas', 'monto_solicitado');
    await queryRunner.dropColumn('personas', 'telefono');
  }
}
