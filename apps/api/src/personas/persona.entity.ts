import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export enum PersonaEstado {
  ACTIVA = 'ACTIVA',
  INACTIVA = 'INACTIVA',
  BLOQUEADA = 'BLOQUEADA',
  DEPURADA_LOGICA = 'DEPURADA_LOGICA',
}

@Entity('personas')
export class PersonaEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 20, unique: true, nullable: true })
  folio: string;

  @Column({ type: 'varchar', length: 18, unique: true, nullable: true })
  curp: string;

  // Nombres de pila (fuente de verdad: UN SOLO campo para todos los nombres)
  @Column({ type: 'varchar', length: 150, nullable: false })
  nombres: string;

  @Column({ type: 'varchar', length: 50, nullable: false })
  apellido_pat: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  apellido_mat: string;

  // Legacy: separación errónea de nombres compuestos, pendientes de eliminar
  @Column({ type: 'varchar', length: 50, nullable: true })
  primer_nombre: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  segundo_nombre: string;

  // Columna generada (nombre completo)
  @Column({ type: 'varchar', length: 255, nullable: true, select: true, insert: false, update: false })
  nombre_completo: string;

  @Column({ type: 'date', nullable: true })
  fecha_nac: Date;

  @Column({ type: 'varchar', length: 15, nullable: true })
  genero: string;

  @Column({ type: 'varchar', length: 20, default: PersonaEstado.ACTIVA })
  estado: PersonaEstado;

  @Column({ type: 'varchar', nullable: true })
  telefono: string;

  @Column({ type: 'varchar', nullable: true })
  telefono_secundario: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  monto_solicitado: number;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;
}
