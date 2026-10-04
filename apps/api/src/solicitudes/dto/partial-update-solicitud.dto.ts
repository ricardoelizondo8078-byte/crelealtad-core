import { PartialType, OmitType } from '@nestjs/mapped-types';
import { CreateSolicitudDto } from './create-solicitud.dto';

/**
 * DTO para PATCH /solicitudes/:integranteId
 *
 * ARQUITECTURA:
 * - integrante_id no se requiere en el PATCH porque se recibe en la ruta.
 * - persona_id, expediente_id y grupo_id siempre los deriva el backend.
 * - Sólo los campos operativos editables de las tablas hijas son aceptados.
 * - Campos financieros, derivados y documentales permanecen fuera del contrato público.
 * - El servicio completa internamente el contexto antes de persistir.
 */
export class PartialUpdateSolicitudDto extends PartialType(
  OmitType(CreateSolicitudDto, ['integrante_id'] as const)
) {}
