import { IsInt, Max, Min } from 'class-validator';

export class ActualizarIntegrantesVerificadasDto {
  @IsInt()
  @Min(0)
  @Max(12)
  integrantes_verificadas_requeridas: number;

  @IsInt()
  @Min(0)
  expected_revision: number;
}
