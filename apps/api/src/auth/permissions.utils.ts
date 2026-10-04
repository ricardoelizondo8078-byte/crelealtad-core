import { Usuario } from '../catalogos/entities/usuario.entity';
import {
  normalizarContratoPermisos,
  PermisosRol,
} from './permission.contract';

export const normalizarPermisos = (permisos?: PermisosRol | null): PermisosRol =>
  normalizarContratoPermisos(permisos);

export const resolverPermisosEfectivos = (
  usuario?: Pick<Usuario, 'permisos_personalizados' | 'rol'> | null,
): PermisosRol => normalizarPermisos(
  usuario?.permisos_personalizados ?? usuario?.rol?.permisos,
);
