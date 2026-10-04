import { Body, Controller, Post, Get, UseGuards, Request } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { CambiarPinDto } from './dto/cambiar-pin.dto';
import { Public } from './public.decorator';
import { JwtAuthGuard } from './jwt-auth.guard';
import {
  PermiteCambioPinPendiente,
  SoloAutenticado,
} from './permissions.decorator';
import { Usuario } from '../catalogos/entities/usuario.entity';
import { resolverPermisosEfectivos } from './permissions.utils';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60000 } }) // 5 intentos por minuto
  @Post('login')
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @UseGuards(JwtAuthGuard)
  @SoloAutenticado()
  @PermiteCambioPinPendiente()
  @Get('me')
  async getProfile(@Request() req: { user: Usuario }) {
    const usuario = req.user;

    return {
      id: usuario.id,
      nombre: usuario.nombre,
      abreviatura: usuario.abreviatura,
      rol_id: usuario.rol_id,
      rol_nombre: usuario.rol.nombre,
      sucursal_id: usuario.sucursal_id,
      estado: usuario.estado,
      requiere_cambio_pin: usuario.requiere_cambio_pin,
      permisos: resolverPermisosEfectivos(usuario),
    };
  }

  @SoloAutenticado()
  @PermiteCambioPinPendiente()
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('cambiar-pin')
  cambiarPin(
    @Body() dto: CambiarPinDto,
    @Request() req: { user: Usuario },
  ) {
    return this.authService.cambiarPin(req.user.id, dto);
  }
}
