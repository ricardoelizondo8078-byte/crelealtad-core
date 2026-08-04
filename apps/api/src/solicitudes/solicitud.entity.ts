import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToOne, JoinColumn } from 'typeorm';
import { IntegranteEntity } from '../integrantes/integrante.entity';

/**
 * Entidad Solicitud - VERSIÓN CORREGIDA
 *
 * CAMBIOS APLICADOS:
 * - fechaNacimiento → fecha_nac (snake_case, sin @Column name)
 * - estadoCivil → estado_civil (snake_case, sin @Column name)
 * - nivelEstudio → nivel_estudio (snake_case, sin @Column name)
 * - estado_nacimiento_nuevo → estado_nacimiento (sin sufijo _nuevo)
 * - negocio_giro_nuevo → negocio_giro (sin sufijo _nuevo)
 * - negocio_gastos_nuevo → negocio_gastos (sin sufijo _nuevo)
 *
 * CONSISTENCIA: Ahora usa snake_case puro, sin @Column name overrides innecesarios
 */
@Entity('solicitudes_completo')
export class SolicitudEntity {
  @Column({ type: 'uuid', primary: true, name: 'solicitud_id' })
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

  // @Column({ type: 'boolean', default: true })
  // es_nuevo: boolean;  // CAMPO NO EXISTE EN BD - COMENTADO

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

  // ✅ CORREGIDO: fecha_nac sin @Column name override
  @Column({ type: 'date', nullable: true })
  fecha_nac: Date;

  @Column({ type: 'varchar', nullable: true })
  nacionalidad: string;

  // ✅ CORREGIDO: estado_nacimiento sin sufijo _nuevo
  @Column({ type: 'varchar', nullable: true })
  estado_nacimiento: string;

  @Column({ type: 'varchar', nullable: true })
  genero: string;

  // ✅ CORREGIDO: estado_civil sin @Column name override
  @Column({ type: 'varchar', nullable: true })
  estado_civil: string;

  @Column({ type: 'varchar', nullable: true })
  ocupacion: string;

  // ✅ CORREGIDO: nivel_estudio sin @Column name override
  @Column({ type: 'varchar', nullable: true })
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

  @Column({ type: 'varchar', length: 5, nullable: true })
  dom_codigo_postal: string;

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

  @Column({ type: 'varchar', nullable: true })
  negocio_num_ext: string;

  @Column({ type: 'varchar', nullable: true })
  negocio_num_int: string;

  @Column({ type: 'varchar', nullable: true })
  negocio_estado: string;

  @Column({ type: 'varchar', length: 5, nullable: true })
  negocio_codigo_postal: string;

  @Column({ type: 'varchar', nullable: true })
  negocio_colonia: string;

  @Column({ type: 'varchar', nullable: true })
  negocio_municipio: string;

  @Column({ type: 'varchar', nullable: true })
  negocio_desde_cuando: string;

  // ✅ CORREGIDO: negocio_giro sin sufijo _nuevo
  @Column({ type: 'varchar', nullable: true })
  negocio_giro: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  negocio_ingreso_semanal: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  negocio_otros_ingresos: number;

  // ✅ CORREGIDO: negocio_gastos sin sufijo _nuevo
  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  negocio_gastos: number;

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
  tiene_medidor_luz: string;

  @Column({ type: 'varchar', nullable: true })
  vive_max_5km_tesorera: string;

  @Column({ type: 'varchar', nullable: true })
  tiene_menos_70_anios: string;

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

  @Column({ type: 'varchar', nullable: true })
  doc_comprobante_credito_ruta: string;

  @Column({ type: 'date', nullable: true })
  doc_comprobante_credito_fecha: Date;

  // Monto autorizado
  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  monto_autorizado: number;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;

  // Relación
  @OneToOne(() => IntegranteEntity, (integrante) => integrante.solicitud)
  @JoinColumn({ name: 'integrante_id' })
  integrante: IntegranteEntity;
}
