import {
  ArrayUnique,
  IsArray,
  IsIn,
  IsInt,
  Max,
  Min,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  MODALIDADES_PASO_VERIFICACION,
  PASOS_VERIFICACION,
  TIPOS_INTEGRANTE_VERIFICACION,
  type PasoVerificacionConfigurable,
  type ModalidadPasoVerificacion,
  type TipoIntegranteVerificacion,
} from '../parametros-verificacion-pasos.types';

export class ReglaPasoVerificacionDto {
  @IsIn(TIPOS_INTEGRANTE_VERIFICACION)
  tipo_integrante: TipoIntegranteVerificacion;

  @IsIn(PASOS_VERIFICACION)
  paso: PasoVerificacionConfigurable;

  @IsIn(MODALIDADES_PASO_VERIFICACION)
  modalidad: ModalidadPasoVerificacion;

  @ValidateIf((regla: ReglaPasoVerificacionDto) => (
    regla.modalidad === 'OBLIGATORIO_DESPUES_DIAS'
  ))
  @IsInt()
  @Min(1)
  @Max(3650)
  dias_para_obligatorio: number | null;
}

export class ActualizarMatrizVerificacionDto {
  @IsInt()
  @Min(1)
  expected_revision: number;

  @IsArray()
  @ArrayUnique((regla: ReglaPasoVerificacionDto) => `${regla.tipo_integrante}:${regla.paso}`)
  @ValidateNested({ each: true })
  @Type(() => ReglaPasoVerificacionDto)
  reglas: ReglaPasoVerificacionDto[];
}
