import { BadRequestException } from '@nestjs/common';

export const MONTO_MAXIMO_SOLICITUD_DEFAULT = 100_000;

type QueryExecutor = {
  query: (sql: string, parameters?: unknown[]) => Promise<Array<Record<string, unknown>>>;
};

export async function obtenerMontoMaximoSolicitable(
  executor: QueryExecutor,
  expedienteId: string,
): Promise<number> {
  const rows = await executor.query(
    `SELECT COALESCE(
       (
         SELECT producto_asignado.monto_maximo
         FROM expedientes expediente
         JOIN productos_credito producto_asignado
           ON producto_asignado.id = expediente.producto_id
         WHERE expediente.id = $1
       ),
       (
         SELECT producto_activo.monto_maximo
         FROM productos_credito producto_activo
         WHERE producto_activo.estado = 'ACTIVO'
         ORDER BY producto_activo.created_at ASC, producto_activo.id ASC
         LIMIT 1
       )
     ) AS monto_maximo`,
    [expedienteId],
  );

  const montoConfigurado = Number(rows[0]?.monto_maximo);
  return Number.isFinite(montoConfigurado) && montoConfigurado > 0
    ? montoConfigurado
    : MONTO_MAXIMO_SOLICITUD_DEFAULT;
}

export function validarMontoSolicitadoContraLimite(
  montoSolicitado: number | undefined,
  montoMaximo: number,
): void {
  if (montoSolicitado === undefined || montoSolicitado <= montoMaximo) {
    return;
  }

  throw new BadRequestException(
    `El monto solicitado no puede exceder $${montoMaximo.toLocaleString('es-MX')}`,
  );
}
