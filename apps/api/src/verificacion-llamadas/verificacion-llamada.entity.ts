import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';
import { TipoTelefonoEntrevista } from './verificacion-entrevista-telefono-confirmacion.entity';

export enum CanalLlamadaVerificacion {
  TELEFONICA = 'TELEFONICA',
  WHATSAPP = 'WHATSAPP',
}

export enum ResultadoLlamadaVerificacion {
  CONTESTADA = 'CONTESTADA',
  NO_CONTESTADA = 'NO_CONTESTADA',
}

@Entity('verificacion_llamadas')
@Index(
  'ux_verificacion_llamadas_actor_idempotencia',
  ['registrada_por', 'idempotency_key'],
  { unique: true },
)
@Index('ix_verificacion_llamadas_integrante_fecha', ['integrante_id', 'created_at'])
@Index(
  'ix_verificacion_llamadas_integrante_tipo_telefono_fecha',
  ['integrante_id', 'tipo_telefono', 'created_at'],
  { where: 'telefono IS NOT NULL' },
)
export class VerificacionLlamadaEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', nullable: false })
  integrante_id: string;

  @Column({ type: 'varchar', length: 20, nullable: false })
  canal: CanalLlamadaVerificacion;

  @Column({ type: 'varchar', length: 20, nullable: false })
  resultado: ResultadoLlamadaVerificacion;

  @Column({ type: 'varchar', length: 20, nullable: true })
  tipo_telefono: TipoTelefonoEntrevista | null;

  @Column({ type: 'varchar', length: 10, nullable: true })
  telefono: string | null;

  @Column({ type: 'varchar', length: 100, nullable: false })
  idempotency_key: string;

  @Column({ type: 'uuid', nullable: false })
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

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;
}
