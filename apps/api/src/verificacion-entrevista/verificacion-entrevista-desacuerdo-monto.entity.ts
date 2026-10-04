import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity('verificacion_entrevista_desacuerdos_montos')
@Index('ix_verificacion_entrevista_desacuerdos_integrante', [
  'entrevista_id',
  'integrante_objetivo_id',
  'created_at',
])
export class VerificacionEntrevistaDesacuerdoMontoEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  entrevista_id: string;

  @Column({ type: 'uuid' })
  expediente_id: string;

  @Column({ type: 'uuid' })
  integrante_objetivo_id: string;

  @Column({ type: 'varchar', length: 120, nullable: true })
  motivo: string | null;

  @Column({ type: 'boolean' })
  activo: boolean;

  @Column({ type: 'uuid' })
  registrada_por: string;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;
}
