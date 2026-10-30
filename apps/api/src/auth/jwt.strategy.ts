import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Usuario, UsuarioEstado } from '../catalogos/entities/usuario.entity';
import { getJwtSecret } from './jwt.config';
import { isDevelopmentUniversalAccessEnabled } from './development-auth.config';

export interface JwtPayload {
  sub: string;
  abreviatura: string;
  rol: string;
  acceso_pin_universal_desarrollo?: boolean;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    @InjectRepository(Usuario)
    private usuariosRepo: Repository<Usuario>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: getJwtSecret(),
    });
  }

  async validate(payload: JwtPayload): Promise<Usuario> {
    const usuario = await this.usuariosRepo.findOne({
      where: { id: payload.sub },
      relations: { rol: true },
    });

    if (
      !usuario ||
      usuario.estado !== UsuarioEstado.ACTIVO ||
      usuario.rol?.estado !== 'ACTIVO'
    ) {
      throw new UnauthorizedException('Usuario inválido o inactivo');
    }

    usuario.acceso_pin_universal_desarrollo = Boolean(
      payload.acceso_pin_universal_desarrollo
      && isDevelopmentUniversalAccessEnabled(),
    );

    return usuario;
  }
}
