import { IsEnum, IsNotEmpty, IsString, MaxLength, ValidateIf } from 'class-validator';
import { MotivoRetiroIntegrante } from '../integrante.entity';

export class RetirarIntegranteDto {
  @IsEnum(MotivoRetiroIntegrante)
  motivo_retiro: MotivoRetiroIntegrante;

  @ValidateIf((dto: RetirarIntegranteDto) => dto.motivo_retiro === MotivoRetiroIntegrante.OTRO)
  @IsString()
  @IsNotEmpty()
  @MaxLength(250)
  motivo_retiro_detalle?: string;
}
