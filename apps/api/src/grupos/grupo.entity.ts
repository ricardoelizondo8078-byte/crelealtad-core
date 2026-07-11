import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, DeleteDateColumn, OneToMany } from 'typeorm';
import { ExpedienteEntity } from '../expedientes/expediente.entity';

export enum GrupoStatus {
  FORMANDO = 'FORMANDO',
  LISTO_PARA_REVISION = 'LISTO_PARA_REVISION',
  EN_REVISION = 'EN_REVISION',
  AUTORIZADO = 'AUTORIZADO',
}

@Entity('grupos')
export class GrupoEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', nullable: false })
  name: string;

  @Column({ type: 'varchar', nullable: true })
  advisorName: string;

  @Column({ type: 'varchar', nullable: true })
  createdBy: string;

  @Column({
    type: 'enum',
    enum: GrupoStatus,
    default: GrupoStatus.FORMANDO,
  })
  status: GrupoStatus;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;

  @DeleteDateColumn({ type: 'timestamptz', nullable: true })
  deletedAt: Date;

  @OneToMany(() => ExpedienteEntity, (expediente) => expediente.grupo)
  expedientes: ExpedienteEntity[];
}
