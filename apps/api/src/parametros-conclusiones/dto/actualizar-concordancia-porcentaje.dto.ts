import { IsInt, Max, Min } from 'class-validator';

export class ActualizarConcordanciaPorcentajeDto {
  @IsInt() @Min(0) @Max(100)
  verde_desde: number;

  @IsInt() @Min(0) @Max(100)
  verde_hasta: number;

  @IsInt() @Min(0) @Max(100)
  amarillo_desde: number;

  @IsInt() @Min(0) @Max(100)
  amarillo_hasta: number;

  @IsInt() @Min(0) @Max(100)
  rojo_desde: number;

  @IsInt() @Min(0) @Max(100)
  rojo_hasta: number;
}
