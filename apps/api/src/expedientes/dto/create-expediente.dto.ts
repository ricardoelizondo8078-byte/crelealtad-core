import { IsUUID } from 'class-validator';

export class CreateExpedienteDto {
  @IsUUID('4', { message: 'grupo_id debe ser un UUID válido' })
  grupo_id: string;
}
