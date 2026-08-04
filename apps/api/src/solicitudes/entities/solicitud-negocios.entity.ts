import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('solicitudes_negocios')
export class SolicitudNegociosEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  solicitud_id: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  negocio_giro: string;

  @Column({ type: 'varchar', length: 200, nullable: true })
  negocio_domicilio: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  negocio_colonia: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  negocio_municipio: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  negocio_estado: string;

  @Column({ type: 'varchar', length: 5, nullable: true })
  negocio_codigo_postal: string;

  @Column({ type: 'uuid', nullable: true })
  negocio_cp_id: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  negocio_num_ext: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  negocio_num_int: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  negocio_desde_cuando: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  negocio_ingreso_semanal: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  negocio_otros_ingresos: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  negocio_gastos: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  negocio_total: number;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;
}
