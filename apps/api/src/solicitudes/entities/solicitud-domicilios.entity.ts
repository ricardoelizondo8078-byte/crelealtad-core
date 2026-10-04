import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('solicitudes_domicilios')
export class SolicitudDomiciliosEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  solicitud_id: string;

  @Column({ type: 'varchar', length: 150, nullable: true })
  dom_calle: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  dom_num_ext: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  dom_num_int: string;

  @Column({ type: 'varchar', length: 150, nullable: true })
  dom_entre_calles: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  dom_colonia: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  dom_municipio: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  dom_estado: string;

  @Column({ type: 'varchar', length: 5, nullable: true })
  dom_codigo_postal: string;

  @Column({ type: 'uuid', nullable: true })
  dom_cp_id: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  dom_telefono: string;

  @Column({ type: 'numeric', precision: 10, scale: 7, nullable: true })
  dom_latitud: number | null;

  @Column({ type: 'numeric', precision: 11, scale: 7, nullable: true })
  dom_longitud: number | null;

  @Column({ type: 'varchar', length: 40, nullable: true })
  dom_geocodificacion_fuente: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  dom_geocodificacion_fecha: Date | null;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;
}
