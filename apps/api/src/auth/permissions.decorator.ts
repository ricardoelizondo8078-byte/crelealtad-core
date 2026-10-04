import { SetMetadata } from '@nestjs/common';
import { AccionAutorizable, ModuloAutorizable } from './permission.contract';

export interface PermisoRequerido {
  modulo: ModuloAutorizable;
  accion: AccionAutorizable;
}

export const PERMISO_REQUERIDO_KEY = 'permisoRequerido';
export const SOLO_AUTENTICADO_KEY = 'soloAutenticado';

export const RequierePermiso = (
  modulo: ModuloAutorizable,
  accion: AccionAutorizable,
) =>
  SetMetadata(PERMISO_REQUERIDO_KEY, { modulo, accion } satisfies PermisoRequerido);

export const SoloAutenticado = () => SetMetadata(SOLO_AUTENTICADO_KEY, true);
