import { ForbiddenException } from '@nestjs/common';
import { Usuario } from '../catalogos/entities/usuario.entity';
import { resolverPermisosEfectivos } from '../auth/permissions.utils';

export const ACCESS_CONTEXT_HEADER = 'x-crelealtad-context';
export const VERIFICACION_ACCESS_CONTEXT = 'verificacion';

type AccessScopeMode = 'PROPIO' | 'INSTITUCIONAL';

export interface AccessScope {
  usuarioId: string;
  rolNombre: string;
  mode?: AccessScopeMode;
}

interface QueryExecutor {
  query(query: string, parameters?: unknown[]): Promise<unknown[]>;
}

type AccessScopeUser = Pick<Usuario, 'id' | 'permisos_personalizados'> & {
  rol: Usuario['rol'];
};

export function accessScopeFromUser(user: AccessScopeUser): AccessScope {
  return {
    usuarioId: user.id,
    rolNombre: user.rol.nombre,
    mode: user.rol.nombre === 'ASESOR' ? 'PROPIO' : 'INSTITUCIONAL',
  };
}

export function accessScopeFromContext(
  user: AccessScopeUser,
  context?: string,
  verificationAction = 'leer',
): AccessScope {
  if (context?.trim().toLowerCase() !== VERIFICACION_ACCESS_CONTEXT) {
    return accessScopeFromUser(user);
  }

  const permisos = resolverPermisosEfectivos(user);
  const tieneModulo = permisos.modulos.includes('*')
    || permisos.modulos.includes('verificacion');
  const tieneAccion = permisos.acciones.includes('*')
    || permisos.acciones.includes(verificationAction);

  if (!tieneModulo || !tieneAccion) {
    throw new ForbiddenException('No tienes permiso para acceder al módulo de Verificación');
  }

  return {
    usuarioId: user.id,
    rolNombre: user.rol.nombre,
    mode: 'INSTITUCIONAL',
  };
}

function requiresAdvisorOwnership(scope: AccessScope): boolean {
  return scope.rolNombre === 'ASESOR' && scope.mode !== 'INSTITUCIONAL';
}

export async function resolveEmpleadoId(
  executor: QueryExecutor,
  scope: AccessScope,
): Promise<string | null> {
  if (!requiresAdvisorOwnership(scope)) return null;

  const rows = await executor.query(
    'SELECT id FROM empleados WHERE usuario_id = $1 LIMIT 1',
    [scope.usuarioId],
  ) as Array<{ id?: string }>;

  if (!rows[0]?.id) {
    throw new ForbiddenException('La cuenta no tiene un registro laboral de asesor asociado');
  }
  return rows[0].id;
}

export async function assertExpedienteAccess(
  executor: QueryExecutor,
  expedienteId: string,
  scope: AccessScope,
): Promise<void> {
  if (!requiresAdvisorOwnership(scope)) return;

  const rows = await executor.query(
    `SELECT 1
       FROM expedientes e
       INNER JOIN empleados empleado ON empleado.id = e.asesora_id
      WHERE e.id = $1
        AND empleado.usuario_id = $2
      LIMIT 1`,
    [expedienteId, scope.usuarioId],
  );
  if (rows.length === 0) {
    throw new ForbiddenException('No tienes acceso a este expediente');
  }
}

export async function assertIntegranteAccess(
  executor: QueryExecutor,
  integranteId: string,
  scope: AccessScope,
): Promise<void> {
  if (!requiresAdvisorOwnership(scope)) return;

  const rows = await executor.query(
    `SELECT 1
       FROM integrantes i
       INNER JOIN expedientes e ON e.id = i.expediente_id
       INNER JOIN empleados empleado ON empleado.id = e.asesora_id
      WHERE i.id = $1
        AND empleado.usuario_id = $2
      LIMIT 1`,
    [integranteId, scope.usuarioId],
  );
  if (rows.length === 0) {
    throw new ForbiddenException('No tienes acceso a esta integrante');
  }
}
