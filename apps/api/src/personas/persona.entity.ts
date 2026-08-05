import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('personas')
export class PersonaEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 20, unique: true, nullable: true })
  folio: string;

  @Column({ type: 'varchar', length: 18, unique: true, nullable: true })
  curp: string;

  // Nombres unificados (refactorización)
  @Column({ type: 'varchar', length: 150, nullable: false })
  nombres: string;

  @Column({ type: 'varchar', length: 50, nullable: false })
  apellido_pat: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  apellido_mat: string;

  // Columna generada (nombre completo)
  @Column({ type: 'varchar', length: 255, nullable: true, select: true, insert: false, update: false })
  nombre_completo: string;

  @Column({ type: 'date', nullable: true })
  fecha_nac: Date;

  @Column({ type: 'varchar', length: 15, nullable: true })
  genero: string;

  @Column({ type: 'varchar', length: 20, default: 'ACTIVA' })
  estado: string;

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
