export interface EffectivePermissions {
  modulos: string[];
  acciones: string[];
}

export function hasPermission(
  permissions: EffectivePermissions | null | undefined,
  module: string,
  action: string,
): boolean {
  const modules = Array.isArray(permissions?.modulos) ? permissions.modulos : [];
  const actions = Array.isArray(permissions?.acciones) ? permissions.acciones : [];

  return (
    (modules.includes('*') || modules.includes(module))
    && (actions.includes('*') || actions.includes(action))
  );
}
