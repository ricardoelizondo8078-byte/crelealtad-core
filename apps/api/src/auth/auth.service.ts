import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Usuario } from '../catalogos/entities/usuario.entity';
import * as bcrypt from 'bcrypt';

export interface LoginDto {
  email: string;
  password: string;
}

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
  ) {}

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

    // Por ahora, generar un token simple (UUID)
    // En producción usar JWT
    const token = `${usuario.id}-${Date.now()}`;

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
    // Por ahora, extraer el ID del token simple
    const [userId] = token.split('-');

    if (!userId) {
      return null;
    }

    const usuario = await this.usuariosRepo.findOne({
      where: { id: userId },
    });

    if (!usuario || usuario.estado !== 'ACTIVO') {
      return null;
    }

    return usuario;
  }
}
