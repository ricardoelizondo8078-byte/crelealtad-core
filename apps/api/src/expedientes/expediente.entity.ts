import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { GrupoEntity } from '../grupos/grupo.entity';

export enum ExpedienteEstado {
  EN_DOCUMENTACION = 'EN_DOCUMENTACION',
  EN_VERIFICACION = 'EN_VERIFICACION',
  COMPLETO = 'COMPLETO',
  EN_REVISION = 'EN_REVISION',
  AUTORIZADO = 'AUTORIZADO',
  RECHAZADO = 'RECHAZADO',
  DESEMBOLSADO = 'DESEMBOLSADO',
}

@Entity('expedientes')
export class ExpedienteEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', unique: true, nullable: true })
  folio: string;

  @Column({ type: 'uuid', nullable: false })
  grupo_id: string; // antes: groupId

  @Column({ type: 'uuid', nullable: true })
  producto_id: string;

  @Column({ type: 'uuid', nullable: true })
  asesora_id: string;

  @Column({ type: 'varchar', nullable: true })
  horario_visita: string;

  @Column({ type: 'varchar', nullable: true })
  dias_visita: string;

  @Column({ type: 'date', nullable: true })
  semana_cobro: Date;

  @Column({ type: 'text', nullable: true })
  observaciones: string;

  @Column({ type: 'varchar', default: ExpedienteEstado.EN_DOCUMENTACION })
  estado: string; // antes: status

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  estado_fecha: Date; // Fecha del último cambio de estado

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date; // antes: createdAt

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date; // antes: updatedAt

  // Relaciones
  @ManyToOne(() => GrupoEntity, (grupo) => grupo.expedientes)
  @JoinColumn({ name: 'grupo_id' })
  grupo: GrupoEntity;

  // Nota: solicitantes ahora es integrantes (se actualizará después)
}
