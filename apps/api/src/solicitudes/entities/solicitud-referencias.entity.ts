import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('solicitudes_referencias')
export class SolicitudReferenciasEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  solicitud_id: string;

  @Column({ type: 'varchar', length: 150, nullable: true })
  ref1_nombre: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  ref1_parentesco: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  ref1_telefono: string;

  @Column({ type: 'varchar', length: 200, nullable: true })
  ref1_direccion: string;

  @Column({ type: 'varchar', length: 150, nullable: true })
  ref2_nombre: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  ref2_parentesco: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  ref2_telefono: string;

  @Column({ type: 'varchar', length: 200, nullable: true })
  ref2_direccion: string;

  @Column({ type: 'varchar', length: 150, nullable: true })
  pareja_nombre: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  pareja_actividad: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  pareja_ingreso_semanal: number;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;
}
