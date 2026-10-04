import { IsUUID } from 'class-validator';

export class SeleccionarTesoreraDto {
  @IsUUID()
  integrante_id: string;
}
