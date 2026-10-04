import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity('verificacion_entrevista_familiares')
@Index('ix_verificacion_entrevista_familiares_integrante', [
  'entrevista_id',
  'familiar_integrante_id',
  'created_at',
])
export class VerificacionEntrevistaFamiliarEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  entrevista_id: string;

  @Column({ type: 'uuid' })
  expediente_id: string;

  @Column({ type: 'uuid' })
  familiar_integrante_id: string;

  @Column({ type: 'boolean' })
  activo: boolean;

  @Column({ type: 'uuid' })
  registrada_por: string;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;
}
