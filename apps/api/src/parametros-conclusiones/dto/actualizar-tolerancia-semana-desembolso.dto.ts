import { IsInt, Max, Min } from 'class-validator';

export class ActualizarToleranciaSemanaDesembolsoDto {
  @IsInt() @Min(0) @Max(10)
  verde_desde: number;

  @IsInt() @Min(0) @Max(10)
  verde_hasta: number;

  @IsInt() @Min(0) @Max(10)
  amarillo_desde: number;

  @IsInt() @Min(0) @Max(10)
  amarillo_hasta: number;

  @IsInt() @Min(0) @Max(10)
  rojo_desde: number;

  @IsInt() @Min(0) @Max(10)
  rojo_hasta: number;
}
