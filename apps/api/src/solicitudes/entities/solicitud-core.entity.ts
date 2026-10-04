import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('solicitudes')
export class SolicitudCoreEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  folio: string;

  @Column({ type: 'uuid' })
  integrante_id: string;

  @Column({ type: 'uuid' })
  persona_id: string;

  @Column({ type: 'uuid' })
  expediente_id: string;

  @Column({ type: 'uuid' })
  grupo_id: string;

  @Column({ type: 'uuid', nullable: true })
  credito_id: string;

  @Column({ type: 'int', nullable: true })
  ciclo_numero: number;

  @Column({ type: 'int', nullable: true })
  numero_credito: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  monto_solicitado: number;

  @Column({ type: 'timestamptz', nullable: true })
  monto_solicitado_confirmado_at: Date | null;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  monto_autorizado: number;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;
}
