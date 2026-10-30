import { IsInt, Max, Min } from 'class-validator';

export class ActualizarSemanaCreditoDto {
  @IsInt() @Min(1) @Max(16)
  verde_desde: number;

  @IsInt() @Min(1) @Max(16)
  verde_hasta: number;

  @IsInt() @Min(1) @Max(16)
  amarillo_desde: number;

  @IsInt() @Min(1) @Max(16)
  amarillo_hasta: number;

  @IsInt() @Min(1) @Max(16)
  rojo_desde: number;

  @IsInt() @Min(1) @Max(16)
  rojo_hasta: number;
}
