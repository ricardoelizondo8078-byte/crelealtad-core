import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { Usuario, UsuarioEstado } from '../catalogos/entities/usuario.entity';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcrypt';
import { PermisosRol } from '../catalogos/entities/rol.entity';
import { registrarAuditoria } from '../common/audit-log';
import { resolverPermisosEfectivos } from './permissions.utils';

export interface LoginResponse {
  usuario: {
    id: string;
    nombre: string;
    abreviatura: string;
    rol_id: string;
    rol_nombre: string;
    sucursal_id: string;
    estado: string;
    requiere_cambio_pin: boolean;
    permisos: PermisosRol;
  };
  token: string;
}

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(Usuario)
    private usuariosRepo: Repository<Usuario>,
    private jwtService: JwtService,
  ) {}

  async login(dto: LoginDto): Promise<LoginResponse> {
    const abreviatura = dto.abreviatura.trim().toUpperCase();
    const usuario = await this.usuariosRepo
      .createQueryBuilder('usuario')
      .leftJoinAndSelect('usuario.rol', 'rol')
      .where('UPPER(usuario.abreviatura) = :abreviatura', { abreviatura })
      .getOne();

    if (!usuario) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const passwordValida = await bcrypt.compare(dto.pin, usuario.password_hash);

    if (!passwordValida) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    // Verificar que el usuario esté activo
    if (usuario.estado !== 'ACTIVO' || usuario.rol?.estado !== 'ACTIVO') {
      throw new UnauthorizedException('Usuario inactivo o suspendido');
    }

    // Generar JWT token
    const payload = {
      sub: usuario.id,
      abreviatura: usuario.abreviatura,
      rol: usuario.rol_id,
    };

    const token = this.jwtService.sign(payload);
    const loginAt = new Date();

    await this.usuariosRepo.manager.transaction(async (manager) => {
      await manager.update(Usuario, usuario.id, { ultimo_login: loginAt });
      await registrarAuditoria(manager, {
        tabla: 'usuarios',
        registroId: usuario.id,
        accion: 'LOGIN',
        usuarioId: usuario.id,
        datosDespues: {
          resultado: 'EXITOSO',
          rol_id: usuario.rol_id,
          sucursal_id: usuario.sucursal_id,
          requiere_cambio_pin: usuario.requiere_cambio_pin,
        },
      });
    });

    return {
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        abreviatura: usuario.abreviatura!,
        rol_id: usuario.rol_id,
        rol_nombre: usuario.rol.nombre,
        sucursal_id: usuario.sucursal_id,
        estado: usuario.estado,
        requiere_cambio_pin: usuario.requiere_cambio_pin,
        permisos: resolverPermisosEfectivos(usuario),
      },
      token,
    };
  }

  async validateToken(token: string): Promise<Usuario | null> {
    try {
      const payload = this.jwtService.verify(token);
      const usuario = await this.usuariosRepo.findOne({
        where: { id: payload.sub },
        relations: { rol: true },
      });

      if (
        !usuario ||
        usuario.estado !== UsuarioEstado.ACTIVO ||
        usuario.rol?.estado !== 'ACTIVO'
      ) {
        return null;
      }

      return usuario;
    } catch {
      return null;
    }
  }

}
