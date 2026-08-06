import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('solicitudes_datos_personales')
export class SolicitudDatosPersonalesEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  solicitud_id: string;

  // Nombres de pila (fuente de verdad: UN SOLO campo)
  @Column({ type: 'varchar', length: 150, nullable: true })
  nombres: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  apellido_pat: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  apellido_mat: string;

  // Columna generada (nombre completo)
  @Column({ type: 'varchar', length: 255, nullable: true, select: true, insert: false, update: false })
  nombre_completo: string;

  // Legacy: separación errónea de nombres compuestos
  @Column({ type: 'varchar', length: 150, nullable: true })
  primer_nombre: string;

  @Column({ type: 'varchar', length: 150, nullable: true })
  segundo_nombre: string;

  @Column({ type: 'varchar', length: 18, nullable: true })
  curp: string;

  @Column({ type: 'date', nullable: true })
  fecha_nac: Date;

  @Column({ type: 'varchar', length: 20, nullable: true })
  genero: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  nacionalidad: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  estado_nacimiento: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  estado_civil: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  ocupacion: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  nivel_estudio: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  telefono: string;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;
}
