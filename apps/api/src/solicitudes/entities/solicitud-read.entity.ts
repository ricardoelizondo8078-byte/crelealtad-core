import { Entity, ViewColumn, ViewEntity } from 'typeorm';

/**
 * Entity de LECTURA sobre la vista solicitudes_completo
 * La vista solo expone las 13 columnas de la tabla core solicitudes.
 * NO incluye campos de tablas hijas.
 * NO usar para INSERT/UPDATE - usar SolicitudCoreEntity + tablas hijas.
 */
@ViewEntity({ name: 'solicitudes_completo', synchronize: false })
export class SolicitudReadEntity {
  @ViewColumn()
  id: string;

  @ViewColumn()
  folio: string;

  @ViewColumn()
  integrante_id: string;

  @ViewColumn()
  persona_id: string;

  @ViewColumn()
  expediente_id: string;

  @ViewColumn()
  grupo_id: string;

  @ViewColumn()
  credito_id: string;

  @ViewColumn()
  ciclo_numero: number;

  @ViewColumn()
  numero_credito: number;

  @ViewColumn()
  monto_solicitado: number;

  @ViewColumn()
  monto_autorizado: number;

  @ViewColumn()
  created_at: Date;

  @ViewColumn()
  updated_at: Date;
}
