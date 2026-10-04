interface AuditExecutor {
  query(query: string, parameters?: unknown[]): Promise<unknown>;
}

export interface AuditEntry {
  tabla: string;
  registroId: string;
  accion: string;
  usuarioId: string;
  datosAntes?: Record<string, unknown> | null;
  datosDespues?: Record<string, unknown> | null;
}

export async function registrarAuditoria(
  executor: AuditExecutor,
  entry: AuditEntry,
): Promise<void> {
  if (entry.accion.length > 20) {
    throw new Error('La acción de auditoría excede el límite de 20 caracteres');
  }

  await executor.query(
    `INSERT INTO audit_log (tabla, registro_id, accion, datos_antes, datos_despues, usuario_id)
     VALUES ($1, $2, $3, $4::jsonb, $5::jsonb, $6)`,
    [
      entry.tabla,
      entry.registroId,
      entry.accion,
      JSON.stringify(entry.datosAntes ?? null),
      JSON.stringify(entry.datosDespues ?? null),
      entry.usuarioId,
    ],
  );
}
