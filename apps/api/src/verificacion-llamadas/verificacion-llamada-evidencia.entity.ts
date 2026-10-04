import { Column, CreateDateColumn, Entity, Index, PrimaryColumn } from 'typeorm';
import { TipoTelefonoEntrevista } from './verificacion-entrevista-telefono-confirmacion.entity';

export enum PropositoEvidenciaLlamada {
  ENCUESTA = 'ENCUESTA',
  CONFIRMACION_TELEFONO = 'CONFIRMACION_TELEFONO',
}

@Entity('verificacion_llamada_evidencias')
@Index('ux_verificacion_llamada_evidencias_encuesta', ['encuesta_id'], { unique: true })
@Index(
  'ux_verificacion_llamada_evidencias_version',
  ['llamada_id', 'proposito', 'version'],
  { unique: true },
)
@Index('ix_verificacion_llamada_evidencias_llamada_fecha', ['llamada_id', 'created_at'])
export class VerificacionLlamadaEvidenciaEntity {
  @PrimaryColumn({ type: 'uuid' })
  id: string;

  @Column({ type: 'uuid', nullable: true })
  encuesta_id: string | null;

  @Column({ type: 'uuid', nullable: false })
  llamada_id: string;

  @Column({ type: 'varchar', length: 30, nullable: false })
  proposito: PropositoEvidenciaLlamada;

  @Column({ type: 'integer', nullable: false })
  version: number;

  @Column({ type: 'varchar', length: 20, nullable: true })
  tipo_telefono: TipoTelefonoEntrevista | null;

  @Column({ type: 'varchar', length: 10, nullable: true })
  telefono: string | null;

  @Column({ type: 'varchar', length: 500, nullable: false })
  ruta: string;

  @Column({ type: 'varchar', length: 100, nullable: false })
  mime_type: string;

  @Column({ type: 'integer', nullable: false })
  tamano_bytes: number;

  @Column({ type: 'char', length: 64, nullable: false })
  sha256: string;

  @Column({ type: 'uuid', nullable: false })
  registrada_por: string;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;
}
