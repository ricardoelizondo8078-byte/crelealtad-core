import { IsEnum, Matches } from 'class-validator';
import { TipoTelefonoEntrevista } from '../verificacion-entrevista-telefono-confirmacion.entity';

export class RegistrarConfirmacionTelefonoDto {
  @IsEnum(TipoTelefonoEntrevista)
  tipo_telefono: TipoTelefonoEntrevista;

  @Matches(/^[0-9]{10}$/)
  telefono: string;
}
