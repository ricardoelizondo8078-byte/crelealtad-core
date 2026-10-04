import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('solicitudes_documentos')
export class SolicitudDocumentosEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  solicitud_id: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  doc_ine_ruta: string | null;

  @Column({ type: 'date', nullable: true })
  doc_ine_fecha: Date | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  doc_comprobante_ruta: string | null;

  @Column({ type: 'date', nullable: true })
  doc_comprobante_fecha: Date | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  doc_ine_beneficiario_ruta: string | null;

  @Column({ type: 'date', nullable: true })
  doc_ine_beneficiario_fecha: Date | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  doc_solicitud_firmada_ruta: string | null;

  @Column({ type: 'date', nullable: true })
  doc_solicitud_firmada_fecha: Date | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  doc_comprobante_credito_ruta: string | null;

  @Column({ type: 'date', nullable: true })
  doc_comprobante_credito_fecha: Date | null;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;
}
