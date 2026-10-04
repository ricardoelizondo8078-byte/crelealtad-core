import { Transform, Type } from 'class-transformer';
import { IsBoolean, IsInt, IsOptional, IsUUID, Max, Min } from 'class-validator';

const transformarBooleanoMultipart = ({ value }: { value: unknown }): unknown => {
  if (value === 'true') return true;
  if (value === 'false') return false;
  return value;
};

export class CargaDocumentoDto {
  @IsOptional()
  @IsUUID()
  carga_id?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(Number.MAX_SAFE_INTEGER)
  indice_inicio?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(Number.MAX_SAFE_INTEGER)
  total_archivos?: number;

  @IsOptional()
  @Transform(transformarBooleanoMultipart)
  @IsBoolean()
  finalizar?: boolean;
}
