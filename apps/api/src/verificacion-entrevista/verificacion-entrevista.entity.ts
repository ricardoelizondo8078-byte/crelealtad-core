import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('verificacion_entrevistas')
@Index('ux_verificacion_entrevistas_integrante', ['integrante_id'], { unique: true })
@Index('ix_verificacion_entrevistas_expediente', ['expediente_id', 'updated_at'])
export class VerificacionEntrevistaEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  expediente_id: string;

  @Column({ type: 'uuid' })
  integrante_id: string;

  @Column({ type: 'boolean', nullable: true })
  conoce_asesora: boolean | null;

  @Column({ type: 'varchar', length: 40, nullable: true })
  como_conocio_asesora: string | null;

  @Column({ type: 'boolean', nullable: true })
  conoce_integrantes: boolean | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  tiempo_conoce_integrantes: string | null;

  @Column({ type: 'boolean', nullable: true })
  sabe_montos_companeras: boolean | null;

  @Column({ type: 'boolean', nullable: true })
  acuerdo_montos_companeras: boolean | null;

  @Column({ type: 'boolean', nullable: true })
  conoce_tesorera: boolean | null;

  @Column({ type: 'uuid', nullable: true })
  tesorera_reconocida_integrante_id: string | null;

  @Column({ type: 'uuid', nullable: true })
  domicilio_recoleccion_integrante_id: string | null;

  @Column({ type: 'boolean', nullable: true })
  desconoce_domicilio_recoleccion: boolean | null;

  @Column({ type: 'boolean', nullable: true })
  tiene_familiares_grupo: boolean | null;

  @Column({ type: 'boolean', nullable: true })
  tiene_otro_credito_grupal: boolean | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  financiera_credito_grupal: string | null;

  @Column({ type: 'boolean', nullable: true })
  credito_grupal_anterior_activo: boolean | null;

  @Column({ type: 'numeric', precision: 12, scale: 2, nullable: true })
  valor_ficha_credito_grupal: number | null;

  @Column({ type: 'smallint', nullable: true })
  semana_actual_credito_grupal: number | null;

  @Column({ type: 'smallint', nullable: true })
  mes_desembolso_credito_grupal: number | null;

  @Column({ type: 'smallint', nullable: true })
  mes_ultimo_pago_credito_grupal: number | null;

  @Column({ type: 'smallint', nullable: true })
  anio_ultimo_pago_credito_grupal: number | null;

  @Column({ type: 'smallint', nullable: true })
  numero_ciclos_credito_grupal: number | null;

  @Column({ type: 'smallint', nullable: true })
  tasa_credito_grupal: number | null;

  @Column({ type: 'varchar', length: 200, nullable: true })
  nombre_asesora_credito_grupal: string | null;

  @Column({ type: 'varchar', length: 10, nullable: true })
  telefono_asesora_credito_grupal: string | null;

  @Column({ type: 'varchar', length: 120, nullable: true })
  motivo_no_renovacion_credito_grupal: string | null;

  @Column({ type: 'boolean', nullable: true })
  vive_en_domicilio: boolean | null;

  @Column({ type: 'varchar', length: 120, nullable: true })
  motivo_no_vive_domicilio: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  tipo_domicilio: string | null;

  @Column({ type: 'varchar', length: 30, nullable: true })
  familiar_domicilio: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  antiguedad_domicilio: string | null;

  @Column({ type: 'varchar', length: 10, nullable: true })
  personas_viven_casa: string | null;

  @Column({ type: 'varchar', array: true, default: () => "'{}'" })
  convivientes: string[];

  @Column({ type: 'boolean', nullable: true })
  saben_del_credito: boolean | null;

  @Column({ type: 'boolean', nullable: true })
  otro_ingreso_hogar: boolean | null;

  @Column({ type: 'numeric', precision: 12, scale: 2, nullable: true })
  otro_ingreso_semanal: number | null;

  @Column({ type: 'numeric', precision: 12, scale: 2, nullable: true })
  capacidad_pago_semanal: number | null;

  @Column({ type: 'text', nullable: true })
  uso_credito: string | null;

  @Column({ type: 'varchar', array: true, default: () => "'{}'" })
  fuentes_ingreso: string[];

  @Column({ type: 'numeric', precision: 12, scale: 2, nullable: true })
  sueldo_semanal: number | null;

  @Column({ type: 'varchar', length: 250, nullable: true })
  lugar_trabajo: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  antiguedad_laboral: string | null;

  @Column({ type: 'varchar', length: 250, nullable: true })
  tipo_negocio: string | null;

  @Column({ type: 'numeric', precision: 12, scale: 2, nullable: true })
  ingreso_libre_semanal_negocio: number | null;

  @Column({ type: 'text', nullable: true })
  ubicacion_negocio: string | null;

  @Column({ type: 'boolean', nullable: true })
  tiene_control_pagos: boolean | null;

  @Column({ type: 'varchar', length: 120, nullable: true })
  motivo_sin_control_pagos: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  asesora_acudio_semanalmente: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  firmaban_control_semanalmente: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  trato_asesora_tesorera: string | null;

  @Column({ type: 'boolean', nullable: true })
  conoce_premio_tesorera: boolean | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  opinion_credito: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  trato_desembolso: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  rapidez_desembolso: string | null;

  @Column({ type: 'boolean', nullable: true })
  informacion_credito_clara: boolean | null;

  @Column({ type: 'boolean', nullable: true })
  recomendaria: boolean | null;

  @Column({ type: 'varchar', length: 120, nullable: true })
  motivo_recomendacion: string | null;

  @Column({ type: 'text', nullable: true })
  oportunidad_mejora: string | null;

  @Column({ type: 'uuid' })
  entrevistada_por: string;

  @Column({ type: 'uuid' })
  actualizada_por: string;

  @Column({ type: 'integer', default: 1 })
  revision: number;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;
}
