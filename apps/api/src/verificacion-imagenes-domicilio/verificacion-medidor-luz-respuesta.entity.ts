import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

export const MOTIVOS_SIN_MEDIDOR_LUZ = [
  'SIN_SERVICIO_ELECTRICO',
  'SERVICIO_COMPARTIDO',
  'MEDIDOR_EN_OTRO_DOMICILIO',
  'MEDIDOR_RETIRADO_O_PENDIENTE',
  'UBICACION_DESCONOCIDA',
] as const;

export type MotivoSinMedidorLuz = (typeof MOTIVOS_SIN_MEDIDOR_LUZ)[number];

@Entity('verificacion_medidor_luz_respuestas')
@Index(
  'ux_verificacion_medidor_luz_actor_idempotencia',
  ['registrada_por', 'idempotency_key'],
  { unique: true },
)
@Index(
  'ix_verificacion_medidor_luz_integrante_fecha',
  ['integrante_id', 'created_at'],
)
export class VerificacionMedidorLuzRespuestaEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', nullable: false })
  integrante_id: string;

  @Column({ type: 'uuid', nullable: false })
  fachada_id: string;

  @Column({ type: 'boolean', nullable: false })
  tiene_medidor: boolean;

  @Column({ type: 'varchar', length: 50, nullable: true })
  motivo: MotivoSinMedidorLuz | null;

  @Column({ type: 'varchar', length: 100, nullable: false })
  idempotency_key: string;

  @Column({ type: 'uuid', nullable: false })
  registrada_por: string;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;
}
