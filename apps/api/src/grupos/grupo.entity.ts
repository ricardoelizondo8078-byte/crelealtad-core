import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, DeleteDateColumn, OneToMany } from 'typeorm';
import { ExpedienteEntity } from '../expedientes/expediente.entity';

export enum GrupoEstado {
  FORMANDO = 'FORMANDO',
  ACTIVO = 'ACTIVO',
  EN_RENOVACION = 'EN_RENOVACION',
  LIQUIDADO = 'LIQUIDADO',
  INACTIVO = 'INACTIVO',
}

@Entity('grupos')
export class GrupoEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', unique: true, nullable: true })
  folio: string;

  @Column({ type: 'varchar', nullable: false })
  nombre: string; // antes: name

  @Column({ type: 'uuid', nullable: true })
  zona_id: string;

  @Column({ type: 'uuid', nullable: true })
  sucursal_id: string;

  @Column({ type: 'date', nullable: false })
  fecha_inicio: Date;

  @Column({ type: 'varchar', nullable: false, default: GrupoEstado.FORMANDO })
  estado: GrupoEstado; // antes: status

  @Column({ type: 'varchar', nullable: true })
  created_by: string; // antes: createdBy

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date; // antes: createdAt

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date; // antes: updatedAt

  @DeleteDateColumn({ type: 'timestamptz', nullable: true })
  deleted_at: Date; // antes: deletedAt

  // Relaciones
  @OneToMany(() => ExpedienteEntity, (expediente) => expediente.grupo)
  expedientes: ExpedienteEntity[];
}
