import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

export const TIPOS_EVIDENCIA_ENTREVISTA = [
  'NEGOCIO',
  'HISTORIAL_CREDITO_ACTIVO',
  'HISTORIAL_CREDITO_INACTIVO',
  'CONTROL_PAGOS',
  'FOLLETO_PREMIO_TESORERA',
] as const;

export type TipoEvidenciaEntrevista = (typeof TIPOS_EVIDENCIA_ENTREVISTA)[number];

@Entity('verificacion_entrevista_evidencias')
@Index(
  'ux_verificacion_entrevista_evidencia_actor_idempotencia',
  ['registrada_por', 'idempotency_key'],
  { unique: true },
)
@Index(
  'ix_verificacion_entrevista_evidencia_integrante_fecha',
  ['integrante_id', 'created_at'],
)
export class VerificacionEntrevistaEvidenciaEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  integrante_id: string;

  @Column({ type: 'varchar', length: 40 })
  tipo: TipoEvidenciaEntrevista;

  @Column({ type: 'varchar', length: 500 })
  ruta: string;

  @Column({ type: 'varchar', length: 20 })
  mime_type: 'image/jpeg' | 'image/png';

  @Column({ type: 'integer' })
  tamano_bytes: number;

  @Column({ type: 'char', length: 64 })
  sha256: string;

  @Column({ type: 'varchar', length: 20 })
  captura_fuente: 'GALERIA' | 'CAMARA';

  @Column({ type: 'timestamptz', nullable: true })
  foto_capturada_at: Date | null;

  @Column({ type: 'varchar', length: 100 })
  idempotency_key: string;

  @Column({ type: 'uuid' })
  registrada_por: string;

  @Column({ type: 'numeric', precision: 10, scale: 7, nullable: true })
  ubicacion_latitud: number | null;

  @Column({ type: 'numeric', precision: 11, scale: 7, nullable: true })
  ubicacion_longitud: number | null;

  @Column({ type: 'numeric', precision: 10, scale: 2, nullable: true })
  ubicacion_precision_metros: number | null;

  @Column({ type: 'timestamptz', nullable: true })
  ubicacion_capturada_at: Date | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  ubicacion_fuente: 'DISPOSITIVO' | null;

  @Column({ type: 'boolean', default: false })
  legado_sin_ubicacion: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;
}
