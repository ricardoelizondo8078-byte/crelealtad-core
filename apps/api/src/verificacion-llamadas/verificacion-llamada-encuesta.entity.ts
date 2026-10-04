import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

export enum AccionPosteriorLlamadaVerificacion {
  AGENDO_VISITA = 'AGENDO_VISITA',
  ENTREVISTA_CORTA = 'ENTREVISTA_CORTA',
  ENTREVISTA_LARGA = 'ENTREVISTA_LARGA',
  LLAMAR_MAS_TARDE = 'LLAMAR_MAS_TARDE',
}

@Entity('verificacion_llamada_encuestas')
@Index('ux_verificacion_llamada_encuestas_llamada', ['llamada_id'], { unique: true })
export class VerificacionLlamadaEncuestaEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', nullable: false })
  llamada_id: string;

  @Column({ type: 'boolean', nullable: false })
  identidad_coincide: boolean;

  @Column({ type: 'boolean', nullable: false })
  domicilio_coincide: boolean;

  @Column({ type: 'varchar', length: 30, nullable: false })
  accion_posterior: AccionPosteriorLlamadaVerificacion;

  @Column({ type: 'uuid', nullable: false })
  registrada_por: string;

  @Column({ type: 'timestamptz', nullable: true })
  completada_at: Date | null;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;
}
