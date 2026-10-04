import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity('verificacion_visitas_vecino')
@Index(
  'ux_verificacion_visitas_vecino_actor_idempotencia',
  ['registrada_por', 'idempotency_key'],
  { unique: true },
)
@Index(
  'ix_verificacion_visitas_vecino_integrante_fecha',
  ['integrante_id', 'created_at'],
)
export class VerificacionVisitaVecinoEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', nullable: false })
  integrante_id: string;

  @Column({ type: 'boolean', nullable: false })
  conoce_y_sabe_donde_vive: boolean;

  @Column({ type: 'uuid', nullable: true })
  fachada_id: string | null;

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
