import {
  IsBoolean,
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Matches,
} from 'class-validator';
import {
  MOTIVOS_SIN_MEDIDOR_LUZ,
  MotivoSinMedidorLuz,
} from '../verificacion-medidor-luz-respuesta.entity';

export class RegistrarMedidorLuzRespuestaDto {
  @IsUUID()
  fachada_id: string;

  @IsBoolean()
  tiene_medidor: boolean;

  @IsOptional()
  @IsIn(MOTIVOS_SIN_MEDIDOR_LUZ)
  motivo?: MotivoSinMedidorLuz;

  @IsString()
  @Length(16, 100)
  @Matches(/^[A-Za-z0-9:_-]+$/)
  idempotency_key: string;
}
