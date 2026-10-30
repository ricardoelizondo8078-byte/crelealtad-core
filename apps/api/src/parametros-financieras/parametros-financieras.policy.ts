import { ForbiddenException } from '@nestjs/common';
import { Usuario } from '../catalogos/entities/usuario.entity';

export const normalizarTextoCatalogo = (value: string): string => value
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .trim()
  .replace(/\s+/g, ' ')
  .toUpperCase();

export const depurarAliases = (
  aliases: readonly string[],
): { originales: string[]; normalizados: string[] } => {
  const unicos = new Map<string, string>();
  aliases.forEach((alias) => {
    const original = alias.trim().replace(/\s+/g, ' ');
    const normalizado = normalizarTextoCatalogo(original);
    if (normalizado && !unicos.has(normalizado)) {
      unicos.set(normalizado, original);
    }
  });

  return {
    originales: [...unicos.values()],
    normalizados: [...unicos.keys()],
  };
};

export const exigirAdministradorParametros = (usuario: Usuario): void => {
  if (usuario.rol?.nombre !== 'ADMINISTRADOR') {
    throw new ForbiddenException(
      'Sólo Administración puede definir y publicar parámetros',
    );
  }
};
