import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('solicitudes_validaciones')
export class SolicitudValidacionesEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  solicitud_id: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  tiene_medidor_luz: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  vive_max_5km_tesorera: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  tiene_menos_70_anios: string;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;
}
