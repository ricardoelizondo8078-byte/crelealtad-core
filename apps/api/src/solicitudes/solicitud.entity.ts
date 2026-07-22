import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToOne, JoinColumn } from 'typeorm';
import { IntegranteEntity } from '../integrantes/integrante.entity';

@Entity('solicitudes')
export class SolicitudEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Nuevas columnas de vínculo
  @Column({ type: 'varchar', unique: true, nullable: true })
  folio: string;

  @Column({ type: 'uuid', nullable: true })
  integrante_id: string;

  @Column({ type: 'uuid', nullable: true })
  integrante_id_old: string; // Temporal - mapea a la tabla vieja

  @Column({ type: 'uuid', nullable: true })
  persona_id: string;

  @Column({ type: 'uuid', nullable: true })
  expediente_id: string;

  @Column({ type: 'uuid', nullable: true })
  grupo_id: string;

  @Column({ type: 'int', nullable: true })
  ciclo_numero: number;

  @Column({ type: 'int', nullable: true })
  numero_credito: number;

  @Column({ type: 'uuid', nullable: true })
  credito_id: string;

  @Column({ type: 'boolean', default: true })
  es_nuevo: boolean;

  // Datos personales (snapshot)
  @Column({ type: 'varchar', nullable: true })
  primer_nombre: string;

  @Column({ type: 'varchar', nullable: true })
  segundo_nombre: string;

  @Column({ type: 'varchar', nullable: true })
  apellido_pat: string;

  @Column({ type: 'varchar', nullable: true })
  apellido_mat: string;

  @Column({ type: 'varchar', nullable: true })
  curp: string;

  @Column({ type: 'date', nullable: true, name: 'fechaNacimiento' })
  fecha_nac: Date;

  @Column({ type: 'varchar', nullable: true })
  nacionalidad: string;

  @Column({ type: 'varchar', nullable: true, name: 'estado_nacimiento_nuevo' })
  estado_nacimiento: string;

  @Column({ type: 'varchar', nullable: true })
  genero: string;

  @Column({ type: 'varchar', nullable: true, name: 'estadoCivil' })
  estado_civil: string;

  @Column({ type: 'varchar', nullable: true })
  ocupacion: string;

  @Column({ type: 'varchar', nullable: true, name: 'nivelEstudio' })
  nivel_estudio: string;

  // Domicilio (snapshot)
  @Column({ type: 'varchar', nullable: true })
  dom_calle: string;

  @Column({ type: 'varchar', nullable: true })
  dom_num_ext: string;

  @Column({ type: 'varchar', nullable: true })
  dom_num_int: string;

  @Column({ type: 'varchar', nullable: true })
  dom_entre_calles: string;

  @Column({ type: 'uuid', nullable: true })
  dom_cp_id: string;

  @Column({ type: 'varchar', nullable: true })
  dom_colonia: string;

  @Column({ type: 'varchar', nullable: true })
  dom_municipio: string;

  @Column({ type: 'varchar', nullable: true })
  dom_estado: string;

  @Column({ type: 'varchar', nullable: true })
  dom_telefono: string;

  // Referencias
  @Column({ type: 'varchar', nullable: true })
  ref1_nombre: string;

  @Column({ type: 'varchar', nullable: true })
  ref1_parentesco: string;

  @Column({ type: 'varchar', nullable: true })
  ref1_telefono: string;

  @Column({ type: 'varchar', nullable: true })
  ref1_direccion: string;

  @Column({ type: 'varchar', nullable: true })
  ref2_nombre: string;

  @Column({ type: 'varchar', nullable: true })
  ref2_parentesco: string;

  @Column({ type: 'varchar', nullable: true })
  ref2_telefono: string;

  @Column({ type: 'varchar', nullable: true })
  ref2_direccion: string;

  // Pareja
  @Column({ type: 'varchar', nullable: true })
  pareja_nombre: string;

  @Column({ type: 'varchar', nullable: true })
  pareja_actividad: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  pareja_ingreso_semanal: number;

  // Negocio
  @Column({ type: 'varchar', nullable: true })
  negocio_domicilio: string;

  @Column({ type: 'uuid', nullable: true })
  negocio_cp_id: string;

  @Column({ type: 'varchar', nullable: true })
  negocio_colonia: string;

  @Column({ type: 'varchar', nullable: true })
  negocio_municipio: string;

  @Column({ type: 'date', nullable: true })
  negocio_desde_cuando: Date;

  @Column({ type: 'varchar', nullable: true })
  negocio_giro_nuevo: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  negocio_ingreso_semanal: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  negocio_otros_ingresos: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  negocio_gastos_nuevo: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  negocio_total: number;

  // Beneficiario
  @Column({ type: 'varchar', nullable: true })
  beneficiario_nombre: string;

  @Column({ type: 'varchar', nullable: true })
  beneficiario_parentesco: string;

  @Column({ type: 'varchar', nullable: true })
  beneficiario_telefono: string;

  @Column({ type: 'varchar', nullable: true })
  beneficiario_direccion: string;

  // Validaciones
  @Column({ type: 'varchar', nullable: true })
  tiene_medidor_luz: string; // antes: tieneMedidorLuzSinAdeudo

  @Column({ type: 'varchar', nullable: true })
  vive_max_5km_tesorera: string; // antes: viveMaximo5KmTesorera

  @Column({ type: 'varchar', nullable: true })
  tiene_menos_70_anios: string; // antes: tieneMenos70Anios

  // Documentos
  @Column({ type: 'varchar', nullable: true })
  doc_ine_ruta: string;

  @Column({ type: 'date', nullable: true })
  doc_ine_fecha: Date;

  @Column({ type: 'varchar', nullable: true })
  doc_comprobante_ruta: string;

  @Column({ type: 'date', nullable: true })
  doc_comprobante_fecha: Date;

  @Column({ type: 'varchar', nullable: true })
  doc_ine_beneficiario_ruta: string;

  @Column({ type: 'date', nullable: true })
  doc_ine_beneficiario_fecha: Date;

  @Column({ type: 'varchar', nullable: true })
  doc_solicitud_firmada_ruta: string;

  @Column({ type: 'date', nullable: true })
  doc_solicitud_firmada_fecha: Date;

  // Monto autorizado
  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  monto_autorizado: number;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date; // antes: createdAt

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date; // antes: updatedAt

  // Relación
  @OneToOne(() => IntegranteEntity, (integrante) => integrante.solicitud)
  @JoinColumn({ name: 'integrante_id' })
  integrante: IntegranteEntity;
}
