import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { GrupoEntity } from '../grupos/grupo.entity';
import { SolicitanteEntity } from '../solicitantes/solicitante.entity';

@Entity('expedientes')
export class ExpedienteEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  groupId: string;

  @Column({ type: 'varchar' })
  title: string;

  @Column({ type: 'varchar', default: 'En proceso' })
  status: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;

  @ManyToOne(() => GrupoEntity, (grupo) => grupo.expedientes)
  @JoinColumn({ name: 'groupId' })
  grupo: GrupoEntity;

  @OneToMany(() => SolicitanteEntity, (solicitante) => solicitante.expediente)
  solicitantes: SolicitanteEntity[];
}
