import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToOne, OneToMany } from 'typeorm';
import { ExpedienteEntity } from '../expedientes/expediente.entity';
import { SolicitudEntity } from '../solicitudes/solicitud.entity';
import { DocumentoEntity } from '../documentos/documento.entity';

export enum IntegranteEstado {
  DOCUMENTANDO = 'DOCUMENTANDO',
  SUJETA_CREDITO = 'SUJETA_CREDITO',
  EN_VERIFICACION = 'EN_VERIFICACION',
  AUTORIZADA = 'AUTORIZADA',
  RECHAZADA = 'RECHAZADA',
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

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date; // antes: createdAt

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date; // antes: updatedAt

  // Relaciones
  @ManyToOne(() => ExpedienteEntity)
  @JoinColumn({ name: 'expediente_id' })
  expediente: ExpedienteEntity;

  @OneToOne(() => SolicitudEntity, (solicitud) => solicitud.integrante)
  solicitud: SolicitudEntity;

  @OneToMany(() => DocumentoEntity, (documento) => documento.integrante)
  documentos: DocumentoEntity[];
}
