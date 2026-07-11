import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToOne, OneToMany } from 'typeorm';
import { ExpedienteEntity } from '../expedientes/expediente.entity';
import { SolicitudEntity } from '../solicitudes/solicitud.entity';
import { DocumentoEntity } from '../documentos/documento.entity';

export enum SolicitanteEstado {
  DOCUMENTANDO = 'DOCUMENTANDO',
  SUJETA_CREDITO = 'SUJETA_CREDITO',
  EN_VERIFICACION = 'EN_VERIFICACION',
  AUTORIZADA = 'AUTORIZADA',
  RECHAZADA = 'RECHAZADA',
}

@Entity('solicitantes')
export class SolicitanteEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  expedienteId: string;

  @Column({ type: 'varchar' })
  nombre: string;

  @Column({ type: 'varchar', nullable: true })
  nombres: string;

  @Column({ type: 'varchar', nullable: true })
  apellidoPaterno: string;

  @Column({ type: 'varchar', nullable: true })
  apellidoMaterno: string;

  @Column({ type: 'varchar' })
  telefono: string;

  @Column({ type: 'varchar', nullable: true })
  telefonoSecundario: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  montoSolicitado: number;

  @Column({
    type: 'enum',
    enum: SolicitanteEstado,
    default: SolicitanteEstado.DOCUMENTANDO,
  })
  estado: SolicitanteEstado;

  @Column({ type: 'int', default: 0 })
  seccionActual: number;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;

  @ManyToOne(() => ExpedienteEntity, (expediente) => expediente.solicitantes)
  @JoinColumn({ name: 'expedienteId' })
  expediente: ExpedienteEntity;

  @OneToOne(() => SolicitudEntity, (solicitud) => solicitud.solicitante)
  solicitud: SolicitudEntity;

  @OneToMany(() => DocumentoEntity, (documento) => documento.solicitante)
  documentos: DocumentoEntity[];
}
