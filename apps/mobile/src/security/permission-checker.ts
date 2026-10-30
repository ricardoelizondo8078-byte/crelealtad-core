export interface EffectivePermissions {
  modulos: string[];
  acciones: string[];
  capacidades?: string[];
}

export function hasPermission(
  permissions: EffectivePermissions | null | undefined,
  module: string,
  action: string,
): boolean {
  const modules = Array.isArray(permissions?.modulos) ? permissions.modulos : [];
  const actions = Array.isArray(permissions?.acciones) ? permissions.acciones : [];
  const capabilities = Array.isArray(permissions?.capacidades)
    ? permissions.capacidades
    : [];

  const moduleCapabilities = capabilities.filter(
    (capability) => capability.startsWith(`${module}:`),
  );
  if (moduleCapabilities.length > 0) {
    return moduleCapabilities.includes(`${module}:${action}`);
  }

  return (
    (modules.includes('*') || modules.includes(module))
    && (actions.includes('*') || actions.includes(action))
  );
}
