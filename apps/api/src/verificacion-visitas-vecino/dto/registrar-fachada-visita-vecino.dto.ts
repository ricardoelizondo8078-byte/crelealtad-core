import { Type } from 'class-transformer';
import {
  IsISO8601,
  IsNumber,
  IsOptional,
  IsString,
  Length,
  Matches,
  Max,
  Min,
} from 'class-validator';

export class RegistrarFachadaVisitaVecinoDto {
  @IsString()
  @Length(16, 100)
  @Matches(/^[A-Za-z0-9:_-]+$/)
  idempotency_key: string;

  @IsISO8601({ strict: true })
  foto_capturada_at: string;

  @Type(() => Number)
  @IsNumber()
  @Min(-90)
  @Max(90)
  ubicacion_latitud: number;

  @Type(() => Number)
  @IsNumber()
  @Min(-180)
  @Max(180)
  ubicacion_longitud: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  ubicacion_precision_metros?: number;

  @IsISO8601({ strict: true })
  ubicacion_capturada_at: string;
}
