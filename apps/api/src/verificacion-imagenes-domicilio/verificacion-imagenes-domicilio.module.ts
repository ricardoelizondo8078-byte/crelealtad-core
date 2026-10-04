import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IntegranteEntity } from '../integrantes/integrante.entity';
import { ImagenesDomicilioStorageService } from './imagenes-domicilio-storage.service';
import { VerificacionImagenDomicilioEntity } from './verificacion-imagen-domicilio.entity';
import { VerificacionImagenesDomicilioController } from './verificacion-imagenes-domicilio.controller';
import { VerificacionImagenesDomicilioService } from './verificacion-imagenes-domicilio.service';
import { VerificacionMedidorLuzRespuestaEntity } from './verificacion-medidor-luz-respuesta.entity';

@Module({
  imports: [TypeOrmModule.forFeature([
    VerificacionImagenDomicilioEntity,
    VerificacionMedidorLuzRespuestaEntity,
    IntegranteEntity,
  ])],
  controllers: [VerificacionImagenesDomicilioController],
  providers: [VerificacionImagenesDomicilioService, ImagenesDomicilioStorageService],
})
export class VerificacionImagenesDomicilioModule {}
