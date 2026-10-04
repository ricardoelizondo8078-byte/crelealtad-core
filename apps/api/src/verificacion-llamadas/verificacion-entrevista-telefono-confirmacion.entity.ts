import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

export enum TipoTelefonoEntrevista {
  PRINCIPAL = 'PRINCIPAL',
  SECUNDARIO = 'SECUNDARIO',
}

@Entity('verificacion_entrevista_telefono_confirmaciones')
@Index('ux_verificacion_entrevista_telefono_llamada', ['llamada_id'], { unique: true })
@Index(
  'ix_verificacion_entrevista_telefono_integrante_tipo_fecha',
  ['integrante_id', 'tipo_telefono', 'created_at'],
)
export class VerificacionEntrevistaTelefonoConfirmacionEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', nullable: false })
  integrante_id: string;

  @Column({ type: 'uuid', nullable: false })
  llamada_id: string;

  @Column({ type: 'uuid', nullable: false })
  evidencia_id: string;

  @Column({ type: 'varchar', length: 20, nullable: false })
  tipo_telefono: TipoTelefonoEntrevista;

  @Column({ type: 'varchar', length: 10, nullable: false })
  telefono: string;

  @Column({ type: 'varchar', length: 500, nullable: false })
  ruta: string;

  @Column({ type: 'varchar', length: 20, nullable: false })
  mime_type: 'image/jpeg' | 'image/png';

  @Column({ type: 'integer', nullable: false })
  tamano_bytes: number;

  @Column({ type: 'char', length: 64, nullable: false })
  sha256: string;

  @Column({ type: 'uuid', nullable: false })
  registrada_por: string;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;
}
