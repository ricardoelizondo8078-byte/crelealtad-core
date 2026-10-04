import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

export enum CaracteristicaLlamadaVerificacion {
  NUMERO_PLANTAS = 'NUMERO_PLANTAS',
  COLOR_DOMICILIO = 'COLOR_DOMICILIO',
  COCHERA_ENTRADA = 'COCHERA_ENTRADA',
  BANQUETA_FRENTE = 'BANQUETA_FRENTE',
  OBJETO_VISIBLE = 'OBJETO_VISIBLE',
  REFERENCIA_EXTERIOR = 'REFERENCIA_EXTERIOR',
}

@Entity('verificacion_llamada_caracteristicas')
@Index('ux_verificacion_llamada_caracteristica', ['encuesta_id', 'clave'], { unique: true })
export class VerificacionLlamadaCaracteristicaEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', nullable: false })
  encuesta_id: string;

  @Column({ type: 'varchar', length: 40, nullable: false })
  clave: CaracteristicaLlamadaVerificacion;

  @Column({ type: 'boolean', nullable: false })
  coincide: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;
}
