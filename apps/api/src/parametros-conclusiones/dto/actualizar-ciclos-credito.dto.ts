import { IsInt, Max, Min } from 'class-validator';

export class ActualizarCiclosCreditoDto {
  @IsInt() @Min(1) @Max(40)
  verde_desde: number;

  @IsInt() @Min(1) @Max(40)
  verde_hasta: number;

  @IsInt() @Min(1) @Max(40)
  amarillo_desde: number;

  @IsInt() @Min(1) @Max(40)
  amarillo_hasta: number;

  @IsInt() @Min(1) @Max(40)
  rojo_desde: number;

  @IsInt() @Min(1) @Max(40)
  rojo_hasta: number;
}
