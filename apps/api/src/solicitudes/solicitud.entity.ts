import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToOne, JoinColumn } from 'typeorm';
import { SolicitanteEntity } from '../solicitantes/solicitante.entity';

@Entity('solicitudes')
export class SolicitudEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', unique: true })
  solicitanteId: string;

  @Column({ type: 'int', default: 0 })
  seccionCompletada: number;

  // Sección 1: Información Personal
  @Column({ type: 'varchar', nullable: true })
  curp: string;

  @Column({ type: 'varchar', nullable: true })
  fechaNacimiento: string;

  @Column({ type: 'varchar', nullable: true })
  lugarNacimiento: string;

  @Column({ type: 'varchar', nullable: true })
  estadoCivil: string;

  @Column({ type: 'varchar', nullable: true })
  escolaridad: string;

  // Sección 2: Domicilio
  @Column({ type: 'varchar', nullable: true })
  domicilio: string;

  @Column({ type: 'varchar', nullable: true })
  colonia: string;

  @Column({ type: 'varchar', nullable: true })
  municipio: string;

  @Column({ type: 'varchar', nullable: true })
  estado: string;

  @Column({ type: 'varchar', nullable: true })
  cp: string;

  @Column({ type: 'varchar', nullable: true })
  tiempoResidencia: string;

  @Column({ type: 'varchar', nullable: true })
  tipoDomicilio: string;

  // Sección 3: Referencias
  @Column({ type: 'varchar', nullable: true })
  referencia1Nombre: string;

  @Column({ type: 'varchar', nullable: true })
  referencia1Telefono: string;

  @Column({ type: 'varchar', nullable: true })
  referencia1Parentesco: string;

  @Column({ type: 'varchar', nullable: true })
  referencia2Nombre: string;

  @Column({ type: 'varchar', nullable: true })
  referencia2Telefono: string;

  @Column({ type: 'varchar', nullable: true })
  referencia2Parentesco: string;

  // Sección 4: Pareja
  @Column({ type: 'boolean', nullable: true })
  parejaVive: boolean;

  @Column({ type: 'varchar', nullable: true })
  parejaNombre: string;

  @Column({ type: 'varchar', nullable: true })
  parejaTelefono: string;

  @Column({ type: 'varchar', nullable: true })
  parejaOcupacion: string;

  // Sección 5: Negocio
  @Column({ type: 'varchar', nullable: true })
  negocioNombre: string;

  @Column({ type: 'varchar', nullable: true })
  negocioTipo: string;

  @Column({ type: 'varchar', nullable: true })
  negocioAntiguedad: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  negocioIngresos: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  negocioGastos: number;

  @Column({ type: 'varchar', nullable: true })
  negocioUbicacion: string;

  // Sección 6: Beneficiario
  @Column({ type: 'varchar', nullable: true })
  beneficiarioNombre: string;

  @Column({ type: 'varchar', nullable: true })
  beneficiarioTelefono: string;

  @Column({ type: 'varchar', nullable: true })
  beneficiarioParentesco: string;

  // Sección 7: Validaciones
  @Column({ type: 'boolean', default: false })
  aceptaTerminos: boolean;

  @Column({ type: 'text', nullable: true })
  firmaDigital: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;

  @OneToOne(() => SolicitanteEntity, (solicitante) => solicitante.solicitud)
  @JoinColumn({ name: 'solicitanteId' })
  solicitante: SolicitanteEntity;
}
