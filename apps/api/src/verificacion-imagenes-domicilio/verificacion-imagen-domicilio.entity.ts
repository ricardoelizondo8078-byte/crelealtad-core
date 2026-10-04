import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

export const TIPOS_IMAGEN_DOMICILIO = [
  'NOMENCLATURAS_CALLES',
  'FACHADA',
  'MEDIDOR_LUZ',
  'FACHADA_CON_INTEGRANTE',
] as const;

export type TipoImagenDomicilio = (typeof TIPOS_IMAGEN_DOMICILIO)[number];

@Entity('verificacion_imagenes_domicilio')
@Index(
  'ux_verificacion_imagenes_domicilio_actor_idempotencia',
  ['registrada_por', 'idempotency_key'],
  { unique: true },
)
@Index(
  'ix_verificacion_imagenes_domicilio_integrante_tipo_fecha',
  ['integrante_id', 'tipo', 'created_at'],
)
export class VerificacionImagenDomicilioEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', nullable: false })
  integrante_id: string;

  @Column({ type: 'varchar', length: 40, nullable: false })
  tipo: TipoImagenDomicilio;

  @Column({ type: 'varchar', length: 500, nullable: false })
  ruta: string;

  @Column({ type: 'varchar', length: 20, nullable: false })
  mime_type: 'image/jpeg' | 'image/png';

  @Column({ type: 'integer', nullable: false })
  tamano_bytes: number;

  @Column({ type: 'char', length: 64, nullable: false })
  sha256: string;

  @Column({ type: 'varchar', length: 20, nullable: false })
  captura_fuente: 'CAMARA';

  @Column({ type: 'timestamptz', nullable: false })
  foto_capturada_at: Date;

  @Column({ type: 'varchar', length: 100, nullable: false })
  idempotency_key: string;

  @Column({ type: 'uuid', nullable: false })
  registrada_por: string;

  @Column({ type: 'numeric', precision: 10, scale: 7, nullable: false })
  ubicacion_latitud: number;

  @Column({ type: 'numeric', precision: 11, scale: 7, nullable: false })
  ubicacion_longitud: number;

  @Column({ type: 'numeric', precision: 10, scale: 2, nullable: true })
  ubicacion_precision_metros: number | null;

  @Column({ type: 'timestamptz', nullable: false })
  ubicacion_capturada_at: Date;

  @Column({ type: 'varchar', length: 20, nullable: false })
  ubicacion_fuente: 'DISPOSITIVO';

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;
}
