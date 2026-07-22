import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { IntegranteEntity } from '../integrantes/integrante.entity';

export enum DocumentoTipo {
  INE = 'INE',
  COMPROBANTE_DOMICILIO = 'COMPROBANTE_DOMICILIO',
  IDENTIFICACION_BENEFICIARIO = 'IDENTIFICACION_BENEFICIARIO',
  COMPROBANTE_CREDITO_ANTERIOR = 'COMPROBANTE_CREDITO_ANTERIOR',
}

export enum DocumentoEstado {
  PENDIENTE = 'PENDIENTE',
  CARGADO = 'CARGADO',
  VERIFICADO = 'VERIFICADO',
}

@Entity('documentos')
export class DocumentoEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  solicitanteId: string;

  @Column({
    type: 'enum',
    enum: DocumentoTipo,
  })
  tipo: DocumentoTipo;

  @Column({
    type: 'enum',
    enum: DocumentoEstado,
    default: DocumentoEstado.PENDIENTE,
  })
  estado: DocumentoEstado;

  @Column({ type: 'text', nullable: true })
  archivoBase64: string;

  @Column({ type: 'varchar', nullable: true })
  archivoNombre: string;

  @Column({ type: 'timestamptz', nullable: true })
  fechaCarga: Date;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;

  @ManyToOne(() => IntegranteEntity, (integrante) => integrante.documentos)
  @JoinColumn({ name: 'solicitanteId' })
  integrante: IntegranteEntity;
}
