import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { Usuario, UsuarioEstado } from '../catalogos/entities/usuario.entity';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcrypt';

export interface LoginResponse {
  usuario: {
    id: string;
    nombre: string;
    email: string;
    rol_id: string;
    sucursal_id: string;
    estado: string;
  };
  token: string; // Por ahora será un token simple
}

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(Usuario)
    private usuariosRepo: Repository<Usuario>,
    private jwtService: JwtService,
  ) {}

  async getLoginList(): Promise<{ id: string; nombre: string; email: string }[]> {
    const usuarios = await this.usuariosRepo
      .createQueryBuilder('usuario')
      .select(['usuario.id', 'usuario.nombre', 'usuario.email'])
      .where('usuario.estado = :estado', { estado: UsuarioEstado.ACTIVO })
      .andWhere('usuario.nombre IS NOT NULL')
      .andWhere('usuario.nombre != :empty', { empty: '' })
      .orderBy('usuario.nombre', 'ASC')
      .getMany();

    return usuarios;
  }

  async login(dto: LoginDto): Promise<LoginResponse> {
    // Buscar usuario por email
    const usuario = await this.usuariosRepo.findOne({
      where: { email: dto.email },
    });

    if (!usuario) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    // Verificar contraseña
    const passwordValida = await bcrypt.compare(dto.password, usuario.password_hash);

    if (!passwordValida) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    // Verificar que el usuario esté activo
    if (usuario.estado !== 'ACTIVO') {
      throw new UnauthorizedException('Usuario inactivo o suspendido');
    }

    // Actualizar último login
    await this.usuariosRepo.update(usuario.id, {
      ultimo_login: new Date(),
    });

    // Generar JWT token
    const payload = {
      sub: usuario.id,
      email: usuario.email,
      rol: usuario.rol_id,
    };

    const token = this.jwtService.sign(payload);

    return {
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        email: usuario.email,
        rol_id: usuario.rol_id,
        sucursal_id: usuario.sucursal_id,
        estado: usuario.estado,
      },
      token,
    };
  }

  async validateToken(token: string): Promise<Usuario | null> {
    try {
      const payload = this.jwtService.verify(token);
      const usuario = await this.usuariosRepo.findOne({
        where: { id: payload.sub },
      });

      if (!usuario || usuario.estado !== UsuarioEstado.ACTIVO) {
        return null;
      }

      return usuario;
    } catch {
      return null;
    }
  }
}
