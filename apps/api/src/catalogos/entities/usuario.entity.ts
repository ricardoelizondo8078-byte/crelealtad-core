import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { PermisosRol, Rol } from './rol.entity';

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

  @Column({ type: 'varchar', length: 100, nullable: true })
  email: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  abreviatura: string | null;

  @Column({ type: 'varchar', nullable: false })
  password_hash: string;

  @Column({ type: 'boolean', default: false })
  requiere_cambio_pin: boolean;

  @Column({ type: 'uuid', nullable: false })
  rol_id: string;

  @ManyToOne(() => Rol, { nullable: false })
  @JoinColumn({ name: 'rol_id' })
  rol: Rol;

  @Column({ type: 'jsonb', nullable: true })
  permisos_personalizados: PermisosRol | null;

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
