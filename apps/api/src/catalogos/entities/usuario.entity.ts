import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';

export enum UsuarioEstado {
  ACTIVO = 'ACTIVO',
  INACTIVO = 'INACTIVO',
  SUSPENDIDO = 'SUSPENDIDO',
}

@Entity('usuarios')
export class Usuario {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100, nullable: false })
  nombre: string;

  @Column({ type: 'varchar', unique: true, nullable: false })
  email: string;

  @Column({ type: 'varchar', nullable: false })
  password_hash: string;

  @Column({ type: 'uuid', nullable: false })
  rol_id: string;

  @Column({ type: 'uuid', nullable: false })
  sucursal_id: string;

  @Column({ type: 'varchar', default: UsuarioEstado.ACTIVO })
  estado: UsuarioEstado;

  @Column({ type: 'timestamptz', nullable: true })
  ultimo_login: Date;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;
}
