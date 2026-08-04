import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('codigos_postales')
export class CodigoPostalEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  folio: string;

  @Column({ type: 'varchar', length: 5 })
  codigo: string;

  @Column({ type: 'varchar', length: 100 })
  colonia: string;

  @Column({ type: 'varchar', length: 100 })
  municipio: string;

  @Column({ type: 'varchar', length: 50, default: 'Nuevo León' })
  estado: string;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;
}
