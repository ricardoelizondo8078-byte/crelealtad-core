import { IsEnum } from 'class-validator';
import { AccionPosteriorLlamadaVerificacion } from '../verificacion-llamada-encuesta.entity';

export enum RespuestaCoincidenciaLlamada {
  SI = 'SI',
  NO = 'NO',
}

export class RegistrarEncuestaLlamadaDto {
  @IsEnum(RespuestaCoincidenciaLlamada)
  identidad_coincide: RespuestaCoincidenciaLlamada;

  @IsEnum(RespuestaCoincidenciaLlamada)
  domicilio_coincide: RespuestaCoincidenciaLlamada;

  @IsEnum(RespuestaCoincidenciaLlamada)
  numero_plantas: RespuestaCoincidenciaLlamada;

  @IsEnum(RespuestaCoincidenciaLlamada)
  color_domicilio: RespuestaCoincidenciaLlamada;

  @IsEnum(RespuestaCoincidenciaLlamada)
  cochera_entrada: RespuestaCoincidenciaLlamada;

  @IsEnum(RespuestaCoincidenciaLlamada)
  banqueta_frente: RespuestaCoincidenciaLlamada;

  @IsEnum(RespuestaCoincidenciaLlamada)
  objeto_visible: RespuestaCoincidenciaLlamada;

  @IsEnum(RespuestaCoincidenciaLlamada)
  referencia_exterior: RespuestaCoincidenciaLlamada;

  @IsEnum(AccionPosteriorLlamadaVerificacion)
  accion_posterior: AccionPosteriorLlamadaVerificacion;
}
