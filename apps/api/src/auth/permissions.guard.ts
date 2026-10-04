import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Usuario } from '../catalogos/entities/usuario.entity';
import { IS_PUBLIC_KEY } from './public.decorator';
import {
  PERMITE_CAMBIO_CREDENCIAL_PENDIENTE_KEY,
  PERMISO_REQUERIDO_KEY,
  PermisoRequerido,
  SOLO_AUTENTICADO_KEY,
} from './permissions.decorator';
import { tienePermiso } from './permission.contract';
import { resolverPermisosEfectivos } from './permissions.utils';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const targets = [context.getHandler(), context.getClass()];
    const esPublico = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, targets);

    if (esPublico) {
      return true;
    }

    const request = context.switchToHttp().getRequest<{ user?: Usuario }>();
    const permiteCambioPinPendiente = this.reflector.getAllAndOverride<boolean>(
      PERMITE_CAMBIO_CREDENCIAL_PENDIENTE_KEY,
      targets,
    );
    if (request.user?.requiere_cambio_pin && !permiteCambioPinPendiente) {
      throw new ForbiddenException({
        statusCode: 403,
        code: 'PIN_CHANGE_REQUIRED',
        message: 'Debes cambiar tu PIN antes de continuar',
      });
    }

    const soloAutenticado = this.reflector.getAllAndOverride<boolean>(
      SOLO_AUTENTICADO_KEY,
      targets,
    );

    if (soloAutenticado) {
      return true;
    }

    const requerido = this.reflector.getAllAndOverride<PermisoRequerido>(
      PERMISO_REQUERIDO_KEY,
      targets,
    );

    if (!requerido) {
      throw new ForbiddenException('La ruta no tiene un permiso configurado');
    }

    const permisos = resolverPermisosEfectivos(request.user);

    if (!tienePermiso(permisos, requerido.modulo, requerido.accion)) {
      throw new ForbiddenException('No tienes permiso para realizar esta acción');
    }

    return true;
  }
}
