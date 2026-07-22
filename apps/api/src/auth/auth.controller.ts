import { Body, Controller, Post, Get, Headers, UnauthorizedException } from '@nestjs/common';
import { AuthService, LoginDto } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Get('me')
  async getProfile(@Headers('authorization') authorization: string) {
    if (!authorization) {
      throw new UnauthorizedException('Token no proporcionado');
    }

    const token = authorization.replace('Bearer ', '');
    const usuario = await this.authService.validateToken(token);

    if (!usuario) {
      throw new UnauthorizedException('Token inválido');
    }

    return {
      id: usuario.id,
      nombre: usuario.nombre,
      email: usuario.email,
      rol_id: usuario.rol_id,
      sucursal_id: usuario.sucursal_id,
      estado: usuario.estado,
    };
  }
}
