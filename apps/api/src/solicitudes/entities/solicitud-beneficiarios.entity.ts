import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('solicitudes_beneficiarios')
export class SolicitudBeneficiariosEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  solicitud_id: string;

  @Column({ type: 'varchar', length: 150, nullable: true })
  beneficiario_nombre: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  beneficiario_parentesco: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  beneficiario_telefono: string;

  @Column({ type: 'varchar', length: 200, nullable: true })
  beneficiario_direccion: string;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;
}
