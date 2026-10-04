import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { ExpedienteEntity } from '../expedientes/expediente.entity';
import { PersonaEntity } from '../personas/persona.entity';

export enum IntegranteEstado {
  DOCUMENTANDO = 'DOCUMENTANDO',
  SUJETA_CREDITO = 'SUJETA_CREDITO',
  RETIRADA = 'RETIRADA',
  EN_VERIFICACION = 'EN_VERIFICACION',
  AUTORIZADA = 'AUTORIZADA',
  RECHAZADA = 'RECHAZADA',
}

export enum MotivoRetiroIntegrante {
  DESCANSA_RENOVACION = 'DESCANSA_RENOVACION',
  DOCUMENTACION_INCOMPLETA = 'DOCUMENTACION_INCOMPLETA',
  DECIDIO_NO_CONTINUAR = 'DECIDIO_NO_CONTINUAR',
  OTRO = 'OTRO',
}

@Entity('integrantes')
export class IntegranteEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', unique: true, nullable: true })
  folio: string;

  @Column({ type: 'uuid', nullable: false })
  expediente_id: string; // antes: expedienteId

  @Column({ type: 'uuid', nullable: true })
  persona_id: string;

  @Column({
    type: 'varchar',
    default: IntegranteEstado.DOCUMENTANDO,
  })
  estado: IntegranteEstado;

  @Column({ type: 'varchar', length: 40, nullable: true })
  motivo_retiro: MotivoRetiroIntegrante | null;

  @Column({ type: 'varchar', length: 250, nullable: true })
  motivo_retiro_detalle: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  retirada_at: Date | null;

  @Column({ type: 'uuid', nullable: true })
  retirada_por: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date; // antes: createdAt

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date; // antes: updatedAt

  // Relaciones
  @ManyToOne(() => ExpedienteEntity)
  @JoinColumn({ name: 'expediente_id' })
  expediente: ExpedienteEntity;

  @ManyToOne(() => PersonaEntity)
  @JoinColumn({ name: 'persona_id' })
  persona: PersonaEntity;

}
