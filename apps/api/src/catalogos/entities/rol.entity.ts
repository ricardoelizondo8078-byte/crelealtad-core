import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { PermisosRol } from '../../auth/permission.contract';

export type { PermisosRol } from '../../auth/permission.contract';

export enum RolEstado {
  ACTIVO = 'ACTIVO',
  INACTIVO = 'INACTIVO',
}

@Entity('roles')
export class Rol {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', nullable: false })
  nombre: string;

  @Column({ type: 'jsonb', nullable: true })
  permisos: PermisosRol | null;

  @Column({ type: 'varchar', nullable: false, default: RolEstado.ACTIVO })
  estado: RolEstado;
}
